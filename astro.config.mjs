// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
// Every page is still built ahead of time; the adapter only runs the few
// routes marked `prerender = false` (the contact card) on Vercel.
export default defineConfig({
  adapter: vercel(),
});
