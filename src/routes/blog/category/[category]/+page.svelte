<script>
  import { gsap, Flip } from "../../../../lib/utils/scripts/gsap";
  import { onMount } from "svelte";

  function transition() {
    
  }
  // htt  ps://greensock.com/forums/topic/28849-how-to-make-gsap-draggable-stop-on-click-and-start-on-click/
  onMount(async () => {
    await transition();
  });

  export let data;
</script>

{#if data.posts.length}
  <ul>
    {#each data.posts as post}
    <li>
      <h2>
        <a href={post.path}>
          <span class="font-extrabold">{post.meta.title}</span>
        </a>
      </h2>
      Published {post.meta.date}
    </li>
    {/each}
  </ul>
{/if}
