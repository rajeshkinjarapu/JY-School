import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📧 Email to ${options.to}: ${options.subject}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"JY School" <noreply@rajacademy.com>',
    ...options,
  });
};

export const sendOtpEmail = async (email: string, otp: string, name: string): Promise<void> => {
  await sendEmail({
    to: email,
    subject: 'Password Reset OTP — JY School',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #6366f1, #14b8a6); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0;">JY School</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Student Management System</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 10px;">
          <h2 style="color: #1e293b;">Password Reset Request</h2>
          <p style="color: #64748b;">Hi ${name},</p>
          <p style="color: #64748b;">Your OTP for password reset is:</p>
          <div style="background: #f8fafc; border: 2px dashed #6366f1; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #6366f1; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="color: #64748b;">This OTP expires in <strong>10 minutes</strong>.</p>
          <p style="color: #94a3b8; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
  });
};

export const sendWelcomeEmail = async (email: string, name: string, role: string, password: string): Promise<void> => {
  await sendEmail({
    to: email,
    subject: 'Welcome to JY School SMS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1, #14b8a6); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0;">Welcome to JY School!</h1>
        </div>
        <div style="background: white; border: 1px solid #e2e8f0; padding: 30px; border-radius: 10px;">
          <h2 style="color: #1e293b;">Hi ${name},</h2>
          <p style="color: #64748b;">Your account has been created. Here are your login credentials:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; color: #64748b; font-weight: bold;">Email:</td>
              <td style="padding: 8px; color: #1e293b;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #64748b; font-weight: bold;">Password:</td>
              <td style="padding: 8px; color: #1e293b;">${password}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #64748b; font-weight: bold;">Role:</td>
              <td style="padding: 8px; color: #1e293b;">${role}</td>
            </tr>
          </table>
          <p style="color: #ef4444; font-size: 12px;">Please change your password after first login.</p>
        </div>
      </div>
    `,
  });
};
