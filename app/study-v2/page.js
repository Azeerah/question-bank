'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBag, drawNext, loadBag, saveBag } from '../../lib/shuffleBag';

const POOL_MODES = [
  { value: 'new', label: 'New questions', statusFilter: (s) => s === 'unattempted' },
  { value: 'retry', label: 'Retry failed', statusFilter: (s) => s === 'failed' },
  { value: 'all', label: 'All questions', statusFilter: () => true },
];

export default function StudyV2Page() {
  const [view, setView] = useState('setup'); // 'setup' | 'quiz' | 'history'
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [poolMode, setPoolMode] = useState('new');

  const [questionsById, setQuestionsById] = useState({});
  const [bag, setBag] = useState(null);
  const [bagKey, setBagKey] = useState(null);

  const [currentId, setCurrentId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load the list of categories once, for the unit dropdown.
  useEffect(() => {
    fetch('/api/study-questions')
      .then((r) => r.json())
      .then((rows) => {
        const cats = [...new Set(rows.map((r) => r.category).filter(Boolean))].sort();
        setCategories(cats);
      })
      .catch(() => {});
  }, []);

  async function startSession() {
    setLoading(true);
    setError(null);
    try {
      const qParam = category ? `?category=${encodeURIComponent(category)}` : '';
      const [questionsRes, statusRes] = await Promise.all([
        fetch(`/api/study-questions${qParam}`),
        fetch(`/api/attempts?mode=status${category ? `&category=${encodeURIComponent(category)}` : ''}`),
      ]);
      const questions = await questionsRes.json();
      const statuses = await statusRes.json();

      const statusByQuestionId = Object.fromEntries(
        statuses.map((s) => [s.question_id, s.status])
      );
      const activeMode = POOL_MODES.find((m) => m.value === poolMode);
      const pool = questions.filter((q) =>
        activeMode.statusFilter(statusByQuestionId[q.id] || 'unattempted')
      );

      if (pool.length === 0) {
        setError(
          poolMode === 'retry'
            ? "No failed questions right now — nice work. Try 'New questions' or 'All questions' instead."
            : 'No questions match this filter.'
        );
        setLoading(false);
        return;
      }

      const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
      setQuestionsById(byId);

      const key = `${category || 'all'}:${poolMode}`;
      const ids = pool.map((q) => q.id);
      const existingBag = loadBag(key);
      const initialBag = existingBag || createBag(ids);

      setBagKey(key);
      setSessionStats({ correct: 0, total: 0 });
      advance(initialBag, ids, key);
      setView('quiz');
    } catch (e) {
      setError('Something went wrong loading questions.');
    } finally {
      setLoading(false);
    }
  }

  function advance(bagState, ids, key) {
    const { id, bag: nextBag } = drawNext(bagState, ids);
    setBag(nextBag);
    saveBag(key, nextBag);
    setCurrentId(id);
    setSelected(null);
    setRevealed(false);
  }

  async function submitAnswer() {
    if (!selected || !currentId) return;
    const q = questionsById[currentId];
    const correct = selected === q.correct_answer;
    setRevealed(true);
    setSessionStats((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));

    try {
      await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: currentId, selectedAnswer: selected, correct }),
      });
    } catch {
      // Logging failure shouldn't block studying — the question is still shown correctly.
    }
  }

  function nextQuestion() {
    const ids = bag.shuffledOrder; // list doesn't change mid-session in this prototype
    advance(bag, ids, bagKey);
  }

  async function openHistory() {
    setView('history');
    setHistoryLoading(true);
    try {
      const qParam = category ? `?mode=history&category=${encodeURIComponent(category)}` : '?mode=history';
      const res = await fetch(`/api/attempts${qParam}`);
      const rows = await res.json();
      setHistory(rows);
    } finally {
      setHistoryLoading(false);
    }
  }

  const currentQuestion = currentId ? questionsById[currentId] : null;
  const choiceLetters = useMemo(() => {
    if (!currentQuestion) return [];
    return ['a', 'b', 'c', 'd', 'e']
      .filter((l) => currentQuestion[`choice_${l}`])
      .map((l) => l.toUpperCase());
  }, [currentQuestion]);

  return (
    <div className="min-h-screen bg-white dark:bg-ink text-gray-900 dark:text-paper px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Study</h1>
          <button
            onClick={openHistory}
            className="text-sm underline underline-offset-2 text-gray-600 dark:text-paper/70 hover:text-gray-900 dark:hover:text-paper"
          >
            History
          </button>
        </div>

        {view === 'setup' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Unit</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-paper/20 bg-white dark:bg-cardDark px-3 py-2"
              >
                <option value="">All units</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {POOL_MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setPoolMode(m.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      poolMode === m.value
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-gray-300 dark:border-paper/20 hover:bg-gray-50 dark:hover:bg-cardDark'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-rose-600 text-sm">{error}</p>}

            <button
              onClick={startSession}
              disabled={loading}
              className="w-full rounded-lg bg-gray-900 dark:bg-paper text-white dark:text-ink font-semibold py-3 disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Start studying'}
            </button>
          </div>
        )}

        {view === 'quiz' && currentQuestion && (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-paper/60">
              <span>
                {category || 'All units'} · {POOL_MODES.find((m) => m.value === poolMode).label}
              </span>
              <span>
                {sessionStats.correct}/{sessionStats.total} correct this session
              </span>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-paper/10 bg-white dark:bg-cardDark p-5">
              <p className="font-medium mb-4">{currentQuestion.question}</p>

              <div className="space-y-2">
                {choiceLetters.map((letter) => {
                  const isCorrectChoice = revealed && letter === currentQuestion.correct_answer;
                  const isWrongSelected =
                    revealed && letter === selected && letter !== currentQuestion.correct_answer;
                  return (
                    <button
                      key={letter}
                      disabled={revealed}
                      onClick={() => setSelected(letter)}
                      className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                        isCorrectChoice
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'
                          : isWrongSelected
                          ? 'border-rose-600 bg-rose-50 dark:bg-rose-900/30'
                          : selected === letter
                          ? 'border-gray-900 dark:border-paper'
                          : 'border-gray-200 dark:border-paper/10 hover:border-gray-400'
                      }`}
                    >
                      <span className="font-semibold mr-2">{letter}.</span>
                      {currentQuestion[`choice_${letter.toLowerCase()}`]}
                    </button>
                  );
                })}
              </div>

              {revealed && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-paper/10 space-y-2 text-sm">
                  <p className="font-medium">
                    {selected === currentQuestion.correct_answer ? '✅ Correct' : '❌ Not quite'}
                  </p>
                  {currentQuestion.rationale && (
                    <p className="text-gray-700 dark:text-paper/80">{currentQuestion.rationale}</p>
                  )}
                  {currentQuestion.why_wrong && (
                    <p className="text-gray-600 dark:text-paper/60">{currentQuestion.why_wrong}</p>
                  )}
                  {currentQuestion.memory_aid && (
                    <p className="italic text-gray-500 dark:text-paper/50">
                      💡 {currentQuestion.memory_aid}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setView('setup')}
                className="rounded-lg border border-gray-300 dark:border-paper/20 px-4 py-2 text-sm"
              >
                Change filters
              </button>
              {!revealed ? (
                <button
                  onClick={submitAnswer}
                  disabled={!selected}
                  className="flex-1 rounded-lg bg-gray-900 dark:bg-paper text-white dark:text-ink font-semibold py-2 disabled:opacity-50"
                >
                  Submit
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="flex-1 rounded-lg bg-gray-900 dark:bg-paper text-white dark:text-ink font-semibold py-2"
                >
                  Next question
                </button>
              )}
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-4">
            <button
              onClick={() => setView('setup')}
              className="text-sm underline underline-offset-2 text-gray-600 dark:text-paper/70"
            >
              ← Back
            </button>
            {historyLoading ? (
              <p>Loading…</p>
            ) : history.length === 0 ? (
              <p className="text-gray-500 dark:text-paper/60">No attempts logged yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-lg border border-gray-200 dark:border-paper/10 px-4 py-3 text-sm flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate">{h.question}</p>
                      <p className="text-xs text-gray-500 dark:text-paper/50">
                        {h.category} · {new Date(h.attemptedAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold px-2 py-1 rounded ${
                        h.correct
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                      }`}
                    >
                      {h.selectedAnswer} {h.correct ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
