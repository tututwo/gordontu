/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      gridTemplateColumns: {
        blogSectionLg: "12rem minmax(auto, 1fr) 23rem",
        // Simple 16 column grid
        projectCol: "repeat(3, minmax(auto, 1fr))",

        // Complex site-specific column configuration
        footer: "200px minmax(900px, 1fr) 100px",
      },
      gridTemplateRows: {
        // Simple 8 row grid
        projectRow: "repeat(8, minmax(auto, 1fr))",

        // Complex site-specific row configuration
        layout: "200px minmax(900px, 1fr) 100px",
      },
    },
    fontFamily: {
      icon: ["HanYiShouJinShuFan"],
      heading: ["EB Garamond"],
    },
  },
  plugins: [],
};
