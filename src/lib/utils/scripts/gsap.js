// https://stackoverflow.com/questions/72016458/sveltekit-greensock-scrolltrigger-breaking-in-production/72278547#72278547
import { gsap } from 'gsap';
import { Flip } from 'gsap/dist/Flip.js';
import { Draggable } from 'gsap/dist/Draggable';
import { InertiaPlugin } from 'gsap/dist/InertiaPlugin';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger.js';
// import { MotionPathPlugin } from 'gsap/dist/MotionPathPlugin.js';

if (typeof window !== "undefined") {
  // gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
  gsap.registerPlugin(Draggable, InertiaPlugin, Flip, ScrollTrigger)
}

export * from "gsap";
export { Draggable, InertiaPlugin, Flip, ScrollTrigger};