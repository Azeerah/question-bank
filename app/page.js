export default function Home() {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wider text-rule mb-3">
        Your exam prep, in one place
      </p>
      <h1 className="font-display text-4xl md:text-5xl leading-tight text-ink dark:text-paper max-w-2xl">
        Every question, its answer, and why it's true &mdash; ready when you are.
      </h1>
      <p className="mt-5 max-w-xl text-ink/70 dark:text-paper/70 leading-relaxed">
        Quiz yourself, browse the full bank, or add today's new questions.
        Each entry carries the correct answer, the reasoning behind it, why
        the other choices don't hold up, and a memory aid to make it stick.
      </p>

      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        <a
          href="/study"
          className="punch-edge block bg-card dark:bg-cardDark border border-ink/10 dark:border-paper/15 rounded-card p-6 hover:border-rule transition-colors"
        >
          <p className="font-mono text-xs text-rule mb-2">01</p>
          <h2 className="font-display text-xl text-ink dark:text-paper">Study Mode</h2>
          <p className="text-sm text-ink/60 dark:text-paper/60 mt-2">
            Quiz yourself one question at a time.
          </p>
        </a>
        <a
          href="/browse"
          className="punch-edge block bg-card dark:bg-cardDark border border-ink/10 dark:border-paper/15 rounded-card p-6 hover:border-rule transition-colors"
        >
          <p className="font-mono text-xs text-rule mb-2">02</p>
          <h2 className="font-display text-xl text-ink dark:text-paper">Browse Bank</h2>
          <p className="text-sm text-ink/60 dark:text-paper/60 mt-2">
            Search and review the full question bank.
          </p>
        </a>
        <a
          href="/add"
          className="punch-edge block bg-card dark:bg-cardDark border border-ink/10 dark:border-paper/15 rounded-card p-6 hover:border-rule transition-colors"
        >
          <p className="font-mono text-xs text-rule mb-2">03</p>
          <h2 className="font-display text-xl text-ink dark:text-paper">Add Question</h2>
          <p className="text-sm text-ink/60 dark:text-paper/60 mt-2">
            Add today's new questions to the bank.
          </p>
        </a>
      </div>
    </div>
  );
}
