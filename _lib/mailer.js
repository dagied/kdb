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

export async function sendBulkEmail(emails, title, content) {
  // Validate emails array
  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    console.error("❌ No valid emails provided");
    throw new Error("No valid email addresses provided");
  }

  // Filter out invalid emails
  const validEmails = emails.filter(email => email && email.trim() && email.includes('@'));
  
  if (validEmails.length === 0) {
    console.error("❌ No valid email addresses after filtering");
    throw new Error("No valid email addresses found");
  }

  console.log(`📧 Preparing to send to ${validEmails.length} recipients:`, validEmails);

  try {
    const transporter = createTransporter();

    // Verify transporter connection
    await transporter.verify();
    console.log("✅ Email transporter verified");

    // Send to all emails
    const mailPromises = validEmails.map(email =>
      transporter.sendMail({
        from: `"Kebele Management System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: title,
        html: `
          <div style="font-family: 'Segoe UI', 'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 24px; padding: 0; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
            <!-- Hero Section -->
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%); backdrop-filter: blur(10px); border-radius: 24px 24px 0 0; padding: 48px 40px 32px; text-align: center;">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 20px;">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <h1 style="color: white; font-size: 32px; font-weight: 700; margin: 0 0 12px 0; letter-spacing: -0.5px;">Bosa Addis Announcement</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0; line-height: 1.5;">Important update from Kebele Management System</p>
            </div>

            <!-- Content Card -->
            <div style="background: white; border-radius: 24px; margin: 24px; padding: 32px; box-shadow: 0 20px 40px -12px rgba(0,0,0,0.15);">
              <div style="margin-bottom: 32px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h2 style="color: #1a202c; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">${title}</h2>
                <p style="color: #718096; font-size: 14px; margin: 0; line-height: 1.5;">New announcement from the system</p>
              </div>

              <!-- Announcement Content -->
              <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 20px; padding: 24px; margin-bottom: 32px; border: 1px solid #e2e8f0;">
                <div style="color: #2d3748; line-height: 1.6;">${content.replace(/\n/g, '<br>')}</div>
              </div>

              <!-- Footer Note -->
              <div style="text-align: center;">
                <p style="color: #a0aec0; font-size: 12px; margin: 0; line-height: 1.5;">This is an automated message from <strong style="color: #667eea;">Bosa Addis Kebele Administrator</strong><br>Bosa Addis, Ethiopia</p>
              </div>
            </div>
          </div>
        `
      })
    );

    const results = await Promise.allSettled(mailPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`✅ Email sending completed: ${successful} successful, ${failed} failed`);
    
    if (failed > 0) {
      console.error('Failed emails:', results.filter(r => r.status === 'rejected').map(r => r.reason));
    }

    return { success: true, sent: successful, failed: failed };

  } catch (error) {
    console.error("❌ Bulk email failed:", error.message);
    throw error;
  }
}