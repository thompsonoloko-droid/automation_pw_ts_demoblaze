import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      // Allow unused vars with underscore prefix (common pattern for Playwright fixtures)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Allow empty catch blocks (used for overlay dismissal and dialog handling)
      "no-empty": ["error", { allowEmptyCatch: true }],
      // Warn on explicit any
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    ignores: [
      "node_modules/",
      "test-results/",
      "reports/",
      "playwright-report/",
      "blob-report/",
      "eslint.config.mjs",
    ],
  },
);
