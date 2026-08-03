"use client";

import { useEffect, useState } from "react";

export default function StudyPage() {
  const [questions, setQuestions] = useState([]);
  const [order, setOrder] = useState([]);
  const [pos, setPos] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((data) => {
        const qs = data.questions || [];
        setQuestions(qs);
        setOrder(shuffle(qs.map((_, i) => i)));
        setLoading(false);
      });
  }, []);

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  if (loading) return <p className="text-ink/60">Loading questions&hellip;</p>;
  if (questions.length === 0)
    return (
      <p className="text-ink/60">
        No questions yet.{" "}
        <a href="/add" className="text-rule underline">
          Add your first one.
        </a>
      </p>
    );

  const current = questions[order[pos]];

  function choose(letter) {
    if (revealed) return;
    setSelected(letter);
    setRevealed(true);
    setScore((s) => ({
      correct: s.correct + (letter === current.correct_answer ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function next() {
    setSelected(null);
    setRevealed(false);
    setPos((p) => (p + 1) % order.length);
  }

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
        <p className="font-mono text-xs uppercase tracking-wider text-ink/50">
          Question {pos + 1} of {order.length}
        </p>
        <p className="font-mono text-xs uppercase tracking-wider text-rule">
          Score: {score.correct}/{score.total}
        </p>
      </div>

      <div className="punch-edge bg-card border border-ink/10 rounded-card p-8">
        <h2 className="font-display text-2xl text-ink leading-snug mb-6">
          {current.question}
        </h2>

        <div className="grid gap-3">
          {choices.map(([letter, text]) => {
            const isCorrect = letter === current.correct_answer;
            const isSelected = letter === selected;
            let style = "border-ink/15 hover:border-rule";
            if (revealed && isCorrect) style = "border-correct bg-correct/5";
            else if (revealed && isSelected && !isCorrect)
              style = "border-incorrect bg-incorrect/5";

            return (
              <button
                key={letter}
                onClick={() => choose(letter)}
                className={`text-left border rounded-card px-4 py-3 transition-colors ${style}`}
              >
                <span className="font-mono text-xs text-ink/50 mr-3">{letter}</span>
                {text}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className="mt-6 pt-6 border-t border-ink/10 space-y-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-correct mb-1">
                Why {current.correct_answer} is correct
              </p>
              <p className="text-ink/80 leading-relaxed">{current.rationale}</p>
            </div>

            {current.why_wrong && (
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-incorrect mb-1">
                  Why the others are wrong
                </p>
                <p className="text-ink/80 leading-relaxed">{current.why_wrong}</p>
              </div>
            )}

            {current.memory_aid && (
              <div className="bg-highlight/20 border border-highlight rounded-card px-4 py-3">
                <p className="font-mono text-xs uppercase tracking-wider text-ink/60 mb-1">
                  Memory aid
                </p>
                <p className="text-ink">{current.memory_aid}</p>
              </div>
            )}

            <button
              onClick={next}
              className="mt-2 bg-ink text-paper font-mono text-xs uppercase tracking-wider px-5 py-3 rounded-card hover:bg-rule transition-colors"
            >
              Next question &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
