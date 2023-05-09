import { writable } from 'svelte/store';

export const blogCardInfo = writable([
    {
        blogtName: "how to download data requested by the current website.",
        icon:
            "akar-icons:twitter-fill",
        blogLink:
            "https://twitter.com/tu_yukun/status/1468683526606258178",
        blogImgSource:
            "/post-images/twitterThread/cover.jpeg",
        date: "2022-01-01"
    },
    {
        blogtName: "GSAP ScrollTrigger in Observable",
        icon:
            "simple-icons:observable",
        blogLink:
            "https://observablehq.com/@tututwo/gsap-scrolltrigger-in-observable",
        blogImgSource:
            "/post-images/observalbe/scrolltrigger.png",
        date: "2022-05-01"
    }
])