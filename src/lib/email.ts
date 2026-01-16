import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export function isEmailConfigured(): boolean {
  return !!resend;
}

interface SendPasswordResetEmailParams {
  to: string;
  resetToken: string;
  baseUrl: string;
}

export async function sendPasswordResetEmail({
  to,
  resetToken,
  baseUrl,
}: SendPasswordResetEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn("[Email] Resend not configured - RESEND_API_KEY missing");
    return { success: false, error: "Email service not configured" };
  }

  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: "CyberComply <noreply@resend.dev>", // Use your verified domain in production
      to: [to],
      subject: "Reset Your CyberComply Password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0e17; color: #e2e8f0; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #151929; border-radius: 12px; padding: 40px; border: 1px solid #1e2638;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 12px; border-radius: 12px;">
                  <span style="font-size: 24px;">🛡️</span>
                </div>
                <h1 style="color: #f8fafc; margin-top: 16px; margin-bottom: 8px;">CyberComply</h1>
              </div>

              <h2 style="color: #f8fafc; margin-bottom: 16px;">Reset Your Password</h2>

              <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">
                We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
                  Reset Password
                </a>
              </div>

              <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #6366f1; font-size: 14px; word-break: break-all; background-color: #0a0e17; padding: 12px; border-radius: 6px;">
                ${resetUrl}
              </p>

              <hr style="border: none; border-top: 1px solid #1e2638; margin: 32px 0;">

              <p style="color: #64748b; font-size: 12px; text-align: center;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
Reset Your CyberComply Password

We received a request to reset your password. Click the link below to create a new password. This link will expire in 1 hour.

${resetUrl}

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
      `,
    });

    if (error) {
      console.error("[Email] Failed to send password reset email:", error);
      return { success: false, error: error.message };
    }

    console.log("[Email] Password reset email sent successfully:", data?.id);
    return { success: true };
  } catch (err) {
    console.error("[Email] Error sending password reset email:", err);
    return { success: false, error: "Failed to send email" };
  }
}
