import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { to, settings } = await req.json();

    if (!to || !settings) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const { provider } = settings;
    let success = false;
    let errorMsg = "";

    if (provider === "smtp") {
      const transporter = nodemailer.createTransport({
        host: settings.smtp.host,
        port: settings.smtp.port,
        secure: settings.smtp.secure,
        auth: {
          user: settings.smtp.user,
          pass: settings.smtp.pass,
        },
      });

      await transporter.sendMail({
        from: `"${settings.smtp.fromName}" <${settings.smtp.fromEmail}>`,
        to,
        subject: "CertiGen Email Test",
        text: "This is a test email from CertiGen to verify your SMTP configuration.",
        html: "<b>This is a test email from CertiGen to verify your SMTP configuration.</b>",
      });
      success = true;
    } else if (provider === "mailersend") {
      const response = await fetch("https://api.mailersend.com/v1/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          Authorization: `Bearer ${settings.mailersend.apiKey}`,
        },
        body: JSON.stringify({
          from: {
            email: settings.mailersend.fromEmail,
            name: settings.mailersend.fromName,
          },
          to: [
            {
              email: to,
            },
          ],
          subject: "CertiGen Email Test",
          text: "This is a test email from CertiGen to verify your MailerSend configuration.",
          html: "<b>This is a test email from CertiGen to verify your MailerSend configuration.</b>",
        }),
      });

      if (response.ok) {
        success = true;
      } else {
        const errData = await response.json();
        errorMsg = errData.message || "MailerSend API error";
      }
    } else if (provider === "brevo") {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": settings.brevo.apiKey,
        },
        body: JSON.stringify({
          sender: {
            name: settings.brevo.fromName,
            email: settings.brevo.fromEmail,
          },
          to: [
            {
              email: to,
            },
          ],
          subject: "CertiGen Email Test",
          textContent: "This is a test email from CertiGen to verify your Brevo configuration.",
          htmlContent: "<b>This is a test email from CertiGen to verify your Brevo configuration.</b>",
        }),
      });

      if (response.ok) {
        success = true;
      } else {
        const errData = await response.json();
        errorMsg = errData.message || "Brevo API error";
      }
    }

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
