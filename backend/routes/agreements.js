const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const supabase = require("../lib/supabase");
const { getTemplate, listTemplates } = require("../lib/templates");

// GET /api/agreements/templates — list available templates
router.get("/templates", (req, res) => {
  res.json({ templates: listTemplates() });
});

// POST /api/agreements — create a new agreement (requires auth)
router.post("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser(token);

  if (authErr || !user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  const { template_id, fields } = req.body;
  if (!template_id || !fields) {
    return res.status(400).json({ error: "template_id and fields are required" });
  }

  const template = getTemplate(template_id);
  if (!template) {
    return res.status(400).json({ error: `Unknown template: ${template_id}` });
  }

  // Validate required fields
  for (const f of template.fields) {
    if (f.required && (!fields[f.key] || String(fields[f.key]).trim() === "")) {
      return res.status(400).json({ error: `Field "${f.label}" is required` });
    }
  }

  const signerToken = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

  const contractText = template.generate({
    ...fields,
    _date: now.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });

  const { data: agreement, error: insertErr } = await supabase
    .from("agreements")
    .insert({
      creator_id: user.id,
      template_id,
      template_version: 1,
      title: template.title,
      field_data: fields,
      contract_text: contractText,
      signer_token: signerToken,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (insertErr) {
    console.error("Agreement insert error:", insertErr.message);
    return res.status(500).json({ error: "Failed to create agreement" });
  }

  // Log audit event
  await supabase.from("audit_trail").insert({
    agreement_id: agreement.id,
    event_type: "created",
    actor_email: user.email,
    metadata: { template_id },
  });

  // Generate QR code as data URL
  const signerUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/sign/${signerToken}`;
  const qrDataUrl = await QRCode.toDataURL(signerUrl, {
    width: 400,
    margin: 2,
    color: { dark: "#1e293b", light: "#ffffff" },
  });

  res.status(201).json({
    agreement: {
      id: agreement.id,
      title: agreement.title,
      template_id: agreement.template_id,
      status: agreement.status,
      expires_at: agreement.expires_at,
      created_at: agreement.created_at,
    },
    signer_url: signerUrl,
    qr_code: qrDataUrl,
  });
});

// GET /api/agreements — list creator's agreements (requires auth)
router.get("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser(token);

  if (authErr || !user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  const { data: agreements, error } = await supabase
    .from("agreements")
    .select("id, title, template_id, status, expires_at, signed_at, created_at, signer_token")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: "Failed to fetch agreements" });
  }

  res.json({ agreements });
});

// GET /api/agreements/sign/:token — public signer access (no auth needed)
router.get("/sign/:token", async (req, res) => {
  const { token } = req.params;

  const { data: agreement, error } = await supabase
    .from("agreements")
    .select("*")
    .eq("signer_token", token)
    .single();

  if (error || !agreement) {
    return res.status(404).json({ error: "Agreement not found or link is invalid" });
  }

  // Check expiry
  if (new Date(agreement.expires_at) < new Date()) {
    if (agreement.status === "pending" || agreement.status === "viewed") {
      await supabase
        .from("agreements")
        .update({ status: "expired" })
        .eq("id", agreement.id);
    }
    return res.status(410).json({ error: "This agreement link has expired" });
  }

  // If already signed, return read-only receipt view
  if (agreement.status === "signed") {
    const { data: sigEvent } = await supabase
      .from("signature_events")
      .select("*")
      .eq("agreement_id", agreement.id)
      .single();

    return res.json({
      agreement: {
        id: agreement.id,
        title: agreement.title,
        template_id: agreement.template_id,
        contract_text: agreement.contract_text,
        status: agreement.status,
        signed_at: agreement.signed_at,
        signer_legal_name: agreement.signer_legal_name,
        signer_email: agreement.signer_email,
      },
      receipt: sigEvent
        ? {
            hmac_signature: sigEvent.hmac_signature,
            signed_at: sigEvent.signed_at,
            signer_email: sigEvent.signer_email,
            signer_legal_name: sigEvent.signer_legal_name,
          }
        : null,
      read_only: true,
    });
  }

  // Mark as viewed if pending
  if (agreement.status === "pending") {
    await supabase
      .from("agreements")
      .update({ status: "viewed" })
      .eq("id", agreement.id);

    await supabase.from("audit_trail").insert({
      agreement_id: agreement.id,
      event_type: "viewed",
      metadata: {},
    });
  }

  res.json({
    agreement: {
      id: agreement.id,
      title: agreement.title,
      template_id: agreement.template_id,
      contract_text: agreement.contract_text,
      status: agreement.status === "pending" ? "viewed" : agreement.status,
      expires_at: agreement.expires_at,
    },
    read_only: false,
  });
});

module.exports = router;
