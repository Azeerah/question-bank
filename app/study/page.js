"use client";

import { useEffect, useState } from "react";
import { weightedSample } from "../../lib/weights";

const COUNT_OPTIONS = [25, 50, 100, 150, 200];
const TIMER_OPTIONS = [
  { label: "No timer", seconds: null },
  { label: "30 sec / question", seconds: 30 },
  { label: "1 min / question", seconds: 60 },
];

export default function StudyPage() {
  const [stage, setStage] = useState("setup"); // "setup" | "quiz"
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]); // empty = all
  const [count, setCount] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(null);
  const [loadingCats, setLoadingCats] = useState(true);

  const [order, setOrder] = useState([]);
  const [pos, setPos] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [starting, setStarting] = useState(false);
  const [setupError, setSetupError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories || []);
        setLoadingCats(false);
      });
  }, []);

  // Reset the countdown whenever a new question is shown (or the quiz starts)
  useEffect(() => {
    if (stage === "quiz") {
      setTimeLeft(timerSeconds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, stage]);

  // Tick the countdown down once per second while a question is unanswered
  useEffect(() => {
    if (stage !== "quiz" || revealed || timerSeconds == null || timeLeft == null) return;
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, revealed, stage, timerSeconds]);

  function handleTimeUp() {
    if (revealed) return;
    setSelected(null);
    setRevealed(true);
    setScore((s) => ({ correct: s.correct, total: s.total + 1 }));
  }

  function toggleCategory(cat) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function toggleAll() {
    setSelectedCategories([]);
  }

  async function startQuiz() {
    setSetupError(null);
    setStarting(true);
    try {
      const activeCats =
        selectedCategories.length > 0
          ? selectedCategories
          : categories.map((c) => c.category);

      const byCategory = {};
      await Promise.all(
        activeCats.map(async (cat) => {
          const params = new URLSearchParams({ category: cat });
          const res = await fetch(`/api/questions?${params}`);
          const data = await res.json();
          byCategory[cat] = data.questions || [];
        })
      );

      const available = Object.values(byCategory).reduce((sum, arr) => sum + arr.length, 0);
      if (available === 0) {
        setSetupError("No questions found in the selected categories.");
        setStarting(false);
        return;
      }

      const picked = weightedSample(byCategory, Math.min(count, available));
      setOrder(picked);
      setPos(0);
      setSelected(null);
      setRevealed(false);
      setScore({ correct: 0, total: 0 });
      setStage("quiz");
    } catch (err) {
      setSetupError(err.message);
    } finally {
      setStarting(false);
    }
  }

  function choose(letter) {
    if (revealed) return;
    setSelected(letter);
    setRevealed(true);
    setScore((s) => ({
      correct: s.correct + (letter === order[pos].correct_answer ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function next() {
    setSelected(null);
    setRevealed(false);
    setPos((p) => p + 1);
  }

  if (stage === "setup") {
    return (
      <div>
        <h1 className="font-display text-3xl text-ink dark:text-paper mb-2">
          Set up your session
        </h1>
        <p className="text-ink/60 dark:text-paper/60 mb-8 max-w-xl">
          Choose how many questions and which categories &mdash; when you
          pick more than one category, questions are drawn proportionally
          to each course's real exam weight.
        </p>

        <p className="font-mono text-xs uppercase tracking-wider text-ink/50 dark:text-paper/50 mb-3">
          Number of questions
        </p>
        <div className="flex gap-2 mb-8 flex-wrap">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`font-mono text-sm px-4 py-2 rounded-card border transition-colors ${
                count === n
                  ? "bg-ink dark:bg-paper text-paper dark:text-ink border-ink dark:border-paper"
                  : "border-ink/15 dark:border-paper/20 text-ink/70 dark:text-paper/70 hover:border-rule"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <p className="font-mono text-xs uppercase tracking-wider text-ink/50 dark:text-paper/50 mb-3">
          Time per question
        </p>
        <div className="flex gap-2 mb-8 flex-wrap">
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setTimerSeconds(opt.seconds)}
              className={`font-mono text-sm px-4 py-2 rounded-card border transition-colors ${
                timerSeconds === opt.seconds
                  ? "bg-ink dark:bg-paper text-paper dark:text-ink border-ink dark:border-paper"
                  : "border-ink/15 dark:border-paper/20 text-ink/70 dark:text-paper/70 hover:border-rule"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p className="font-mono text-xs uppercase tracking-wider text-ink/50 dark:text-paper/50 mb-3">
          Categories
        </p>
        {loadingCats ? (
          <p className="text-ink/60 dark:text-paper/60">Loading&hellip;</p>
        ) : categories.length === 0 ? (
          <p className="text-ink/60 dark:text-paper/60">
            No questions yet.{" "}
            <a href="/add" className="text-rule underline">
              Add your first one.
            </a>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={toggleAll}
              className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-card border transition-colors ${
                selectedCategories.length === 0
                  ? "bg-rule text-paper border-rule"
                  : "border-ink/15 dark:border-paper/20 text-ink/70 dark:text-paper/70 hover:border-rule"
              }`}
            >
              All categories
            </button>
            {categories.map(({ category, count: catCount }) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-card border transition-colors ${
                  selectedCategories.includes(category)
                    ? "bg-rule text-paper border-rule"
                    : "border-ink/15 dark:border-paper/20 text-ink/70 dark:text-paper/70 hover:border-rule"
                }`}
              >
                {category} <span className="opacity-60">({catCount})</span>
              </button>
            ))}
          </div>
        )}

        {setupError && <p className="text-incorrect text-sm mb-4">{setupError}</p>}

        <button
          onClick={startQuiz}
          disabled={starting || categories.length === 0}
          className="bg-ink dark:bg-paper text-paper dark:text-ink font-mono text-xs uppercase tracking-wider px-6 py-3 rounded-card hover:bg-rule dark:hover:bg-rule dark:hover:text-paper transition-colors disabled:opacity-50"
        >
          {starting ? "Building session…" : "Start studying"}
        </button>
      </div>
    );
  }

  // stage === "quiz"
  if (pos >= order.length) {
    return (
      <div className="punch-edge bg-card dark:bg-cardDark border border-ink/10 dark:border-paper/15 rounded-card p-8 text-center">
        <h2 className="font-display text-2xl text-ink dark:text-paper mb-2">
          Session complete
        </h2>
        <p className="text-ink/70 dark:text-paper/70 mb-6">
          You scored {score.correct} out of {score.total}.
        </p>
        <button
          onClick={() => setStage("setup")}
          className="bg-ink dark:bg-paper text-paper dark:text-ink font-mono text-xs uppercase tracking-wider px-6 py-3 rounded-card hover:bg-rule dark:hover:bg-rule dark:hover:text-paper transition-colors"
        >
          New session
        </button>
      </div>
    );
  }

  const current = order[pos];
  const choices = [
    ["A", current.choice_a],
    ["B", current.choice_b],
    ["C", current.choice_c],
    ["D", current.choice_d],
  ];
  if (current.choice_e) choices.push(["E", current.choice_e]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setStage("setup")}
          className="font-mono text-xs uppercase tracking-wider text-ink/50 dark:text-paper/50 hover:text-rule"
        >
          &larr; End session
        </button>
        <p className="font-mono text-xs uppercase tracking-wider text-ink/50 dark:text-paper/50">
          Question {pos + 1} of {order.length}
        </p>
        {timerSeconds != null && !revealed && (
          <p
            className={`font-mono text-xs uppercase tracking-wider ${
              timeLeft <= 5 ? "text-incorrect" : "text-ink/50 dark:text-paper/50"
            }`}
          >
            {timeLeft}s
          </p>
        )}
        <p className="font-mono text-xs uppercase tracking-wider text-rule">
          Score: {score.correct}/{score.total}
        </p>
      </div>

      <div className="punch-edge bg-card dark:bg-cardDark border border-ink/10 dark:border-paper/15 rounded-card p-8">
        {current.category && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-rule mb-3">
            {current.category}
          </p>
        )}
        <h2 className="font-display text-2xl text-ink dark:text-paper leading-snug mb-6">
          {current.question}
        </h2>

        <div className="grid gap-3">
          {choices.map(([letter, text]) => {
            const isCorrect = letter === current.correct_answer;
            const isSelected = letter === selected;
            let style = "border-ink/15 dark:border-paper/20 hover:border-rule";
            if (revealed && isCorrect) style = "border-correct bg-correct/5";
            else if (revealed && isSelected && !isCorrect)
              style = "border-incorrect bg-incorrect/5";

            return (
              <button
                key={letter}
                onClick={() => choose(letter)}
                className={`text-left border rounded-card px-4 py-3 transition-colors text-ink dark:text-paper ${style}`}
              >
                <span className="font-mono text-xs text-ink/50 dark:text-paper/50 mr-3">
                  {letter}
                </span>
                {text}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className="mt-6 pt-6 border-t border-ink/10 dark:border-paper/15 space-y-4">
            {selected === null && timerSeconds != null && (
              <p className="font-mono text-xs uppercase tracking-wider text-incorrect">
                Time's up &mdash; no answer selected
              </p>
            )}
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-correct mb-1">
                Why {current.correct_answer} is correct
              </p>
              <p className="text-ink/80 dark:text-paper/80 leading-relaxed">
                {current.rationale}
              </p>
            </div>

            {current.why_wrong && (
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-incorrect mb-1">
                  Why the others are wrong
                </p>
                <p className="text-ink/80 dark:text-paper/80 leading-relaxed">
                  {current.why_wrong}
                </p>
              </div>
            )}

            {current.memory_aid && (
              <div className="bg-highlight/20 border border-highlight rounded-card px-4 py-3">
                <p className="font-mono text-xs uppercase tracking-wider text-ink/60 dark:text-ink/60 mb-1">
                  Memory aid
                </p>
                <p className="text-ink">{current.memory_aid}</p>
              </div>
            )}

            <button
              onClick={next}
              className="mt-2 bg-ink dark:bg-paper text-paper dark:text-ink font-mono text-xs uppercase tracking-wider px-5 py-3 rounded-card hover:bg-rule dark:hover:bg-rule dark:hover:text-paper transition-colors"
            >
              Next question &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
