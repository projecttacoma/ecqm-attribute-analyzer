const fs = require('fs');
const path = require('path');
const { Calculator } = require('fqm-execution');
const { Workbook } = require('exceljs');
const { parseQueryFilters } = require('./util/parseQueryFilters');
const qicoreMustSupports = require('./qicore-must-supports.json');
const uscoreMustSupports = require('./uscore-must-supports.json');

if (!fs.existsSync('connectathon')) {
  console.error('Error: could not find "connectathon" directory. Ensure you run ./setup.sh first');
  process.exit(1);
}

if (!fs.existsSync('./src/qicore-must-supports.json')) {
  console.error('Error: could not find "src/qicore-must-supports.json". Ensure you run ./setup.sh first');
  process.exit(1);
}

if (!fs.existsSync('./src/uscore-must-supports.json')) {
  console.error('Error: could not find "src/uscore-must-supports.json". Ensure you run ./setup.sh first');
  process.exit(1);
}

const cthonBasePath = path.resolve(path.join(__dirname, '../connectathon/fhir401/bundles/measure'));

const bundleFilePaths = fs.readdirSync(cthonBasePath).map(d => path.join(d, `${d}-bundle.json`));

// Stores information for outputted excel spreadsheet
const workbook = new Workbook();
const worksheet = workbook.addWorksheet('Resources');

const GOOD_FILL_CONFIG = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: '9FFF9F' }
};

const WARN_FILL_CONFIG = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'F7FF00' }
};

const BAD_FILL_CONFIG = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF9F9F' }
};

// Returns true if a QI-Core profile is based off of US-Core profile rather than base FHIR
const isUsCoreBase = entry => entry.baseDefinition.startsWith('http://hl7.org/fhir/us/core');

// Object for accumulating all Resources and attributes used for all measures
const allResources = {};

bundleFilePaths.forEach(p => {
  const measureBundlePath = path.join(cthonBasePath, p);
  const measureBundle = JSON.parse(fs.readFileSync(measureBundlePath), 'utf8');
  const measureBaseName = path.basename(measureBundlePath, '-bundle.json');

  try {
    // Get query info and create worksheet for the measure if successful
    const { results } = Calculator.calculateQueryInfo(measureBundle);

    // Mapping of resourceType -> attributes for this measure
    const allAttributes = parseQueryFilters(results);

    let measureHasError = false;
    let validationString = `Measure ${measureBaseName}:\n`;

    Object.entries(allAttributes).forEach(([resourceType, attributes]) => {
      const attrs = allResources[resourceType] || [];
      attrs.push(...attributes);

      // Ensure uniqueness of ongoing attribute array
      allResources[resourceType] = [...new Set(attrs)];

      // Validate each attribute at the measure level
      attributes.forEach(attr => {
        const qiCoreEntry = qicoreMustSupports[resourceType];
        if (!qiCoreEntry.mustSupports.includes(attr)) {
          validationString += `\tERROR: Attribute ${resourceType}.${attr} is queried for by measure but not marked as "mustSupport" in the Profile\n`;
          measureHasError = true;
        }

        // Check for added data element
        if (
          !measureHasError &&
          isUsCoreBase(qiCoreEntry) &&
          !uscoreMustSupports[resourceType].mustSupports.includes(attr)
        ) {
          validationString += `\tWARNING: Attribute ${resourceType}.${attr} not marked as "mustSupport" in US-Core (new data element)\n`;
        }
      });
    });

    if (!measureHasError) {
      validationString += '\tvalidation succeeded\n';
    }

    console.log(validationString);
  } catch (e) {
    console.error(`Measure ${measureBaseName}: Error parsing measure logic (${e.message})\n`);
  }
});

worksheet.columns = Object.keys(allResources).map(resourceType => ({
  key: resourceType,
  header: resourceType
}));

Object.entries(allResources).forEach(([resourceType, attributes]) => {
  const col = worksheet.getColumn(resourceType);
  const values = [resourceType, '', ...attributes];
  col.values = values;

  // Color each cell based on adherence to mustSupport flag
  col.eachCell((cell, rowNum) => {
    const qiCoreEntry = qicoreMustSupports[resourceType];

    if (rowNum > 2 && cell.value) {
      if (!qiCoreEntry.mustSupports.includes(cell.value)) {
        cell.fill = BAD_FILL_CONFIG;
      } else if (isUsCoreBase(qiCoreEntry) && !uscoreMustSupports[resourceType].mustSupports.includes(cell.value)) {
        cell.fill = WARN_FILL_CONFIG;
      } else {
        cell.fill = GOOD_FILL_CONFIG;
      }
    }
  });
});

worksheet.getRow(1).font = {
  bold: true
};

worksheet.addRow();

const legendRowGood = worksheet.addRow(['', '=', 'Correctly marked as "Must Support" in QI-Core']);
const legendRowBad = worksheet.addRow(['', '=', 'Not marked as "Must Support" in QI-Core']);
const legendRowWarn = worksheet.addRow([
  '',
  '=',
  'Marked as "Must Support" in QI-Core but not in US-Core (added data element)'
]);

legendRowGood.getCell(1).fill = GOOD_FILL_CONFIG;
legendRowBad.getCell(1).fill = BAD_FILL_CONFIG;
legendRowWarn.getCell(1).fill = WARN_FILL_CONFIG;

const outFile = 'output.xlsx';

workbook.xlsx
  .writeFile(outFile)
  .then(() => console.log(`Wrote output to ${outFile}`))
  .catch(err => console.error(err));
