const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/explain — explain a clause in plain language
router.post("/", async (req, res) => {
  const { clause_text, full_contract } = req.body;

  if (!clause_text) {
    return res.status(400).json({ error: "clause_text is required" });
  }

  const prompt = `You are a legal-language simplifier for a Canadian peer-to-peer agreement app called Handshake.

Your job is to help everyday people understand legal text. You are NOT providing legal advice.

Given the following clause from a legal agreement, provide a response in exactly this JSON format:
{
  "plain_summary": "A clear explanation of what this clause means, written at an 8th-grade reading level. Use short sentences. Avoid jargon.",
  "risks": ["List any potential risks or downsides for the person signing this agreement. Be specific and practical."],
  "ambiguities": ["List anything that is vague, unclear, or could be interpreted in multiple ways."],
  "disclaimer": "This explanation is for informational purposes only and does not constitute legal advice. For complex matters, consult a licensed legal professional in your province."
}

${full_contract ? `FULL CONTRACT CONTEXT:\n${full_contract}\n\n` : ""}CLAUSE TO EXPLAIN:
${clause_text}

Respond ONLY with valid JSON. No markdown, no code fences.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON response
    let parsed;
    try {
      // Strip markdown code fences if present
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        plain_summary: text,
        risks: [],
        ambiguities: [],
        disclaimer:
          "This explanation is for informational purposes only and does not constitute legal advice.",
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error("Gemini explain error:", err.message);
    res.status(500).json({ error: "Failed to generate explanation" });
  }
});

module.exports = router;
