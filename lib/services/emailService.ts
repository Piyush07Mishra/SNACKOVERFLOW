import nodemailer from 'nodemailer';

interface WelcomeEmailPayload {
  to: string;
  name: string;
  employeeId: string;
  tempPassword: string;
  loginUrl?: string;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Sends a welcome email with login credentials to a newly created employee.
 * NEVER throws — failures are logged silently so they never block user creation.
 */
export async function sendWelcomeEmail(payload: WelcomeEmailPayload): Promise<void> {
  const { to, name, employeeId, tempPassword, loginUrl } = payload;
  const appUrl = loginUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                    Welcome to EmPay 👋
                  </h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="color:#374151;font-size:16px;margin:0 0 24px;">
                    Hi <strong>${name}</strong>,
                  </p>
                  <p style="color:#374151;font-size:15px;margin:0 0 32px;line-height:1.6;">
                    Your employee account has been created. Here are your login credentials:
                  </p>

                  <!-- Credentials Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin-bottom:32px;">
                    <tr>
                      <td>
                        <p style="margin:0 0 12px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Employee ID</p>
                        <p style="margin:0 0 24px;color:#1a1a1a;font-size:20px;font-weight:700;font-family:monospace;">${employeeId}</p>
                        <p style="margin:0 0 12px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Temporary Password</p>
                        <p style="margin:0;color:#1a1a1a;font-size:20px;font-weight:700;font-family:monospace;">${tempPassword}</p>
                      </td>
                    </tr>
                  </table>

                  <p style="color:#ef4444;font-size:14px;margin:0 0 32px;">
                    ⚠️ Please change your password after your first login.
                  </p>

                  <!-- CTA -->
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="border-radius:8px;background:#1a1a1a;">
                        <a href="${appUrl}/login" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                          Login to EmPay →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
                  <p style="color:#9ca3af;font-size:13px;margin:0;text-align:center;">
                    This is an automated message from EmPay. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject: `Welcome to EmPay — Your Login Credentials`,
      html,
    });
    console.log(`[EmailService] Welcome email sent to ${to}`);
  } catch (err) {
    // IMPORTANT: Never rethrow — email failure must not block user creation
    console.error(`[EmailService] Failed to send welcome email to ${to}:`, err);
  }
}
