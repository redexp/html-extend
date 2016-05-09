module.exports = clone;

function clone(node, parent) {
    var obj = {};

    for (var field in node) {
        if (!node.hasOwnProperty(field) || field === 'prev' || field === 'next') continue;

        switch (field) {
        case 'parent':
            obj.parent = parent;
            break;

        case 'shadowDom':
            obj[field] = node[field];
            break;

        case 'children':
            obj.children = [].concat(node.children);

            var prev = null, item = null;

            for (var i = 0, len = node.children.length; i < len; i++) {
                item = clone(node.children[i], obj);

                item.prev = prev;
                item.next = null;

                if (prev) {
                    prev.next = item;
                }

                obj.children[i] = item;

                prev = item;
            }
            break;

        default:
            switch (typeOf(node[field])) {
            case 'object':
                obj[field] = clone(node[field]);
                break;

            case 'array':
                obj[field] = [].concat(node[field]);
                break;

            default:
                obj[field] = node[field];
            }
        }
    }

    return obj;
}

function typeOf(val) {
    var type = typeof val;

    switch (type) {
    case 'object':
        return val ? Array.isArray(val) ? 'array' : 'object' : 'null';

    default:
        return val;
    }
}