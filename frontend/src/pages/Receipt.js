import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchReceipt, verifyReceipt as apiVerifyReceipt } from "../lib/api";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Copy,
  FileText,
} from "lucide-react";

export default function Receipt() {
  const { agreementId } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReceipt(agreementId)
      .then((data) => setReceipt(data.receipt))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [agreementId]);

  async function handleVerify() {
    if (!receipt) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await apiVerifyReceipt(agreementId, receipt.hmac_signature);
      setVerifyResult(result);
    } catch (err) {
      setVerifyResult({ valid: false, message: err.message });
    } finally {
      setVerifying(false);
    }
  }

  async function handleCopySignature() {
    if (!receipt?.hmac_signature) return;
    try {
      await navigator.clipboard.writeText(receipt.hmac_signature);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  if (loading) {
    return (
      <div className="page-center">
        <div className="loading-state">
          <Loader2 size={32} className="spin" />
          <p>Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <header className="page-header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={18} /> Dashboard
          </button>
        </header>
        <main className="main-content">
          <div className="error-card">
            <AlertCircle size={40} />
            <h2>Receipt Not Found</h2>
            <p>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} /> Dashboard
        </button>
        <h2>Receipt</h2>
      </header>

      <main className="main-content">
        <div className="signed-banner">
          <CheckCircle2 size={32} />
          <h2>{receipt.title}</h2>
          <p>This agreement has been signed and is cryptographically secured.</p>
        </div>

        <div className="receipt-card">
          <h4>
            <FileText size={16} /> Agreement Details
          </h4>
          <div className="receipt-row">
            <span>Signer</span>
            <strong>{receipt.signer_legal_name}</strong>
          </div>
          <div className="receipt-row">
            <span>Signer Email</span>
            <strong>{receipt.signer_email}</strong>
          </div>
          <div className="receipt-row">
            <span>Creator Email</span>
            <strong>{receipt.creator_email}</strong>
          </div>
          <div className="receipt-row">
            <span>Signed At</span>
            <strong>{new Date(receipt.signed_at).toLocaleString("en-CA")}</strong>
          </div>
          <div className="receipt-row">
            <span>Template</span>
            <strong>{receipt.template_id} (v{receipt.template_version})</strong>
          </div>
        </div>

        <div className="receipt-card">
          <h4>
            <ShieldCheck size={16} /> Cryptographic Proof
          </h4>
          <div className="receipt-row receipt-sig">
            <span>HMAC-SHA256</span>
            <div className="sig-value">
              <code>{receipt.hmac_signature}</code>
              <button className="btn btn-ghost btn-sm" onClick={handleCopySignature}>
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <button
            className="btn btn-outline btn-full"
            onClick={handleVerify}
            disabled={verifying}
            style={{ marginTop: 12 }}
          >
            {verifying ? (
              <>
                <Loader2 size={18} className="spin" /> Verifying...
              </>
            ) : (
              <>
                <ShieldCheck size={18} /> Verify Integrity
              </>
            )}
          </button>

          {verifyResult && (
            <div
              className={`alert ${verifyResult.valid ? "alert-success" : "alert-error"}`}
              style={{ marginTop: 12 }}
            >
              {verifyResult.valid ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span>{verifyResult.message}</span>
            </div>
          )}
        </div>

        {receipt.contract_text && (
          <div className="contract-card" style={{ marginTop: 16 }}>
            <h4>Full Agreement Text</h4>
            <pre className="contract-text">{receipt.contract_text}</pre>
          </div>
        )}
      </main>
    </div>
  );
}
