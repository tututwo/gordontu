<script>
  import { headingStringParse } from "$lib/utils";
  import { headingData } from "$lib/utils/blogAttributes";

  import { gsap } from "../utils/scripts/gsap";
  import { onMount } from "svelte";

  export let categories = [];
  export let titleSection = [];

  onMount(() => {
    const tl = gsap.timeline();
    tl.to("#sideHeading", {
      rotation: 360,
      // duration: 2,
      ease: "power4.easeOut",
      opacity: 1,
      // repeat: -1,
      // yoyo: true,
    });
  });
</script>

<aside class="flex flex-col justify-start ml-4">
  <!-- <PostSearch /> -->

  <h2 class="lg:text-2xl font-extrabold font-heading">Sections</h2>

  <div>
    <!--* Moving border  -->
    <div />
    <!--* Side heading links  -->
    {#each titleSection as section}
      <!--TODO when the h2 element enters .5, the a element change the border  -->
      <!--TODO if progress>.5 & id of h2 == section   -->
      <div
        class="font-light lg:text-lg"
        id = "sideHeading"
        style={$headingData.progressAtCurrentHeading > 0.5 &&
        $headingData.currentHeading == headingStringParse(section)
          ? "border-radius: 10px;border: 2px solid red"
          : "border: none"}
      >
        <a href={"#" + headingStringParse(section)}>{section}</a>
      </div>
    {/each}
  </div>

  <div class="lg:text-2xl font-extrabold font-heading mt-4 mb-2">
    Categories
  </div>
  <div class="flex gap-x-4 ">
    {#each categories as category}
      <a
        href="/blog/category/{category}"
        class="font-[2000] lg:text-lg bg-[#9AC6BD] text-white px-2 rounded-lg hover:bg-[#F7D138] transition-colors ease-in-out"
      >
        {category}
      </a>
    {/each}
  </div>
</aside>
