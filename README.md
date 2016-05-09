# html-extend


## Задача
У нас есть просто html файл, нам нужно создать на его основе новый, но с добавленными тегами в определённых местах.


## Анотации
Анотации вида `@anotationName` будут служить ключивыми структурами с помощью которых движок будет знать что делать с тегом. Анотацию нужно ставить непосредственно перед тегом.Любой текст, между анотацией и тегом, будет относиться к анотации.


## Модульность
Модули будут максимально приближёнными к модулям ES6. По аналогии с Node.js глобальные модули будут храниться в папке `html_modules`.


## @export
Что бы экспортнуть тег достаточно перед ним написать анотацию `@export TagAlias` где `TagAlias` - имя тега когда его будут импортировать. Если `TagAlias` будет равен `default` то этот тег можно будет импортировать как дефолтный. Анотация `@export` может нахоиться на любом уровне вложенности.
```html
@export default
<div>
  @export ButtonXS
  <button class="btn btn-xs">OK</button>
</div>
```


## import
Что бы импортнуть тег необходимо использовать слово `import` одним из следующих вариантов
```javascript
import {TagAlias1, TagAlias2 as Item} from 'path/to/file1'
import * as Bootstrap from 'path/to/file2'
import Layout from 'path/to/file3'
```
а потом создавать тег обычным способом
```html
<TagAlias1></TagAlias1>
<Item/>
<Bootstrap.ButtonXS></Bootstrap.ButtonXS>
<Layout/>
```
Из-за того что `import` не относится к конкретному тегу, потому он не является анотацией, а ключевым словом.


## Указание пути к модифицируемому тегу
Все теги, перед которыми нету анотаций и которые находятся внутри импортированного тега, будут восприняты как путь.
```html
@export Item
<div>
  <ul class="list">
    <li class="item">
      <span class="h2">Title</span>
    </li>
  </ul>
</div>
```
+
```html
import {Item} from 'module1'

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
Этот путь можно представить в виде селектора `Item > *:nth-child(1) > *:nth-child(1)`
Результат:
```html
<div>
  <ul class="list">
    <li class="item"><h1>Title</h1>
      <span class="h2">Title</span>
      <button>OK</button></li>
  </ul>
</div>
```
Что бы не привязываться к имени тега можно использовать `<tag>`, например
```html
<Item>
  <tag>
    <tag>
    ...
    </tag>
  </tag>
</Item>
```
Селектор будет `Item > *:nth-child(1) > *:nth-child(1)`
Что бы указать третий тег в контейнере
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
Селектор будет `Item > *:nth-child(1) > *:nth-child(3)`

## Добавление тегов
Если в родительском контейнере один тег, а в текущем два, то второй будет будет добавлен
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
import {Item} from 'module1'

<Item>
  <tag>
    <tag/>
    <li class="second-item"></li>
  </tag>
</Item>
```
 =
```html
@export Item
<div>
  <ul class="list">
    <li class="item"></li>
    <li class="second-item"></li>
  </ul>
</div>
```
Что бы добавить тег, без указания точного пути, есть аннотации: @prepend, @append, @insert


## Удаление тегов
Для этого надо использовать аннотацию @remove


## Переименование тегов
Указав путь к тегу, можно просто написать другое имя
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
import {Item} from 'module1'

<Item>
  <tag>
    <div/>
  </tag>
</Item>
```
 =
```html
@export Item
<div>
  <ul class="list">
    <div class="item"></li>
  </ul>
</div>
```


## Добавление/переписывание атрибутов
Любой указанный атрибут (кроме тега `class`) будет переписывать такой же родительский или если у родительского тега нету такого атрибута, то он добавиться
```html
@export Item
<div>
  <h1 id="title">Title</h1>
</div>
```
+
```html
import {Item} from 'module1'

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

## Удаление атрибутов
Что бы удалить атрибут перед ним нужно поставить `!`
```html
@export Item
<div>
  <h1 title="Header">Title</h1>
</div>
```
+
```html
import {Item} from 'module1'

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

## Добавление классов
Любой указаный класс будет добавлен к текущему тегу
```html
@export Item
<div>
  <h1 class="header">Title</h1>
</div>
```
+
```html
import {Item} from 'module1'

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

## Удаление классов
Что бы удалить класс перед ним нужно поставить `!`
```html
@export Item
<div>
  <h1 class="header">Title</h1>
</div>
```
+
```html
import {Item} from 'module1'

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


## Замена текста в теге
Текст, перед которым нету анотации, будет заменять текущий текст в теге. На текст так же распостроняются правила построения пути.
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
import {Item} from 'module1'

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


## Удаление текста
Удалить текст можно добавив символ мнемонику `&nbsp;` или если вообще без пробелов то можно `&ZeroWidthSpace;` или любой другой непечатаемы символ.


## @find
С помощью этой анотации можно указать путь к тегу через селектор. Теги с этой анотацией будут участвовать в построении пути только внутри себя, для соседей их существовать не будет, так как они не будут относиться к текущему контейнеру.
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
import {Item} from 'module1'

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
Путь к первому `@append` будет `Item .header`, ко второму `Item > *:nth-child(1) > *:nth-child(2)`. 
Результат:
```html
<div>
  <div class="wrapper">
    <div class="header">
      <h1>Title</h1>
      <span>Sub title</span>
    </div>
    <div class="content">
      <p>Description</p>
      <p>Text</p>
    </div>
  </div>
</div>
```


## @append
Добавляет тег в конец текущего контейнера.
```html
@export Item
<div>
  <span>Title</span>
</div>
```
+
```html
import {Item} from 'module1'

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
Если вы хотите добавить несколько тего, то перед каждым нужно будет ставить `@append`.


## @prepend
Добавляет тег в начало текущего контейнера.
```html
@export Item
<div>
  <span>Title</span>
</div>
```
+
```html
import {Item} from 'module1'

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
Добавляет тег в текущую позицию текущего контейнера.
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
  <tag/>
  
  @insert
  <input type="text"/>
  
  <button type="submit"/>
</Item>
```
 =
```html
<div>
  <h1>Title</h1>
  <p>Description</p>
  <input type="text"/>
  <button type="submit">OK</button>
</div>
```


## @remove
Удаляет текущий тег.
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
import {Item} from 'module1'

<Item>
  <tag class="content">
    @remove
    <input/>
    
    <button type="submit"/>
  </tag>
</Item>
```
 =
```html
<div>
  <div class="content">
    <button type="submit">OK</button>
  </div>
</div>
```


## @empty
Удаляет всё содержимое текущего тега.
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
import {Item} from 'module1'

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
