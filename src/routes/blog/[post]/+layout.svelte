<script>
  import BlogSideBar from "$lib/blogSection/blogSideBar.svelte";
  export let data;
  $: ({ categories, titleSection } = data);
</script>

<!--TODO I need category and titleSection data -->
<div class="grid lg:grid-cols-blogSectionLg lg:gap-x-6 bg-white">
  <div></div>
  <slot />
  <div class="block sticky [align-self:start] top-0">
    <BlogSideBar {categories} {titleSection} />
  </div>

  
</div>
