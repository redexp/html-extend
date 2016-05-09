var chai = require('chai'),
    expect = require('chai').expect,
    search = require('simple-object-query').search,
    toHtml = require('simple-html-dom-parser').getOuterHTML;

chai.use(require('chai-shallow-deep-equal'));

var htmFileToDom = require('../src/html-to-dom');

describe('imports', function () {
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
            name: 'input'
        });

        expect(dom.exports.Button).to.shallowDeepEqual({
            type: 'tag',
            name: 'button'
        });
    });

    it('should not have shadow DOM', function () {
        var dom = htmFileToDom(__dirname + '/imports/helpers/index.html');

        expect(dom.exports.Input).to.shallowDeepEqual({
            type: 'tag',
            name: 'input'
        });

        expect(dom.exports.Input).to.not.have.property('shadowDom');
    });
});

describe('merge', function () {
    it('should merge', function () {
        var dom = toHtml(htmFileToDom(__dirname + '/merge/index.html')),
            out = toHtml(htmFileToDom(__dirname + '/merge/output.html'));

        expect(dom).to.equal(out);
    });
});

describe('annotations', function () {
    it('should handle annotations', function () {
        var dom = toHtml(htmFileToDom(__dirname + '/annotations/index.html')),
            out = toHtml(htmFileToDom(__dirname + '/annotations/output.html'));

        expect(dom).to.equal(out);
    });
});

describe('cssFind', function () {
    var parser = require('simple-html-dom-parser').parse,
        cssFind = require('../src/css-find');
    
    it('should find node by css selector', function () {
        var node = parser(`<div><a href="index.html">Test <span class="open"></span> <i class="close"></i></a></div>`);
        
        var target = cssFind(node, '.close');
        
        expect(target).to.shallowDeepEqual({
            name: 'i',
            attr: {
                "class": 'close'
            }
        });

        target = cssFind(node, 'span.close');

        expect(target).to.be.an('undefined');

        target = cssFind(node, 'a[href="index.html"] .close');

        expect(target).to.shallowDeepEqual({
            name: 'i',
            attr: {
                "class": 'close'
            }
        });

        target = cssFind(node, 'a[href^="index"] .close');

        expect(target).to.shallowDeepEqual({
            name: 'i',
            attr: {
                "class": 'close'
            }
        });

        target = cssFind(node, 'a[href$=".html"] .close');

        expect(target).to.shallowDeepEqual({
            name: 'i',
            attr: {
                "class": 'close'
            }
        });

        target = cssFind(node, 'a[href*="x.h"] .close');

        expect(target).to.shallowDeepEqual({
            name: 'i',
            attr: {
                "class": 'close'
            }
        });

        target = cssFind(node, 'a[href*="test"] .close');

        expect(target).to.be.an('undefined');

        target = cssFind(node, 'a > .close');

        expect(target).to.shallowDeepEqual({
            name: 'i',
            attr: {
                "class": 'close'
            }
        });

        target = cssFind(node, 'div > .close');

        expect(target).to.be.an('undefined');
    });

    it('should handle comma', function () {
        var node = parser(`<div><a href="index.html">Test <span class="open"></span> <i class="close"></i></a></div>`);

        var target = cssFind(node, '.open, .close');

        expect(target).to.shallowDeepEqual({
            name: 'span',
            attr: {
                "class": 'open'
            }
        });

        target = cssFind(node, 'a[href="#"], span');

        expect(target).to.shallowDeepEqual({
            name: 'span',
            attr: {
                "class": 'open'
            }
        });

        target = cssFind(node, '.test, a > .close');

        expect(target).to.shallowDeepEqual({
            name: 'i',
            attr: {
                "class": 'close'
            }
        });
    });
    
    it('should handle pseudos', function () {
        var node = parser(`<div><a href="index.html">Test <span class="open"></span> <span class="close"></span></a></div>`);

        var target = cssFind(node, 'span:eq(2)');

        expect(target).to.shallowDeepEqual({
            name: 'span',
            attr: {
                "class": 'close'
            }
        });

        target = cssFind(node, 'a > span:nth-child(1)');

        expect(target).to.shallowDeepEqual({
            name: 'span',
            attr: {
                "class": 'open'
            }
        });

        target = cssFind(node, 'a:eq(10)');

        expect(target).to.be.an('undefined');
    });
});

describe('find', function () {
    it('should handle find annotation', function () {
        var dom = toHtml(htmFileToDom(__dirname + '/find/index.html')),
            out = toHtml(htmFileToDom(__dirname + '/find/output.html'));

        expect(dom).to.equal(out);
    });
});

describe('complex', function () {
    it('should handle everything', function () {
        var dom = toHtml(htmFileToDom(__dirname + '/complex/index.html')),
            out = toHtml(htmFileToDom(__dirname + '/complex/output.html'));

        expect(dom).to.equal(out);
    });
});