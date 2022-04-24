"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = exports.order = exports.filter = void 0;
const BUILDER_ORDER_DIRECTION_BY_ORDER_DIRECTION = {
    '+': 'asc',
    '-': 'desc',
};
const BUILDER_OPERATOR_BY_COMPARISON_OPERATOR = {
    eq: '=',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    ne: '<>',
};
const METHOD_BY_CALLBACK_OPERATOR = {
    or: 'orWhere',
    and: 'andWhere',
    and_not: 'andWhereNot',
    not: 'andWhereNot',
    or_not: 'orWhereNot',
};
const METHOD_BY_IS_OR_BY_RANGE_OPERATOR = {
    in: { true: 'orWhereIn', false: 'whereIn' },
    not_in: { true: 'orWhereNotIn', false: 'whereNotIn' },
    btw: { true: 'orWhereBetween', false: 'whereBetween' },
    not_btw: { true: 'orWhereNotBetween', false: 'whereNotBetween' },
};
const METHOD_BY_IS_OR_BY_NULL_OPERATOR = {
    is: { true: 'orWhereNull', false: 'whereNull' },
    eq: { true: 'orWhereNull', false: 'whereNull' },
    is_not: { true: 'orWhereNotNull', false: 'whereNotNull' },
    ne: { true: 'orWhereNotNull', false: 'whereNotNull' },
};
const METHOD_BY_IS_OR = { true: 'orWhere', false: 'where' };
const NEGATED_BUILDER_METHOD_BY_IS_OR = { true: 'orWhereNot', false: 'whereNot' };
const ORDER_DIRECTION_REPLACEMENT_REGEX = /^(\+|\-)/;
exports.default = { filter, order, paginate };
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
function filter(builder, filterObject) {
    if (!filterObject || typeof filterObject !== 'object') {
        return builder;
    }
    for (const key of Object.keys(filterObject)) {
        const value = filterObject[key];
        if (METHOD_BY_CALLBACK_OPERATOR[key]) {
            builder[METHOD_BY_CALLBACK_OPERATOR[key]](builder => filter(builder, value));
        }
        else {
            const parts = key.split('__');
            switch (parts.length) {
                case 2:
                    filterOperator(builder, parts[0], parts[1], value);
                    break;
                case 3:
                    filterOperator(builder, parts[1], parts[2], value, parts[0] === 'or');
            }
        }
    }
    return builder;
}
exports.filter = filter;
function filterOperator(builder, column, operator, value, isOr) {
    var _a;
    const isOrString = String(!!isOr);
    if (value === null) {
        builder[((_a = METHOD_BY_IS_OR_BY_NULL_OPERATOR[operator]) !== null && _a !== void 0 ? _a : METHOD_BY_IS_OR_BY_NULL_OPERATOR.is)[isOrString]](column);
    }
    else if (METHOD_BY_IS_OR_BY_RANGE_OPERATOR[operator]) {
        builder[METHOD_BY_IS_OR_BY_RANGE_OPERATOR[operator][isOrString]](column, value);
    }
    else {
        const parts = operator.split('_');
        switch (parts.length) {
            case 1:
                builder[METHOD_BY_IS_OR[isOrString]](column, BUILDER_OPERATOR_BY_COMPARISON_OPERATOR[parts[0]] || parts[0], value);
                break;
            case 2:
                builder[NEGATED_BUILDER_METHOD_BY_IS_OR[isOrString]](column, BUILDER_OPERATOR_BY_COMPARISON_OPERATOR[parts[1]] || parts[1], value);
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
function order(builder, ...orderStrings) {
    for (const orderString of orderStrings) {
        builder.orderBy(orderString.replace(ORDER_DIRECTION_REPLACEMENT_REGEX, ''), BUILDER_ORDER_DIRECTION_BY_ORDER_DIRECTION[orderString.charAt(0)] ||
            order.defaultOrderDirection);
    }
    return builder;
}
exports.order = order;
order.defaultOrderDirection = 'asc';
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
function paginate(builder, page = 1, pageSize = paginate.defaultPageSize) {
    builder.limit(pageSize);
    builder.offset((Math.max(1, page) - 1) * pageSize);
    return builder;
}
exports.paginate = paginate;
paginate.defaultPageSize = 15;
//# sourceMappingURL=index.js.map