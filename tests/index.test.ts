import Knex from 'knex';
import { filter, order, paginate } from '../src';

const knex = Knex({ client: 'pg' });

describe('applyFiltering', () => {
  test('basic', () => {
    const { sql } = filter(knex('table'), { column__eq: 'hello' }).toSQL();
    expect(sql.endsWith('where "column" = ?')).toBe(true);
  });

  test('multiple conditions', () => {
    const { sql } = filter(knex('table'), { column__eq: 'hello', column2__like: 'hello' }).toSQL();
    expect(sql.endsWith('where "column" = ? and "column2" like ?')).toBe(true);
  });

  test('multiple conditions with or', () => {
    const { sql } = filter(knex('table'), { column__eq: 'hello', or__column2__like: 'hello' }).toSQL();
    expect(sql.endsWith('where "column" = ? or "column2" like ?')).toBe(true);
  });

  test('not', () => {
    const { sql } = filter(knex('table'), {
      not: { column__eq: 'hello', or__column2__like: 'hello' },
    }).toSQL();
    expect(sql.endsWith('where not ("column" = ? or "column2" like ?)')).toBe(true);
  });

  test('not operator prefix', () => {
    const { sql } = filter(knex('table'), { column__not_eq: 'hello' }).toSQL();
    expect(sql.endsWith('where not "column" = ?')).toBe(true);
  });

  test('nesting', () => {
    const { sql } = filter(knex('table'), {
      and: { column__eq: 'hello', and__column2__like: 'hello', or: { column3__eq: 12, or__column4__eq: 14 } },
    }).toSQL();
    expect(sql.endsWith('where ("column" = ? and "column2" like ? or ("column3" = ? or "column4" = ?))')).toBe(true);
  });
});

describe('order', () => {
  test('', () => {
    const { sql } = order(knex('table'), 'hello__asc', 'hey__desc').toSQL();
    expect(sql.endsWith('"hello" asc, "hey" desc')).toBe(true);
  });

  test('with array', () => {
    const { sql } = order(knex('table'), ['hello__asc', 'hey__desc']).toSQL();
    expect(sql.endsWith('"hello" asc, "hey" desc')).toBe(true);
  });
});

describe('paginate', () => {
  test('', () => {
    const { sql } = paginate(knex('table'), 2, 100).toSQL();
    expect(sql.endsWith('limit ? offset ?')).toBe(true);
  });
});
