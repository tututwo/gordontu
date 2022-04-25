---
date: "2021-07-04"
diagram: true
highlight: true
image:
  placement: 3
math: true
title: Svelte Data Viz Study Notes 2 - How to Define Chart Dimensions

categories:
- Svelte
- Tutorial
---
With data ready, where are you going to actually plot the data **?** The ***container*** and the ***size*** of a data visualization shall be our primary concern in this tutorial.

Today I will show you how to define dimensions in a data visualization made by Svelte.

### Bind in Data Visualization

Typically, when you make a chart, you want to know the width, height and margins etc.. Such *dimensions* can

1. deterimine the size of a chart, **dymamically**
2. and help define *scale function*, which converts data into pixel values.

Here is what you can do in Svelte: 

1. Set the dimensions of the container, such as `<div>` or `<figure>`, which will include basically everything of a chart.
1. Save the dimensions of the container in variables
2. Manipulate those variables in order to alter dimensions

*Please look at the `Child.svelte` for the demonstration.* Or see below.

### Set the dimension

**Firstly**, you can specify the width and height of an HTML in `<style>` tag with CSS. 

There are so many more tricks you can do with this. Just think about paddings and margins etc..Feel free to check the DOM while playing with CSS.

```css
<div class = "chart-container">
</div>

<style>
	.chart-container {
		height:100%;
		width: 50%
	}
</style>

/*It is saying: make this element's height 100% of its parent's height, its width 50% of its parent's width. (parent is `<body>` element in this case) */
```

*Why don't we just change the dimensions of a `<svg>` element like in d3**?***

- Because we **can't retrieve`<svg>` element's width like html elements' directly**

```html
<div class = "chart-container">
  <svg></svg>
</div>
```

**Secondly**, save the `div` elements' width and height attribute in other variables: `width` and `height`

```html
<div class = "chart-container"
		 bind:offsetWidth = {width}
		 bind:offsetHeight = {height}>
   <svg></svg>
</div>
```

Oh, what is that? what did we just do? 

It's **`bind:`**!

### A Crash Course for `bind:`

You can find offical tutorial on svelte.dev about `bind:`.

I am not going to do a better the job than the offical tutotial, so here is short note about `bind:` for this tutorial.

**In a classical binding situation, e.g. `bind:theBound = {bindHere}`, `bind:` extracts specified/pre-existing value/property (`theBound` in this case) from the *bound* component or element, and assign that value to variable (`bindHere`) in {} expression.**

Let's do a simple one. 

```html
<!-- Parent.svelte-->
<Child
	 bind:variable_in_Child = {variable_in_Parent}/>
```

This is basically saying: we got the value of the variable(aka, property), `variable_in_Child`, from *Child* component! Now, let's assigned it to the variable, `variable_in_Parent`, in the *Parent* component.

If you console.log `variable_in_Parent` in parent component, you should be able to see the value 100 in the console

#### Quick Note for `$:`

It makes the line/block of code **reactive**. This line then is called *Reactive Statement*. If any variable in the line/block changes, the whole line/block is re-evaluated. In this case, `console.log` will log all the changes of `variable_in_Parent`. 

```javascript
// in Parent.svelte
$: console.log(variable_in_Parent) // returns 100, which is from variable_in_Child in Child.svelte
```

**Tips**

* `offsetWidth` is an **HTML** element property. **Not SVG. Not SVG. Not SVG.**
* HTML elements have attributes like `class`, `style`, `transform` etc.. When Svelte *Components* get to have attributes, we called them *properties*,or *props* in short.

When you drag to change the width of the window, you will see a series of updated arrays in *console*, telling you the current width and height of `<div class = "chart-container">`element. 

<iframe src="https://svelte.dev/repl/c23207a19bf64b86a19defe0afa71c6f?version=3.47.0" width="100%" height='600' title="Svelte temperature each demo"></iframe>

**The last and also easiest step** is to give our `<svg>` element, the desired value of `width` and `height`

```html
<svg 
			 width = {width}
			 height = {height}>
</svg>
```

The width attribute on the left of the `=` refers to the width of the `<svg>` element.

Another `width` variable on the right has the value of `offsetWidth` we extracted earlier using `bind:`. Same goes for `height`.



### Bonus: Another Crash Course on Scoped CSS in Svelte

**Styles written in the current component will only be applied to elements written in the current component.**

Now we will take a look at `Trial.svelte` and `App.svelte`

In `App.svelte`, there is an `<h1>` element whose color is pink.

Uncomment  `<Trial />`.

```html
<h1>
	I am an h1 element in App.svelte
</h1>
<!-- <Trial /> --> // uncomment this one

<Parent />

<style>
	h1 {
		color: pink;
	}
</style>
```

You will see another `<h1>` element whose color is black.

Apparently, the style written in `App.svelte` only changed elements written in `App.svelte`.

If you uncomment the style I wrote in `Trial.svelte`, the second `<h1>` element turns into light blue, however, the first `<h1>` element that belongs to `App.svelte` is still unaffected.

#### Useful Resources

* Lihau has been covering a variety of topics of Svelte. This one is [about style in Svelte](https://www.youtube.com/watch?v=deX_QwlcRZk&t=271s) 
* Svelte Discord (People there are so nice. I personally believe all of my questions about Svelte can be answered there)
* [Svelte Tutorial about Dimensions](https://svelte.dev/tutorial/dimensions)

