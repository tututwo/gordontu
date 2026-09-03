# Use a DOM-based project wall

**Superseded by ADR-0003 on 2026-09-03.** The card deck and project wall were removed with the landing redesign; this record stays for the reasoning.

The landing page uses a virtualized CSS 3D wall of semantic project links, driven by Pointer Events and Svelte motion, instead of WebGL. This keeps every project image, title, link, focus state, and responsive layout native to the document while still providing an infinite, inertial spatial interaction.
