const operatorMap = {
  eq: '=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  ne: '<>',
} as const;

export function applyFiltering<QB extends FilteringQueryBuilder>(builder: QB, filtering?: Filtering): QB {
  if (!filtering) {
    return builder;
  }
  for (const key of Object.keys(filtering)) {
    const value = filtering[key];
    switch (key) {
      case 'or':
        builder.orWhere(builder => applyFiltering(builder, value as Filtering));
        break;
      case 'and':
        builder.andWhere(builder => applyFiltering(builder, value as Filtering));
        break;
      case 'not':
      case 'and_not':
        builder.andWhereNot(builder => applyFiltering(builder, value as Filtering));
        break;
      case 'or_not':
        builder.orWhereNot(builder => applyFiltering(builder, value as Filtering));
        break;
      default:
        const parts = key.split('__');
        switch (parts.length) {
          case 2:
            applyFilteringOperator(builder, parts[0], parts[1], value);
            break;
          case 3:
            applyFilteringOperator(builder, parts[1], parts[2], value, parts[0] === 'or');
            break;
        }
    }
  }
  return builder;
}

function applyFilteringOperator<QB extends FilteringQueryBuilder>(
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
            ? builder.orWhere(column, operatorMap[parts[0]] || parts[0], value as Value)
            : builder.where(column, operatorMap[parts[0]] || parts[0], value as Value);
          break;
        case 2:
          isOr
            ? builder.orWhereNot(column, operatorMap[parts[1]] || parts[1], value as Value)
            : builder.whereNot(column, operatorMap[parts[1]] || parts[1], value as Value);
          break;
      }
  }
  return builder;
}

export function applyOrdering<QB extends OrderingQueryBuilder>(builder: QB, ordering: Ordering | Ordering[]): QB {
  (Array.isArray(ordering) ? ordering : [ordering]).forEach(order => {
    const [column, direction = 'asc'] = order.split('__');
    builder.orderBy(column, direction as 'asc' | 'desc');
  });
  return builder;
}

export function applyPagination<QB extends PaginationQueryBuilder>(builder: QB, pagination: Pagination): QB {
  pagination.page = Math.max(1, pagination.page);
  builder.limit(pagination.size);
  builder.offset((pagination.page - 1) * pagination.size);
  return builder;
}

//#region Types
export type Value = string | number | boolean;

type Operator = keyof typeof operatorMap;

type AndOrPrefix<T extends string> = `${'and' | 'or'}__${T}`;

type KeyCombinations<T extends string> =
  | `${string}__${T}`
  | AndOrPrefix<`${string}__${T}`>
  | `${string}__not_${T}`
  | AndOrPrefix<`${string}__not_${T}`>;

export interface Filtering {
  [Key: KeyCombinations<Operator>]: Value;
  [Key: KeyCombinations<'btw'>]: [string, string] | [number, number];
  [Key: KeyCombinations<'in'>]: Value[];
  [Key: KeyCombinations<'like' | 'ilike'>]: string;
  [Key: KeyCombinations<'is'>]: null | boolean;
  or?: Filtering;
  and?: Filtering;
  not?: Filtering;
  and_not?: Filtering;
  or_not?: Filtering;
}

export interface Pagination {
  page: number;
  size: number;
}

export type Ordering = `${string}__${'asc' | 'desc'}` | string;

export interface FilteringQueryBuilder {
  andWhere(cb: (qb: FilteringQueryBuilder) => void): void;
  orWhere(cb: (qb: FilteringQueryBuilder) => void): void;
  orWhere(col: string, op: Operator | string, val: Value): void;
  andWhereNot(cb: (qb: FilteringQueryBuilder) => void): void;
  orWhereNot(cb: (qb: FilteringQueryBuilder) => void): void;
  orWhereNot(col: string, op: Operator | string, val: Value): void;
  whereIn(col: string, val: Value[]): void;
  orWhereIn(col: string, val: Value[]): void;
  whereNotIn(col: string, val: Value[]): void;
  orWhereNotIn(col: string, val: Value[]): void;
  where(col: string, op: Operator | string, val: Value): void;
  whereNot(col: string, op: Operator | string, val: Value): void;
  whereBetween(col: string, val: [string, string] | [number, number]);
  orWhereBetween(col: string, val: [string, string] | [number, number]);
  whereNotBetween(col: string, val: [string, string] | [number, number]): void;
  orWhereNotBetween(col: string, val: [string, string] | [number, number]): void;
}

export interface PaginationQueryBuilder {
  limit(limit: number): void;
  offset(offset: number): void;
}

export interface OrderingQueryBuilder {
  orderBy(column: string, direction: 'asc' | 'desc'): void;
}
//#endregion

//#region dead code
// export function applyFiltering<QB extends FilterQueryBuilder>(builder: QB, query: Filtering): QB {
//   for (const key of Object.keys(query)) {
//     const value = query[key as keyof typeof query];
//     if (key === 'and') {
//       (castArray(value) as Filtering[]).forEach((query) =>
//         builder.andWhere((builder) => applyFiltering(builder, query)),
//       );
//     } else if (key === 'or') {
//       (castArray(value) as Filtering[]).forEach((query) =>
//         builder.orWhere((builder) => applyFiltering(builder, query)),
//       );
//     } else if (key === 'not' || key === 'and_not') {
//       (castArray(value) as Filtering[]).forEach((query) =>
//         builder.andWhereNot((builder) => applyFiltering(builder, query)),
//       );
//     } else if (key === 'or_not') {
//       (castArray(value) as Filtering[]).forEach((query) =>
//         builder.orWhereNot((builder) => applyFiltering(builder, query)),
//       );
//     } else {
//       const [column, operator] = key.split('__');
//       if (operator === 'in') {
//         builder.whereIn(column, value as Value[]);
//       } else if (operator === 'not_in') {
//         builder.whereNotIn(column, value as Value[]);
//       } else if (operator === 'btw') {
//         builder.whereBetween(column, value as [string, string] | [number, number]);
//       } else if (operator === 'not_btw') {
//         builder.whereNotBetween(column, value as [string, string] | [number, number]);
//       } else {
//         if (operator.startsWith('not_')) {
//           const operatorWithoutNegation = operator.replace('not_', '');
//           builder.whereNot(
//             column,
//             operatorMap[operatorWithoutNegation as keyof typeof operatorMap] || operator,
//             value as Value,
//           );
//         } else {
//           builder.where(column, operatorMap[operator as keyof typeof operatorMap] || operator, value as Value);
//         }
//       }
//     }
//   }
//   return builder;
// }

// export interface Filtering {
//   [Key: `${string}__${keyof typeof operatorMap}` | `${string}__not_${keyof typeof operatorMap}`]: Value;
//   [Key: `${string}__in` | `${string}__not_in`]: Value[];
//   [Key: `${string}__like` | `${string}__not_like`]: string;
//   [Key: `${string}__btw` | `${string}__not_btw`]: [number, number] | [string, string];
//   or?: Filtering[] | Filtering;
//   and?: Filtering[] | Filtering;
//   not?: Filtering[] | Filtering;
//   and_not?: Filtering[] | Filtering;
//   or_not?: Filtering[] | Filtering;
// }
//#endregion
