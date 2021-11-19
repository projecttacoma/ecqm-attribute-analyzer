const fs = require('fs');
const path = require('path');

function getStructureDefs(igBasePath) {
  const structureDefFilenames = fs
    .readdirSync(igBasePath)
    .filter(f => path.extname(f) === '.json' && f.startsWith('StructureDefinition'));
  const structureDefs = structureDefFilenames.map(f => JSON.parse(fs.readFileSync(path.join(igBasePath, f), 'utf8')));

  return structureDefs;
}

function parseStructureDefs(structureDefs) {
  const output = {};

  structureDefs.forEach(sd => {
    if (sd.kind === 'resource') {
      const resourceType = sd.type;
      const mustSupports = output[resourceType] ? output[resourceType].mustSupports : [];

      sd.snapshot.element.forEach(elem => {
        if (elem.mustSupport) {
          // Strip off redundant first part of path (i.e. the resource type)
          // Safely handle value[x] attributes since cql-execution will not include the [x]
          const attr = elem.path.split('.').slice(1).join('.').replace('[x]', '');

          if (!mustSupports.includes(attr)) {
            mustSupports.push(attr);
          }
        }
      });

      output[resourceType] = { baseDefinition: sd.baseDefinition, mustSupports };
    }
  });

  return output;
}

const qicoreIgBasePath = path.resolve(path.join(__dirname, '../../qicore-ig'));
const uscoreIgBasePath = path.resolve(path.join(__dirname, '../../uscore-ig/site'));

const qicoreStructureDefs = getStructureDefs(qicoreIgBasePath);
const uscoreStructureDefs = getStructureDefs(uscoreIgBasePath);

const qicoreMustSupports = parseStructureDefs(qicoreStructureDefs);
const uscoreMustSupports = parseStructureDefs(uscoreStructureDefs);

fs.writeFileSync('./src/qicore-must-supports.json', JSON.stringify(qicoreMustSupports, null, 2));
fs.writeFileSync('./src/uscore-must-supports.json', JSON.stringify(uscoreMustSupports, null, 2));
