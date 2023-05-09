/** @type {import('./$types').LayoutLoad} */
export const load = async ({ fetch, params }) => {
  const responses = await fetch(`/api/posts`);
  const posts = await responses.json();

  const post = await import (`../posts/${params.post}.md`)
  // setTimeout(() => {
  //   console.log(post.metadata)
  // }, 5000);
  const { title, date, titleSection, categories } = post.metadata
  const content = post.default
  return {
    posts,
    title,
    titleSection,
    categories
  };
};
