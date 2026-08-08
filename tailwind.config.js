/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media", // follows the device's system dark-mode setting automatically
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F6F3EC",
        card: "#FFFFFF",
        cardDark: "#242E3B",
        ink: "#1E2A38",
        rule: "#2C4A7C",
        correct: "#2F7A4F",
        incorrect: "#B3432B",
        highlight: "#F2C14E",
        muted: "#6B7280",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        card: "6px",
      },
    },
  },
  plugins: [],
};
