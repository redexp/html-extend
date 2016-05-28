var chai = require('chai').use(require('chai-shallow-deep-equal')),
    expect = chai.expect,
    pt = require('path');

var htmlFileToDom = require('../index').htmlFileToDom,
    render = require('../index').render;

describe('imports', function () {
    it('should have imports', function () {
        var dom = htmlFileToDom(__dirname + '/imports/index.html');

        expect(dom.imports.Layout).to.deep.equal({
            name: 'default',
            alias: 'Layout',
            type: 'tag',
            path: './layout'
        });

        expect(dom.imports.Wrapper).to.deep.equal({
            name: 'Wrapper',
            alias: null,
            type: 'tag',
            path: './layout'
        });

        expect(dom.imports.TestFooter).to.deep.equal({
            name: 'Footer',
            alias: 'TestFooter',
            type: 'tag',
            path: './layout'
        });

        expect(dom.imports['Helpers.Input']).to.deep.equal({
            name: 'Input',
            alias: 'Helpers.Input',
            type: 'tag',
            path: './helpers'
        });

        expect(dom.imports['Helpers.Button']).to.deep.equal({
            name: 'Button',
            alias: 'Helpers.Button',
            type: 'tag',
            path: './helpers'
        });

        expect(dom.imports['Button']).to.deep.equal({
            name: 'Button',
            alias: null,
            type: 'tag',
            path: './helpers'
        });

        expect(dom.imports['Main']).to.deep.equal({
            name: 'default',
            alias: 'Main',
            type: 'tag',
            path: './layout'
        });

        expect(dom.imports).to.not.have.property('Footer');
        expect(dom.imports).to.not.have.property('GlobalTag1');
        expect(dom.imports).to.not.have.property('Global.Tag2');

        var g = require('../index').globalTags;

        expect(g).to.have.property('GlobalTag1');
        expect(g).to.have.property('Global.Tag2');

        expect(g['GlobalTag1']).to.shallowDeepEqual({
            type: 'tag',
            attr: {
                'class': 'global-1'
            }
        });

        expect(g['Global.Tag2']).to.shallowDeepEqual({
            type: 'tag',
            attr: {
                'class': 'global-2'
            }
        });

        expect(dom.imports['Module1']).to.deep.equal({
            name: 'default',
            alias: 'Module1',
            type: 'tag',
            path: 'module1'
        });

        expect(dom.imports['Module2']).to.deep.equal({
            name: 'default',
            alias: 'Module2',
            type: 'tag',
            path: 'module2'
        });

        expect(dom.imports['Module3']).to.deep.equal({
            name: 'default',
            alias: 'Module3',
            type: 'tag',
            path: 'module3'
        });

        expect(dom.children[1]).to.shallowDeepEqual({
            type: 'tag',
            attr: {
                'class': 'wrapper'
            }
        });

        expect(dom.children[2]).to.shallowDeepEqual({
            type: 'tag',
            attr: {
                'class': 'wrapper'
            }
        });

        expect(dom.children[3]).to.shallowDeepEqual({
            type: 'tag',
            attr: {
                'class': 'footer'
            }
        });

        expect(dom.children[4]).to.shallowDeepEqual({
            type: 'tag',
            attr: {
                'type': 'text'
            }
        });

        expect(dom.children[5]).to.shallowDeepEqual({
            type: 'tag',
            attr: {
                'type': 'button'
            }
        });

        expect(dom.children[6]).to.shallowDeepEqual({
            type: 'tag',
            attr: {
                'class': 'wrapper'
            }
        });

        expect(dom.children[7]).to.shallowDeepEqual({
            type: 'tag',
            attr: {
                'class': 'global-1'
            }
        });

        expect(dom.children[8]).to.shallowDeepEqual({
            type: 'tag',
            attr: {
                'class': 'global-2'
            }
        });

        expect(dom.children[9]).to.shallowDeepEqual({
            type: 'tag',
            attr: {
                'class': 'module1'
            }
        });

        expect(dom.children[10]).to.shallowDeepEqual({
            type: 'tag',
            attr: {
                'class': 'module2'
            }
        });

        expect(dom.children[11]).to.shallowDeepEqual({
            type: 'tag',
            attr: {
                'class': 'module3'
            }
        });
    });

    it('should have exports', function () {
        var dom = htmlFileToDom(__dirname + '/imports/helpers/index.html');

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
        var dom = htmlFileToDom(__dirname + '/imports/helpers/index.html');

        expect(dom.exports.Input).to.shallowDeepEqual({
            type: 'tag',
            name: 'input'
        });

        expect(dom.exports.Input).to.not.have.property('shadowDom');
    });
});

describe('merge', function () {
    it('should merge', function () {
        var input = render(__dirname + '/merge/index.html'),
            output = render(__dirname + '/merge/output.html');

        expect(input).to.equal(output);
    });
});

describe('annotations', function () {
    it('should handle annotations', function () {
        var dom = render(__dirname + '/annotations/index.html'),
            out = render(__dirname + '/annotations/output.html');

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
        var dom = render(__dirname + '/find/index.html'),
            out = render(__dirname + '/find/output.html');

        expect(dom).to.equal(out);
    });
});

describe('complex', function () {
    it('should handle everything', function () {
        var dom = render(__dirname + '/complex/index.html'),
            out = render(__dirname + '/complex/output.html');

        expect(dom).to.equal(out);
    });
});

describe('extensions', function () {
    var setExtension = require('../index').setExtension,
        fs = require('fs');
    
    it('should handle extension as function', function () {
        setExtension('xhtml', function (file) {
            var html = fs.readFileSync(file).toString();

            return {
                "default": function (tag) {
                    var result = html,
                        data = tag.shadowAttr;

                    for (var name in data) {
                        if (!data.hasOwnProperty(name)) continue;

                        result = result.replace(new RegExp(`\\{${name}}`, 'g'), data[name]);
                    }

                    return result;
                }
            };
        });

        var dom = render(__dirname + '/extensions/index.html'),
            out = render(__dirname + '/extensions/output.html');

        expect(dom).to.equal(out);
    });
    
    it('should handle extension as string', function () {
        setExtension('xhtml', function (file) {
            return {
                "default": fs.readFileSync(file).toString()
            };
        });

        var dom = render(__dirname + '/extensions/index.html'),
            out = render(__dirname + '/extensions/output.html');

        expect(dom).to.equal(out);
    });
    
    it('should handle extension as dom object', function () {
        setExtension('xhtml', function (file) {
            var dom = htmlFileToDom(file);

            return {
                "default": dom.children[0]
            };
        });

        var dom = render(__dirname + '/extensions/index.html'),
            out = render(__dirname + '/extensions/output.html');

        expect(dom).to.equal(out);
    });
});