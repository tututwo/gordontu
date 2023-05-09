---
title: "Svelte Data Viz: Part 1 - How to import Data in Svelte"
date: "2021-12-27"
updated: "2022-09-06"
categories:
  - "svelte"
  - "javascript"
  - "tutorial"

coverImage: "sveltekit-learn.png"
coverWidth: 16
coverHeight: 9
excerpt: Learn the fundamentals of SvelteKit by building a statically generated blog from scratch, with Markdown support, Sass, an API, and an RSS feed.
titleSection: 
  - "Easy Way: import from '../path'"
  - "Retro Way: asynchronous d3"
  - "Svelte Way: `onMount`"
---


Today I will introduce you three ways to import data in Svelte and talk about how I understand Svelte's `onMount`

> **Note**: This tutorial uses [Svelte's offical template](https://github.com/sveltejs/template) on Github

## Easy Way: import from path

Let's say you are importing data in `App.svelte`.

1. Code below is all you need

   ```javascript
   import data from "./data.csv"; // this could be from any path of the desired data file

   console.log(data);
   ```

   **BUT** If you are running it locally with _Node.js_, Svelte doesn't just happily handle csv for you.

   It needs a plugin, called [**@rollup/plugin-dsv**](https://github.com/rollup/plugins/tree/master/packages/dsv)

2. Go to the current project folder(not `/src`, not `/public`, just the primary folder of your whole svelte project where you store everything) and type the command below in the terminal

   ```javascript
   npm install @rollup/plugin-dsv --save-dev
   ```

   Now, Svelte gets its plugin. The last thing you need to do is to make sure Svelte uses it.

   Inside _rollup.config.js_, there is a `plugins:[]` property.

3. **Add `dsv()` to to it.**

<!-- ![featured](featured.png) -->

**_Tips:_**

When you use this method to import data:

+ You need to have the data locally
+ The data is **often** saved in `src` folder



## Retro Way: asynchronous d3

First of all, import _d3_ in Svelte. (Do this however you want, I used `npm install d3`)

Then you can get the good-old `d3.csv` (use `d3.json` or `d3.tsv` in terms of your file types) from _d3.js_.

```javascript
import { csv } from "d3"; // I just want the csv function
```

Things may become familiar now: `csv` returns a promise, when it's fulfilled, `then` you save and process the data however you want.

This is just a typical asynchronous d3 code written in Javascript.

```html
<!-- Async.svelte -->

<script>
  import { csv } from "d3";
  let dataset = [];
  csv(
    "https://raw.githubusercontent.com/tututwo/svelte-tutorial-heatmap/main/src/data/data.csv"
  ).then(
    (data) => (dataset = data)
    // feel free to do .map().filter()
  );
  $: console.log(dataset);
</script>
```

**_Tips:_**

When you use this method to import data:

- Data often stays in `public` folder
- Data path can even be an URL
- You can mutate the data inside of .then()

## Crash Course: import local data files in Svelte

You might wanna ask the difference between two approaches above. (Well, I did). Probably, where should you save the data? `src`? or `public` folder? Let's talk about it briefly.

#### `import ... from "src/..."`

When you write `import data.csv from "src/data"` in a basic `.js` file, this is not a typical js syntax, aka, it won't work because:

1. `import` can only import `.js` file
2. `import` must be bundled by bundlers like _webpack_ or _rollup_.

However, thanks to the _rollup/plugin-dsv_, we can still import csv files Svelte, but the impoted `.csv` will still be bundled/compiled into a `.js` file. **Consequently, if you are using `import ... from ...`, it really doesn't matter where the imported `.csv` file is.** (Try to put the data on Desktop, wink)

<!-- ![folder](folder.png) -->

```js
import data from "./data/data.csv";
import metrics from "./data/metrics";
import d from "../public/data/data.csv";
```

#### `public` folder

Once the Svelte project gets deployed, the `build` script makes everything in `public` folder available on the web. As a result, you can get the data in `public` folder via **http request**too.

The interesting thing is that `d3.csv` happens to be able to do so. `d3.csv` does not run on bundler like `import from` command, but on _JavaScript Runtime Environment_. Therefore, it is really up to you.

In summary, I say my habit is that:

- When I save the data in `src` folder, I use `import ... from ...`.

- When data is in `public` folder or somewhere else on the internet, I'll try `d3.csv`.

## Svelte Way: `onMount`

What if your data is on a server and it takes some time to load it, **but** you want to do it in _Svelte's Way_. Well, we still need some help from our old friend, `d3.csv`

1. Import `d3.csv`

   ```javascript
   import { csv } from "d3";
   ```

2. Import data asynchronously but don't call it.

   ```javascript
   let dataset = [];

   async () => {
     dataset = await d3.csv("link_or_path_of_dataset");
   };
   ```

3. When do you call it?

   Passing the asynchronous function as a callback to `onMount`. It tells Svelte when the callback is executed

   ```javascript
   import { onMount } from "svelte";
   let dataset = [];

   onMount(
   	async () => {
   		dataset = await d3.csv('link_or_path_of_dataset').  // you can use fetch() here, totally up to you
   	}
   )

   $: console.log(dataset)
   ```

   Once you put the `async` function above inside `onMount`, you can access the data even at the top level too.

   The chunk above is basically saying:

   _"Ok, everyone outside of me(`onMount`). Keep going. I will catch up with you once you are all 'mounted' "_

   > To learn more about _mount_, I have written another blog about component initialization and lifecycle of Svelte [here](https://tuyukun.com/post/svelte_componentinit/).

   In short, when other code in `<script>` finishes running and the markup(html) you wrote in `.svelte` are finally added to the DOM, _callbacks inside `onMount` finally get called._ With elements in the DOM, `onMount`'s callback will not only change `dataset` you defined earlier (as you can see in `console.log`) but also, with **Svelte's reactivity**, happliy update other variables/DOM elements that depends on `dataset`.

   In this very specific case, `onMount` will return you a fulfilled promise (because `async` function returns a promise).

   <iframe src="https://svelte.dev/repl/d41603e8668945dba79459575590261e?version=3.47.0" width="100%" height='600' title="Svelte temperature each demo"></iframe>

**_Tips_**:

- Do not define the `dataset` variable inside onMount. It would be **scoped** in `onMount` so that you can't refer to it outside of `onMount` function.
- Whatever is inside of `onMount` will be run as soon as the rest of your code is run, aka "_the component is first rendered to the DOM_", aka _after elements are "**mounted**"_.(Or I think of it as: the code your wrote in your `.svlete` completes running for the first time.)

<iframe src="https://svelte.dev/repl/51307d85d4c544f5a685e4514713d49c?version=3.47.0" width="100%" height='600' title="Svelte temperature each demo"></iframe>

#### Useful Resources

- There is actually one article talking about [how to fetch data with other APIs in Svelte](https://www.sitepoint.com/svelte-fetch-data/)
- All kinds of plugins for rollup, such as [dsv](https://github.com/rollup/plugins/tree/master/packages/dsv)
- [stackoverflow onMount](https://stackoverflow.com/questions/61577631/sveltejs-components-with-or-without-onmount)
- Svelte Discord (People there are so nice. I personally believe all of my questions about Svelte can be answered there)
- [Svelte's own onMount Tutorial](https://svelte.dev/tutorial/onmount)
