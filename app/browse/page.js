"use client";

import { useEffect, useState } from "react";

export default function BrowsePage() {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryInput, setCategoryInput] = useState("");

  useEffect(() => {
    load();
    loadCategories();
  }, []);

  function load(searchTerm = search, category = activeCategory) {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (category) params.set("category", category);
    const url = `/api/questions${params.toString() ? `?${params}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.questions || []);
        setLoading(false);
      });
  }

  function loadCategories() {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []));
  }

  function handleSearch(e) {
    e.preventDefault();
    load(search, activeCategory);
  }

  function selectCategory(cat) {
    const next = cat === activeCategory ? "" : cat;
    setActiveCategory(next);
    load(search, next);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this question? This can't be undone.")) return;
    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  }

  function startEditCategory(q) {
    setEditingCategoryId(q.id);
    setCategoryInput(q.category || "");
  }

  async function saveCategory(id) {
    const res = await fetch(`/api/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: categoryInput || null }),
    });
    if (res.ok) {
      setQuestions((qs) =>
        qs.map((q) => (q.id === id ? { ...q, category: categoryInput || null } : q))
      );
      loadCategories();
    }
    setEditingCategoryId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-ink">Browse the bank</h1>
        <p className="font-mono text-xs uppercase tracking-wider text-ink/50">
          {questions.length} question{questions.length === 1 ? "" : "s"}
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-5 flex gap-3">
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

      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map(({ category, count }) => (
            <button
              key={category}
              onClick={() => selectCategory(category)}
              className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-card border transition-colors ${
                activeCategory === category
                  ? "bg-rule text-paper border-rule"
                  : "border-ink/15 text-ink/70 hover:border-rule"
              }`}
            >
              {category} <span className="opacity-60">({count})</span>
            </button>
          ))}
        </div>
      )}

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
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-rule">
                    {q.category || "Uncategorized"}
                  </span>
                  <p className="text-ink mt-1">{q.question}</p>
                </div>
                <span className="font-mono text-xs text-ink/40 shrink-0">
                  #{q.id}
                </span>
              </button>

              {openId === q.id && (
                <div className="mt-4 pt-4 border-t border-ink/10 space-y-3 text-sm">
                  <ul className="grid gap-1">
                    {["A", "B", "C", "D", "E"]
                      .filter((letter) => letter !== "E" || q.choice_e)
                      .map((letter) => (
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

                  <div className="flex items-center gap-2 pt-2">
                    <span className="font-mono text-xs uppercase text-ink/50">
                      Category:
                    </span>
                    {editingCategoryId === q.id ? (
                      <>
                        <input
                          type="text"
                          value={categoryInput}
                          onChange={(e) => setCategoryInput(e.target.value)}
                          className="border border-ink/15 rounded-card px-2 py-1 text-sm bg-card focus:outline-none focus:border-rule"
                          placeholder="e.g. FAM905"
                        />
                        <button
                          onClick={() => saveCategory(q.id)}
                          className="font-mono text-xs uppercase text-correct hover:underline"
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditCategory(q)}
                        className="font-mono text-xs uppercase text-rule hover:underline"
                      >
                        {q.category || "Uncategorized"} (edit)
                      </button>
                    )}
                  </div>

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
