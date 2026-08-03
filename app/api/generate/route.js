import { NextResponse } from "next/server";

// POST /api/generate
// Body: { question, choice_a, choice_b, choice_c, choice_d, correct_answer, rationale }
// Returns: { why_wrong, memory_aid }
//
// Uses Google's Gemini API (free tier — see https://ai.google.dev/gemini-api/docs/pricing
// for which model IDs are currently free; gemini-2.5-flash was free as of mid-2026).
export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not set on the server. Add it in Vercel > Settings > Environment Variables, or fill these fields in manually.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      question,
      choice_a,
      choice_b,
      choice_c,
      choice_d,
      choice_e,
      correct_answer,
      rationale,
    } = body;

    const choiceLines = [
      `A) ${choice_a}`,
      `B) ${choice_b}`,
      `C) ${choice_c}`,
      `D) ${choice_d}`,
      choice_e ? `E) ${choice_e}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `You are helping build a study question bank. Given this question, its choices, the correct answer, and the rationale, produce two things:

1. "why_wrong": a short, simple explanation (as if to a five-year-old) of why EACH incorrect choice is wrong. Label each by its letter. Keep it plain and concrete, no jargon.
2. "memory_aid": one short, memorable mnemonic, phrase, or trick to help remember the correct answer.

Question: ${question}
${choiceLines}
Correct answer: ${correct_answer}
Rationale: ${rationale}

Respond ONLY with valid JSON, no other text, in exactly this shape:
{"why_wrong": "...", "memory_aid": "..."}`;

    const model = "gemini-2.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini API error: ${text}`);
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
