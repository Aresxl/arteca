import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { file } from "astro/loaders";

export const collections = {
  portfolioCard: defineCollection({
    loader: file(`src/data/portfolio.json`),
    schema: ({ image }) =>
      z.object({
        id: z.string(),
        mobileImgSrc: image(),
        desktopImgSrc: image(),
        title: z.string(),
        eyebrow: z.string(),
        text: z.string(),
        pageSpeed: z.string(),
        loadSpeed: z.string(),
        roles: z.array(z.enum(["featured", "portfolio"])),
        type: z.string(),
        websiteHref: z.string(),
        websiteUrl: z.string(),
      }),
  }),
};
