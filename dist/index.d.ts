declare const operatorMap: {
    readonly eq: "=";
    readonly gt: ">";
    readonly gte: ">=";
    readonly lt: "<";
    readonly lte: "<=";
    readonly ne: "<>";
};
declare const _default: {
    filter: typeof filter;
    order: typeof order;
    paginate: typeof paginate;
};
export default _default;
export declare function filter<QB extends FilterQueryBuilder>(builder: QB, filterObject?: Filter): QB;
export declare function order<QB extends OrderQueryBuilder>(builder: QB, ...order: (Order | Order[])[]): QB;
export declare function paginate<QB extends PaginationQueryBuilder>(builder: QB, page: number, pageSize: number): QB;
export declare type Value = string | number | boolean;
declare type Operator = keyof typeof operatorMap;
declare type AndOrPrefix<T extends string> = `${'and' | 'or'}__${T}`;
declare type WithNegation<T extends string> = T | `not_${T}`;
declare type Key<T extends string> = `${string}__${WithNegation<T>}`;
declare type KeyCombinations<T extends string> = Key<T> | AndOrPrefix<Key<T>>;
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
export declare type Order = `${string}__${'asc' | 'desc'}` | string;
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
