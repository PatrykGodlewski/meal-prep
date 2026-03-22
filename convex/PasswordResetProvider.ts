/**
 * Password reset email provider.
 *
 * Currently logs the reset code/token to the console for development.
 * To integrate with Resend + React Email:
 * 1. Install: pnpm add resend @react-email/components
 * 2. Add AUTH_RESEND_KEY to env
 * 3. Replace sendVerificationRequest to use Resend API and React Email templates
 */
import type { EmailConfig } from "@auth/core/providers/email";

function generateNumericCode(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  const alphabet = "0123456789";
  return Array.from(bytes)
    .map((b) => alphabet[b % alphabet.length])
    .join("");
}

export const PasswordResetProvider: EmailConfig = {
  id: "password-resend-otp",
  type: "email",
  name: "PasswordReset",
  maxAge: 60 * 60, // 1 hour
  generateVerificationToken() {
    return Promise.resolve(generateNumericCode(8));
  },
  async sendVerificationRequest({ identifier: email, token, url }) {
    // TODO: Replace with Resend + React Email integration
    // import { Resend } from "resend";
    // import { PasswordResetEmail } from "@/emails/password-reset";
    // const resend = new Resend(process.env.AUTH_RESEND_KEY);
    // await resend.emails.send({ from: "...", to: [email], react: PasswordResetEmail({ token, url }) });
    console.log("[Password Reset] Code and URL for", email, ":", {
      token,
      url,
    });
    await Promise.resolve();
  },
};
