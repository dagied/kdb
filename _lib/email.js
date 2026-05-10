import nodemailer from "nodemailer";

function createTransporter() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("Missing SMTP credentials. Set SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS.");
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  const transportOptions = host
    ? {
        host,
        port,
        secure,
        auth: { user, pass }
      }
    : {
        service: "gmail",
        auth: { user, pass }
      };

  if (process.env.SMTP_TLS_REJECT_UNAUTHORIZED === "false") {
    transportOptions.tls = { rejectUnauthorized: false };
  }

  return nodemailer.createTransport(transportOptions);
}

export async function sendCredentials(email, username, password) {

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Kebele Management System" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Account Credentials",
      html: `
        <div style="font-family: 'Segoe UI', 'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 24px; padding: 0; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
          <!-- Hero Section -->
          <div style="background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%); backdrop-filter: blur(10px); border-radius: 24px 24px 0 0; padding: 48px 40px 32px; text-align: center;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 20px;">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h1 style="color: white; font-size: 32px; font-weight: 700; margin: 0 0 12px 0; letter-spacing: -0.5px;">Welcome to Bosa Addis</h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0; line-height: 1.5;">Your Kebele Management System account has been created</p>
          </div>
          
          <!-- Content Card -->
          <div style="background: white; border-radius: 24px; margin: 24px; padding: 32px; box-shadow: 0 20px 40px -12px rgba(0,0,0,0.15);">
            <div style="margin-bottom: 32px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                  <circle cx="12" cy="7" r="4" stroke="white" stroke-width="1.5"/>
                </svg>
              </div>
              <h2 style="color: #1a202c; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">Account Credentials</h2>
              <p style="color: #718096; font-size: 14px; margin: 0; line-height: 1.5;">Use these credentials to access your account</p>
            </div>
            
            <!-- Credentials Card -->
            <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 20px; padding: 24px; margin-bottom: 32px; border: 1px solid #e2e8f0;">
              <!-- Username -->
              <div style="margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="#4a5568" stroke-width="1.5" stroke-linecap="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#4a5568" stroke-width="1.5"/>
                  </svg>
                  <span style="color: #4a5568; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Username</span>
                </div>
                <div style="background: white; padding: 14px 18px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 16px; color: #2d3748; font-weight: 500;">${username}</div>
              </div>
              
              <!-- Password -->
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="5" y="11" width="14" height="11" rx="2" stroke="#4a5568" stroke-width="1.5"/>
                    <path d="M8 11V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V11" stroke="#4a5568" stroke-width="1.5"/>
                  </svg>
                  <span style="color: #4a5568; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Password</span>
                </div>
                <div style="background: white; padding: 14px 18px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 16px; color: #2d3748; font-weight: 500;">${password}</div>
              </div>
            </div>
            
            <!-- Security Note -->
            <div style="background: #fef5e7; border-left: 4px solid #f39c12; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px; display: flex; align-items: flex-start; gap: 12px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                <path d="M12 8V12M12 16H12.01M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="#e67e22" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <div>
                <p style="color: #e67e22; font-size: 13px; font-weight: 600; margin: 0 0 4px 0;">Security Notice</p>
                <p style="color: #7f8c8d; font-size: 13px; margin: 0; line-height: 1.4;">Please change your password after logging in to secure your account.</p>
              </div>
            </div>
            
            <!-- Divider -->
            <div style="height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 24px 0;"></div>
            
            <!-- Footer Note -->
            <div style="text-align: center;">
              <p style="color: #a0aec0; font-size: 12px; margin: 0; line-height: 1.5;">This is an automated message from <strong style="color: #667eea;">Kebele Management System</strong><br>Bosa Addis, Ethiopia</p>
            </div>
          </div>
        </div>
      `
    });

    console.log("✅ Email sent to:", email);

  } catch (error) {
    console.error("❌ Email failed:", error.message);
  }
}
