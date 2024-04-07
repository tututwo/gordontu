<script>
  import Code from "$lib/blogSection/ui/Code/Code.svelte";
  import Expand from "$lib/blogSection/ui/Expand/Expand.svelte";
</script>


<main class="py-[6em] px-8 max-w-[82em] my-0 mx-auto">
  <article>
    <p>
      Let's make a bar chart! but...how do we go from a blank page in the
      browser to a bar chart? We add elements to the DOM (What is a DOM?)
    </p>
    <br />
    <p>
      How do we add elements to the DOM in Svelte? It is easy. Just write HTML.
      <b>SHOW CODE HERE</b>. You will become a HTML master as you keep writing
      Svelte code.
    </p>
    <br />
    <p>
      Alright, let's say we want to create one bar, and add it to the <code
        >&lt;figure&gt;</code
      >
      element. What element should I use to represent a bar in the DOM? That is a
      great question: You can use <code>&lt;div&gt;</code>, you can use
      <code>&lt;rect&gt;</code>
      of SVG, you can use <code>&lt;canvas&gt;</code>, and feel free to use
      webGPU if that is what you want. But for this, a common practice would be
      to use
      <mark class="bg-fuchsia-800 text-[white] py-1 px-2">svg</mark> elements.
      Those elements produce way better and crisp resultions than
      <code>&lt;div&gt;</code> and <code>&lt;canvas&gt;</code> elements, and you
      will find it is easier to work with SVG elements in Svelte.
    </p>
    <br />
    <p>Here is how I would create a bar in Svelte. <b>SHOW CODE HERE</b></p>

    <br />
  </article>

  <div>
    <Code />
  </div>

  <div>
    <Expand summaryTitle={"This is from Blog One: Transition to be added"}>
      <p>
        <a href="https://reactjs.org/">React.js</a> is a JavaScript library that
        helps with building complex user interfaces. This website is NOT written
        using React!
      </p>
    </Expand>
  </div>
</main>
