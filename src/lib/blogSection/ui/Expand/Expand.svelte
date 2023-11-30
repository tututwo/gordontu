<script>
  export let summaryTitle = "Summary";
</script>

<details class="mt-2 mb-7">
  <!-- list-style to delete the arrow:https://developer.mozilla.org/en-US/docs/Web/CSS/list-style -->
  <summary class="list-none cursor-pointer focus:outline-none hover:bg-sky-700">
    <div class="flex items-center justify-between py-4 px-5 bg-[rgba(18,203,196,.1)] border-l-4 border-[#12cbc4]">
      <div class="flex flex-col">
        <b>{summaryTitle}</b>
        <div>Tap me to hide details</div>
      </div>
    </div>
  </summary>

  <div class="max-h-[90em] py-4 px-5 border-l-4 border-[#12cbc4]">
    <slot></slot>
  </div>
</details>
