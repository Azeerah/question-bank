"use client";

import { useEffect, useState } from "react";

const empty = {
  question: "",
  choice_a: "",
  choice_b: "",
  choice_c: "",
  choice_d: "",
  choice_e: "",
  correct_answer: "A",
  rationale: "",
  why_wrong: "",
  memory_aid: "",
  category: "",
};

export default function AddPage() {
  const [form, setForm] = useState(empty);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories((data.categories || []).map((c) => c.category)));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleGenerate() {
    setError(null);
    if (!form.question || !form.rationale) {
      setError("Add the question, choices, and rationale first, then generate.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setForm((f) => ({
        ...f,
        why_wrong: data.why_wrong || f.why_wrong,
        memory_aid: data.memory_aid || f.memory_aid,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage(`Saved question #${data.question.id}.`);
      setForm(empty);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink dark:text-paper mb-2">Add a question</h1>
      <p className="text-ink/60 dark:text-paper/60 mb-8 max-w-xl">
        Fill in the question, choices, correct answer, and rationale &mdash;
        the same format you already use. Then generate the ELI5 wrong-answer
        explanation and memory aid, or write your own.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
        <Field label="Question">
          <textarea
            value={form.question}
            onChange={(e) => update("question", e.target.value)}
            rows={2}
            className="w-full border border-ink/15 dark:border-paper/20 rounded-card px-4 py-2 bg-card dark:bg-cardDark text-ink dark:text-paper focus:outline-none focus:border-rule"
            required
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          {["a", "b", "c", "d"].map((letter) => (
            <Field key={letter} label={`Choice ${letter.toUpperCase()}`}>
              <input
                type="text"
                value={form[`choice_${letter}`]}
                onChange={(e) => update(`choice_${letter}`, e.target.value)}
                className="w-full border border-ink/15 dark:border-paper/20 rounded-card px-4 py-2 bg-card dark:bg-cardDark text-ink dark:text-paper focus:outline-none focus:border-rule"
                required
              />
            </Field>
          ))}
          <Field label="Choice E (optional, if 5 choices)">
            <input
              type="text"
              value={form.choice_e}
              onChange={(e) => update("choice_e", e.target.value)}
              className="w-full border border-ink/15 dark:border-paper/20 rounded-card px-4 py-2 bg-card dark:bg-cardDark text-ink dark:text-paper focus:outline-none focus:border-rule"
            />
          </Field>
        </div>

        <Field label="Correct answer">
          <select
            value={form.correct_answer}
            onChange={(e) => update("correct_answer", e.target.value)}
            className="border border-ink/15 dark:border-paper/20 rounded-card px-4 py-2 bg-card dark:bg-cardDark text-ink dark:text-paper focus:outline-none focus:border-rule"
          >
            {["A", "B", "C", "D", "E"].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Rationale (why the correct answer is correct)">
          <textarea
            value={form.rationale}
            onChange={(e) => update("rationale", e.target.value)}
            rows={3}
            className="w-full border border-ink/15 dark:border-paper/20 rounded-card px-4 py-2 bg-card dark:bg-cardDark text-ink dark:text-paper focus:outline-none focus:border-rule"
            required
          />
        </Field>

        <Field label="Category (optional)">
          <input
            type="text"
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            list="category-options"
            placeholder="e.g. FAM905"
            className="w-full border border-ink/15 dark:border-paper/20 rounded-card px-4 py-2 bg-card dark:bg-cardDark text-ink dark:text-paper focus:outline-none focus:border-rule"
          />
          <datalist id="category-options">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <div className="border-t border-ink/10 dark:border-paper/15 pt-5">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="font-mono text-xs uppercase tracking-wider border border-rule text-rule px-5 py-2 rounded-card hover:bg-rule hover:text-paper transition-colors disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate wrong-answer explanation + memory aid"}
          </button>
        </div>

        <Field label="Why the wrong answers are wrong (ELI5)">
          <textarea
            value={form.why_wrong}
            onChange={(e) => update("why_wrong", e.target.value)}
            rows={3}
            className="w-full border border-ink/15 dark:border-paper/20 rounded-card px-4 py-2 bg-card dark:bg-cardDark text-ink dark:text-paper focus:outline-none focus:border-rule"
          />
        </Field>

        <Field label="Memory aid">
          <textarea
            value={form.memory_aid}
            onChange={(e) => update("memory_aid", e.target.value)}
            rows={2}
            className="w-full border border-ink/15 dark:border-paper/20 rounded-card px-4 py-2 bg-card dark:bg-cardDark text-ink dark:text-paper focus:outline-none focus:border-rule"
          />
        </Field>

        {error && <p className="text-incorrect text-sm">{error}</p>}
        {message && <p className="text-correct text-sm">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-ink dark:bg-paper text-paper dark:text-ink font-mono text-xs uppercase tracking-wider px-6 py-3 rounded-card hover:bg-rule dark:hover:bg-rule dark:hover:text-paper transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save question"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block font-mono text-xs uppercase tracking-wider text-ink/50 dark:text-paper/50 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
