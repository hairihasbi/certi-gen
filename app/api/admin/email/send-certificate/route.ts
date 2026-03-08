import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { certificateId, recipientEmail } = await req.json();

    if (!certificateId || !recipientEmail) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch Email Settings
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("id", "email_config")
      .single();

    if (settingsError || !settingsData) {
      return NextResponse.json({ error: "Email configuration not found. Please configure email settings first." }, { status: 400 });
    }

    const settings = settingsData.value;
    const { provider } = settings;

    // 2. Fetch Certificate Data
    const { data: cert, error: certError } = await supabaseAdmin
      .from("certificates")
      .select("*, templates(name)")
      .eq("id", certificateId)
      .single();

    if (certError || !cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const subject = `Sertifikat Anda: ${cert.templates?.name || "CertiGen"}`;
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #1a1a1a;">Selamat!</h2>
        <p>Halo <b>${cert.recipient_data?.Name || cert.recipient_data?.name || "Peserta"}</b>,</p>
        <p>Sertifikat Anda untuk kegiatan <b>${cert.recipient_data?.event || "CertiGen"}</b> telah terbit.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${cert.image_url}" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Unduh Sertifikat</a>
        </div>
        <p style="font-size: 12px; color: #666;">Nomor Sertifikat: ${cert.certificate_number}</p>
        <p style="font-size: 12px; color: #666;">Digital Hash: ${cert.digital_hash}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 10px; color: #999; text-align: center;">Dikirim secara otomatis oleh CertiGen Pro.</p>
      </div>
    `;

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
        to: recipientEmail,
        subject,
        html: htmlContent,
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
          to: [{ email: recipientEmail }],
          subject,
          html: htmlContent,
        }),
      });
      if (response.ok) success = true;
      else errorMsg = "MailerSend API error";
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
          to: [{ email: recipientEmail }],
          subject,
          htmlContent,
        }),
      });
      if (response.ok) success = true;
      else errorMsg = "Brevo API error";
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
