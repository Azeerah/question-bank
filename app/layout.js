import "./globals.css";

export const metadata = {
  title: "Question Bank",
  description: "Study, quiz, and manage your exam question bank.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen">
        <header className="border-b border-ink/10 bg-paper">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <a href="/" className="font-display text-2xl tracking-tight text-ink">
              Question Bank
            </a>
            <nav className="flex gap-6 font-mono text-xs uppercase tracking-wider text-ink/70">
              <a href="/study" className="hover:text-rule transition-colors">Study</a>
              <a href="/browse" className="hover:text-rule transition-colors">Browse</a>
              <a href="/add" className="hover:text-rule transition-colors">Add</a>
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
