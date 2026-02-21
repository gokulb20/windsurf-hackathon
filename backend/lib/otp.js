const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");
const supabase = require("./supabase");

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_COOLDOWN_MS = 60 * 1000; // 60 seconds

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * Send an OTP to the given email for a specific agreement signer session.
 */
async function sendOtp(email, agreementId) {
  // Check cooldown
  const { data: recent } = await supabase
    .from("otp_events")
    .select("created_at")
    .eq("email", email)
    .eq("agreement_id", agreementId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (recent && recent.length > 0) {
    const lastSent = new Date(recent[0].created_at).getTime();
    if (Date.now() - lastSent < OTP_COOLDOWN_MS) {
      const waitSec = Math.ceil(
        (OTP_COOLDOWN_MS - (Date.now() - lastSent)) / 1000
      );
      return { error: `Please wait ${waitSec}s before requesting a new code.` };
    }
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();

  const { error: insertErr } = await supabase.from("otp_events").insert({
    email,
    agreement_id: agreementId,
    otp_hash: otpHash,
    expires_at: expiresAt,
    attempts: 0,
    verified: false,
  });

  if (insertErr) {
    console.error("OTP insert error:", insertErr.message);
    return { error: "Failed to create verification code." };
  }

  // Send email via SendGrid
  try {
    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@handshake.app",
      subject: "Your Handshake Verification Code",
      text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
      html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px;">
        <h2 style="color:#1e293b;">Handshake Verification</h2>
        <p>Your verification code is:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#1e40af;padding:16px 0;">${otp}</div>
        <p style="color:#64748b;font-size:14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>`,
    });
  } catch (emailErr) {
    console.error("SendGrid error:", emailErr.message);
    return { error: "Failed to send verification email." };
  }

  return { success: true };
}

/**
 * Verify an OTP for the given email and agreement.
 */
async function verifyOtp(email, agreementId, otpInput) {
  const { data: rows, error: fetchErr } = await supabase
    .from("otp_events")
    .select("*")
    .eq("email", email)
    .eq("agreement_id", agreementId)
    .eq("verified", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (fetchErr || !rows || rows.length === 0) {
    return { error: "No pending verification found. Request a new code." };
  }

  const record = rows[0];

  if (new Date(record.expires_at) < new Date()) {
    return { error: "Verification code has expired. Request a new one." };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { error: "Too many failed attempts. Request a new code." };
  }

  // Increment attempts
  await supabase
    .from("otp_events")
    .update({ attempts: record.attempts + 1 })
    .eq("id", record.id);

  const inputHash = hashOtp(otpInput);
  if (inputHash !== record.otp_hash) {
    const remaining = OTP_MAX_ATTEMPTS - (record.attempts + 1);
    return {
      error: `Invalid code. ${remaining} attempt(s) remaining.`,
    };
  }

  // Mark verified
  await supabase
    .from("otp_events")
    .update({ verified: true })
    .eq("id", record.id);

  return { success: true };
}

module.exports = { sendOtp, verifyOtp };
