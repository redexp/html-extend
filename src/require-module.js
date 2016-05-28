var resolve = require('resolve'),
    pt = require('path');

/**
 * @typedef {Object} HtmlModule
 * @property {Object} imports - Hash of imported tags
 * @property {Object} exports - Hash of exported tags
 * @property {Array} children
 */

var modules = {},
    extensions = {},
    extensionsList = [];

requireModule.modules = modules;
requireModule.setExtension = setExtension;

module.exports = requireModule;

function requireModule(path, baseDir) {
    var realPath = resolve.sync(path, {
        basedir: baseDir,
        extensions: extensionsList
    });

    if (modules[realPath]) return modules[realPath];

    var ext = pt.extname(realPath),
        cb = extensions[ext];

    return modules[realPath] = cb(realPath);
}

/**
 * @param {Array<String>|String} fileExtensions
 * @param {Function} handler
 */
function setExtension(fileExtensions, handler) {
    if (!Array.isArray(fileExtensions)) {
        fileExtensions = [fileExtensions];
    }

    fileExtensions.forEach(function (ext) {
        ext = '.' + ext;

        if (!handler && extensions[ext]) {
            delete extensions[ext];
        }
        else {
            extensions[ext] = handler;
        }
    });

    extensionsList = Object.keys(extensions);
}