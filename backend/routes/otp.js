const express = require("express");
const router = express.Router();
const { sendOtp, verifyOtp } = require("../lib/otp");
const supabase = require("../lib/supabase");

// POST /api/otp/send — send OTP to signer email
router.post("/send", async (req, res) => {
  const { email, agreement_id } = req.body;

  if (!email || !agreement_id) {
    return res.status(400).json({ error: "email and agreement_id are required" });
  }

  // Validate agreement exists and is not already signed
  const { data: agreement, error } = await supabase
    .from("agreements")
    .select("id, status")
    .eq("id", agreement_id)
    .single();

  if (error || !agreement) {
    return res.status(404).json({ error: "Agreement not found" });
  }

  if (agreement.status === "signed") {
    return res.status(400).json({ error: "This agreement has already been signed" });
  }

  if (agreement.status === "expired") {
    return res.status(410).json({ error: "This agreement link has expired" });
  }

  const result = await sendOtp(email, agreement_id);
  if (result.error) {
    return res.status(429).json({ error: result.error });
  }

  // Audit
  await supabase.from("audit_trail").insert({
    agreement_id,
    event_type: "otp_sent",
    actor_email: email,
    metadata: {},
  });

  res.json({ success: true, message: "Verification code sent to your email" });
});

// POST /api/otp/verify — verify OTP
router.post("/verify", async (req, res) => {
  const { email, agreement_id, otp } = req.body;

  if (!email || !agreement_id || !otp) {
    return res.status(400).json({ error: "email, agreement_id, and otp are required" });
  }

  const result = await verifyOtp(email, agreement_id, otp);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  // Update agreement status
  await supabase
    .from("agreements")
    .update({ status: "otp_verified", signer_email: email })
    .eq("id", agreement_id);

  // Audit
  await supabase.from("audit_trail").insert({
    agreement_id,
    event_type: "otp_verified",
    actor_email: email,
    metadata: {},
  });

  res.json({ success: true, message: "Email verified successfully" });
});

module.exports = router;
