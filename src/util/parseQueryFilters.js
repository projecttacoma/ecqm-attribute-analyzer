// TODO: The root of these attributes are already handled. We can probably improve this to not need to ignore them
const IGNORED_ATTRIBUTES = ['performed.start', 'performed.end', 'effective.start', 'effective.end'];

function parseQueryFilters(retrieves) {
  const output = {};

  retrieves.forEach(retrieve => {
    const resourceType = retrieve.dataType;

    const attributes = output[resourceType] || [];

    if (retrieve.queryInfo) {
      const { filter } = retrieve.queryInfo;

      if (filter.type === 'and' || filter.type === 'or') {
        filter.children.forEach(child => {
          if (
            child.attribute &&
            !attributes.includes(child.attribute) &&
            !IGNORED_ATTRIBUTES.includes(child.attribute)
          ) {
            attributes.push(child.attribute);
          }
        });
      } else if (
        filter.attribute &&
        !attributes.includes(filter.attribute) &&
        !IGNORED_ATTRIBUTES.includes(filter.attribute)
      ) {
        attributes.push(filter.attribute);
      }
    }

    output[resourceType] = attributes;
  });

  return output;
}

module.exports = {
  parseQueryFilters
};
