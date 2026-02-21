import { supabase } from "./supabase";

const API_BASE = "/api";

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// Agreements
export async function fetchTemplates() {
  return apiRequest("/agreements/templates");
}

export async function createAgreement(templateId, fields) {
  const authHeaders = await getAuthHeaders();
  return apiRequest("/agreements", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ template_id: templateId, fields }),
  });
}

export async function fetchMyAgreements() {
  const authHeaders = await getAuthHeaders();
  return apiRequest("/agreements", { headers: authHeaders });
}

export async function fetchSignerAgreement(token) {
  return apiRequest(`/agreements/sign/${token}`);
}

// OTP
export async function sendOtp(email, agreementId) {
  return apiRequest("/otp/send", {
    method: "POST",
    body: JSON.stringify({ email, agreement_id: agreementId }),
  });
}

export async function verifyOtp(email, agreementId, otp) {
  return apiRequest("/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, agreement_id: agreementId, otp }),
  });
}

// Sign
export async function signAgreement(agreementId, signerToken, signerLegalName, signerEmail) {
  return apiRequest("/sign", {
    method: "POST",
    body: JSON.stringify({
      agreement_id: agreementId,
      signer_token: signerToken,
      signer_legal_name: signerLegalName,
      signer_email: signerEmail,
    }),
  });
}

// Explain
export async function explainClause(clauseText, fullContract) {
  return apiRequest("/explain", {
    method: "POST",
    body: JSON.stringify({ clause_text: clauseText, full_contract: fullContract }),
  });
}

// Receipts
export async function fetchReceipt(agreementId) {
  return apiRequest(`/receipts/${agreementId}`);
}

export async function verifyReceipt(agreementId, hmacSignature) {
  return apiRequest("/receipts/verify", {
    method: "POST",
    body: JSON.stringify({ agreement_id: agreementId, hmac_signature: hmacSignature }),
  });
}
