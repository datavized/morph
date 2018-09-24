/* eslint-env node, browser: false */
const eslintConfig = require('datavized-code-style');
module.exports = Object.assign(eslintConfig, {
	plugins: eslintConfig.plugins.concat([
		'react',
		'jsx-a11y'
	]),
	env: {
		browser: true,
		es6: true,
		commonjs: true
	},
	extends: eslintConfig.extends.concat([
		'plugin:react/recommended'
	]),
	rules: Object.assign(eslintConfig.rules, {
		'react/jsx-uses-react': 'error',
		'react/jsx-uses-vars': 'error',
		'no-invalid-this': 0,
		'react/forbid-foreign-prop-types': 'error'
	}),
	settings: {
		react: {
			version: require('react').version
		}
	}
});
