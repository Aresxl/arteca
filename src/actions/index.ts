import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/** Escape user-supplied values before they go into the HTML email body. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Rate limiter — caps submissions per IP so a bot (or a script POSTing
 * straight to the action endpoint, bypassing the honeypot) can't flood the
 * inbox or burn the Resend quota. Upstash Redis is HTTP-based, so a single
 * module-level client is reused across invocations.
 *
 * Built only when both env vars are present; if they're missing or Redis is
 * unreachable at request time we FAIL OPEN (allow the send) so an outage or a
 * misconfig never blocks a real customer.
 */
const upstashUrl = import.meta.env.UPSTASH_REDIS_REST_URL;
const upstashToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

const ratelimit =
  upstashUrl && upstashToken
    ? new Ratelimit({
        redis: new Redis({ url: upstashUrl, token: upstashToken }),
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        prefix: "ratelimit:contact",
        analytics: false,
      })
    : null;

export const server = {
  form: defineAction({
    // accept: "form",
    input: z.object({
      name: z.preprocess(
        (val) => (val === null ? "" : val),
        z.string().trim().min(2, { message: `Please enter your name` }),
      ),
      "venue-name": z.preprocess(
        (val) => (val === null ? "" : val),
        z.string().trim().min(2, { message: `Please enter your venue's name` }),
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
    handler: async (input, context) => {
      const apiKey = import.meta.env.RESEND_API_KEY;

      if (!apiKey) {
        console.error("Missing RESEND_API_KEY in environment");
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server configuration error",
        });
      }

      const resend = new Resend(apiKey);

      // Honeypot — a real user never fills this hidden field
      if (input[`fax`]?.trim()) {
        return { success: true };
      }

      // Rate limit per IP (fail open if Redis is down/unconfigured)
      if (ratelimit) {
        let ip = "unknown";
        try {
          ip = context.clientAddress;
        } catch {
          ip =
            context.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        }

        try {
          const { success } = await ratelimit.limit(ip);
          if (!success) {
            throw new ActionError({
              code: "TOO_MANY_REQUESTS",
              message:
                "You've sent a few messages already. Please wait a little while and try again, or email us directly at vyteca@gmail.com.",
            });
          }
        } catch (err) {
          if (err instanceof ActionError) throw err; // rethrow the 429
          console.error("Rate limiter unavailable, allowing request:", err);
        }
      }

      try {
        const emailPayload = {
          from: "Vyteca Contact Form <contact@mail.vyteca.com>",
          to: ["vyteca@gmail.com"],
          replyTo: input.email,
          subject: `New inquiry from ${input.name} @ ${input["venue-name"]}`,
          html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
        <p><strong>Venue:</strong> ${escapeHtml(input["venue-name"])}</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p><strong>Phone:</strong> ${input.phone ? escapeHtml(input.phone) : "Not provided"}</p>
        <p><strong>Contact preference:</strong> ${input.contact.replace("contact-", "")}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${escapeHtml(input.message)}</p>
      `,
        };

        const response = await resend.emails.send(emailPayload);

        if (response.error) {
          console.error("Resend error:", response.error);

          throw new ActionError({
            code: "INTERNAL_SERVER_ERROR",
            message: "We couldn't send your message. Please try again.",
          });
        }

        return {
          success: true,
          message: "Message sent successfully!",
        };
      } catch (err) {
        console.error("Contact form send failed:", err);

        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong. Please try again.",
        });
      }
    },
  }),
};
