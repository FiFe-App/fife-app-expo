module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
		'**/*.{js,html,png,ico}'
	],
	swDest: 'dist/OneSignalSDKWorker.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};