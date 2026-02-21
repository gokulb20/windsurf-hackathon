const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");
const { verifyReceipt } = require("../lib/hmac");

// POST /api/receipts/verify — verify a cryptographic receipt
router.post("/verify", async (req, res) => {
  const { agreement_id, hmac_signature } = req.body;

  if (!agreement_id || !hmac_signature) {
    return res.status(400).json({ error: "agreement_id and hmac_signature are required" });
  }

  // Fetch signature event
  const { data: sigEvent, error } = await supabase
    .from("signature_events")
    .select("*")
    .eq("agreement_id", agreement_id)
    .single();

  if (error || !sigEvent) {
    return res.status(404).json({ error: "No signature record found for this agreement" });
  }

  // Rebuild receipt fields from stored data
  const receiptFields = {
    agreement_id: sigEvent.agreement_id,
    contract_text: sigEvent.contract_text,
    creator_email: sigEvent.creator_email,
    signer_email: sigEvent.signer_email,
    signer_legal_name: sigEvent.signer_legal_name,
    signed_at: sigEvent.signed_at,
    template_id: sigEvent.template_id,
    template_version: String(sigEvent.template_version),
  };

  try {
    const isValid = verifyReceipt(receiptFields, hmac_signature);

    res.json({
      valid: isValid,
      agreement_id: sigEvent.agreement_id,
      signer_email: sigEvent.signer_email,
      signer_legal_name: sigEvent.signer_legal_name,
      signed_at: sigEvent.signed_at,
      message: isValid
        ? "This receipt is authentic and the agreement has not been tampered with."
        : "WARNING: This receipt does not match. The agreement may have been altered.",
    });
  } catch (err) {
    res.json({
      valid: false,
      message: "Verification failed — signature format is invalid.",
    });
  }
});

// GET /api/receipts/:agreementId — get receipt for an agreement
router.get("/:agreementId", async (req, res) => {
  const { agreementId } = req.params;

  const { data: sigEvent, error } = await supabase
    .from("signature_events")
    .select("agreement_id, signer_email, signer_legal_name, creator_email, hmac_signature, signed_at, template_id, template_version")
    .eq("agreement_id", agreementId)
    .single();

  if (error || !sigEvent) {
    return res.status(404).json({ error: "No receipt found for this agreement" });
  }

  const { data: agreement } = await supabase
    .from("agreements")
    .select("title, contract_text")
    .eq("id", agreementId)
    .single();

  res.json({
    receipt: {
      ...sigEvent,
      title: agreement?.title || "Agreement",
      contract_text: agreement?.contract_text || "",
    },
  });
});

module.exports = router;
