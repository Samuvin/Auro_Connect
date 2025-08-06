import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
	{ 
		ignores: [
			"dist/", 
			"node_modules/", 
			"coverage/", 
			"build/",
			"test-results/",
			"playwright-report/",
			"lighthouse-reports/"
		] 
	},
	{
		files: ["**/*.{js,jsx}"],
		languageOptions: {
			ecmaVersion: 2022,
			globals: globals.browser,
			parserOptions: {
				ecmaVersion: "latest",
				ecmaFeatures: { jsx: true },
				sourceType: "module",
			},
		},
		settings: { 
			react: { version: "18.3" },
			"import/resolver": {
				node: {
					extensions: [".js", ".jsx"]
				}
			}
		},
		plugins: {
			react,
			"react-hooks": reactHooks,
			"react-refresh": reactRefresh,
			import: importPlugin,
			"jsx-a11y": jsxA11y,
		},
		rules: {
			// Base JavaScript rules
			...js.configs.recommended.rules,
			
			// React rules
			...react.configs.recommended.rules,
			...react.configs["jsx-runtime"].rules,
			...reactHooks.configs.recommended.rules,
			
			// Accessibility rules
			...jsxA11y.configs.recommended.rules,
			
			// Code style
			"indent": ["error", "tab"],
			"quotes": ["error", "double"],
			"semi": ["error", "always"],
			"no-trailing-spaces": "error",
			"no-multiple-empty-lines": ["error", { "max": 2 }],
			"eol-last": "error",
			"comma-dangle": ["error", "always-multiline"],
			"object-curly-spacing": ["error", "always"],
			"array-bracket-spacing": ["error", "never"],
			
			// Variables and functions
			"no-unused-vars": ["error", { 
				"argsIgnorePattern": "^_",
				"varsIgnorePattern": "^_"
			}],
			"no-undef": "error",
			"no-redeclare": "error",
			"prefer-const": "error",
			"no-var": "error",
			
			// Best practices
			"no-console": "warn", // Warn about console statements in frontend
			"no-debugger": "error",
			"no-alert": "error",
			"no-eval": "error",
			"no-implied-eval": "error",
			"no-new-func": "error",
			"no-return-assign": "error",
			"no-self-compare": "error",
			"no-throw-literal": "error",
			"no-unreachable": "error",
			"no-unused-expressions": "error",
			"curly": ["error", "all"],
			"eqeqeq": ["error", "always"],
			"dot-notation": "error",
			
			// ES6+
			"prefer-arrow-callback": "error",
			"arrow-spacing": "error",
			"template-curly-spacing": "error",
			"prefer-template": "error",
			"prefer-destructuring": ["error", {
				"array": true,
				"object": true
			}, {
				"enforceForRenamedProperties": false
			}],
			
			// Import/Export rules
			"import/no-unresolved": "off", // Disable as Vite handles this
			"import/extensions": ["error", "never", { "css": "always" }],
			"import/no-duplicates": "error",
			"import/newline-after-import": "error",
			"import/order": ["error", {
				"groups": [
					"builtin",
					"external", 
					"internal",
					"parent",
					"sibling",
					"index"
				],
				"newlines-between": "always"
			}],
			
			// React specific rules
			"react/jsx-no-target-blank": "off",
			"react/prop-types": "off", // Using TypeScript or not enforcing prop-types
			"react/jsx-uses-react": "off", // Not needed in React 17+
			"react/react-in-jsx-scope": "off", // Not needed in React 17+
			"react/jsx-props-no-spreading": "warn",
			"react/jsx-key": "error",
			"react/jsx-no-duplicate-props": "error",
			"react/jsx-no-undef": "error",
			"react/jsx-uses-vars": "error",
			"react/no-array-index-key": "warn",
			"react/no-danger": "warn",
			"react/no-direct-mutation-state": "error",
			"react/no-unescaped-entities": "error",
			"react/prefer-stateless-function": "warn",
			"react/self-closing-comp": "error",
			"react/jsx-boolean-value": ["error", "never"],
			"react/jsx-curly-brace-presence": ["error", { 
				"props": "never", 
				"children": "never" 
			}],
			"react/jsx-equals-spacing": ["error", "never"],
			"react/jsx-indent": ["error", "tab"],
			"react/jsx-indent-props": ["error", "tab"],
			"react/jsx-max-props-per-line": ["error", { "maximum": 3 }],
			"react/jsx-tag-spacing": ["error", {
				"closingSlash": "never",
				"beforeSelfClosing": "always",
				"afterOpening": "never",
				"beforeClosing": "never"
			}],
			
			// React Hooks rules
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",
			
			// React Refresh rules
			"react-refresh/only-export-components": ["warn", { 
				allowConstantExport: true 
			}],
			
			// Accessibility rules (from jsx-a11y)
			"jsx-a11y/alt-text": "error",
			"jsx-a11y/anchor-has-content": "error",
			"jsx-a11y/click-events-have-key-events": "error",
			"jsx-a11y/no-static-element-interactions": "error",
		},
	},
	{
		// Test files configuration
		files: ["**/*.test.{js,jsx}", "**/*.spec.{js,jsx}", "tests/**/*.{js,jsx}"],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.jest,
				describe: "readonly",
				it: "readonly",
				test: "readonly",
				expect: "readonly",
				beforeAll: "readonly",
				afterAll: "readonly",
				beforeEach: "readonly",
				afterEach: "readonly",
				jest: "readonly",
			},
		},
		rules: {
			"no-unused-expressions": "off", // Allow for Jest assertions
			"no-console": "off", // Allow console in tests
			"import/no-extraneous-dependencies": "off", // Allow test dependencies
		},
	},
];
