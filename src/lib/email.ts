import nodemailer from 'nodemailer';
import { config } from './config';

// ============================================
// EMAIL TRANSPORTER
// ============================================

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

// ============================================
// EMAIL TEMPLATES
// ============================================

const getBaseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.app.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
    .content { margin-bottom: 30px; }
    .button { display: inline-block; background: #6366f1; color: white !important; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500; }
    .button:hover { background: #4f46e5; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
    .code { background: #f4f4f5; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 24px; letter-spacing: 3px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">${config.app.name}</div>
      </div>
      ${content}
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${config.app.name}. All rights reserved.</p>
        <p>This email was sent to you because you have an account with us.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // In development or if SMTP is not configured, log instead of sending
    if (!config.email.user || !config.email.password) {
      console.log('📧 Email would be sent:', {
        to: options.to,
        subject: options.subject,
      });
      console.log('HTML:', options.html);
      return true;
    }

    await transporter.sendMail({
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// ============================================
// SPECIFIC EMAIL FUNCTIONS
// ============================================

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const verifyUrl = `${config.app.url}/verify-email?token=${token}`;
  
  const content = `
    <div class="content">
      <h2>Welcome, ${name}!</h2>
      <p>Thank you for signing up for ${config.app.name}. Please verify your email address to get started.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" class="button">Verify Email Address</a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #6366f1;">${verifyUrl}</p>
      <p>This link will expire in 24 hours.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Verify your email - ${config.app.name}`,
    html: getBaseTemplate(content),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const resetUrl = `${config.app.url}/reset-password?token=${token}`;
  
  const content = `
    <div class="content">
      <h2>Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Password Reset - ${config.app.name}`,
    html: getBaseTemplate(content),
  });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const content = `
    <div class="content">
      <h2>Welcome to ${config.app.name}!</h2>
      <p>Hi ${name},</p>
      <p>Your email has been verified and your account is now active. You're all set to start using our AI tools!</p>
      <p>Here's what you can do:</p>
      <ul>
        <li>Explore our AI tool catalog</li>
        <li>Generate text, code, and more</li>
        <li>Track your usage and history</li>
        <li>Customize your profile</li>
      </ul>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${config.app.url}/dashboard" class="button">Go to Dashboard</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to ${config.app.name}!`,
    html: getBaseTemplate(content),
  });
}

export async function sendPasswordChangedEmail(email: string, name: string): Promise<boolean> {
  const content = `
    <div class="content">
      <h2>Password Changed</h2>
      <p>Hi ${name},</p>
      <p>Your password has been successfully changed.</p>
      <p>If you did not make this change, please contact our support team immediately.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${config.app.url}/contact" class="button">Contact Support</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Password Changed - ${config.app.name}`,
    html: getBaseTemplate(content),
  });
}

export async function sendContactConfirmationEmail(
  email: string,
  name: string,
  subject: string
): Promise<boolean> {
  const content = `
    <div class="content">
      <h2>We received your message</h2>
      <p>Hi ${name},</p>
      <p>Thank you for contacting us regarding: <strong>${subject}</strong></p>
      <p>Our team will review your message and get back to you within 24-48 hours.</p>
      <p>In the meantime, you can check our FAQ section for quick answers.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `We received your message - ${config.app.name}`,
    html: getBaseTemplate(content),
  });
}

export async function sendAiRequestCompleteEmail(
  email: string,
  name: string,
  toolName: string,
  requestId: string
): Promise<boolean> {
  const viewUrl = `${config.app.url}/dashboard/history/${requestId}`;
  
  const content = `
    <div class="content">
      <h2>Your AI Request is Complete</h2>
      <p>Hi ${name},</p>
      <p>Your ${toolName} request has been processed successfully.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${viewUrl}" class="button">View Results</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `AI Request Complete - ${config.app.name}`,
    html: getBaseTemplate(content),
  });
}
