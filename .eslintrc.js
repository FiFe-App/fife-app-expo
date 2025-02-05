module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended","expo", "prettier",
      "next/core-web-vitals",
      "plugin:@typescript-eslint/recommended"],
    plugins: ["prettier","@typescript-eslint",
        "react"],
    parser: "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    ignorePatterns: ["dist/"],
    rules: {
      "prettier/prettier": "warn",
    },
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
  };