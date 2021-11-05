const fs = require('fs');
const path = require('path');

const igBasePath = path.resolve(path.join(__dirname, '../../ig'));

const structureDefsFilenames = fs.readdirSync(igBasePath).filter(f => f.includes('StructureDefinition'));
const structureDefs = structureDefsFilenames.map(f => JSON.parse(fs.readFileSync(path.join(igBasePath, f), 'utf8')));

const output = {};

structureDefs.forEach(sd => {
  if (sd.kind === 'resource') {
    const resourceType = sd.type;
    const mustSupports = output[resourceType] || [];

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

    output[resourceType] = mustSupports;
  }
});

fs.writeFileSync('./src/mustSupports.json', JSON.stringify(output, null, 2));
