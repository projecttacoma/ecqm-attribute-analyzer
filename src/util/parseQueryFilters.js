// TODO: The root of these attributes are already handled. We can probably improve this to not need to ignore them
const IGNORED_ATTRIBUTES = ['performed.start', 'performed.end', 'effective.start', 'effective.end'];

/**
 * Parse the output from fqm-execution to identify all attributes accessed
 *
 * @param {Array} retrieves the DataTypeQuery array from fqm-execution
 * @return {Object} lookup object of resourceType -> attributes
 */
function parseQueryFilters(retrieves) {
  const output = {};

  retrieves.forEach(retrieve => {
    const resourceType = retrieve.dataType;

    const attributes = output[resourceType] || [];

    // Inspect any filters that go for a "attribute" on the query source
    if (retrieve.queryInfo) {
      const { filter } = retrieve.queryInfo;

      // Recursively parse all attributes and push to array
      parseFilter(filter, attributes);
    }

    output[resourceType] = attributes;
  });

  return output;
}

function parseFilter(filter, attributes) {
  if (filter.type === 'and' || filter.type === 'or') {
    filter.children.forEach(child => {
      parseFilter(child, attributes);
    });
  } else if (
    filter.attribute &&
    !attributes.includes(filter.attribute) &&
    !IGNORED_ATTRIBUTES.includes(filter.attribute)
  ) {
    attributes.push(filter.attribute);
  }
}

module.exports = {
  parseQueryFilters
};
