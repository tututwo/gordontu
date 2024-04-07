<script>
    // export const prerender = true
    import "../app.css";
    import 'css-doodle';
    import Analytics from "$lib/Analytics.svelte";
    import Header from "$lib/landingPage/Header.svelte";

    import { fade } from "svelte/transition";

    export let data;
</script>


{#key data.currentRoute}
    <div
        class="w-full h-full min-h-[100vh]"
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
</style>
