// @ts-check
import { defineConfig, svgoOptimizer } from "astro/config";

import netlify from "@astrojs/netlify";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://vyteca.com",
  devToolbar: {
    enabled: false,
  },

  build: {
    inlineStylesheets: "always",
  },

  // Give Lightning CSS (Vite's production CSS minifier) explicit browser targets
  // so it vendor-prefixes correctly. With no targets it added no -webkit- prefixes
  // (breaking backdrop-filter blur on Safari < 18) and collapsed rules that shipped
  // both backdrop-filter prefixes down to -webkit- only (breaking the blur in
  // Firefox, which has no -webkit-backdrop-filter). These versions match the site's
  // existing baseline — relative colour, hsl(from …), already requires them — so
  // nothing is downlevelled; Lightning CSS just prefixes from the standard property.
  vite: {
    build: {
      cssTarget: ["chrome119", "edge119", "firefox128", "safari16.4", "ios16.4"],
    },
  },

  experimental: {
    svgOptimizer: svgoOptimizer({
      plugins: [
        {
          name: "preset-default",
          params: {
            overrides: {
              cleanupIds: false,
            },
          },
        },
      ],
    }),
  },

  integrations: [sitemap()],

  adapter: netlify(),

  trailingSlash: "never",
});
