import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";
import { Resend } from "resend";

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
      const apiKey = import.meta.env.RESEND_API_KEY;

      if (!apiKey) {
        console.error("Missing RESEND_API_KEY in environment");
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server configuration error",
        });
      }

      const resend = new Resend(apiKey);

      console.log("=== FORM SUBMISSION START ===");
      console.log("Raw input:", input);

      // Honeypot check
      if (input[`fax`]?.trim()) {
        console.log("Honeypot triggered. Possible bot submission.");
        return { success: true };
      }

      try {
        console.log("Preparing email payload...");

        const emailPayload = {
          from: "Agency Contact Form <onboarding@resend.dev>",
          to: ["lockyyw@outlook.com"],
          replyTo: input.email,
          subject: `New inquiry from ${input.name} @ ${input["restaurant-name"]}`,
          html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${input.name}</p>
        <p><strong>Restaurant:</strong> ${input["restaurant-name"]}</p>
        <p><strong>Email:</strong> ${input.email}</p>
        <p><strong>Phone:</strong> ${input.phone || "Not provided"}</p>
        <p><strong>Contact preference:</strong> ${input.contact?.replace("contact-", "")}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${input.message}</p>
      `,
        };

        console.log("Email payload:", emailPayload);

        const response = await resend.emails.send(emailPayload);

        console.log("Resend response:", response);

        if (response.error) {
          console.error("Resend error object:", response.error);

          throw new ActionError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Resend failed: ${response.error.message}`,
          });
        }

        console.log("=== EMAIL SENT SUCCESSFULLY ===");

        return {
          success: true,
          message: "Message sent successfully!",
        };
      } catch (err: any) {
        console.error("=== ERROR CAUGHT ===");
        console.error("Full error object:", err);
        console.error("Error message:", err?.message);
        console.error("Stack trace:", err?.stack);

        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Something went wrong. Please try again.",
        });
      }
    },
  }),
};
