import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist-electron/**",
      "renderer/dist/**",
      "release/**",
      "node_modules/**",
      "build/**",
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  }
);
