<script>
    // export const prerender = true
    import "../app.css";
    // import 'css-doodle';
    import Analytics from "$lib/Analytics.svelte";
    import Header from "$lib/landingPage/Header.svelte";

    import { fade } from "svelte/transition";

    export let data;
</script>

<div
    class="absolute h-full w-full flex items-start justify-center overflow-hidden z-[-1] pointer-events-none"
    
>
    <!-- <css-doodle >
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
    </css-doodle> -->
</div>
<!-- <svelte:head>
    <script
        defer
        src="https://unpkg.com/css-doodle@0.30.8/css-doodle.js"
    ></script>
</svelte:head> -->

{#key data.currentRoute}
    <div
        class="w-full h-full min-h-[100vh]"
        in:fade={{ duration: 150, delay: 150 }}
        out:fade={{ duration: 150 }}
    >
        <!-- <Header /> -->
        <Analytics />
        <slot />
    </div>
{/key}

<footer class="flex items-center justify-center mt-[120px] z-[-1]">
    This website is made of love, and shoulder pain as well as endless support
    from Svelte community.
</footer>

<style>
    :global(body) {
        position: relative;
    }

    css-doodle {
        color: white
    }
</style>
