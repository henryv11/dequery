"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = exports.order = exports.filter = void 0;
const operatorMap = {
    eq: '=',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    ne: '<>',
};
exports.default = { filter, order, paginate };
function filter(builder, filterObject) {
    if (!filterObject) {
        return builder;
    }
    for (const key of Object.keys(filterObject)) {
        const value = filterObject[key];
        switch (key) {
            case 'or':
                builder.orWhere(builder => filter(builder, value));
                break;
            case 'and':
                builder.andWhere(builder => filter(builder, value));
                break;
            case 'not':
            case 'and_not':
                builder.andWhereNot(builder => filter(builder, value));
                break;
            case 'or_not':
                builder.orWhereNot(builder => filter(builder, value));
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
exports.filter = filter;
function filterOperator(builder, column, operator, value, isOr) {
    switch (operator) {
        case 'in':
            isOr ? builder.orWhereIn(column, value) : builder.whereIn(column, value);
            break;
        case 'not_in':
            isOr ? builder.orWhereNotIn(column, value) : builder.whereNotIn(column, value);
            break;
        case 'btw':
            isOr
                ? builder.orWhereBetween(column, value)
                : builder.whereBetween(column, value);
            break;
        case 'not_btw':
            isOr
                ? builder.orWhereNotBetween(column, value)
                : builder.whereNotBetween(column, value);
            break;
        default:
            const parts = operator.split('_');
            switch (parts.length) {
                case 1:
                    isOr
                        ? builder.orWhere(column, operatorMap[parts[0]] || parts[0], value)
                        : builder.where(column, operatorMap[parts[0]] || parts[0], value);
                    break;
                case 2:
                    isOr
                        ? builder.orWhereNot(column, operatorMap[parts[1]] || parts[1], value)
                        : builder.whereNot(column, operatorMap[parts[1]] || parts[1], value);
                    break;
            }
    }
    return builder;
}
function order(builder, ...order) {
    [].concat(...order).forEach(order => {
        const [column, direction = 'asc'] = order.split('__');
        builder.orderBy(column, direction);
    });
    return builder;
}
exports.order = order;
function paginate(builder, page, pageSize) {
    builder.limit(pageSize);
    builder.offset((Math.max(1, page) - 1) * pageSize);
    return builder;
}
exports.paginate = paginate;
//# sourceMappingURL=index.js.map