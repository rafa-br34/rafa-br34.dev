module.exports = {
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint", "prettier"],
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:prettier/recommended",
	],
	env: {
		browser: true,
		es2021: true
	},
	rules: {
		semi: ["error", "always"],
		quotes: ["error", "double"],
		"prettier/prettier": "error"
	}
}