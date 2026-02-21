require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const agreementRoutes = require("./routes/agreements");
const otpRoutes = require("./routes/otp");
const signRoutes = require("./routes/sign");
const explainRoutes = require("./routes/explain");
const receiptRoutes = require("./routes/receipts");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "1mb" }));

// Rate limiting for OTP endpoints
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many requests. Please try again later." },
});

// Routes
app.use("/api/agreements", agreementRoutes);
app.use("/api/otp", otpLimiter, otpRoutes);
app.use("/api/sign", signRoutes);
app.use("/api/explain", explainRoutes);
app.use("/api/receipts", receiptRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "handshake-api" });
});

app.listen(PORT, () => {
  console.log(`Handshake API running on http://localhost:${PORT}`);
});
