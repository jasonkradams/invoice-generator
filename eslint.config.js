export default [
  {
    files: ["static/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        ErrorHandler: "readonly",
        ValidationUtils: "readonly"
      }
    },
    rules: {
      "indent": ["error", 4],
      "quotes": ["error", "single"],
      "semi": ["error", "always"],
      "no-unused-vars": "warn",
      "no-console": "off",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "no-trailing-spaces": "error"
    }
  }
];
