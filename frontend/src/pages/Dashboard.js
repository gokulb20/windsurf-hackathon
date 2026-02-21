import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchMyAgreements } from "../lib/api";
import {
  Handshake,
  Plus,
  LogOut,
  FileText,
  Clock,
  CheckCircle2,
  Eye,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, className: "status-pending" },
  viewed: { label: "Viewed", icon: Eye, className: "status-viewed" },
  otp_verified: { label: "Verified", icon: ShieldCheck, className: "status-verified" },
  signed: { label: "Signed", icon: CheckCircle2, className: "status-signed" },
  expired: { label: "Expired", icon: XCircle, className: "status-expired" },
  superseded: { label: "Superseded", icon: XCircle, className: "status-expired" },
};

export default function Dashboard() {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadAgreements();
  }, []);

  async function loadAgreements() {
    try {
      const data = await fetchMyAgreements();
      setAgreements(data.agreements || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="page-container">
      <header className="app-header">
        <div className="header-brand" onClick={() => navigate("/dashboard")}>
          <Handshake size={24} />
          <span>Handshake</span>
        </div>
        <div className="header-actions">
          <span className="header-email">{user?.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="section-header">
          <h2>My Agreements</h2>
          <button className="btn btn-primary" onClick={() => navigate("/create")}>
            <Plus size={18} /> New Agreement
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-state">Loading agreements...</div>
        ) : agreements.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} strokeWidth={1} />
            <h3>No agreements yet</h3>
            <p>Create your first legally binding agreement in seconds.</p>
            <button className="btn btn-primary" onClick={() => navigate("/create")}>
              <Plus size={18} /> Create Agreement
            </button>
          </div>
        ) : (
          <div className="agreements-list">
            {agreements.map((a) => {
              const statusCfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              return (
                <div
                  key={a.id}
                  className="agreement-card"
                  onClick={() => {
                    if (a.status === "signed") {
                      navigate(`/receipt/${a.id}`);
                    } else {
                      navigate(`/qr/${a.signer_token}`);
                    }
                  }}
                >
                  <div className="agreement-card-top">
                    <FileText size={20} />
                    <div className="agreement-card-info">
                      <h4>{a.title}</h4>
                      <span className="agreement-date">
                        {new Date(a.created_at).toLocaleDateString("en-CA")}
                      </span>
                    </div>
                    <div className={`status-badge ${statusCfg.className}`}>
                      <StatusIcon size={14} />
                      {statusCfg.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
