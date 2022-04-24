import Knex from 'knex';
import { Filter, filter, order, OrderString, paginate } from '../src';

const knex = Knex({ client: 'pg' });

describe(filter.name, () => {
  function testFilter(filterInput: Filter, expectedOutput: string, expectedBindings?: any[]) {
    const { sql, bindings } = filter(knex.queryBuilder(), filterInput).toSQL();
    const [, filterPart] = sql.split('where ');
    expect(filterPart).toEqual(expectedOutput);
    if (expectedBindings) {
      expect(bindings).toEqual(expectedBindings);
    }
  }

  describe(testFilter.name, () => {
    test('sql', () => expect(() => testFilter({ col__eq: '' }, '')).toThrow());

    test('bindings', () => expect(() => testFilter({ col__eq: '' }, '"col" = ?', [])).toThrow());
  });

  describe('complex conditions', () => {
    test('nesting', () =>
      testFilter(
        {
          and: { col__eq: '', and__col2__like: '', or: { col3__eq: 0, or__col4__eq: 0 } },
          or: { col5__is: null },
          or__col6__is: null,
        },
        '("col" = ? and "col2" like ? or ("col3" = ? or "col4" = ?)) or ("col5" is null) or "col6" is null',
        ['', '', 0, 0],
      ));

    test('nesting or', () =>
      testFilter(
        {
          col__eq: 0,
          or: {
            col__eq: '',
            or__col2__like: '',
            or: { col3__eq: 0, or__col4__btw: [0, 0] },
          },
        },
        '"col" = ? or ("col" = ? or "col2" like ? or ("col3" = ? or "col4" between ? and ?))',
        [0, '', '', 0, 0, 0],
      ));

    test('multiple conditions', () =>
      testFilter({ col__eq: '', col2__like: '' }, '"col" = ? and "col2" like ?', ['', '']));

    test('multiple conditions with or', () =>
      testFilter({ col__eq: '', or__col2__like: '' }, '"col" = ? or "col2" like ?', ['', '']));

    test('and or', () => testFilter({ col__eq: '', or__col2__not_eq: '' }, '"col" = ? or not "col2" = ?', ['', '']));

    test('not', () =>
      testFilter({ not: { col__eq: '', or__col2__like: '' } }, 'not ("col" = ? or "col2" like ?)', ['', '']));
  });

  describe('comparisons - eq | ne', () => {
    test('eq', () => testFilter({ col__eq: 0 }, '"col" = ?', [0]));

    test('not_eq', () => testFilter({ col__not_eq: 0 }, 'not "col" = ?', [0]));

    test('ne', () => testFilter({ col__ne: 0 }, '"col" <> ?', [0]));

    test('not_ne', () => testFilter({ col__not_ne: 0 }, 'not "col" <> ?', [0]));
  });

  describe('dates', () => {
    const date = new Date();

    test('btw with date', () => testFilter({ col__btw: [date, date] }, '"col" between ? and ?', [date, date]));

    test('lte with date', () => testFilter({ col__lte: date }, '"col" <= ?', [date]));
  });

  describe('arrays - in | btw', () => {
    test('in', () => testFilter({ col__in: [0, 0, 0] }, '"col" in (?, ?, ?)', [0, 0, 0]));

    test('not_in', () => testFilter({ col__not_in: [0, 0, 0] }, '"col" not in (?, ?, ?)', [0, 0, 0]));

    test('btw', () => testFilter({ col__btw: [0, 0] }, '"col" between ? and ?'));

    test('not_btw', () => testFilter({ col__not_btw: [0, 0] }, '"col" not between ? and ?', [0, 0]));
  });

  describe('null - is | eq | ne', () => {
    test('null', () => testFilter({ col__is: null }, '"col" is null', []));

    test('not null', () => testFilter({ col__is_not: null }, '"col" is not null', []));

    test('null with eq', () => testFilter({ col__eq: null }, '"col" is null')), [];

    test('null with ne', () => testFilter({ col__ne: null }, '"col" is not null', []));
  });

  describe('pattern - like | ilike', () => {
    test('like', () => testFilter({ col__like: '' }, '"col" like ?', ['']));

    test('not_like', () => testFilter({ col__not_like: '' }, 'not "col" like ?', ['']));

    test('ilike', () => testFilter({ col__ilike: '' }, '"col" ilike ?', ['']));

    test('not_ilike', () => testFilter({ col__not_ilike: '' }, 'not "col" ilike ?', ['']));
  });

  describe('regex - re | ire', () => {
    const regex = /test/;

    test('re', () => testFilter({ col__re: regex }, '"col" ~ ?', [regex]));

    test('not_re', () => testFilter({ col__not_re: regex }, 'not "col" ~ ?', [regex]));

    test('ire', () => testFilter({ col__ire: regex }, '"col" !~ ?', [regex]));

    test('not_ire', () => testFilter({ col__not_ire: regex }, 'not "col" !~ ?', [regex]));
  });
});

describe(order.name, () => {
  function testOrder(orderInput: OrderString[], expectedOutput: string) {
    const { sql } = order(knex.queryBuilder(), ...orderInput).toSQL();
    expect(sql.replace('select * order by ', '')).toEqual(expectedOutput);
  }

  test('asc', () => testOrder(['+col'], '"col" asc'));

  test('desc', () => testOrder(['-col'], '"col" desc'));

  test('multiple', () => testOrder(['-col1', '+col2'], '"col1" desc, "col2" asc'));

  test('default', () => testOrder(['col'], '"col" asc'));
});

describe(paginate.name, () => {
  const PAGE_SIZE = 100;

  function testPaginate(page: number, expectedOffset?: number) {
    const {
      sql,
      bindings: [limit, offset],
    } = paginate(knex.queryBuilder(), page, PAGE_SIZE).toSQL();
    if (page > 1) {
      expect(sql.replace('select * ', '')).toEqual('limit ? offset ?');
      expect(offset).toEqual(expectedOffset);
    } else {
      expect(sql.replace('select * ', '')).toEqual('limit ?');
    }
    expect(limit).toEqual(PAGE_SIZE);
  }

  test('page -1', () => testPaginate(-1));

  test('page 0', () => testPaginate(0));

  test('page 1', () => testPaginate(1));

  test('page 2', () => testPaginate(2, 100));
});
