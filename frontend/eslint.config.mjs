import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: resolve(__dirname, "node_modules/eslint-config-next"),
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".next",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "node_modules/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-duplicate-head": "off",
      "@next/next/no-page-custom-font": "off",
    },
  },
];

export default eslintConfig;
