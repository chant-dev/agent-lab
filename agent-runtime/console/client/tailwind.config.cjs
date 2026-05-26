module.exports = {
  content: {
    relative: true,
    files: ["./index.html", "./src/**/*.{ts,tsx}"],
  },
  theme: {
    extend: {
      colors: {
        ink: "#05070a",
        panel: "#0d1117",
        panelSoft: "#121821",
        line: "#273241",
        accent: "#5eead4",
        gold: "#f5c86b",
        danger: "#fb7185",
      },
      boxShadow: {
        glow: "0 18px 60px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};
