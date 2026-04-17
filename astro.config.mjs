// @ts-check
import { defineConfig } from "astro/config";
import icon from "astro-icon";

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
    svgo: {
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
    },
  },

  integrations: [
    icon({
      iconDir: `src/assets/icons/offer`,
    }),
    sitemap(),
  ],

  adapter: netlify(),

  trailingSlash: "never",
});
