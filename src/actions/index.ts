import { defineAction } from "astro:actions";
import { z } from "astro/zod";

export const server = {
  form: defineAction({
    accept: "form",
    input: z.object({
      name: z.preprocess(
        (val) => (val === null ? "" : val),
        z.string().trim().nonempty({ message: `Please enter your name` }),
      ),
      "restaurant-name": z.preprocess(
        (val) => (val === null ? "" : val),
        z.string().trim().nonempty({ message: `Please enter your restaurant's name` }),
      ),
      phone: z.preprocess(
        (val) => (val === null ? "" : val),
        z
          .string()
          .trim()
          .optional()
          .refine((val) => !val || val.replace(/[^0-9+]/g, "").length >= 9, {
            message: "Please enter a valid phone number",
          }),
      ),
      email: z.preprocess(
        (val) => (val === null ? "" : val),
        z
          .string()
          .trim()
          .nonempty({ message: `Email can't be empty` })
          .email({ message: `Please enter a valid email` }),
      ),
      contact: z.enum(["contact-email", "contact-phone", "contact-none"], {
        required_error: "Please select how you'd like us to contact you",
      }),
      message: z.preprocess(
        (val) => (val === null ? "" : val),
        z
          .string()
          .trim()
          .nonempty({ message: `Message can't be empty` })
          .min(50, { message: `Must be 50 characters or more` }),
      ),
      fax: z.string().optional(),
    }),
    handler: async (input) => {
      if (input[`fax`]?.trim()) {
        return { success: true };
      }

      return { success: true };
    },
  }),
};
