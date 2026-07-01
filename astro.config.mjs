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
