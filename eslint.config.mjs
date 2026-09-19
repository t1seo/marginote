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
  {
    files: ["src/settings.ts"],
    rules: {
      // Keep the tested 1.10.6 settings API until the 1.13 search UI has real-app coverage.
      "obsidianmd/settings-tab/prefer-setting-definitions": "off",
    },
  },
]);
