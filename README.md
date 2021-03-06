html-extend
===========

[![Build Status](https://travis-ci.org/redexp/html-extend.svg?branch=master)](https://travis-ci.org/redexp/html-extend)

## Issue
For example, you have some html file with `<table>` tag with rich markup and you need it in another file but without some buttons, different classes and labels, or even worse, you will need to wrap some tag. You can solve it with dozens of parameters and if's but you markup will become unreadable.

## My solution
Extend origin html file using es6 like module system and annotations.

## Install

`npm install html-extend`

## Contents

* [API](#api)
  * [render](#render)
  * [htmlFileToDom](#htmlfiletodom)
  * [htmlToDom](#htmltodom)
  * [domToHtml](#domtohtml)
  * [globalTags](#globaltags)
  * [setExtension](#setextension)
* [Annotations](#annotations)
* [export](#export)
* [global](#global)
* [import](#import)
* Tags
  * [Path to tag](#path-to-tag)
  * [Add tag](#add-tag)
  * [Remove tag](#remove-tag)
  * [Rename tag](#rename-tag)
* Attributes
  * [Add/rewrite attribute](#addrewrite-attribute)
  * [Remove attribute](#remove-attribute)
  * [Shadow attribute](#shadow-attribute)
  * [Add class](#add-class)
  * [Remove class](#remove-class)
* Text
  * [Rewrite text in tag](#rewrite-text-in-tag)
  * [Remove text](#remove-text)
* Annotations
  * [@find](#find)
  * [@append](#append)
  * [@prepend](#prepend)
  * [@remove](#remove)
  * [@empty](#empty)
  * [@appendTo](#appendto)
  * [@prependTo](#prependto)
  * [@insertBefore](#insertbefore)
  * [@insertAfter](#insertafter)
* [Contribute](#contribute)


## API
<a name="render"></a>
```javascript
/**
 * @param {String} filePath
 * @returns {HtmlString}
 */
render(filePath)
```
<a name="htmlfiletodom"></a>
```javascript
/**
 * @param {String} filePath
 * @returns {HtmlModule}
 */
htmlFileToDom(filePath)
```
`{HtmlModule}` is dom object of [simple-html-dom-parser](https://github.com/redexp/simple-html-dom-parser) with `imports` and `exports` properties
<a name="htmltodom"></a>
```javascript
/**
 * @param {String} html
 * @param {String} filePath - needed to resolve import path
 * @returns {HtmlModule}
 */
htmlToDom(html, filePath)
```
<a name="domtohtml"></a>
```javascript
/**
 * @param {DomObject} dom
 * @returns {String}
 */
domToHtml(dom)
```
<a name="globaltags"></a>
```javascript
/**
 * @property {Object}
 */
require('html-extend').globalTags
```
It's hash where keys are names of global tags and values should be `DomObject` or html string or function (which will take `DomObject` and should return string or new `DomObject`).
<a name="setextension"></a>
```javascript
/**
 * @param {Array<String>|String} fileExtensions
 * @param {Function} handler
 */
function setExtension(fileExtensions, handler)
```
`handler` will take file path and should return hash with exported tag names, which values should be `DomObject` or html string or function (which will take `DomObject` and should return string or new `DomObject`).

Example

`component.xhtml`
```html
<div>
    <h1>{label}</h1>
    <input type="{type}"/>
</div>
```
```javascript
var setExtension = require('html-extend').setExtension;

setExtension('xhtml', function handler(file) {
    var html = fs.readFileSync(file).toString();

    return {
        "default": function (tag) {
            var result = html;

            for (var name in tag.shadowAttr) {
                result = result.replace('{' + name + '}', tag.shadowAttr[name]);
            }

            return result;
        }
    };
});
```
```html
import Component from './component'

<div>
    <Component ~label="Some Title" ~type="number" class="test"/>
</div>
```
```html
<div>
    <div class="test">
        <h1>Some Title</h1>
        <input type="number"/>
    </div>
</div>
```
With `setExtension` you can even rewrite default `html` extension handler.

To remove extension just set `null`
```javascript
setExtension('xhtml', null);
```


## Annotations
Annotations is text or comment like `@annotationName` before tags which describes how tag should be modified.


## @export
Annotation which used to export tags. The only option is the name of exported tag. It's same as in CommonJS when you write `exports.TagName` or in es6 `export TagName` will be `@export TagName`. Also as in es6 `export default` you can write `@export default` or just `@export` and this tag will be default for current module. You can export any tag from file, not just root tags. You can use dots and dashes in tag name. You can use as many export names as you wish.
```html
@export default
@export Layout
<div class="layout">
  @export ButtonXS
  <button class="btn btn-xs">OK</button>
  <!-- @export Button.SM -->
  <button class="btn btn-sm">OK</button>
  <!--
   | @export btn-lg
   | @export Btn.lg
   | @export Bootstrap.btn-lg
   +-->
  <button class="btn btn-lg">OK</button>
</div>
```

## @global
This annotation same as `@export` only it will export to global scope

## import
`import` is a keyword, not annotation, because it's not binded to any tag, it should be only on top of file or after `<!DOCTYPE ...>`. Syntax is same as for es6.
```javascript
import {TagAlias1, TagAlias2 as Item} from './path/to/file'
import Layout from '/absolute/path/to/file'
import * as Bootstrap from 'name-of-npm-package'
```
Then you can use those tags.
```html
<TagAlias1></TagAlias1>
<Item/>
<Layout/>
<Bootstrap.ButtonXS></Bootstrap.ButtonXS>
```
As you can see you can share your html modules through npm and `import` will find it just like native `require()`.


## Path to tag
You have two options to point on tag which you want to modify. 

**First** is write same tags tree to tag.
```html
@export Item
<div>
  <ul class="list">
    <li class="item">
      <span class="h2">Title 1</span>
    </li>
    <li class="item">
      <span class="h2">Title 2</span>
    </li>
    <li class="item">
      <span class="h2">Title 3</span>
    </li>
  </ul>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  <ul>
    <li>
      @prepend
      <h1>Title</h1>
      
      @append
      <button>OK</button>
    </li>
  </ul>
</Item>
```
 =
```html
<div>
  <ul class="list">
    <li class="item"><h1>Title</h1>
      <span class="h2">Title</span>
      <button>OK</button></li>
  </ul>
</div>
```
If you don't want or don't know tags names, simply write `<tag>`
```html
<Item>
  <tag>
    <tag>
    ...
    </tag>
  </tag>
</Item>
```
To point to third tag
```html
<Item>
  <ul>
    <tag/>
    <tag/>
    <tag>
    ...
    </tag>
  </ul>
</Item>
```
**Second** is to use `@find`


## Add tag
If in parent tag only one child and you write two then second will be added.
```html
@export Item
<div>
  <ul class="list">
    <li class="item"></li>
  </ul>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  <tag>
    <tag/>
    <li class="second-item"></li>
  </tag>
</Item>
```
 =
```html
<div>
  <ul class="list">
    <li class="item"></li>
    <li class="second-item"></li>
  </ul>
</div>
```
Also annotations like `@prepend` and `@append` can add tags.


## Remove tag
See `@remove`


## Rename tag
Just point to needed tag and write new name
```html
@export Item
<div>
  <ul class="list">
    <li class="item"></li>
  </ul>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  <tag>
    <div/>
  </tag>
</Item>
```
 =
```html
<div>
  <ul class="list">
    <div class="item"></li>
  </ul>
</div>
```


## Add/rewrite attribute
Any attribute (except `class`) will be rewrited if it not exist in parent, it will be added.
```html
@export Item
<div>
  <h1 id="title">Title</h1>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  <tag id="header" title="Header"/>
</Item>
```
 =
```html
<div>
  <h1 id="header" title="Header">Title</h1>
</div>
```

## Remove attribute
To remove attribute just write `!` before it
```html
@export Item
<div>
  <h1 title="Header">Title</h1>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  <h1 !title/>
</Item>
```
 =
```html
<div>
  <h1>Title</h1>
</div>
```

## Shadow attribute
When attribute name starts with `~` it means it's shadow attribute and it needed only to pass some value to extended module. This type of attribute will not add, remove or rewrite parent attribute. See example of **setExtension** function.

## Add class
All class names will be added (not rewrited) to parent tag.
```html
@export Item
<div>
  <h1 class="header">Title</h1>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  <h1 class="pull-left"/>
</Item>
```
 =
```html
<div>
  <h1 class="header pull-left">Title</h1>
</div>
```

## Remove class
To remove class name write `!` before it
```html
@export Item
<div>
  <h1 class="header">Title</h1>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  <h1 class="!header"/>
</Item>
```
 =
```html
<div>
  <h1 class="">Title</h1>
</div>
```


## Rewrite text in tag
Any text will rewrite parent text.
```html
@export Item
<div>
  <h1><span class="icon"></span> Title</h1>
  <h2>Title <span class="icon"></span></h2>
  <h3><span class="icon"></span></h3>
  <h4><span class="icon"></span></h4>
  <h5></h5>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  <h1><tag/> Main title</h1>
  <tag>Sub title </tag>
  <tag><tag/> Title</tag>
  <tag>Title</tag>
  <tag>
    Title
    <span class="icon"></span>
  </tag>
</Item>
```
 =
```html
<div>
  <h1><span class="icon"></span> Main title</h1>
  <h2>Sub title <span class="icon"></span></h2>
  <h3><span class="icon"></span> Title</h3>
  <h4>Title<span class="icon"></span></h4>
  <h5>
    Title
    <span class="icon"></span>
  </h5>
</div>
```


## Remove text
To remove text you need write some html entity like `&nbsp;` or if you no need space then `&ZeroWidthSpace;` or similar.


## @find
With this annotation you can point to tag with css selector.
```html
@export Item
<div>
  <div class="wrapper">
    <div class="header">
      <h1>Title</h1>
    </div>
    <div class="content">
      <p>Description</p>
    </div>
  </div>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  @find .header
  <tag>
    @append
    <span>Sub title</span>
  </tag>
  
  <tag class="wrapper">
    <tag/>
    <tag class="content">
      @append
      <p>Text</p>
    </tag>
  </tag>
</Item>
```
 =
```html
<div>
  <div class="wrapper">
    <div class="header">
      <h1>Title</h1>
    <span>Sub title</span></div>
    <div class="content">
      <p>Description</p>
    <p>Text</p></div>
  </div>
</div>
```


## @append
It will add tag to the end of current tag parent.
```html
@export Item
<div>
  <span>Title</span>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  @append
  <button>OK</button>
  
  <span>Title</span>
</Item>
```
 =
```html
<div>
  <span>Title</span>
<button>OK</button></div>
```
If you want to add several tags then you need to write `@append` before each of them.


## @prepend
Will add tag on first place of current parent
```html
@export Item
<div>
  <span>Title</span>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  @prepend
  <button>OK</button>
  
  <span class="header"/>
</Item>
```
 =
```html
<div><button>OK</button>
  <span class="header">Title</span>
</div>
```


## @insert
Will add tag on current place.
```html
@export Item
<div>
  <h1>Title</h1>
  <p>Description</p>
  <button>Ok</button>
</div>
```
+
```html
import {Item} from 'module1'

<Item>
  <h1/>
  <p/>
  
  @insert
  <input type="text"/>
</Item>
```
 =
```html
<div>
  <h1>Title</h1>
  <p>Description</p>
  <input type="text"/>
  <button>Ok</button>
</div>
```


## @remove
Will remove current tag
```html
@export Item
<div>
  <div class="content">
    <input type="text"/>
    <button>OK</button>
  </div>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  <tag class="content">
    @remove
    <input/>
  </tag>
</Item>
```
 =
```html
<div>
  <div class="content">
    <button>OK</button>
  </div>
</div>
```


## @empty
Will remove children of current tag.
```html
@export Item
<div>
  <div class="content">
    <p>Description</p>
    <button>OK</button>
  </div>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  @empty
  <tag class="content">
    <h1>Title</h1>
  </tag>
</Item>
```
 =
```html
<div>
  <div class="content">
    <h1>Title</h1>
  </div>
</div>
```


## @appendTo
Will add tag to another tag by css selector.
```html
@export Item
<div>
  <div class="content">
    <p class="description">Description</p>
  </div>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  @appendTo .description
  <span>Read more</span>
</Item>
```
 =
```html
<div>
  <div class="content">
    <p class="description">Description<span>Read more</span></p>
  </div>
</div>
```


## @prependTo
Will add tag to the beginig of another tag by css selector
```html
@export Item
<div>
  <div class="content">
    <p class="description">Description</p>
  </div>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  @prependTo .content
  <h1>Title</h1>
</Item>
```
 =
```html
<div>
  <div class="content"><h1>Title</h1>
    <p class="description">Description</p>
  </div>
</div>
```

## @insertBefore
Will add tag before another tag by css selector
```html
@export Item
<div>
  <div class="content">
    <h1>Title</h1>
    <p class="description">Description</p>
  </div>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  @insertBefore .description
  <h2>Sub title</h2>
</Item>
```
 =
```html
<div>
  <div class="content">
    <h1>Title</h1>
    <h2>Sub title</h2><p class="description">Description</p>
  </div>
</div>
```


## @insertAfter
Will add tag after another tag by css selector
```html
@export Item
<div>
  <div class="content">
    <h1>Title</h1>
    <p class="description">Description</p>
  </div>
</div>
```
+
```html
import {Item} from './module1'

<Item>
  @insertAfter .content h1
  <h2>Sub title</h2>
</Item>
```
 =
```html
<div>
  <div class="content">
    <h1>Title</h1><h2>Sub title</h2>
    <p class="description">Description</p>
  </div>
</div>
```


## Contribute
Help me improve this doc and any comments are welcome in issues.

