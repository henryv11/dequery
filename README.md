# DEQUERY

## WHAT IS THIS?

It's an fully typed declarative query builder with zero dependencies, mostly to be used to build queries using knex over arguments sent over querystring.

## HOW DO I USE IT?

```sh
npm i dequery
```

```sh
import { applyFiltering } from 'dequery'

const query = applyFiltering(knex("table", { column1__eq: 12, or__column2__eq: 13 });
```
