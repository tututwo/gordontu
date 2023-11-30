<script>
  import Icon from "@iconify/svelte";
  // import { annotate } from "svelte-rough-notation";
  import { annotateAction, titleTagVisibility } from "$lib/utils/landingPage";
  import Project from "$lib/project/project.svelte";
  import BlogSection from "$lib/blogSection/BlogSection.svelte";

  import { fade, fly } from "svelte/transition";
  import { onMount, afterUpdate } from "svelte";
  import { gsapOut, gsapIn } from "$lib/utils/tweens";

  let options = {};

  import { projectCardInfo } from "$lib/project/project";

  /**
   * Title
   */
  let headerWidth = 1000;
  let titleTags = [
    { tag: "charts", color: "#E4523E" },
    { tag: "maps", color: "#81ABD9" },
    { tag: "code creatively", color: "#0EAEC9" },
  ];
  let tagTextColor = "black";

  let tagNodes = [];
  /*
   * Project
   */

  let currentProjectTitleTag = $projectCardInfo.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  $: projectNodes = [];

  // afterUpdate(() => {
  function filterProjectButton(event) {
    currentProjectTitleTag = $projectCardInfo.filter(
      // .textContent will not work
      // https://stackoverflow.com/questions/24427621/innertext-vs-innerhtml-vs-label-vs-text-vs-textcontent-vs-outertext
      (d) => d.titleTag == event.target.innerText
    );
    currentProjectTitleTag = currentProjectTitleTag.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
  }

  /**
   * Blog
   */
  function showBlogSelection() {
    currentProjectTitleTag = [];
  }
</script>

<div
  class="absolute h-full w-full flex items-start justify-center overflow-hidden z-[-1] pointer-events-none"
>
  <css-doodle>
    {`
          :doodle {
          @grid: 16 / 100vmin 80vmin;
          perspective: 90vmin;
          perspective-origin: 0% -140%;
          transform: scale(1.8);
          }

          :container {
          transform-style: preserve-3d;
          animation: camera 20s ease-in-out infinite;
          animation-direction: alternate-reverse;
          }

          --ds: @r(4s, 12s, .1);
          --size: @r(1, 9);

          /* Thanks to mootari for the tip */
          --z: calc(@i() * .0001px + var(--size) * .1px);

          animation:
          move var(--ds) linear infinite,
          opacity var(--ds) linear infinite;

          animation-delay: 
          calc((@row() - @size-row()) * var(--ds) / @size-row() - @r(@size()) * .1s);

          :after {
          content: '';
          @size: calc(var(--size) * 10%);
          background: @p(#00b8a9, #f8f3d4, #f6416c, #ffde7d);

          }

          position: absolute;
          left: calc(@col() * 100% / @size-row());
          @size: calc(100% / @size-row());

          @keyframes move {
          0% {
            transform: 
              translate3d(0, 0, calc(var(--z) - 15vmin)) 
              rotateX(180deg) scaleY(.01);
          }
          10% {
            transform: 
              translate3d(0, calc(10% * @size-row()), var(--z)) 
              rotateX(0) scaleY(.8);
          }
          90% {
            transform: 
              translate3d(0, calc(90% * @size-row()), var(--z)) 
              scale(1);
          }
          100% {
            transform: 
              translate3d(0, calc(100% * @size-row()), calc(var(--z) + 5vmin)) 
              scale(.5);
          }
          }

          @keyframes opacity {
          0%, 100% { opacity: 0; }
          10%, 90% { opacity: .9; }
          }

          @keyframes camera {
          from {
            transform: rotateX(-45deg) rotate(140deg) translateY(-10%);
          }
          to {
            transform: rotateX(-45deg) rotate(220deg) translateY(-10%);
          }
          }
          `}
  </css-doodle>
</div>
<svelte:head>
  <script
    defer
    src="https://unpkg.com/css-doodle@0.30.8/css-doodle.js"
  ></script>
</svelte:head>
<header
  class="relative top-[20vh] w-full lg:min-h-[50vh] flex flex-col items-center justify-center text-[1.2rem]"
>
  <div class="lg:px-[300px] lg:min-w-[40vw]">
    <div class="flex items-center">
      <!--* Project Tags -->
      <span class="clearText">
        <p class="actualClearText">Hi, I'm Gordon Tu. I make</p>
      </span>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      {#each titleTags as { tag, color }, index}
        <span
          class="z-[1000] font-heading font-black cursor-pointer mx-2 px-2 flex items-center justify-center text-[2rem]"
          style="color: {'white'}"
          bind:this={tagNodes[index]}
          on:click={filterProjectButton}
          use:annotateAction={{
            visible: true,
            color: color,
            type: "highlight",
            animationDuration: 1000,
            padding: 10,
          }}
        >
          {tag}
        </span>
      {/each}
      <div>on the web,</div>
    </div>
    <!--* Blog Tag -->
    <div class="clearText">
      <div class="actualClearText">
        and I also write
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <span
          use:annotateAction={{
            visible: true,
            color: "#33BFB1",
            type: "underline",
            animationDuration: 1000,
            strokeWidth: 6,
          }}
          class="cursor-pointer font-bold font-heading text-[2rem]"
          on:click={showBlogSelection}>blog posts</span
        >
        <button on:click={showBlogSelection}>
          <Icon icon="ph:cursor-fill" /></button
        >
      </div>
    </div>
    <!--* Icon -->
    <div class="flex mt-2">
      <a href="https://twitter.com/tu_yukun" class="mr-2"
        ><Icon class="hover:color-[grey]" icon="akar-icons:twitter-fill" /></a
      >
      <a href="https://github.com/tututwo" class="mx-2"
        ><Icon icon="akar-icons:github-fill" /></a
      >
      <a href="https://observablehq.com/@tututwo?tab=profile" class="mx-2"
        ><Icon icon="simple-icons:observable" /></a
      >
      <a
        href="https://www.linkedin.com/in/gordon-tu-675a43255/"
        class="mx-2 scale-125"><Icon icon="mdi:linkedin" /></a
      >
    </div>
  </div>

  <div class="mt-10 h-full lg:min-h-[2000px] w-full flex justify-center">
    <!--* Project  -->
    {#if currentProjectTitleTag.length > 0}
      {#key currentProjectTitleTag}
        <section
          class="h-full w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ml-10"
        >
          {#each currentProjectTitleTag as individualProject, i (individualProject.projectName)}
            <div
              id={individualProject.projectName}
              class="postcard hover lg:w-[90%] gap-[10rem] h-[20vh] lg:h-[400px] mb-10 relative flex justify-center items-center"
              bind:this={projectNodes[i]}
            >
              <!--                                 projectOffsetLeft={projectNodes[i].offsetLeft}
                                projectOffsetHeight={projectNodes[i].offsetHeight} -->
              <Project {individualProject} projectNode={projectNodes[i]} />
            </div>
          {/each}
        </section>
      {/key}
    {/if}
    <!--* Blog -->
    {#if currentProjectTitleTag.length == 0}
      <BlogSection />
    {/if}
  </div>
</header>

<!-- in:gsapIn|global
out:gsapOut|global={{
    currentProjectTitleTagLength:
        currentProjectTitleTag.length,
}} -->
<style lang="scss">
  :global(.rough-annotation) {
    z-index: 999;
  }
  :global(.rough-annotation:hover) {
    opacity: 0.4;
  }
  .clearText {
    position: relative;
    width: fit-content;
  }

  .clearText::before {
    content: "";
    background-color: white;
    background-size: cover;
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    opacity: 0.85;
    border-radius: 0.21rem;
  }

  .actualClearText {
    position: relative;
    line-height: 0.9;
    z-index: 1000;
  }

  .postcard {
    perspective: 1000px;
  }
</style>
