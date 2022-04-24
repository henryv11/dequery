const BUILDER_ORDER_DIRECTION_BY_ORDER_DIRECTION = {
  '+': 'asc',
  '-': 'desc',
} as const;

const BUILDER_OPERATOR_BY_COMPARISON_OPERATOR = {
  eq: '=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  ne: '<>',
} as const;

const METHOD_BY_CALLBACK_OPERATOR = {
  or: 'orWhere',
  and: 'andWhere',
  and_not: 'andWhereNot',
  not: 'andWhereNot',
  or_not: 'orWhereNot',
} as const;

const METHOD_BY_IS_OR_BY_RANGE_OPERATOR = {
  in: { true: 'orWhereIn', false: 'whereIn' },
  not_in: { true: 'orWhereNotIn', false: 'whereNotIn' },
  btw: { true: 'orWhereBetween', false: 'whereBetween' },
  not_btw: { true: 'orWhereNotBetween', false: 'whereNotBetween' },
} as const;

const METHOD_BY_IS_OR_BY_NULL_OPERATOR = {
  is: { true: 'orWhereNull', false: 'whereNull' },
  eq: { true: 'orWhereNull', false: 'whereNull' },
  is_not: { true: 'orWhereNotNull', false: 'whereNotNull' },
  ne: { true: 'orWhereNotNull', false: 'whereNotNull' },
} as const;

const METHOD_BY_IS_OR = { true: 'orWhere', false: 'where' } as const;

const NEGATED_BUILDER_METHOD_BY_IS_OR = { true: 'orWhereNot', false: 'whereNot' } as const;

const ORDER_DIRECTION_REPLACEMENT_REGEX = /^(\+|\-)/;

export default { filter, order, paginate };

/**
 * Applies filtering to the query builder and returns the query builder instance.
 * Allows to build complex filtering queries using Javascript Objects.
 * @example <caption>Usage</caption>
 * filter(builder, { column__eq: 0 }) // -> where "column" = 0
 * filter(builder, { column1__eq: 0, or__column2__eq: 1 }) // -> where "column1" = 0 or "column2" = 1
 * @param builder Query builder instance.
 * @param filterObject The {@link Filter} object to apply.
 * @returns Query builder instance.
 */
export function filter<Builder extends FilterQueryBuilder>(builder: Builder, filterObject?: Filter): Builder {
  if (!filterObject || typeof filterObject !== 'object') {
    return builder;
  }
  for (const key of Object.keys(filterObject)) {
    const value = filterObject[key as keyof typeof filterObject];
    if (METHOD_BY_CALLBACK_OPERATOR[key as CallbackKey]) {
      builder[METHOD_BY_CALLBACK_OPERATOR[key as CallbackKey]](builder => filter(builder, value as Filter));
    } else {
      const parts = key.split('__') as [string, Operator] | [AndOr, string, Operator];
      switch (parts.length) {
        case 2:
          filterOperator(builder, parts[0], parts[1], value as Value);
          break;
        case 3:
          filterOperator(builder, parts[1], parts[2], value as Value, parts[0] === 'or');
      }
    }
  }
  return builder;
}

function filterOperator<Builder extends FilterQueryBuilder>(
  builder: Builder,
  column: string,
  operator: Operator,
  value: Value,
  isOr?: boolean,
): Builder {
  const isOrString = String(!!isOr) as 'true' | 'false';
  if (value === null) {
    builder[
      (METHOD_BY_IS_OR_BY_NULL_OPERATOR[operator as NullOperator] ?? METHOD_BY_IS_OR_BY_NULL_OPERATOR.is)[isOrString]
    ](column);
  } else if (METHOD_BY_IS_OR_BY_RANGE_OPERATOR[operator as RangeOperator]) {
    builder[METHOD_BY_IS_OR_BY_RANGE_OPERATOR[operator as RangeOperator][isOrString]](
      column,
      value as Exclude<Value, string | number | boolean | null | Date>,
    );
  } else {
    const parts = operator.split('_') as
      | [ComparisonOperator | LikeOperator]
      | [Negation, ComparisonOperator | LikeOperator];
    switch (parts.length) {
      case 1:
        builder[METHOD_BY_IS_OR[isOrString]](
          column,
          BUILDER_OPERATOR_BY_COMPARISON_OPERATOR[parts[0] as ComparisonOperator] || parts[0],
          value,
        );
        break;
      case 2:
        builder[NEGATED_BUILDER_METHOD_BY_IS_OR[isOrString]](
          column,
          BUILDER_OPERATOR_BY_COMPARISON_OPERATOR[parts[1] as ComparisonOperator] || parts[1],
          value,
        );
    }
  }
  return builder;
}

/**
 * Applies ordering to the query builder and returns the query builder instance.
 * @example <caption>Usage</caption>
 * order(builder, '-column'); // -> order by "column" desc
 * order(builder, '+column'); // -> order by "column" asc
 * order(builder, 'column1', '-column2'); // -> order by "column1" asc, "column2" desc
 * order(builder, ...['column1', 'column2']); // array must be spread
 * @param builder Query builder instance.
 * @param orderStrings Columns to order by, prefixed with either '+' or '-'.
 * - '+' for ascending
 * - '-' for descending
 *
 * If column is not prefixed defaults to ascending. Can be overridden.
 * @example <caption>Overriding default order direction</caption>
 * order.defaultOrderDirection = 'asc'; // must be either 'asc' or 'desc'
 * @returns Query builder instance.
 */
export function order<Builder extends OrderQueryBuilder>(builder: Builder, ...orderStrings: OrderString[]): Builder {
  for (const orderString of orderStrings) {
    builder.orderBy(
      orderString.replace(ORDER_DIRECTION_REPLACEMENT_REGEX, ''),
      BUILDER_ORDER_DIRECTION_BY_ORDER_DIRECTION[orderString.charAt(0) as OrderDirection] ||
        order.defaultOrderDirection,
    );
  }
  return builder;
}

order.defaultOrderDirection = 'asc' as 'asc' | 'desc';

/**
 * Applies pagination to the query builder and returns the query builder instance.
 * @example <caption>Usage</caption>
 * paginate.delta = 1;
 * paginate(builder, -1, 100); // -> limit 100 // negative values are ignored
 * paginate(builder, 0, 100); // -> limit 100
 * paginate(builder, 1, 100); // -> limit 100
 * paginate(builder, 2, 100); // -> limit 100 offset 100
 * paginate.delta = 0;
 * paginate(builder, 0, 100); // -> limit 100
 * paginate(builder, 1, 100); // -> limit 100 offset 100 * @param builder Query builder instance.
 * @param page Starts from 1. Defaults to 1. Uses builder offset method.
 * @example <caption>How offset is calculated</caption>
 * (Math.max(paginate.delta, page) - paginate.delta) * pageSize);
 * @example <caption>Overriding delta</caption>
 * paginate.delta = 1; // Default page is 1, paging starts from 1. Default setting
 * paginate.delta = 0; // Default page is 0, paging starts from 0.
 * @param pageSize Number of items per page. Uses builder limit method.
 * @example <caption>Overriding default page size</caption>
 * paginate.defaultPageSize = 15; // Default is 15.
 * @returns Query builder instance.
 */
export function paginate<Builder extends PaginationQueryBuilder>(
  builder: Builder,
  page: number = paginate.delta,
  pageSize = paginate.defaultPageSize,
): Builder {
  builder.limit(pageSize);
  builder.offset((Math.max(paginate.delta, page) - paginate.delta) * pageSize);
  return builder;
}

paginate.defaultPageSize = 15;

paginate.delta = 1 as 1 | 0;

export type Filter = CallbackFilter & NullFilter & LikeFilter & InFilter & ComparisonFilter & BetweenFilter;

type CallbackFilter = {
  [Key in CallbackKey]?: Filter;
};

type NullFilter = {
  [Key in WithAndOr<ColumnWithOperator<WithReverseNegation<'is'>>>]?: null | boolean;
};

type LikeFilter = {
  [Key in KeyCombinations<LikeOperator>]?: string;
};

type InFilter = {
  [Key in KeyCombinations<'in'>]?: Value[];
};

type ComparisonFilter = {
  [Key in KeyCombinations<ComparisonOperator>]?: Value;
};

type BetweenFilter = {
  [Key in KeyCombinations<'btw'>]?: [string, string] | [number, number] | [Date, Date];
};

export interface FilterQueryBuilder {
  where(col: string, op: BuilderComparisonOperator, val: Value): void;
  whereNot(col: string, op: BuilderComparisonOperator, val: Value): void;
  andWhere(cb: (qb: FilterQueryBuilder) => void): void;
  andWhereNot(cb: (qb: FilterQueryBuilder) => void): void;
  orWhere(cb: (qb: FilterQueryBuilder) => void): void;
  orWhere(col: string, op: BuilderComparisonOperator, val: Value): void;
  orWhereNot(cb: (qb: FilterQueryBuilder) => void): void;
  orWhereNot(col: string, op: BuilderComparisonOperator, val: Value): void;
  whereIn(col: string, val: Value[]): void;
  orWhereIn(col: string, val: Value[]): void;
  whereNotIn(col: string, val: Value[]): void;
  orWhereNotIn(col: string, val: Value[]): void;
  whereBetween(col: string, val: [string, string] | [number, number]): void;
  whereNotBetween(col: string, val: [string, string] | [number, number]): void;
  orWhereBetween(col: string, val: [string, string] | [number, number]): void;
  orWhereNotBetween(col: string, val: [string, string] | [number, number]): void;
  whereNull(col: string): void;
  whereNotNull(col: string): void;
  orWhereNull(col: string): void;
  orWhereNotNull(col: string): void;
}

export interface PaginationQueryBuilder {
  limit(limit: number): PaginationQueryBuilder;
  offset(offset: number): PaginationQueryBuilder;
}

export interface OrderQueryBuilder {
  orderBy(column: string, direction: typeof BUILDER_ORDER_DIRECTION_BY_ORDER_DIRECTION[OrderDirection]): void;
}

type BuilderComparisonOperator = typeof BUILDER_OPERATOR_BY_COMPARISON_OPERATOR[ComparisonOperator] | LikeOperator;

type ComparisonOperator = keyof typeof BUILDER_OPERATOR_BY_COMPARISON_OPERATOR;

type RangeOperator = keyof typeof METHOD_BY_IS_OR_BY_RANGE_OPERATOR;

type NullOperator = keyof typeof METHOD_BY_IS_OR_BY_NULL_OPERATOR;

type CallbackKey = keyof typeof METHOD_BY_CALLBACK_OPERATOR;

type OrderDirection = keyof typeof BUILDER_ORDER_DIRECTION_BY_ORDER_DIRECTION;

type LikeOperator = 'like' | 'ilike';

type Operator = ComparisonOperator | RangeOperator | NullOperator | LikeOperator;

export type Value = string | number | boolean | Date | null;

export type OrderString = `${OrderDirection}${string}` | string;

type AndOr = 'and' | 'or';

type Negation = 'not';

type Column = string;

type WithReverseNegation<T extends string> = T | `${T}_${Negation}`;

type WithNegation<T extends string> = T | `${Negation}_${T}`;

type WithAndOr<T extends string> = T | `${AndOr}__${T}`;

type ColumnWithOperator<T extends string> = `${Column}__${T}`;

type KeyCombinations<T extends string> = WithAndOr<ColumnWithOperator<WithNegation<T>>>;
