Handshake MVP Implementation Plan
This plan pivots the current React + Node/Express chat starter into a mobile-first Handshake MVP for legally oriented P2P agreements with Supabase auth/storage, QR signer access, Gemini explainability, OTP verification, and tamper-evident cryptographic receipts.

Confirmed Product Decisions
Scope: only core Handshake flow (Create → Scan/Understand → Sign/Secure), skip extras for now.
Templates (MVP): Bill of Sale, Roommate Agreement, and Proof of Payment.
Creator authentication: required via Supabase Auth.
Primary jurisdiction: Canada-first.
Legal notice: include explicit non-legal-advice disclaimer.
Signature method: typed legal name consent + email OTP.
Persistence: Supabase.
Agreement mutability: immutable once signed, with versioned supersession support.
Retention: 12 months.
OTP provider/controls: SendGrid, 6 digits, 10-minute expiry, max 5 attempts, 60s resend cooldown.
Signer identity: verified email + full legal name confirmation.
QR/session rules: 24h link expiry pre-sign, single-use signing link, read-only receipt view post-sign.
Explain feature: Gemini preferred, on-demand generation, 8th-grade reading target, include plain summary + risks + ambiguities.
Receipt cryptography: A256 interpreted as HMAC-SHA256 (confirmed).
Receipt payload: include agreement canonical text, signer identity, creator identity, timestamp, agreement id, template version.
Add verification endpoint for cryptographic receipts.
Security/privacy baseline: OTP hashing at rest + PII-safe logging.
Product UI: fully replace existing chat UI with legal/trust-oriented mobile-first interface.
Delivery mode: vertical slice first, then tests after each completed feature.
Repository Snapshot (Current)
Frontend: React single-page chat interface.
Backend: Express API with Gemini chat route.
No existing contract/template/QR/OTP/signing/receipt modules.
Execution Plan (Post-Approval)
Architecture & Supabase Foundation
Configure Supabase client(s), environment variables, and auth integration.
Define schema + RLS strategy for templates, agreements, signer sessions, OTP events, signatures, receipts, and versions.
Agreement Authoring (Creator App Flow)
Replace chat UI with mobile-first Handshake creator experience.
Implement template-driven agreement creation, field validation, and agreement version initialization.
QR Access + Public Signer Review
Generate signer URL token + QR code.
Build no-account signer web view with 24h access window and single-use signing enforcement.
Gemini “✨ Explain” Layer
Add clause-level explain endpoint and UI action.
Return 8th-grade explanation + risks + ambiguities with legal-advice disclaimer.
Email OTP Verification (SendGrid)
Implement OTP send/verify APIs with hashing, expiry, attempt caps, cooldown, and abuse controls.
Bind verified identity (email + legal name) to signer session.
Signing Pipeline + Receipt Generation
Implement typed-name consent checkpoint.
Canonicalize agreement content and generate HMAC receipt at sign time.
Persist immutable signed artifact + metadata and expose read-only receipt view.
Receipt Verification + Versioning Rules
Add receipt verification endpoint.
Enforce post-sign immutability and supersede-by-new-version model.
Hardening + Tests (Feature-by-Feature)
Add integration tests for each completed feature path.
Validate auditability, error handling, and mobile usability (iPhone-first viewport target).
Final Clarifications Before Implementation
All required implementation clarifications are confirmed and this plan is ready for execution.