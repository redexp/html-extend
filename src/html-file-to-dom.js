var htmlToDom = require('./html-to-dom'),
    fs = require('fs');

module.exports = htmlFileToDom;

/**
 * @param {String} filePath
 * @returns {HtmlModule}
 */
function htmlFileToDom(filePath) {
    return htmlToDom(fs.readFileSync(filePath).toString(), filePath);
}