var toHtml = require('simple-html-dom-parser').getOuterHTML,
    htmlFileToDom = require('./src/html-file-to-dom'),
    htmlToDom = require('./src/html-to-dom'),
    setExtension = require('./src/require-module').setExtension;

module.exports.render = render;

module.exports.htmlToDom = htmlToDom;

module.exports.htmlFileToDom = htmlFileToDom;

module.exports.domToHtml = toHtml;

module.exports.setExtension = setExtension;

setExtension(['html', 'htm'], function (file) {
    return htmlFileToDom(file).exports;
});

/**
 * @param filePath
 * @returns {String}
 */
function render(filePath) {
    return toHtml(htmlFileToDom(filePath));
}