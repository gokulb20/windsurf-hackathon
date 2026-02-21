import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchSignerAgreement,
  sendOtp as apiSendOtp,
  verifyOtp as apiVerifyOtp,
  signAgreement,
  explainClause,
} from "../lib/api";
import {
  FileText,
  Sparkles,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

export default function SignerView() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [agreement, setAgreement] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Step: "review" | "otp" | "sign" | "done"
  const [step, setStep] = useState("review");

  // OTP state
  const [signerEmail, setSignerEmail] = useState("");
  const [signerLegalName, setSignerLegalName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Explain state
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainResult, setExplainResult] = useState(null);
  const [explainVisible, setExplainVisible] = useState(false);
  const [selectedClause, setSelectedClause] = useState("");

  // Sign state
  const [signLoading, setSignLoading] = useState(false);
  const [signError, setSignError] = useState("");

  useEffect(() => {
    loadAgreement();
  }, [token]);

  async function loadAgreement() {
    try {
      const data = await fetchSignerAgreement(token);
      setAgreement(data.agreement);
      setReadOnly(data.read_only);
      setReceipt(data.receipt || null);

      if (data.read_only) {
        setStep("done");
      } else if (data.agreement.status === "otp_verified") {
        setOtpVerified(true);
        setStep("sign");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Split contract into numbered clauses for explain
  function getClauses() {
    if (!agreement?.contract_text) return [];
    const lines = agreement.contract_text.split("\n");
    const clauses = [];
    let current = "";
    for (const line of lines) {
      if (/^\d+\./.test(line.trim()) && current.trim()) {
        clauses.push(current.trim());
        current = line;
      } else {
        current += "\n" + line;
      }
    }
    if (current.trim()) clauses.push(current.trim());
    return clauses;
  }

  async function handleExplain(clause) {
    setSelectedClause(clause);
    setExplainVisible(true);
    setExplainLoading(true);
    setExplainResult(null);
    try {
      const result = await explainClause(clause, agreement.contract_text);
      setExplainResult(result);
    } catch (err) {
      setExplainResult({
        plain_summary: "Unable to generate explanation right now.",
        risks: [],
        ambiguities: [],
        disclaimer: err.message,
      });
    } finally {
      setExplainLoading(false);
    }
  }

  async function handleSendOtp() {
    if (!signerEmail || !signerLegalName) {
      setOtpError("Email and full legal name are required.");
      return;
    }
    setOtpError("");
    setOtpLoading(true);
    try {
      await apiSendOtp(signerEmail, agreement.id);
      setOtpSent(true);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError("Enter the 6-digit code from your email.");
      return;
    }
    setOtpError("");
    setOtpLoading(true);
    try {
      await apiVerifyOtp(signerEmail, agreement.id, otpCode);
      setOtpVerified(true);
      setStep("sign");
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleSign() {
    setSignError("");
    setSignLoading(true);
    try {
      const result = await signAgreement(
        agreement.id,
        token,
        signerLegalName,
        signerEmail
      );
      setReceipt(result.receipt);
      setStep("done");
    } catch (err) {
      setSignError(err.message);
    } finally {
      setSignLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-center">
        <div className="loading-state">
          <Loader2 size={32} className="spin" />
          <p>Loading agreement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-center">
        <div className="error-card">
          <AlertCircle size={40} />
          <h2>Unable to Load Agreement</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // SIGNED / READ-ONLY VIEW
  if (step === "done" && (readOnly || receipt)) {
    return (
      <div className="page-container signer-page">
        <header className="signer-header">
          <FileText size={20} />
          <span>Handshake</span>
        </header>
        <main className="main-content">
          <div className="signed-banner">
            <CheckCircle2 size={32} />
            <h2>Agreement Signed</h2>
            <p>This agreement was signed and is now legally binding.</p>
          </div>
          <div className="contract-card">
            <h3>{agreement.title}</h3>
            <pre className="contract-text">{agreement.contract_text}</pre>
          </div>
          {(receipt || agreement) && (
            <div className="receipt-card">
              <h4>Cryptographic Receipt</h4>
              <div className="receipt-row">
                <span>Signer</span>
                <strong>{receipt?.signer_legal_name || agreement.signer_legal_name}</strong>
              </div>
              <div className="receipt-row">
                <span>Email</span>
                <strong>{receipt?.signer_email || agreement.signer_email}</strong>
              </div>
              <div className="receipt-row">
                <span>Signed</span>
                <strong>
                  {new Date(receipt?.signed_at || agreement.signed_at).toLocaleString("en-CA")}
                </strong>
              </div>
              {receipt?.hmac_signature && (
                <div className="receipt-row receipt-sig">
                  <span>HMAC-SHA256</span>
                  <code>{receipt.hmac_signature}</code>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  const clauses = getClauses();

  return (
    <div className="page-container signer-page">
      <header className="signer-header">
        <FileText size={20} />
        <span>Handshake</span>
      </header>

      <main className="main-content">
        {/* Step indicator */}
        <div className="step-indicator">
          <div className={`step-dot ${step === "review" ? "active" : "done-dot"}`}>1</div>
          <div className="step-line" />
          <div className={`step-dot ${step === "otp" ? "active" : otpVerified ? "done-dot" : ""}`}>
            2
          </div>
          <div className="step-line" />
          <div className={`step-dot ${step === "sign" ? "active" : ""}`}>3</div>
        </div>

        {/* STEP 1: REVIEW */}
        {step === "review" && (
          <>
            <h2 className="section-title">{agreement.title}</h2>
            <p className="section-subtitle">
              Review the agreement below. Tap any clause to get a plain-language explanation.
            </p>

            <div className="contract-card">
              {clauses.map((clause, i) => (
                <div key={i} className="clause-block">
                  <pre className="clause-text">{clause}</pre>
                  <button
                    className="btn btn-explain"
                    onClick={() => handleExplain(clause)}
                  >
                    <Sparkles size={14} /> Explain
                  </button>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={() => setStep("otp")}
              style={{ marginTop: 16 }}
            >
              I've Reviewed — Continue to Verify
            </button>
          </>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === "otp" && (
          <div className="otp-section">
            <ShieldCheck size={32} className="section-icon" />
            <h2 className="section-title">Verify Your Identity</h2>
            <p className="section-subtitle">
              Enter your full legal name and email to receive a verification code.
            </p>

            {otpError && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                <span>{otpError}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="signer-name">Full Legal Name</label>
              <input
                id="signer-name"
                type="text"
                value={signerLegalName}
                onChange={(e) => setSignerLegalName(e.target.value)}
                placeholder="As it appears on your ID"
                disabled={otpSent}
              />
            </div>

            <div className="form-group">
              <label htmlFor="signer-email">
                <Mail size={14} /> Email Address
              </label>
              <input
                id="signer-email"
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={otpSent}
              />
            </div>

            {!otpSent ? (
              <button
                className="btn btn-primary btn-full"
                onClick={handleSendOtp}
                disabled={otpLoading}
              >
                {otpLoading ? (
                  <>
                    <Loader2 size={18} className="spin" /> Sending...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </button>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="otp-code">6-Digit Code</label>
                  <input
                    id="otp-code"
                    type="text"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    maxLength={6}
                    className="otp-input"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                  />
                </div>
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleVerifyOtp}
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <>
                      <Loader2 size={18} className="spin" /> Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </button>
              </>
            )}

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setStep("review")}
              style={{ marginTop: 8 }}
            >
              Back to Review
            </button>
          </div>
        )}

        {/* STEP 3: SIGN */}
        {step === "sign" && (
          <div className="sign-section">
            <CheckCircle2 size={32} className="section-icon text-green" />
            <h2 className="section-title">Agree & Sign</h2>
            <p className="section-subtitle">
              By tapping "Agree & Sign" below, you confirm that:
            </p>
            <ul className="sign-checklist">
              <li>You have reviewed the agreement in full</li>
              <li>Your legal name is <strong>{signerLegalName}</strong></li>
              <li>Your verified email is <strong>{signerEmail}</strong></li>
              <li>You consent to be legally bound by this agreement</li>
            </ul>

            {signError && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                <span>{signError}</span>
              </div>
            )}

            <button
              className="btn btn-primary btn-full btn-sign"
              onClick={handleSign}
              disabled={signLoading}
            >
              {signLoading ? (
                <>
                  <Loader2 size={18} className="spin" /> Signing...
                </>
              ) : (
                "Agree & Sign"
              )}
            </button>

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setStep("review")}
              style={{ marginTop: 8 }}
            >
              Back to Review
            </button>
          </div>
        )}
      </main>

      {/* Explain Modal */}
      {explainVisible && (
        <div className="modal-overlay" onClick={() => setExplainVisible(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Sparkles size={18} /> Plain-Language Explanation
              </h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setExplainVisible(false)}
              >
                <X size={18} />
              </button>
            </div>

            {explainLoading ? (
              <div className="modal-loading">
                <Loader2 size={24} className="spin" />
                <p>Analyzing clause...</p>
              </div>
            ) : explainResult ? (
              <div className="explain-content">
                <div className="explain-section">
                  <h4>
                    <Info size={14} /> What This Means
                  </h4>
                  <p>{explainResult.plain_summary}</p>
                </div>

                {explainResult.risks && explainResult.risks.length > 0 && (
                  <div className="explain-section explain-risks">
                    <h4>
                      <AlertTriangle size={14} /> Potential Risks
                    </h4>
                    <ul>
                      {explainResult.risks.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {explainResult.ambiguities && explainResult.ambiguities.length > 0 && (
                  <div className="explain-section explain-ambiguities">
                    <h4>
                      <AlertCircle size={14} /> Ambiguities
                    </h4>
                    <ul>
                      {explainResult.ambiguities.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {explainResult.disclaimer && (
                  <div className="explain-disclaimer">
                    {explainResult.disclaimer}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
