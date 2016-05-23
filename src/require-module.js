var fs = require('fs');

/**
 * @typedef {Object} HtmlModule
 * @property {Object} imports - Hash of imported tags
 * @property {Object} exports - Hash of exported tags
 * @property {Array} children
 */

var modules = {},
    extensions = {};

requireModule.modules = modules;
requireModule.extensions = extensions;
requireModule.setExtension = setExtension;

module.exports = requireModule;

function requireModule(path) {
    if (modules[path]) return modules[path];

    var realPath = path;
    
    if (isDir(realPath)) {
        realPath += '/index';
    }
    
    var cb;

    for (var ext in extensions) {
        if (!extensions.hasOwnProperty(ext) || !fileExist(realPath + '.' + ext)) continue;

        cb = extensions[ext];
        break;
    }

    if (!cb) {
        throw new Error(`Unknown file type ${realPath}`)
    }

    modules[path] = cb(realPath + '.' + ext);

    return modules[path];
}

/**
 * @param {Array<String>|String} fileExtensions
 * @param {Function} handler
 */
function setExtension(fileExtensions, handler) {
    if (!Array.isArray(fileExtensions)) {
        fileExtensions = [fileExtensions];
    }

    fileExtensions.forEach(function (rule) {
        extensions[rule] = handler;
    });
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

function isDir(file) {
    try {
        return fs.statSync(file).isDirectory();
    }
    catch (e) {
        return false;
    }
}
