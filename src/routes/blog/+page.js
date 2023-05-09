export const load = async ({ fetch }) => {
  //? should i fetch from end point or...?
    const response = await fetch(`/api/posts`)
    const posts = await response.json()
  
    return {
      posts
    }
  }