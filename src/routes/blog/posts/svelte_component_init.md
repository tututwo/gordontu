---
title: "Svelte Data Viz: Part 0 - Component Initialization and Updates"
date: "2021-12-07"
updated: "2022-09-06"
categories:
  - "svelte"
  - "javascript"

coverImage: "sveltekit-learn.png"
coverWidth: 16
coverHeight: 9
excerpt: Learn the fundamentals of SvelteKit by building a statically generated blog from scratch, with Markdown support, Sass, an API, and an RSS feed.
titleSection: 
  - "The Early Stage"
  - "A Bit Later: Mounting"
  - "Svelte's Updating Pattern"
---
<script>
  import BlogHeading from "$lib/blogSection/blogHeading.svelte"
</script>
I often see

> this must be called during component initialisation

in Svelte's docs, but what exactly is **Component Initialization**???

After inquiring some smart people on the Internet, I would like to jog down some notes about what's included in **Component Initialization** in case of forgetting it again, like I always do.

<BlogHeading heading = "The Early Stage"/>

TL DR:

> ##### Component initialization includes everything you write in .svelte, but callbacks.

It includes those imports:

```svelte
<script>
	import abc from "./abc.js"

  import { onMount } from "svelte"
</script>
```

Sync tasks:

```svelte
<script>
	let x = 1, y = 2

  function thisGetsCalled(){}
  thisGetsCalled()

  function thisNotCalled(){}
  // because I didn't invoke it: thisNotCalled()
</script>
```

Microtasks that are schedule to run.

```svelte
<script>
	function thisGetsCalled(){
    thisAlsoCalled() {}
    thisAlsoCalled()
  }
  thisGetsCalled()
</script>
```

Macrotasks like `setTimeOut` runs during **Component Initialization** but not whatever is scheduled to run(aka, callbacks) inside it for whatever inside it is considered as _callbacks_

Lihau has this wonderful [thread](https://twitter.com/lihautan/status/1396111979799093254) about Component Initialization, and he introduced this trick: _In `<script>`, put everything inside ONE function. Whatever runs at the first time runs during **Component Initialization**._

<BlogHeading heading = "A Bit Later: Mounting"/>

Basically when `<scirpt>` is run. Elements defined in _.svelte_, the component, is added to the DOM. This step is called **component mouting**.

## The End: Stuff inside onMount()

If I defined `onMount` earlier, I know `onMount` is run, but not its callback. Guess what, right now is the time!

Stuff inside `onMount` looks around see what's available, then RUN. In this [stackoverflow](https://stackoverflow.com/questions/61577631/sveltejs-components-with-or-without-onmount) answer, it points out the difference between using `onMount` and `setTimeOut` is about what's available.

###### A bit about lifecycle functions: `onMount()`

> Lifecycle functions like `onMount` to me are more like a timer. It marks some point on the timeline of Svelte's working progress. For example, `onMount` marks the point right after when the component is mounted. It is a relative time point: if I got a lot of elements to add and large data to load, then statements inside `onMount` would not for a while. It just waits until things all get loaded.
>
> `setTimeOut(()=>{}, 1000)` then marks an absolute point of the timeline: 1 second. Regardless of loading data or mouting component, its callback just got push to the task queue to run after 1 second.

<BlogHeading heading = "Svelte's Updating Pattern"/>
While making data visualization using Svelte, I often want to add animation or transition in Svelte. Sometimes I don't get to see any animation playing. Why? It's all due to Svelte's special updating pattern.

If I want to change/update DOM elements via clicking a button:

<iframe src="https://svelte.dev/repl/7145bafa507a4bec8d8a9adb4a3cd9b5?version=3.44.2" width="100%" height='600' title="Svelte temperature each demo"></iframe>

`foo` and `bar` are changed to 2 and 5 respectively, and they are according to `console.log()`. However, when I try to log the DOM element's content, I still see the old `1+2=3`. WHY???

<!-- Ruben Leija made an [awesome graph](https://linguinecode.com/post/3-methods-to-run-code-after-dom-update-in-svelte).

![img](flow.png) -->
<BlogHeading heading = "Svelte's Updating Pattern"/>
To put it in my words in this case:

When I change those variables in `<script>`, they are changed in `<script>`. Once Svelte is about to compile the code to `.js` to update the DOM, this very action is batched!

Svelte is kind of saying: _Hey, you sync task go first, I will keep collecting those pending changes to be made in the DOM_. Once those tasks are done, aka before the next micro task, DOM then gets updated.

###### A bit about `beforeUpdate()`

> _Watch out: lifecycle function alter:`beforeUpdate()`. Like `onMount` and other lifecycle functions, it marks a point on Svelte's working timeline. This point happen to be right before DOM gets updated. Statements inside `beforeUpdate()` will run right before those pending state changes are about to be exectioned._

Consequently, **`console.log(DOMElement)` happens before DOM is actually changed!** Because the subsequent changes in DOM are artifically halted by Svelte.

My take home message here is : maybe be careful when code that can change DOM is followed by code to implement once DOM is changed. The later code probably won't run successfully.

**BUT**!

`tick()` can give you some help:

```html
<script>
  changeTheDOM ()
   await tick()
   doThisOnceDOMChanged()
</script>
```

`tick()` basically cashed in those _pending state changes_: Don't wait. Just do it now!

I made an outline of Svelte's component initialization and updating process, and I hope it's useful.

<!-- ![featured.png](featured.png) -->
