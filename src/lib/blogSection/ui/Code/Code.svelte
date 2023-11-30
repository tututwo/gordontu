<script >
// @ts-nocheck

  import Prism from "prismjs";
  import "prism-svelte";
  import "./prism-vs.css"
  import Icon from "@iconify/svelte";

  export let code = ` {#if markers}
          {@const markerIndex =
            markers &&
            markers.findIndex((list) =>
              list.includes(startLineIndex + index + 1)
            )}
          <div
            style="border-color: {color}"
            class="absolute inset-0 border-l-[.8em]"
          />
        {/if}`;

  export let markers = [[9, 10, 11], [15], [17, 18, 19, 20]];
  let startLineIndex = 0;
  export let color = "#1da1f2";
  export const fileName = "Circles.js";
</script>

<div class="flex flex-col align-middle">
  <!--!--!--!--!--!--!--!--!--!--!--!--!--!--!--!--! _________ !--!--!--!--!--!--!--!--!--!--!---->
  <!--!--!--!--!--!--!--!--!--!--!--!--!--!--!--!--! Header Copy Bar !--!--!--!--!--!--!--!--!--!--!---->
  <!--!--!--!--!--!--!--!--!--!--!--!--!--!--!--!--! _________ !--!--!--!--!--!--!--!--!--!--!---->
  <div class="flex items-center px-4 py-1">
    <Icon icon="majesticons:file" />
    <div class="ml-2">{fileName}</div>
    <div class="h-6 ml-auto">
      <svg preserveAspectRatio="none" viewBox="0 0 24 24" class="w-full h-full"
        ><rect
          x="2"
          y="8"
          width="15"
          height="15"
          rx="2"
          ry="2"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <rect
          x="7"
          y="3"
          width="15"
          height="15"
          rx="2"
          ry="2"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        /></svg
      >
    </div>
  </div>

  <div class="flex flex-col ">
    <!--!--!--!--!--!--!--!--!--!--!--!--!--!--!--!--! _________ !--!--!--!--!--!--!--!--!--!--!---->
    <!--!--!--!--!--!--!--!--!--!--!--!--!--!--!--!--! Code Text !--!--!--!--!--!--!--!--!--!--!---->
    <!--!--!--!--!--!--!--!--!--!--!--!--!--!--!--!--! _________ !--!--!--!--!--!--!--!--!--!--!---->
    {#each code.split("\n").slice(0, -1) as codeline, index}
      <div class="flex items-baseline px-8 relative">
        <!-- Highlight bar -->
        {#if markers}
          {@const markerIndex =
            markers &&
            markers.findIndex((list) =>
              list.includes(startLineIndex + index + 1)
            )}
          <div
            style="border-color: {color}"
            class="absolute inset-0 border-l-[.8em]"
          />
        {/if}
        <!-- Line number -->
        <div class="pt-1 flex-[0_0_3em]">
          {index + 1}
        </div>
        <!-- Actual code -->
        <div class="code">
          {@html Prism.highlight(codeline, Prism.languages["javascript"])}
        </div>
      </div>
    {/each}
  </div>
</div>



<style>
  .code {
    white-space: pre-wrap;
  }
</style>
