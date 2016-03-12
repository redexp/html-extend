# html-extend


## Задача
У нас есть просто html файл, нам нужно создать на его основе новый, но с добавленными тегами в определённых местах.


## Анотации
Анотации вида `@anotationName` будут служить ключивыми структурами с помощью которых движок будет знать что делать с тегом. Анотацию нужно ставить непосредственно перед тегом.Любой текст, между анотацией и тегом, будет относиться к анотации.


## Модульность
Модули будут максимально приближёнными к модулям ES6


## @export
Что бы экспортнуть тег достаточно перед ним написать анотацию `@export TagAlias` где TagAlias - имя тега когда его будут импортировать.
```html
@export ButtonXS
<button class="btn btn-xs">OK</button>
```


## import
Что бы импортнуть тег необходимо использовать слово `import` одним из следующих вариантов
```javascript
import {TagAlias1, TagAlias2} from 'path/to/file'
import * as Bootstrap from 'path/to/file'
```
а потом создавать тег обычным способом
```html
<TagAlias1></TagAlias1>
<TagAlias2/>
<Bootstrap.Button/>
```
Из-за того что `import` не относится к конкретному тегу, потому он не является анотацией, а ключевым словом.


## Указание пути к модифицируемому тегу
Все теги, перед которыми нету анотаций, будут восприняты как путь.
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
Что бы указать второй елемент в контейнере
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
  <span>Title</span>
  <button>Ok</button>
</div>
```
+
```html
import {Item} from 'module1'

<Item>
  <span/>
  
  @insert
  <input type="text"/>
</Item>
```
 =
```html
<div>
  <span>Title</span>
  <input type="text"/>
  <button>OK</button>
</div>
```
