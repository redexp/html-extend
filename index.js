var toHtml = require('simple-html-dom-parser').getOuterHTML,
    htmlFileToDom = require('./src/html-file-to-dom'),
    htmlToDom = require('./src/html-to-dom');

module.exports.compile = compile;

module.exports.htmlToDom = htmlToDom;

module.exports.htmlFileToDom = htmlFileToDom;

module.exports.domToHtml = toHtml;

/**
 * @param filePath
 * @returns {String}
 */
function compile(filePath) {
    return toHtml(htmlFileToDom(filePath));
}