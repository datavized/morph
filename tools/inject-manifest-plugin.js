/*
We build a manifest.json full of icons with favicons-webpack-plugin
but it does not properly inject it into the HTML
(bug: https://github.com/jantimon/favicons-webpack-plugin/pull/10)

This custom plugin lets us do that and modify it with some of
our own preferred properties
*/

const { RawSource } = require('webpack-sources');
function InjectManifestPlugin(options) {
	this.options = options;
}

InjectManifestPlugin.prototype.apply = function (compiler) {
	let manifestLocation = '';
	const options = this.options;

	compiler.hooks.compilation.tap('InjectManifestPlugin', (compilation) => {
		if (compilation.hooks.htmlWebpackPluginAfterHtmlProcessing) {
			compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync(
				'InjectManifestPlugin',
				(data, cb) => {
					if (manifestLocation) {
						data.html = data.html.replace(
							/(<\/head>)/i,
							`<link rel="manifest" href="${encodeURI(manifestLocation)}" /></head>`
						);
					}
					cb(null, data);
				}
			);
		}

		if (compilation.hooks.additionalAssets) {
			compilation.hooks.additionalAssets.tapAsync(
				'InjectManifestPlugin',
				cb => {
					for (const name in compilation.assets) {
						if (compilation.assets.hasOwnProperty(name) && /manifest\.json$/.test(name)) {
							const asset = compilation.assets[name];
							try {
								if (options) {
									const manifest = JSON.parse(asset.source());
									const modifiedManifest = Object.assign(manifest, options || {});
									compilation.assets[name] = new RawSource(JSON.stringify(modifiedManifest));
								}
								manifestLocation = name;
							} catch (e) {
								console.warn('failed to update manifest', e);
							}
						}
					}

					cb(null);
				}
			);
		}
	});
};

module.exports = InjectManifestPlugin;