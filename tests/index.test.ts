import Knex from 'knex';
import { applyFiltering, applyOrdering, applyPagination } from '../src';

const knex = Knex({ client: 'pg' });

describe('applyFiltering', () => {
  test('basic', () => {
    const { sql } = applyFiltering(knex('table'), { column__eq: 'hello' }).toSQL();
    expect(sql.endsWith('where "column" = ?')).toBe(true);
  });

  test('multiple conditions', () => {
    const { sql } = applyFiltering(knex('table'), { column__eq: 'hello', column2__like: 'hello' }).toSQL();
    expect(sql.endsWith('where "column" = ? and "column2" like ?')).toBe(true);
  });

  test('multiple conditions with or', () => {
    const { sql } = applyFiltering(knex('table'), { column__eq: 'hello', or__column2__like: 'hello' }).toSQL();
    expect(sql.endsWith('where "column" = ? or "column2" like ?')).toBe(true);
  });

  test('not', () => {
    const { sql } = applyFiltering(knex('table'), {
      not: { column__eq: 'hello', or__column2__like: 'hello' },
    }).toSQL();
    expect(sql.endsWith('where not ("column" = ? or "column2" like ?)')).toBe(true);
  });

  test('not operator prefix', () => {
    const { sql } = applyFiltering(knex('table'), { column__not_eq: 'hello' }).toSQL();
    expect(sql.endsWith('where not "column" = ?')).toBe(true);
  });

  test('nesting', () => {
    const { sql } = applyFiltering(knex('table'), {
      and: { column__eq: 'hello', or__column2__like: 'hello', or: { column3__eq: 12, or__column4__eq: 14 } },
    }).toSQL();
    expect(sql.endsWith('where ("column" = ? or "column2" like ? or ("column3" = ? or "column4" = ?))')).toBe(true);
  });
});

describe('applyOrdering', () => {
  test('', () => {
    const { sql } = applyOrdering(knex('table'), ['hello__asc', 'hey__desc']).toSQL();
    expect(sql.endsWith('"hello" asc, "hey" desc')).toBe(true);
  });
});

describe('applyPagination', () => {
  test('', () => {
    const { sql } = applyPagination(knex('table'), { page: 2, size: 100 }).toSQL();
    expect(sql.endsWith('limit ? offset ?')).toBe(true);
  });
});

//#region dead code
// describe('applyFiltering', () => {
//   test('simple condition', () => {
//     const { sql } = applyFiltering(knex('table'), { column__eq: 12 }).toSQL();
//     expect(sql.endsWith('where "column" = ?')).toBe(true);
//   });

//   test('multiple conditions', () => {
//     const { sql } = applyFiltering(knex('table'), { column__eq: 12, column2__ne: 12, column3__not_like: '' }).toSQL();
//     expect(sql.endsWith('where "column" = ? and "column2" <> ?')).toBe(true);
//   });

//   test('condition with or', () => {
//     const { sql } = applyFiltering(knex('table'), { column__eq: 12, or: { column__eq: 14 } }).toSQL();
//     expect(sql.endsWith('where "column" = ? or ("column" = ?)')).toBe(true);
//   });

//   test('condition with not', () => {
//     const { sql } = applyFiltering(knex('table'), { column__eq: 12, not: { column__eq: 14 } }).toSQL();
//     expect(sql.endsWith('where "column" = ? and not ("column" = ?)')).toBe(true);
//   });

//   test('condition with or not', () => {
//     const { sql } = applyFiltering(knex('table'), { column__eq: 12, or_not: { column__eq: 14 } }).toSQL();
//     expect(sql.endsWith('where "column" = ? or not ("column" = ?)')).toBe(true);
//   });

//   test('more complex condition', () => {
//     const { sql } = applyFiltering(knex('table'), {
//       and: { hello__eq: 12, hey__ne: 14 },
//       or: { hello__eq: 14, hey__ne: 14 },
//     }).toSQL();
//     expect(sql.endsWith('where ("hello" = ? and "hey" <> ?) or ("hello" = ? and "hey" <> ?)')).toBe(true);
//   });

//   test('multiple or', () => {
//     const { sql } = applyFiltering(knex('table'), {
//       or: [{ hello__eq: 12, or: { hello__eq: 15 } }, { hello__eq: 14 }],
//     }).toSQL();
//     expect(sql.endsWith('where ("hello" = ? or ("hello" = ?)) or ("hello" = ?)')).toBe(true);
//   });
// });
//#endregion
