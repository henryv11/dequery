const operatorMap = {
  eq: '=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  ne: '<>',
} as const;

export default { filter, order, paginate };

export function filter<QB extends FilterQueryBuilder>(builder: QB, filterObject?: Filter): QB {
  if (!filterObject) {
    return builder;
  }
  for (const key of Object.keys(filterObject)) {
    const value = filterObject[key as keyof typeof filterObject];
    switch (key) {
      case 'or':
        builder.orWhere(builder => filter(builder, value as Filter));
        break;
      case 'and':
        builder.andWhere(builder => filter(builder, value as Filter));
        break;
      case 'not':
      case 'and_not':
        builder.andWhereNot(builder => filter(builder, value as Filter));
        break;
      case 'or_not':
        builder.orWhereNot(builder => filter(builder, value as Filter));
        break;
      default:
        const parts = key.split('__');
        switch (parts.length) {
          case 2:
            filterOperator(builder, parts[0], parts[1], value);
            break;
          case 3:
            filterOperator(builder, parts[1], parts[2], value, parts[0] === 'or');
            break;
        }
    }
  }
  return builder;
}

function filterOperator<QB extends FilterQueryBuilder>(
  builder: QB,
  column: string,
  operator: string,
  value: unknown,
  isOr?: boolean,
): QB {
  switch (operator) {
    case 'in':
      isOr ? builder.orWhereIn(column, value as Value[]) : builder.whereIn(column, value as Value[]);
      break;
    case 'not_in':
      isOr ? builder.orWhereNotIn(column, value as Value[]) : builder.whereNotIn(column, value as Value[]);
      break;
    case 'btw':
      isOr
        ? builder.orWhereBetween(column, value as [string, string] | [number, number])
        : builder.whereBetween(column, value as [string, string] | [number, number]);
      break;
    case 'not_btw':
      isOr
        ? builder.orWhereNotBetween(column, value as [string, string] | [number, number])
        : builder.whereNotBetween(column, value as [string, string] | [number, number]);
      break;
    default:
      const parts = operator.split('_');
      switch (parts.length) {
        case 1:
          isOr
            ? builder.orWhere(column, operatorMap[parts[0] as Operator] || parts[0], value as Value)
            : builder.where(column, operatorMap[parts[0] as Operator] || parts[0], value as Value);
          break;
        case 2:
          isOr
            ? builder.orWhereNot(column, operatorMap[parts[1] as Operator] || parts[1], value as Value)
            : builder.whereNot(column, operatorMap[parts[1] as Operator] || parts[1], value as Value);
          break;
      }
  }
  return builder;
}

export function order<QB extends OrderQueryBuilder>(builder: QB, ...order: Order[]): QB {
  order.forEach(order => {
    const [column, direction = 'asc'] = order.split('__');
    builder.orderBy(column, direction as 'asc' | 'desc');
  });
  return builder;
}

export function paginate<QB extends PaginationQueryBuilder>(builder: QB, page: number, pageSize: number): QB {
  builder.limit(pageSize);
  builder.offset((Math.max(1, page) - 1) * pageSize);
  return builder;
}

export type Value = string | number | boolean;

type Operator = keyof typeof operatorMap;

type AndOrPrefix<T extends string> = `${'and' | 'or'}__${T}`;

type WithNegation<T extends string> = T | `not_${T}`;

type Key<T extends string> = `${string}__${WithNegation<T>}`;

type KeyCombinations<T extends string> = Key<T> | AndOrPrefix<Key<T>>;

export interface Filter {
  [Key: KeyCombinations<Operator>]: Value;
  [Key: KeyCombinations<'btw'>]: [string, string] | [number, number];
  [Key: KeyCombinations<'in'>]: Value[];
  [Key: KeyCombinations<'like' | 'ilike'>]: string;
  [Key: KeyCombinations<'is'>]: null | boolean;
  or?: Filter;
  and?: Filter;
  not?: Filter;
  and_not?: Filter;
  or_not?: Filter;
}

export type Order = `${string}__${'asc' | 'desc'}` | string;

export interface FilterQueryBuilder {
  andWhere(cb: (qb: FilterQueryBuilder) => void): void;
  orWhere(cb: (qb: FilterQueryBuilder) => void): void;
  orWhere(col: string, op: Operator | string, val: Value): void;
  andWhereNot(cb: (qb: FilterQueryBuilder) => void): void;
  orWhereNot(cb: (qb: FilterQueryBuilder) => void): void;
  orWhereNot(col: string, op: Operator | string, val: Value): void;
  whereIn(col: string, val: Value[]): void;
  orWhereIn(col: string, val: Value[]): void;
  whereNotIn(col: string, val: Value[]): void;
  orWhereNotIn(col: string, val: Value[]): void;
  where(col: string, op: Operator | string, val: Value): void;
  whereNot(col: string, op: Operator | string, val: Value): void;
  whereBetween(col: string, val: [string, string] | [number, number]): void;
  orWhereBetween(col: string, val: [string, string] | [number, number]): void;
  whereNotBetween(col: string, val: [string, string] | [number, number]): void;
  orWhereNotBetween(col: string, val: [string, string] | [number, number]): void;
}

export interface PaginationQueryBuilder {
  limit(limit: number): void;
  offset(offset: number): void;
}

export interface OrderQueryBuilder {
  orderBy(column: string, direction: 'asc' | 'desc'): void;
}
