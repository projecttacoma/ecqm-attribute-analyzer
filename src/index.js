const fs = require('fs');
const path = require('path');
const { Calculator } = require('fqm-execution');
const { Workbook } = require('exceljs');
const { parseQueryFilters } = require('./util/parseQueryFilters');
const mustSupports = require('./mustSupports.json');

if (!fs.existsSync('connectathon')) {
  console.error('Error: could not find "connectathon" directory. Ensure you run ./setup.sh first');
  process.exit(1);
}

if (!fs.existsSync('src/mustSupports.json')) {
  console.error('Error: could not find "src/mustSupports.json". Ensure you run ./setup.sh first');
  process.exit(1);
}

const cthonBasePath = path.resolve(path.join('../connectathon/fhir401/bundles/measure'));

const bundleFilePaths = fs.readdirSync(cthonBasePath).map(d => path.join(d, `${d}-bundle.json`));

// Stores information for outputted excel spreadsheet
const workbook = new Workbook();

bundleFilePaths.forEach(p => {
  const measureBundlePath = path.join(cthonBasePath, p);
  const measureBundle = JSON.parse(fs.readFileSync(measureBundlePath), 'utf8');
  const measureBaseName = path.basename(measureBundlePath, '-bundle.json');

  try {
    // Get query info and create worksheet for the measure if successful
    const { results } = Calculator.calculateQueryInfo(measureBundle);

    const allAttributes = parseQueryFilters(results);
    const worksheet = workbook.addWorksheet(measureBaseName);

    worksheet.columns = Object.keys(allAttributes).map(resourceType => ({
      key: resourceType,
      header: resourceType
    }));

    let measureHasError = false;
    let validationString = `Measure ${measureBaseName}:\n`;

    Object.entries(allAttributes).forEach(([resourceType, attributes]) => {
      const col = worksheet.getColumn(resourceType);
      const values = [resourceType, '', ...attributes];
      col.values = values;

      // Color each cell based on adherence to mustSupport flag
      col.eachCell((cell, rowNum) => {
        if (rowNum > 2 && cell.value) {
          if (!mustSupports[resourceType].includes(cell.value)) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF9F9F' }
            };
          } else {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '9FFF9F' }
            };
          }
        }
      });

      attributes.forEach(attr => {
        if (!mustSupports[resourceType].includes(attr)) {
          validationString += `\tERROR: Attribute ${resourceType}.${attr} is queried for by measure but not marked as "mustSupport" in the Profile\n`;
          measureHasError = true;
        }
      });
    });

    if (!measureHasError) {
      validationString += '\tvalidation succeeded\n';
    }

    worksheet.getRow(1).font = {
      bold: true
    };

    console.log(validationString);
  } catch (e) {
    console.error(`Measure ${measureBaseName}: Error parsing measure logic (${e.message})\n`);
  }
});

const outFile = 'output.xlsx';

workbook.xlsx
  .writeFile(outFile)
  .then(() => console.log(`Wrote output to ${outFile}`))
  .catch(err => console.error(err));
