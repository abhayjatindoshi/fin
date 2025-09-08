import css from "@eslint/css";
import js from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  // React recommended + jsx-runtime (disables react/react-in-jsx-scope for new JSX transform)
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  { files: ["**/*.css"], plugins: { css }, language: "css/css", extends: ["css/recommended"] },
  // Optional: auto-detect React version for lint rules
  { settings: { react: { version: "detect" } } },
]);
