const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
	js.configs.recommended,
	{
		files: ['**/*.js'],
		languageOptions: {
			ecmaVersion: 2021,
			sourceType: 'script',
			globals: {
				...globals.browser,
				...globals.node
			}
		},
		rules: {
			'no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			],
			'no-console': 'off',
			semi: ['error', 'never'],
			quotes: ['error', 'single', { avoidEscape: true }],
			indent: ['error', 'tab'],
			eqeqeq: 'error',
			curly: 'error',
			camelcase: 'warn',
			'no-var': 'error',
			'prefer-const': 'warn',
			'no-alert': 'off'
		}
	},
	{
		files: ['build.js'],
		languageOptions: {
			sourceType: 'script',
			globals: {
				...globals.node
			}
		}
	},
	{
		ignores: ['src/apps/fuel/fuel.js', 'src/apps/breath/breath.js', 'docs/**/*']
	}
]
