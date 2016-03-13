# html-extend


## Задача
У нас есть просто html файл, нам нужно создать на его основе новый, но с добавленными тегами в определённых местах.


## Анотации
Анотации вида `@anotationName` будут служить ключивыми структурами с помощью которых движок будет знать что делать с тегом. Анотацию нужно ставить непосредственно перед тегом.Любой текст, между анотацией и тегом, будет относиться к анотации.


## Модульность
Модули будут максимально приближёнными к модулям ES6


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
Этот путь можно представить в виде селектора `Item > ul:nth-child(1) > li:nth-child(1)`
Результат:
```html
<div>
  <ul class="list">
    <li class="item">
      <h1>Title</h1>
      <span class="h2">Title</span>
      <button>OK</button>
    </li>
  </ul>
</div>
```
Что бы не привязываться к имени тега можно использовать `<tag>`, например
```html
<Item>
  <tag>
    <tag class="item">
    ...
    </tag>
  </tag>
</Item>
```
Селектор будет `Item > *:nth-child(1) > *.item:nth-child(1)`
Что бы указать третий тег в контейнере
```html
<Item>
  <ul>
    <tag class="first-item"/>
    <li class="second-item"/>
    <tag class="item">
    ...
    </tag>
  </ul>
</Item>
```
Селектор будет `Item > ul:nth-child(1) > *.first-item:nth-child(1) ~ li.second-item:nth-child(2) ~ *.item:nth-child(3)`


## @find
С помощью этой анотации можно указать путь к тегу через селектор. Использован будет первый попавшийся тег, а не все которые подходят под селектор. Теги с этой анотацией будут участвовать в построении пути только внутри себя, для соседей их существовать не будет, так как они не будут относиться к текущему контейнеру.
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
Путь к первому `@append` будет `Item .header`, ко второму `Item > *.wrapper:nth-child(1) > *:nth-child(1) ~ *.content:nth-child(2)`. 
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
Добавляет тег в конец текущего контейнера
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
</Item>
```
 =
```html
<div>
  <span>Title</span>
  <button>OK</button>
</div>
```


## @prepend
Добавляет тег в начало текущего контейнера
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
</Item>
```
 =
```html
<div>
  <button>OK</button>
  <span>Title</span>
</div>
```


## @insert
Добавляет тег в текущую позицию текущего контейнера
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
</Item>
```
 =
```html
<div>
  <h1>Title</h1>
  <p>Description</p>
  <input type="text"/>
  <button>OK</button>
</div>
```

## Добавление/переписывание атрибутов
Что бы добавить или переписать атрибут перед ним нужно поставить `+`
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
  <h1 +id="header" +title="Header"/>
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
Что бы добавить класс перед ним нужно поставить `+`
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
  <h1 class="+pull-left"/>
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
