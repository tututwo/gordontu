<script>
  import { headingStringParse } from "$lib/utils";
  import { gsap, ScrollTrigger } from "../utils/scripts/gsap";
  import { onMount } from "svelte";

  import { headingData } from "$lib/utils/blogAttributes"

  /**
   * @type {any}
   */
  export let heading = "";
  // scrolltrigger way
  onMount(() => {
    const headingElements = gsap.utils.toArray(".scrolltrigger-demo");

    // create = register
    headingElements.forEach((headingElement) => {
      ScrollTrigger.create({
        trigger: headingElement,
        start: "top top+=300px",
        markers: true,
        end: "bottom 50%",
        // equivalent to on:eventlistener. this is a callback
        onUpdate: (self) => {
          
          $headingData.progressAtCurrentHeading = self.progress.toFixed(3)
          $headingData.currentHeading = self.trigger.id
          // console.log(self.trigger.id)
          // console.log(
          //   "progress:",
          //   self.progress.toFixed(3),
          //   "direction:",
          //   self.direction,
          //   "velocity",
          //   self.getVelocity()
          // );
        },
      });
      ScrollTrigger.refresh();
    });
  });
</script>

<h2 id={headingStringParse(heading)} class="scrolltrigger-demo">
  {@html heading}
</h2>
