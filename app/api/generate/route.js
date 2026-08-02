import { NextResponse } from "next/server";

// POST /api/generate
// Body: { question, choice_a, choice_b, choice_c, choice_d, correct_answer, rationale }
// Returns: { why_wrong, memory_aid }
export async function POST(request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "ANTHROPIC_API_KEY is not set on the server. Add it in Vercel > Settings > Environment Variables, or fill these fields in manually.",
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
      correct_answer,
      rationale,
    } = body;

    const prompt = `You are helping build a study question bank. Given this question, its choices, the correct answer, and the rationale, produce two things:

1. "why_wrong": a short, simple explanation (as if to a five-year-old) of why EACH of the three incorrect choices is wrong. Label each by its letter. Keep it plain and concrete, no jargon.
2. "memory_aid": one short, memorable mnemonic, phrase, or trick to help remember the correct answer.

Question: ${question}
A) ${choice_a}
B) ${choice_b}
C) ${choice_c}
D) ${choice_d}
Correct answer: ${correct_answer}
Rationale: ${rationale}

Respond ONLY with valid JSON, no other text, in exactly this shape:
{"why_wrong": "...", "memory_aid": "..."}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error: ${text}`);
    }

    const data = await response.json();
    const textBlock = data.content.find((c) => c.type === "text");
    const raw = textBlock ? textBlock.text : "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
