# DEQUERY

## WHAT IS THIS?

It's an fully typed declarative query builder with zero dependencies, mostly to be used to build queries using knex over query string.

## WHAT IS THE POINT?

The point is to build complex queries using query parameters from the client side for GET requests.

### FOR EXAMPLE

#### CLIENT SIDE

```ts
import { Filter } from 'dequery';

const filter: Filter = {
  column1__like: 'some string',
  or__column2__eq: 12,
  or: {
    column3__is: null,
    column4__not_btw: [0, 1],
    column5__not_in: ['a', 'b', 'c'],
    or__column6__in: [1, 2, 3, 4],
  },
  and: {
    column7__ilike: 'some case insensitive string',
    column8__not_is: false,
  },
  not: {
    column9__gte: 12,
  },
  or_not: {
    column10__is: false,
  },
  and_not: {
    column11__lte: 'date-string or w/e',
  },
};

const filterString = JSON.stringify(filter);

const url = `https://my.host.com/path?filter=${filterString}`;

// make a request with the url etc...
```

#### SERVER SIDE

```ts
import { filter } from 'dequery';

server.get('/path', req => {
  const queryFilter = JSON.parse(req.query.filter);
  const query = knex('table');
  filter(query, queryFilter);
  return query;
});
```

## HOW DO I USE IT?

### INSTALLING

```sh
npm i dequery knex
```

### USAGE

```ts
import { filter } from 'dequery'

const { sql } = filter(knex("table", { column1__eq: 12, or__column2__eq: 13 }).toSQL();

sql // 'select * from "table" where "column1" = ? or "column2" = ?'
```

### ALSO INCLUDED

#### PAGINATE

```ts
import { paginate } from 'dequery';

const { sql } = paginate(knex('table'), 1, 100).toSQL();

sql; // 'select * from table offset ? limit ?'
```

#### ORDER

```ts
import { order } from 'dequery';

const { sql } = order(knex('table'), 'column1__asc', 'column2__desc').toSQL();

sql; // 'select * from table order by "column1" asc, "column2" desc'
```

## THINGS TO NOTE

- the separator for operators is double underscore `"__"` , so do not use it in column names
