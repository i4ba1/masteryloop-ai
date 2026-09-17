import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/database.types.ts",
      "**/next-env.d.ts",
      "test-results/**",
      "playwright-report/**",
      "supabase/functions/**",
      ".bootstrap/**",
    ],
  },
  ...tseslint.configs.recommended,
  { settings: { next: { rootDir: "apps/web" } } },
  ...nextVitals.map((config) => ({ ...config, files: ["apps/web/src/**/*.{ts,tsx}"] })),
  {
    files: ["scripts/**/*.mjs", "*.mjs"],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        URL: "readonly",
        fetch: "readonly",
        AbortSignal: "readonly",
        setTimeout: "readonly",
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: { "no-console": "error", "@typescript-eslint/no-explicit-any": "error" },
  },
  {
    files: ["packages/domain/src/**/*.ts", "packages/application/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "next",
            "next/*",
            "react",
            "react/*",
            "@supabase/*",
            "openai",
            "@vercel/*",
            "node:*",
            "@masteryloop/infrastructure",
          ],
        },
      ],
    },
  },
];
