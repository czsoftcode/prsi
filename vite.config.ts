import { defineConfig } from "vite";

// Na GitHub Pages běží hra pod /prsi/ (project page), proto produkční build
// potřebuje base "/prsi/". Dev server i testy zůstávají na "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/prsi/" : "/",
  test: {
    globals: true,
    environment: "node",
  },
}));
