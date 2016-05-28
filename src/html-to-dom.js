var parser = require('simple-html-dom-parser').parse,
    search = require('simple-object-query').search,
    get = require('simple-object-query').get,
    clone = require('./clone'),
    cssFind = require('./css-find'),
    requireModule = require('./require-module'),
    globalTags = require('./global-tags'),
    fs = require('fs'),
    util = require('util'),
    pt = require('path');

module.exports = htmlToDom;

/**
 * @param {String} html
 * @param {String} filePath This param needs to resolve path of imported files
 * @returns {HtmlModule}
 */
function htmlToDom(html, filePath) {
    if (!filePath) {
        throw new Error('File path is required');
    }

    var fileDir = pt.dirname(filePath);

    var dom = parser(html, {
        regex: {
            attribute: /[!~\w][\w:\-\.]*/
        }
    });
    
    // comments

    removeComments(dom);

    // imports

    dom.imports = {};
    
    var importsText = dom.children[0] && dom.children[0].type === 'text' ? 
                        dom.children[0] :
                      dom.children.length >= 2 && dom.children[0].type === 'doctype' && dom.children[1].type === 'text' ? 
                        dom.children[1] : null;

    if (importsText) {
        importsText.data = getImportsFromText(importsText.data, function (item) {
            var importName = item.alias || item.name;

            switch (item.type) {
            case 'module':
                importName = importName === '*' ? '' : importName + '.';

                var exports = requireModule(item.path, fileDir);

                for (var name in exports) {
                    if (!exports.hasOwnProperty(name)) continue;

                    dom.imports[importName + name] = {
                        name: name,
                        alias: importName + name,
                        path: item.path,
                        type: 'tag'
                    };
                }
                break;

            case 'default':
                dom.imports[importName] = {
                    name: 'default',
                    alias: importName,
                    path: item.path,
                    type: 'tag'
                };
                break;
            
            case 'anonymous':
                requireModule(item.path, fileDir);
                break;

            default:
                dom.imports[importName] = item;
            }
        });
    }

    // annotations

    find(dom, {type: 'text'}, function (item) {
        var text = item.target;

        text.annotations = [];

        text.data = getAnnotationsFromText(text.data, function (annotation) {
            if (!text.next || text.next.type !== 'tag') {
                throw new Error('After annotations should be a tag');
            }

            text.annotations.push(annotation);
        });
    });
    
    // shadow dom

    find(dom, {type: 'tag'}, function (item) {
        var tag = item.target;

        if (!dom.imports[tag.name] && !globalTags[tag.name]) return;
        
        tag.shadowAttr = {};
        
        for (var name in tag.attr) {
            if (!tag.attr.hasOwnProperty(name) || name.charAt(0) !== '~') continue;
            
            var value = tag.attr[name];
            
            delete tag.attr[name];
            
            name = name.slice(1);

            tag.shadowAttr[name] = value;
        }

        var shadowDom;

        if (dom.imports[tag.name]) {
            var parent = dom.imports[tag.name];

            shadowDom = requireModule(parent.path, fileDir)[parent.name];
        }
        else {
            shadowDom = globalTags[tag.name];
        }
        
        switch (typeof shadowDom) {
        case 'object':
            // ok
            break;

        case 'string':
            shadowDom = htmlToFirstTag(shadowDom, parent.path);
            break;
            
        case 'function':
            shadowDom = shadowDom(tag);
            
            switch (typeof shadowDom) {
            case 'object':
                // ok
                break;
            
            case 'string':
                shadowDom = htmlToFirstTag(shadowDom, parent.path);
                break;
            
            default: 
                throw new Error('Extension tag handler should return string or dom object');
            }
            break;

        case 'undefined':
            throw new Error('Undefined import tag ' + tag.name);

        default:
            throw new Error('Unknown type of tag');
        }

        tag.shadowDom = clone(shadowDom);
    });
    
    // compile
    
    find(dom, {type: 'tag', shadowDom: isObject}, function (item) {
        var root = item.target;

        compileShadowDom(root);

        var shadowDom = root.shadowDom;

        deepMergeShadowDom(root, shadowDom);

        replace(root, root.shadowDom);

        delete root.shadowDom;
    });

    // exports

    dom.exports = {};

    find(dom, {type: 'text'}, function (item) {
        var text = item.target;

        text.annotations.forEach(function (annotation) {
            switch (annotation.name) {

            case 'export':
                dom.exports[annotation.value.trim() || 'default'] = text.next;
                break;

            case 'global':
                var name = annotation.value.trim();

                if (!name) {
                    throw new Error('Name for global tag is required');
                }

                globalTags[name] = text.next;
                break;
            }
        });
    });
    
    return dom;
}

function compileShadowDom(node) {
    search({
        source: node,
        query: {
            type: 'tag',
            shadowDom: isObject
        },
        include: function (item) {
            return (
                item.field === 'children' ||
                item.path[item.path.length - 1] === 'children'
            );
        },
        callback: function (item) {
            if (item.target === node) return;

            compileShadowDom(item.target);
        }
    });

    find(node, {type: 'tag'}, function (item) {
        var tag = item.target,
            text = tag.prev;

        if (!(
            tag !== node &&
            text &&
            text.type === 'text' &&
            text.annotations &&
            text.annotations.length > 0
        )) {
            return;
        }

        if (tag.shadowDom) {
            merge(tag.shadowDom, tag);
        }

        var root = node,
            path = getPath(text, root),
            targetText = get(root.shadowDom, path);

        if (targetText && targetText.type === 'text') {
            merge(targetText, text);
        }
        else {
            targetText = insertTo(root.shadowDom, path, emptyClone(text));
        }

        var targetTag = targetText.next,
            context,
            currentContainer,
            targetContainer,
            targetNode;

        text.annotations.forEach(function (annotation) {
            switch (annotation.name) {
            
            case 'prepend':
                path[path.length - 1] = 0;
                insertTo(root.shadowDom, path, context || flatClone(tag));
                insertTo(text.parent, ['children', 0], tag);
                return;
            
            case 'append':
                remove(tag);
                path[path.length - 1] = Number.MAX_VALUE;
                insertTo(root.shadowDom, path, context || tag.shadowDom || flatClone(tag));
                return;

            case 'insert':
                path[path.length - 1] = Number(path[path.length - 1]) + 1;
                insertTo(root.shadowDom, path, context || flatClone(tag));
                insertTo(text.parent, ['children', path[path.length - 1]], tag);
                break;

            case 'remove':
                if (targetTag.next && targetTag.next.type === 'text') {
                    targetText.data += targetTag.next.data;
                    remove(targetTag.next);
                }

                remove(tag);
                remove(targetTag);
                break;

            case 'empty':
                merge(targetTag, tag);
                targetTag.children = [];
                break;

            case 'find':
                context = targetTag = cssFind(targetTag.parent, annotation.value);

                if (!context) {
                    throw new Error(`Can't find tag by selector "${annotation.value}"`);
                }

                remove(tag);
                break;

            case 'appendTo':
                currentContainer = get(root.shadowDom, getPath(text.parent, root));
                targetContainer = cssFind(currentContainer, annotation.value);
                
                remove(tag);
                appendTo(targetContainer, context || flatClone(tag));
                break;

            case 'prependTo':
                currentContainer = get(root.shadowDom, getPath(text.parent, root));
                targetContainer = cssFind(currentContainer, annotation.value);

                remove(tag);
                prependTo(targetContainer, context || flatClone(tag));
                break;

            case 'insertAfter':
                currentContainer = get(root.shadowDom, getPath(text.parent, root));
                targetNode = cssFind(currentContainer, annotation.value);

                remove(tag);
                insertAfter(targetNode, context || flatClone(tag));
                break;

            case 'insertBefore':
                currentContainer = get(root.shadowDom, getPath(text.parent, root));
                targetNode = cssFind(currentContainer, annotation.value);

                remove(tag);
                insertBefore(targetNode, context || flatClone(tag));
                break;
            }
        });

        if (context) {
            deepMergeShadowDom(tag, context);
        }

        if (text.next && text.next.type === 'text') {
            text.next.data = text.data + text.next.data;
            remove(text);
        }
    });
}

function removeComments(root) {
    find(root, {type: 'comment'}, function (item) {
        var comment = item.target;

        if (
            comment.prev &&
            comment.prev.type === 'text' &&
            comment.next &&
            comment.next.type === 'text'
        ) {
            comment.prev.data += comment.next.data;
            remove(comment.next);
        }

        remove(comment);
    });
}

function find(dom, query, cb) {
    return search({
        source: dom,
        query: query,
        include: function (item) {
            return (
                item.field === 'children' ||
                item.path[item.path.length - 1] === 'children'
            );
        },
        callback: cb
    });
}

function getImportsFromText(text, cb) {
    return text
        .replace(/^ *import +["'](.+)["'] *(as +[\w\.\-]+)? *(?:\r\n|\n)?/gm, function (x, path, alias) {
            alias = alias && alias.replace(/^as +/, '');

            cb({
                alias: alias,
                type: alias ? 'default' : 'anonymous',
                path: path
            });

            return '';
        })
        .replace(/^ *import +(.+) +from +["'](.+)["'] *(?:\r\n|\n)?/gm, function (x, items, path) {
            items
                .replace(/\{([^}]+)}/, function (x, items) {
                    items
                        .split(/\s*,\s*/)
                        .forEach(function (tag) {
                            var name = tag.match(/^[\w\.\-]+/)[0],
                                alias = tag.match(/as\s+([\w\.\-]+)$/);

                            if (alias) alias = alias[1];

                            cb({
                                name: name,
                                alias: alias,
                                path: path,
                                type: 'tag'
                            });
                        })
                    ;

                    return '';
                })
                .split(/\s*,\s*/)
                .forEach(function (tag) {
                    if (!tag) return;

                    var name = tag.match(/^(?:\*|[\w\.\-]+)/)[0],
                        alias = tag.match(/as\s+([\w\.\-]+)$/);

                    if (alias) alias = alias[1];

                    cb({
                        name: name,
                        alias: alias,
                        path: path,
                        type: name === '*' ? 'module' : 'default'
                    });
                })
            ;

            return '';
        });
}

function getAnnotationsFromText(text, cb) {
    return text.replace(/^ *@([\w\-]+) *(.*)(\r\n|\n)?/gm, function (x, name, value) {
        cb({
            name: name,
            value: value
        });

        return '';
    });
}

function isObject(val) {
    return !!val && typeof val === 'object';
}

function mergeTag(target, source) {
    if (source.shadowDom !== target && source.name !== 'tag') {
        target.name = source.name;
    }

    var tAttr = target.attr,
        sAttr = source.attr;

    var name;

    if (sAttr['class']) {
        var tClasses = classHash(tAttr['class'] || ''),
            sClasses = classHash(sAttr['class'] || '');

        for (name in sClasses) {
            if (!sClasses.hasOwnProperty(name)) continue;

            if (name.charAt(0) === '!') {
                delete tClasses[name.slice(1)];

                continue;
            }

            tClasses[name] = true;
        }

        var classes = [];

        for (name in tClasses) {
            if (!tClasses.hasOwnProperty(name)) continue;
            
            classes.push(name);
        }

        tAttr['class'] = classes.join(' ');
    }

    for (name in sAttr) {
        if (!sAttr.hasOwnProperty(name) || name === 'class') continue;

        if (name.charAt(0) === '!') {
            delete tAttr[name.slice(1)];

            continue;
        }

        tAttr[name] = sAttr[name];
    }

    return target;
}

function mergeText(tagret, source) {
    if (!source.data.trim()) return;

    tagret.data = source.data;

    return tagret;
}

function merge(target, source) {
    if (target.type !== source.type) {
        throw new Error('Types are not equal');
    }

    switch (target.type) {
    case 'tag':
        mergeTag(target, source);
        break;
    case 'text':
        mergeText(target, source);
        break;
    default:
        throw new Error('Unknown type');
    }

    return target;
}

function deepMergeShadowDom(root, shadowDom) {
    merge(shadowDom, root);

    find(root, {type: /^(tag|text)$/}, function (item) {
        if (item.target === root) return;

        var tag = item.target,
            path = item.path,
            target = get(shadowDom, path);

        if (tag.shadowDom) {
            merge(tag.shadowDom, tag);
            if (target) {
                replace(target, tag.shadowDom);
            }
            else {
                insertTo(shadowDom, path, tag.shadowDom);
            }
        }
        else if (target && target.type === tag.type) {
            merge(target, tag);
        }
        else if (tag.type === 'text') {
            insertTo(shadowDom, path, flatClone(tag));
        }
        else {
            insertTo(shadowDom, path, emptyClone(tag));
        }
    });
}

function classHash(classes) {
    var hash = {};

    classes.split(/\s+/).forEach(function (name) {
        if (!name) return;

        hash[name] = true;
    });

    return hash;
}

function insertTo(dom, path, node) {
    remove(node);

    var index = Number(path[path.length - 1]);

    var parent = get(dom, path.slice(0, -2));

    parent.children.splice(index, 0, node);

    index = parent.children.indexOf(node);

    node.parent = parent;
    node.prev = parent.children[index - 1] || null;
    node.next = parent.children[index + 1] || null;

    if (node.prev) {
        node.prev.next = node;
    }

    if (node.next) {
        node.next.prev = node;
    }

    return node;
}

function appendTo(parent, node) {
    remove(node);

    insertTo(parent, ['children', Number.MAX_VALUE], node);
}

function prependTo(parent, node) {
    remove(node);

    insertTo(parent, ['children', 0], node);
}

function insertBefore(target, node) {
    remove(node);

    var index = target.parent.children.indexOf(target);

    insertTo(target.parent, ['children', index], node);
}

function insertAfter(target, node) {
    remove(node);

    var index = target.parent.children.indexOf(target);

    insertTo(target.parent, ['children', index + 1], node);
}

function replace(target, replacment) {
    replacment.parent = target.parent;
    replacment.prev = target.prev;
    replacment.next = target.next;

    if (target.parent) {
        var index = target.parent.children.indexOf(target);
        target.parent.children[index] = replacment;
    }

    if (target.prev) {
        target.prev.next = replacment;
    }

    if (target.next) {
        target.next.prev = replacment;
    }

    target.parent = target.prev = target.next = null;
}

function createTag(name) {
    return {
        type: 'tag',
        name: name || 'tag',
        attr: {},
        children: [],
        parent: null,
        prev: null,
        next: null
    };
}

function createText(data) {
    return {
        type: 'text',
        data: data || '',
        annotations: [],
        parent: null,
        prev: null,
        next: null
    };
}

function emptyClone(node) {
    var clone;

    switch (node.type) {
    case 'tag':
        clone = createTag();
        break;
    case 'text':
        clone = createText();
        break;
    }

    return merge(clone, node);
}

function remove(node) {
    if (node.parent) {
        var index = node.parent.children.indexOf(node);
        node.parent.children.splice(index, 1);
    }

    if (node.prev) {
        node.prev.next = node.next;
    }

    if (node.next) {
        node.next.prev = node.prev;
    }

    node.parent = node.prev = node.next = null;
}

function getPath(node, root) {
    var path = [];

    if (node === root) return path;

    search({
        query: {
            type: 'tag'
        },
        source: node,
        include: function (item) {
            return (
                item.field === 'parent'
            );
        },
        callback: function (item) {
            if (item.target === node) return;

            var parent = item.target,
                index = parent.children.indexOf(node);

            path.push(index, 'children');

            node = parent;

            if (node === root) return true;
        }
    });

    return path.reverse();
}

function flatClone(node) {
    node = clone(node);

    find(node, {shadowDom: isObject}, function (item) {
        replace(item.target, flatClone(item.target.shadowDom));
    });

    return node;
}

function htmlToFirstTag(html, file) {
    html = htmlToDom(html, file);
    return html.children[0].type === 'tag' ? html.children[0] : html.children[1];
}