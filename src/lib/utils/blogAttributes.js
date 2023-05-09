import { writable } from 'svelte/store';

export const progressAtCurrentHeading = writable(0);

export const headingData = writable({
    progressAtCurrentHeading: 0,
    currentHeading: ""
})
