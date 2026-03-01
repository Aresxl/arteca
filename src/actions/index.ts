import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";
import { Resend } from "resend";

const resend = new Resend(import.meta.env.RESEND_API_KEY);

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

      try {
        const { error } = await resend.emails.send({
          from: "Agency Contact Form <onboarding@resend.dev>", // Must be a verified domain in Resend
          to: ["lockyyw@outlook.com"], // Your real email(s)
          replyTo: input.email,
          subject: `New inquiry from ${input.name} @ ${input["restaurant-name"]}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${input.name}</p>
            <p><strong>Restaurant:</strong> ${input["restaurant-name"]}</p>
            <p><strong>Email:</strong> ${input.email}</p>
            <p><strong>Phone:</strong> ${input.phone || "Not provided"}</p>
            <p><strong>Contact preference:</strong> ${input.contact.replace("contact-", "")}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${input.message}</p>
          `,
        });

        if (error) {
          console.error("Resend error:", error);
          throw new ActionError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send message — please try again later.",
          });
        }

        return { success: true, message: "Message sent successfully!" };
      } catch (err) {
        console.error(err);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong. Please try again.",
        });
      }

      return { success: true };
    },
  }),
};
