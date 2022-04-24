declare const BUILDER_ORDER_DIRECTION_BY_ORDER_DIRECTION: {
    readonly '+': "asc";
    readonly '-': "desc";
};
declare const BUILDER_OPERATOR_BY_COMPARISON_OPERATOR: {
    readonly eq: "=";
    readonly gt: ">";
    readonly gte: ">=";
    readonly lt: "<";
    readonly lte: "<=";
    readonly ne: "<>";
};
declare const METHOD_BY_CALLBACK_OPERATOR: {
    readonly or: "orWhere";
    readonly and: "andWhere";
    readonly and_not: "andWhereNot";
    readonly not: "andWhereNot";
    readonly or_not: "orWhereNot";
};
declare const _default: {
    filter: typeof filter;
    order: typeof order;
    paginate: typeof paginate;
};
export default _default;
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
export declare function filter<TFilterQueryBuilder extends FilterQueryBuilder>(builder: TFilterQueryBuilder, filterObject?: Filter): TFilterQueryBuilder;
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
export declare function order<TOrderQueryBuilder extends OrderQueryBuilder>(builder: TOrderQueryBuilder, ...orderStrings: OrderString[]): TOrderQueryBuilder;
export declare namespace order {
    var defaultOrderDirection: "desc" | "asc";
}
/**
 * Applies pagination to the query builder and returns the query builder instance.
 * @example <caption>Usage</caption>
 * paginate(builder, 0, 100); // -> limit 100
 * paginate(builder, 1, 100); // -> limit 100
 * paginate(builder, 2, 100); // -> limit 100 offset 100
 * @param builder Query builder instance.
 * @param page Starts from 1. Defaults to 1. Uses builder offset method.
 * @example <caption>How offset is calculated</caption>
 * (Math.max(1, page) - 1) * pageSize;
 * @param pageSize Number of items per page.
 * Uses builder limit method. Defaults to 15. Can be overridden.
 * @example <caption>Overriding default page size</caption>
 * paginate.defaultPageSize = 15;
 * @returns Query builder instance.
 */
export declare function paginate<TPaginationQueryBuilder extends PaginationQueryBuilder>(builder: TPaginationQueryBuilder, page?: number, pageSize?: number): TPaginationQueryBuilder;
export declare namespace paginate {
    var defaultPageSize: number;
}
export declare type Filter = CallbackFilter & NullFilter & LikeFilter & InFilter & ComparisonFilter & BetweenFilter;
declare type CallbackFilter = {
    [Key in CallbackKey]?: Filter;
};
declare type NullFilter = {
    [Key in WithAndOr<ColumnWithOperator<WithReverseNegation<'is'>>>]?: null | boolean;
};
declare type LikeFilter = {
    [Key in KeyCombinations<LikeOperator>]?: string;
};
declare type InFilter = {
    [Key in KeyCombinations<'in'>]?: Value[];
};
declare type ComparisonFilter = {
    [Key in KeyCombinations<ComparisonOperator>]?: Value;
};
declare type BetweenFilter = {
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
declare type BuilderComparisonOperator = typeof BUILDER_OPERATOR_BY_COMPARISON_OPERATOR[ComparisonOperator] | LikeOperator;
declare type ComparisonOperator = keyof typeof BUILDER_OPERATOR_BY_COMPARISON_OPERATOR;
declare type CallbackKey = keyof typeof METHOD_BY_CALLBACK_OPERATOR;
declare type OrderDirection = keyof typeof BUILDER_ORDER_DIRECTION_BY_ORDER_DIRECTION;
declare type LikeOperator = 'like' | 'ilike';
export declare type Value = string | number | boolean | Date | null;
export declare type OrderString = `${OrderDirection}${string}` | string;
declare type AndOr = 'and' | 'or';
declare type Negation = 'not';
declare type Column = string;
declare type WithReverseNegation<T extends string> = T | `${T}_${Negation}`;
declare type WithNegation<T extends string> = T | `${Negation}_${T}`;
declare type WithAndOr<T extends string> = T | `${AndOr}__${T}`;
declare type ColumnWithOperator<T extends string> = `${Column}__${T}`;
declare type KeyCombinations<T extends string> = WithAndOr<ColumnWithOperator<WithNegation<T>>>;
