var toHtml = require('simple-html-dom-parser').getOuterHTML,
    util = require('util'),
    htmlFileToDom = require('./src/html-to-dom'),
    fs = require('fs');

var dom = htmlFileToDom(__dirname + '/test/merge/index.html');


console.log(toHtml(dom));
//
//console.log(toHtml(dom));

// console.log(fs.accessSync(__dirname + '/test.html', fs.R_OK));

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