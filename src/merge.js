module.exports = merge;

var deepClone = require('./clone');

function merge(a, b) {
    var obj = {};

    for (var field in a) {
        if (!a.hasOwnProperty(field)) continue;

        switch (field) {
        case 'attr':
            obj.attr = {};
            extend(obj.attr, a.attr);
            extend(obj.attr, b.attr);
            break;

        case 'children':

            break;

        default:
            obj[field] = a[field];
        }
    }

    return obj;
}

function extend(target, src) {
    for (var field in src) {
        if (!src.hasOwnProperty(field)) continue;

        target[field] = src[field];
    }

    return target;
}