var search = require('simple-object-query').search,
    CssSelectorParser = require('css-selector-parser').CssSelectorParser,
    cssParser = new CssSelectorParser();

cssParser
    .registerNestingOperators('>')
    .registerAttrEqualityMods('^', '$', '*', '~')
;

module.exports = cssFind;

function cssFind(root, rule) {
    if (typeof rule === 'string') {
        rule = cssParser.parse(rule);
    }

    if (rule.type === 'selectors') {
        for (var i = 0, len = rule.selectors.length; i < len; i++) {
            var res = cssFind(root, rule.selectors[i].rule);
            
            if (res) return res;
        }
        
        return;
    }
    else if (rule.type === 'ruleSet') {
        rule = rule.rule;
    }

    return search({
        source: root,
        query: {
            type: 'tag'
        },
        include: function (item) {
            if (rule.nestingOperator === '>' && item.parent && item.parent !== root) return false;

            return (
                item.field === 'children' ||
                item.path[item.path.length - 1] === 'children'
            );
        },
        callback: function (item) {
            if (item.target === root) return;

            var node = item.target;

            if (isCssValid(node, rule)) {
                if (!rule.rule) {
                    return node;
                }

                return cssFind(node, rule.rule);
            }
        }
    });
}

function isCssValid(node, rule) {
    var i, len;

    if (rule.tagName) {
        if (node.name !== rule.tagName) return false;
    }

    if (rule.classNames) {
        var classes = (node.attr['class'] || '').split(/\s+/);

        for (i = 0, len = rule.classNames.length; i < len; i++) {
            if (classes.indexOf(rule.classNames[i]) === -1) return false;
        }
    }

    if (rule.attrs) {
        for (i = 0, len = rule.attrs.length; i < len; i++) {
            var attr = rule.attrs[i];

            if (!node.attr.hasOwnProperty(attr.name)) return false;

            switch (attr.operator) {
            case '=':
                if (node.attr[attr.name] !== attr.value) return false;
                break;

            case '^=':
                if (node.attr[attr.name].indexOf(attr.value) !== 0) return false;
                break;

            case '$=':
                if (node.attr[attr.name].slice(-attr.value.length) !== attr.value) return false;
                break;

            case '*=':
                if (node.attr[attr.name].indexOf(attr.value) === -1) return false;
                break;
            }
        }
    }

    if (rule.pseudos) {
        for (i = 0, len = rule.pseudos.length; i < len; i++) {
            var pseudo = rule.pseudos[i];

            switch (pseudo.name) {
            case 'nth-child':
            case 'eq':
                if (getChildNodes(node.parent).indexOf(node) !== Number(pseudo.value) - 1) return false;
                break;
            }
        }
    }

    return true;
}

function getChildNodes(node) {
    var nodes = [];

    for (var i = 0, len = node.children.length; i < len; i++) {
        if (node.children[i].type === 'tag') {
            nodes.push(node.children[i]);
        }
    }

    return nodes;
}