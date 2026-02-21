const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");
const { signReceipt } = require("../lib/hmac");

// POST /api/sign — sign an agreement
router.post("/", async (req, res) => {
  const { agreement_id, signer_token, signer_legal_name, signer_email } = req.body;

  if (!agreement_id || !signer_token || !signer_legal_name || !signer_email) {
    return res.status(400).json({
      error: "agreement_id, signer_token, signer_legal_name, and signer_email are required",
    });
  }

  // Fetch agreement
  const { data: agreement, error: fetchErr } = await supabase
    .from("agreements")
    .select("*")
    .eq("id", agreement_id)
    .eq("signer_token", signer_token)
    .single();

  if (fetchErr || !agreement) {
    return res.status(404).json({ error: "Agreement not found" });
  }

  // Validate state
  if (agreement.status === "signed") {
    return res.status(400).json({ error: "This agreement has already been signed" });
  }

  if (agreement.status === "expired") {
    return res.status(410).json({ error: "This agreement link has expired" });
  }

  if (agreement.status !== "otp_verified") {
    return res.status(400).json({ error: "Email verification is required before signing" });
  }

  // Check expiry
  if (new Date(agreement.expires_at) < new Date()) {
    await supabase.from("agreements").update({ status: "expired" }).eq("id", agreement.id);
    return res.status(410).json({ error: "This agreement link has expired" });
  }

  // Verify signer email matches OTP-verified email
  if (agreement.signer_email !== signer_email) {
    return res.status(400).json({ error: "Signer email does not match verified email" });
  }

  // Fetch creator email
  const { data: creatorData } = await supabase.auth.admin.getUserById(agreement.creator_id);
  const creatorEmail = creatorData?.user?.email || "unknown";

  // Build receipt payload and sign
  const signedAt = new Date().toISOString();
  const receiptFields = {
    agreement_id: agreement.id,
    contract_text: agreement.contract_text,
    creator_email: creatorEmail,
    signer_email: signer_email,
    signer_legal_name: signer_legal_name,
    signed_at: signedAt,
    template_id: agreement.template_id,
    template_version: String(agreement.template_version),
  };

  const { signature, canonical } = signReceipt(receiptFields);

  // Insert signature event (immutable)
  const { error: sigErr } = await supabase.from("signature_events").insert({
    agreement_id: agreement.id,
    signer_email,
    signer_legal_name,
    creator_email: creatorEmail,
    contract_text: agreement.contract_text,
    template_id: agreement.template_id,
    template_version: agreement.template_version,
    canonical_payload: canonical,
    hmac_signature: signature,
    signed_at: signedAt,
  });

  if (sigErr) {
    console.error("Signature event insert error:", sigErr.message);
    return res.status(500).json({ error: "Failed to record signature" });
  }

  // Update agreement
  await supabase
    .from("agreements")
    .update({
      status: "signed",
      signed_at: signedAt,
      signer_legal_name,
      signer_email,
    })
    .eq("id", agreement.id);

  // Audit
  await supabase.from("audit_trail").insert({
    agreement_id: agreement.id,
    event_type: "signed",
    actor_email: signer_email,
    metadata: { signer_legal_name },
  });

  res.json({
    success: true,
    receipt: {
      agreement_id: agreement.id,
      title: agreement.title,
      hmac_signature: signature,
      signed_at: signedAt,
      signer_email,
      signer_legal_name,
      creator_email: creatorEmail,
    },
  });
});

module.exports = router;
