<script>
  import Icon from "@iconify/svelte";

  import { Annotation, annotate } from "svelte-rough-notation";
  import { annotationGroup } from "rough-notation";
  import { onMount } from "svelte";
  let navOptions = [
    { name: "Blog", visible: false },
    { name: "Project", visible: false },
    // { name: "About", visible: false },
  ];
</script>

<nav class="bg-white shadow drop-shadow-lg flex justify-between">
  <!--! Left part  -->
<div class="container flex h-14">
    <div class="flex items-center px-2">
      <a
        class="relaitve lg:text-3xl font-bold font-icon text-gray-900 hover:text-gray-400"
        href="/"><img src="/印章.svg" width="3%" class="absolute"/>Gordon Tu 涂钰坤</a
      >
    </div>

    <div class="lg:flex items-center">
      <!--* Nav Options  -->
      {#each navOptions as { name, visible }}
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <a
          on:mouseover={(d) => (visible = true)}
          on:mouseout={(d) => (visible = false)}
          on:focus={(d) => (visible = true)}
          use:annotate={{
            visible: visible,
            color: "#8fb2c9",
            type: "underline",
            animationDuration: 1000,
          }}
          href="/{name.toLowerCase()}"
          class="m-2 font-extrabold font-icon lg:text-3xl text-gray-900"
          >{name}</a
        >
      {/each}
    </div>
  </div>
  <!--! Right part  -->
  <div class="flex items-center justify-center px-2 lg:justify-end">
    <!--* Search Bar  -->

    <div class="relative">
      <span class="absolute inset-y-0 left-0 flex items-center pl-3">
        <svg
          class="w-4 h-4 text-gray-600 dark:text-gray-300"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>

      <input
        type="text"
        class="block w-full py-1 pl-10 pr-4 text-gray-700 placeholder-gray-600 bg-white border-b border-gray-600 dark:placeholder-gray-300 dark:focus:border-gray-300 lg:w-56 lg:border-transparent dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:border-gray-600"
        placeholder="Search"
      />
    </div>

    <!--* Social Media Icons  -->
    <div class="flex mr-10">
      <a href="https://twitter.com/tu_yukun" class="px-2"
        ><Icon class="hover:animate-spin" icon="akar-icons:twitter-fill" /></a
      >
      <a href="https://github.com/tututwo" class="px-2"
        ><Icon icon="akar-icons:github-fill" /></a
      >
      <a href="https://observablehq.com/@tututwo?tab=profile" class="px-2"
        ><Icon icon="simple-icons:observable" /></a
      >
    </div>
  </div>
</nav>
