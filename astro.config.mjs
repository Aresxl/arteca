// @ts-check
import { defineConfig } from "astro/config";
import icon from "astro-icon";

import netlify from "@astrojs/netlify";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false,
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

  vite: {
    build: {
      assetsInlineLimit: 10240,
    },
  },

  integrations: [
    icon({
      iconDir: `src/assets/icons/offer`,
    }),
    sitemap(),
  ],

  adapter: netlify(),
});
