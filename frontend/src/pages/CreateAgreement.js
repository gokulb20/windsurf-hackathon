import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTemplates, createAgreement } from "../lib/api";
import {
  ArrowLeft,
  FileText,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function CreateAgreement() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates()
      .then((data) => setTemplates(data.templates || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectTemplate = (t) => {
    setSelectedTemplate(t);
    const initial = {};
    t.fields.forEach((f) => (initial[f.key] = ""));
    setFields(initial);
    setError("");
  };

  const handleFieldChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = await createAgreement(selectedTemplate.id, fields);
      navigate(`/qr/${data.agreement.id}`, {
        state: {
          qrCode: data.qr_code,
          signerUrl: data.signer_url,
          agreement: data.agreement,
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading templates...</div>
      </div>
    );
  }

  // Template selection screen
  if (!selectedTemplate) {
    return (
      <div className="page-container">
        <header className="page-header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={18} /> Back
          </button>
          <h2>Choose a Template</h2>
        </header>

        <main className="main-content">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="template-grid">
            {templates.map((t) => (
              <button
                key={t.id}
                className="template-card"
                onClick={() => handleSelectTemplate(t)}
              >
                <FileText size={28} />
                <h3>{t.title}</h3>
                <p>{t.description}</p>
                <ChevronRight size={18} className="template-card-arrow" />
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Form screen for selected template
  return (
    <div className="page-container">
      <header className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTemplate(null)}>
          <ArrowLeft size={18} /> Back
        </button>
        <h2>{selectedTemplate.title}</h2>
      </header>

      <main className="main-content">
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="agreement-form">
          {selectedTemplate.fields.map((f) => (
            <div key={f.key} className="form-group">
              <label htmlFor={f.key}>
                {f.label}
                {f.required && <span className="required">*</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  id={f.key}
                  value={fields[f.key] || ""}
                  onChange={(e) => handleFieldChange(f.key, e.target.value)}
                  required={f.required}
                  rows={3}
                  placeholder={`Enter ${f.label.toLowerCase()}`}
                />
              ) : (
                <input
                  id={f.key}
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  value={fields[f.key] || ""}
                  onChange={(e) => handleFieldChange(f.key, e.target.value)}
                  required={f.required}
                  step={f.type === "number" ? "0.01" : undefined}
                  placeholder={`Enter ${f.label.toLowerCase()}`}
                />
              )}
            </div>
          ))}

          <div className="form-disclaimer">
            This document is generated for informational purposes and does not constitute
            legal advice. For complex transactions, consult a licensed legal professional.
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={18} className="spin" /> Generating...
              </>
            ) : (
              "Generate Agreement"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
