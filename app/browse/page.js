"use client";

import { useEffect, useState } from "react";

export default function BrowsePage() {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  function load(searchTerm = "") {
    setLoading(true);
    const url = searchTerm
      ? `/api/questions?search=${encodeURIComponent(searchTerm)}`
      : "/api/questions";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.questions || []);
        setLoading(false);
      });
  }

  function handleSearch(e) {
    e.preventDefault();
    load(search);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this question? This can't be undone.")) return;
    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-ink">Browse the bank</h1>
        <p className="font-mono text-xs uppercase tracking-wider text-ink/50">
          {questions.length} question{questions.length === 1 ? "" : "s"}
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-8 flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search question text&hellip;"
          className="flex-1 border border-ink/15 rounded-card px-4 py-2 bg-card focus:outline-none focus:border-rule"
        />
        <button
          type="submit"
          className="bg-ink text-paper font-mono text-xs uppercase tracking-wider px-5 py-2 rounded-card hover:bg-rule transition-colors"
        >
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-ink/60">Loading&hellip;</p>
      ) : questions.length === 0 ? (
        <p className="text-ink/60">No questions found.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div
              key={q.id}
              className="bg-card border border-ink/10 rounded-card p-5"
            >
              <button
                onClick={() => setOpenId(openId === q.id ? null : q.id)}
                className="w-full text-left flex items-start justify-between gap-4"
              >
                <span className="text-ink">{q.question}</span>
                <span className="font-mono text-xs text-ink/40 shrink-0">
                  #{q.id}
                </span>
              </button>

              {openId === q.id && (
                <div className="mt-4 pt-4 border-t border-ink/10 space-y-3 text-sm">
                  <ul className="grid gap-1">
                    {["A", "B", "C", "D"].map((letter) => (
                      <li
                        key={letter}
                        className={
                          letter === q.correct_answer
                            ? "text-correct font-medium"
                            : "text-ink/70"
                        }
                      >
                        {letter}) {q[`choice_${letter.toLowerCase()}`]}
                        {letter === q.correct_answer ? "  ✓" : ""}
                      </li>
                    ))}
                  </ul>
                  <p>
                    <span className="font-mono text-xs uppercase text-ink/50">
                      Rationale:{" "}
                    </span>
                    {q.rationale}
                  </p>
                  {q.why_wrong && (
                    <p>
                      <span className="font-mono text-xs uppercase text-ink/50">
                        Why others are wrong:{" "}
                      </span>
                      {q.why_wrong}
                    </p>
                  )}
                  {q.memory_aid && (
                    <p>
                      <span className="font-mono text-xs uppercase text-ink/50">
                        Memory aid:{" "}
                      </span>
                      {q.memory_aid}
                    </p>
                  )}
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="font-mono text-xs uppercase tracking-wider text-incorrect hover:underline mt-2"
                  >
                    Delete question
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
