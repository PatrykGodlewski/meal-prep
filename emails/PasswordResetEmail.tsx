/**
 * React Email template for password reset.
 * Used when integrating with Resend - see convex/PasswordResetProvider.ts
 *
 * Usage with Resend:
 *   import { PasswordResetEmail } from "@/emails/PasswordResetEmail";
 *   await resend.emails.send({
 *     from: "Your App <onboarding@resend.dev>",
 *     to: [email],
 *     subject: "Reset your password",
 *     react: PasswordResetEmail({ token, url }),
 *   });
 */
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type * as React from "react";

interface PasswordResetEmailProps {
  token: string;
  url: string;
}

export function PasswordResetEmail({
  token,
  url,
}: PasswordResetEmailProps): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Reset your password with this code: {token}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>Your password reset code is:</Text>
          <Section style={codeSection}>
            <Text style={code}>{token}</Text>
          </Section>
          <Text style={text}>Or click the link below:</Text>
          <Link href={url} style={link}>
            Reset password
          </Link>
          <Hr style={hr} />
          <Text style={footer}>
            If you didn&apos;t request a password reset, you can safely ignore
            this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "20px 0 48px" };
const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
};
const text = { color: "#333", fontSize: "16px", lineHeight: "26px" };
const codeSection = {
  background: "#f4f4f5",
  borderRadius: "4px",
  padding: "16px",
  margin: "24px 0",
};
const code = { fontFamily: "monospace", fontSize: "24px", fontWeight: "bold" };
const link = {
  color: "#2563eb",
  fontSize: "16px",
  textDecoration: "underline",
};
const hr = { borderColor: "#e6ebf1", margin: "20px 0" };
const footer = { color: "#8898aa", fontSize: "12px" };
