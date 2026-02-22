import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";

export const collections = {
  projects: defineCollection({
    loader: file(`src/data/projects.json`),
    schema: ({ image }) =>
      z.object({
        id: z.string(),
        title: z.string(),
        text: z.string(),
        roles: z.array(z.enum(["featured", "portfolio"])),
        imgSrc: image(),
      }),
  }),
};
