module.exports = {
  extends: ["expo", "prettier",
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"],
  plugins: ["prettier","@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  ignorePatterns: ["dist/"],
  rules: {
    "prettier/prettier": "warn",
  },
};