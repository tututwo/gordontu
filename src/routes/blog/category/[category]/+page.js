// src/routes/blog/category/[category]/+page.js
export const load = async ({ fetch, params }) => {
  const { category } = params
  const response = await fetch(`/api/posts`)
  const allPosts = await response.json()

  const posts = allPosts
    .filter(post => post.meta.categories.includes(category))
  // console.log(allPosts[0].meta.categories.includes("svelte"))
  
  
  return {
    category,
    posts
  }
}