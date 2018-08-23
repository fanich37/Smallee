# Smallee

Simple responsive slider with no dependencies.

## How to use

1. Add Smallee's script and styles into your markup:

```html
<link rel="stylesheet" href="smallee.min.css">
<script type="text/javascript" src="smallee.min.js"></script>
```

2. And initialize it:

```js
const smallee = new Smallee({ selector: '.my-slider' });
```

or if don't need public methods/not going to remove it from the page just:

```js
new Smallee({ selector: '.my-slider' });
```

### Options

There are several options you could use

| Option           | Type                | Default Value   | Description                                                                                                                         |
| ---------------- | ------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `selector`       | `String` - required | `undefined`     | any valid css selector. where to apply Smallee                                                                                      |
| `arrows`         | `Boolean`           | `true`          | show/don't show arrows                                                                                                              |
| `delay`          | `Number`            | `300`           | transition time                                                                                                                     |
| `easeFunc`       | `String`            | `'ease-in-out'` | can be any transition function                                                                                                      |
| `effect`         | `String`            | `'slide'`       | how to change slides. as for now (22.08.2018) `slide` is the only option. `fade` is in progress                                     |
| `loop`           | `Boolean`           | `false`         | set the instance into infinite mode                                                                                                 |
| `resizeTimeout`  | `Number`            | `1000`          | how often refresh the instance dimensions when the viewport dimensions is changed. only matters with responsive mode is set to true |
| `responsive`     | `Boolean`           | `true`          | as for now (22.08.2018) it only updates the instance dimensions                                                                     |
| `slidesToScroll` | `Number`            | `1`             | how many slides to scroll at once                                                                                                   |
| `slidesToShow`   | `Number`            | `1`             | how many slides to show at once                                                                                                     |
| `swipeable`      | `Boolean`           | `false`         | change slides with swipe gesture                                                                                                    |
| `threshold`      | `Number`            | `100`           | mouse dragging threshold in px                                                                                                      |

### Public methods

**`init()`** - if the instance was previously destroyed it could be reinit with this method:

```js
const mySlider = new Smallee({ selector: '.my-slider' });
/* some code */
mySlider.destroy(); // the Smallee instance is desroyed 😭
/* some code */
mySlider.init(); // but it's back 😊
```

**`changeSlide(direction)`** - change the slide. direction can be `'prev'` or `'next'`:

```js
mySlider.changeSlide('prev');
mySlider.changeSlide('next');
```

**`refresh()`** - refresh the instance and set new dimensions for slides, track and so on:

```js
mySlider.refresh();
```

**`destroy()`** destroy the instance 😭. this method returns `null`, so if you don't need to initialize it later it's possible to completely destroy the instance:

```js
mySlider.destroy(); // can be re-inited later
let mySlider2 = new Smallee({ selector: '.my-slider2' });
mySlider2 = mySlider2.destroy(); // can't be re-inited. mySlider2 is just a null it this case
```
