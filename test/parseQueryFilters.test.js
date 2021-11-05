const { parseQueryFilters } = require('../src/util/parseQueryFilters');
const simpleQuery = require('./fixtures/queryInfo/simple-query.json');
const simpleQueryAnd = require('./fixtures/queryInfo/simple-query-and.json');
const simpleQueryOr = require('./fixtures/queryInfo/simple-query-or.json');
const nestedQueryAndOr = require('./fixtures/queryInfo/nested-and-or.json');

describe('parseQueryFilters', () => {
  it('simple attribute should populate', () => {
    const result = parseQueryFilters([simpleQuery]);

    expect(result['Procedure']).toBeDefined();
    expect(result['Procedure']).toHaveLength(1);
    expect(result['Procedure']).toEqual(['attr-0']);
  });

  it('simple and should populate', () => {
    const result = parseQueryFilters([simpleQueryAnd]);

    expect(result['Procedure']).toBeDefined();
    expect(result['Procedure']).toHaveLength(2);
    expect(result['Procedure']).toEqual(['attr-0', 'attr-1']);
  });

  it('simple or should populate', () => {
    const result = parseQueryFilters([simpleQueryOr]);

    expect(result['Procedure']).toBeDefined();
    expect(result['Procedure']).toHaveLength(2);
    expect(result['Procedure']).toEqual(['attr-0', 'attr-1']);
  });

  it('nested and/or should populate', () => {
    const result = parseQueryFilters([nestedQueryAndOr]);

    expect(result['Procedure']).toBeDefined();
    expect(result['Procedure']).toHaveLength(4);
    expect(result['Procedure']).toEqual(['attr-0', 'attr-1', 'attr-2', 'attr-3']);
  });

  it('no queries should be empty object', () => {
    const result = parseQueryFilters([]);

    expect(result).toEqual({});
  });

  it('no query info should be empty array', () => {
    const result = parseQueryFilters([{ dataType: 'Procedure' }]);

    expect(result['Procedure']).toBeDefined();
    expect(result['Procedure']).toEqual([]);
  });
});
