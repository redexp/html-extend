var chai = require('chai'),
    expect = require('chai').expect;

chai.use(require('chai-shallow-deep-equal'));

var htmFileToDom = require('../src/html-to-dom');

describe('dom', function () {
    it('should have imports', function () {
        var dom = htmFileToDom(__dirname + '/imports/index.html');

        expect(dom.imports.Layout).to.deep.equal({
            name: 'default',
            alias: 'Layout',
            type: 'tag',
            path: __dirname + '/imports/layout'
        });

        expect(dom.imports.TestFooter).to.deep.equal({
            name: 'Footer',
            alias: 'TestFooter',
            type: 'tag',
            path: __dirname + '/imports/layout'
        });

        expect(dom.imports['Helpers.Input']).to.deep.equal({
            name: 'Input',
            alias: 'Helpers.Input',
            type: 'tag',
            path: __dirname + '/imports/helpers'
        });

        expect(dom.imports['Helpers.Button']).to.deep.equal({
            name: 'Button',
            alias: 'Helpers.Button',
            type: 'tag',
            path: __dirname + '/imports/helpers'
        });

        expect(dom.imports['Button']).to.deep.equal({
            name: 'Button',
            alias: null,
            type: 'tag',
            path: __dirname + '/imports/helpers'
        });
    });

    it('should have exports', function () {
        var dom = htmFileToDom(__dirname + '/imports/helpers/index.html');

        expect(dom.exports.default).to.shallowDeepEqual({
            type: 'tag',
            name: 'div'
        });

        expect(dom.exports.Input).to.shallowDeepEqual({
            type: 'tag',
            name: 'Input'
        });

        expect(dom.exports.Button).to.shallowDeepEqual({
            type: 'tag',
            name: 'Button'
        });
    });

    it('should have shadow DOM', function () {
        var dom = htmFileToDom(__dirname + '/imports/helpers/index.html');

        expect(dom.exports.Input).to.shallowDeepEqual({
            type: 'tag',
            name: 'Input',
            shadowDom: {
                type: 'tag',
                name: 'input',
                attr: {
                    type: 'text'
                }
            }
        });
    });
});