// @ts-check
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

// GitHub Pages serves a project site under a path, not at the root of a
// domain. Both values below must stay correct together: `site` builds the
// absolute URLs in the sitemap, and `base` prefixes every internal link.
// Never write a link as "/favicon.svg". Write it with the base, or the link
// breaks in production while it still works in development.
const SITE = "https://stiven-gjekaj.github.io";
const BASE = "/markdown-to-wattpad";

export default defineConfig({
  site: SITE,
  base: BASE,

  // GitHub Pages serves a directory as `index.html`, so "always" matches what
  // the host already does. A mixed rule puts the same page in a search index
  // twice.
  trailingSlash: "always",

  integrations: [sitemap()],
});
