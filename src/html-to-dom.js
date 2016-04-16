var parser = require('simple-html-dom-parser').parse,
    search = require('simple-object-query').search,
    get = require('simple-object-query').get,
    clone = require('./clone'),
    fs = require('fs'),
    util = require('util'),
    pt = require('path');

module.exports = htmlFileToDom;

// var annotations = {
//     find: findAnnotation
// };

var modules = {};

function htmlFileToDom(file) {
    var dom = parser(fs.readFileSync(file).toString(), {
        regex: {
            attribute: /[!\w][\w:\-\.]*/
        }
    });
    
    // comments

    find(dom.children, {type: 'comment'}, function (item) {
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

    // imports

    dom.imports = {};

    if (dom.children[0] && dom.children[0].type === 'text') {
        var dir = pt.dirname(file);

        dom.children[0].data = getImportsFromText(dom.children[0].data, function (item) {
            item.path = pt.join(dir, item.path);

            var importName = item.alias || item.name;

            switch (item.type) {
            case 'module':
                importName = importName === '*' ? '' : importName + '.';

                var exports = requireModule(item.path);

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

            default:
                dom.imports[importName] = item;
            }
        });
    }

    // exports

    dom.exports = {};

    find(dom.children, {type: 'text'}, function (item) {
        var text = item.target;

        text.annotations = [];

        text.data = getAnnotationsFromText(text.data, function (annotation) {
            text.annotations.push(annotation);

            if (annotation.name !== 'export') return;

            if (!text.next || text.next.type !== 'tag') {
                throw new Error('After @export should be a tag');
            }

            dom.exports[annotation.value || 'default'] = text.next;
        });
    });

    // shadow dom

    find(dom.children, {type: 'tag'}, function (item) {
        var tag = item.target,
            parent = dom.imports[tag.name];

        if (!parent) return;

        if (!parent.path) {
            log(parent);
        }

        var parentModule = requireModule(parent.path);

        tag.shadowDom = clone(parentModule[parent.name]);
    });

    // merge

    find(dom.children, {type: 'tag', shadowDom: isObject}, function (item) {
        var parent = item.target,
            shadowDom = parent.shadowDom;

        merge(shadowDom, parent);

        find(parent.children, {type: /^(tag|text)$/}, function (item) {
            var tag = item.target,
                path = item.path,
                target = get(shadowDom.children, path);

            if (tag.shadowDom) {
                merge(tag.shadowDom, tag);
                if (target) {
                    replace(target, tag.shadowDom);
                }
                else {
                    insertTo(shadowDom.children, path, tag.shadowDom);
                }
            }
            else if (target && target.type === tag.type) {
                merge(target, tag);
            }
            else {
                insertTo(shadowDom.children, path, emptyClone(tag));
            }
        });

        replace(parent, shadowDom);
    });

    return dom;
}

function find(dom, query, exclude, cb) {
    if (!cb) {
        cb = exclude;
        exclude = ['attr', 'annotations', 'shadowDom'];
    }

    return search({
        source: dom,
        query: query,
        exclude: ['parent', 'prev', 'next'].concat(exclude),
        callback: cb
    });
}

function getImportsFromText(text, cb) {
    return text.replace(/^\s*import\s+(.+)\s+from\s+["'](.+)["']/gm, function (x, items, path) {
        items
            .replace(/\{([^}]+)}/, function (x, items) {
                items
                    .split(/\s*,\s*/)
                    .forEach(function (tag) {
                        var name = tag.match(/^[\w\-]+/)[0],
                            alias = tag.match(/as\s+([\w\-]+)$/);

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

                var name = tag.match(/^[\w\-\*]+/)[0],
                    alias = tag.match(/as\s+([\w\-]+)$/);

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
    return text.replace(/^\s*@([\w\-]+)\s*(.*)/gm, function (x, name, value) {
        cb({
            name: name,
            value: value
        });

        return '';
    });
}

function requireModule(file) {
    file = file.replace(/\.html?$/, '');

    if (!modules[file]) {
        var ext = null;

        ['.html', '.htm', '/index.html', '/index.htm'].some(function (end) {
            if (fileExist(file + end)) {
                ext = end;
                return true;
            }
        });

        if (!ext) {
            throw new Error('File "'+ file +'" not exists or not readable')
        }

        modules[file] = htmlFileToDom(file + ext).exports;
    }

    return modules[file];
}

function fileExist(file) {
    try {
        fs.accessSync(file, fs.R_OK);
        return true;
    }
    catch (e) {
        return false;
    }
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

function classHash(classes) {
    var hash = {};

    classes.split(/\s+/).forEach(function (name) {
        if (!name) return;

        hash[name] = true;
    });

    return hash;
}

function insertTo(dom, path, node) {
    var index = Number(path[path.length - 1]);

    var parent = get(dom, path.slice(0, -2));

    parent.children.splice(index, 0, node);

    index = parent.children.indexOf(node);

    node.parent = parent;
    node.prev = parent.children[index - 1] || null;
    node.next = parent.children[index + 1] || null;
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

function wrapper(dom) {
    var obj = {};
    for (var field in dom) {
        if (!dom.hasOwnProperty(field)) continue;
        if ('parent prev next'.indexOf(field) > -1) continue;
        obj[field] = dom[field];
    }

    if (dom.children) {
        obj.children = [].concat(dom.children);
        dom.children.forEach(function (item, i) {
            obj.children[i] = wrapper(item);
        });
    }

    return obj;
}

function log(dom) {
    console.log(util.inspect(wrapper(dom), false, null));
}