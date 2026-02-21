import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { fetchMyAgreements } from "../lib/api";
import { ArrowLeft, Copy, CheckCircle2, Clock, Share2 } from "lucide-react";

export default function QRDisplay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  // Try to get data from navigation state (just created)
  const stateData = location.state;
  const [agreement, setAgreement] = useState(stateData?.agreement || null);
  const [signerUrl, setSignerUrl] = useState(stateData?.signerUrl || "");
  const [loading, setLoading] = useState(!stateData);

  useEffect(() => {
    if (!stateData) {
      // Fetch agreement to get signer token
      fetchMyAgreements()
        .then((data) => {
          const found = (data.agreements || []).find(
            (a) => a.id === id || a.signer_token === id
          );
          if (found) {
            setAgreement(found);
            const url = `${window.location.origin}/sign/${found.signer_token}`;
            setSignerUrl(url);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id, stateData]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(signerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Handshake: ${agreement?.title || "Agreement"}`,
          text: "Please review and sign this agreement",
          url: signerUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} /> Dashboard
        </button>
        <h2>Share Agreement</h2>
      </header>

      <main className="main-content qr-content">
        <div className="qr-card">
          <div className="qr-status">
            <Clock size={16} />
            <span>Expires in 24 hours</span>
          </div>

          <h3>{agreement?.title || "Agreement"}</h3>

          <div className="qr-wrapper">
            {signerUrl ? (
              <QRCodeSVG
                value={signerUrl}
                size={280}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="M"
                includeMargin
              />
            ) : (
              <div className="qr-placeholder">QR Code unavailable</div>
            )}
          </div>

          <p className="qr-instruction">
            Ask the other party to scan this QR code with their phone camera.
            They don't need an account.
          </p>

          <div className="qr-actions">
            <button className="btn btn-outline btn-full" onClick={handleCopy}>
              {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button className="btn btn-primary btn-full" onClick={handleShare}>
              <Share2 size={18} /> Share
            </button>
          </div>
        </div>

        {agreement?.status === "signed" && (
          <div className="alert alert-success" style={{ marginTop: 16 }}>
            <CheckCircle2 size={16} />
            <span>This agreement has been signed!</span>
          </div>
        )}
      </main>
    </div>
  );
}
