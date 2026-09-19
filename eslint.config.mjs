import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  { ignores: ["main.js", ".qa/**", "node_modules/**"] },
  ...obsidianmd.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "obsidianmd/ui/sentence-case": [
        "warn",
        {
          brands: ["Marginote", "Obsidian", "Markdown"],
          ignoreWords: ["Enter", "Space", "Cmd", "Ctrl"],
          enforceCamelCaseLower: true,
        },
      ],
    },
  },
]);
