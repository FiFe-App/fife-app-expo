module.exports = {
  extends: ["expo", "prettier"],
  plugins: ["prettier"],
  ignorePatterns: ["dist/"],
  rules: {
    "prettier/prettier": "warn",
  },
};
