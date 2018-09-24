import Path from './Path';
import PixiPath from './PixiPath';
import './PixiText';
import './PixiLinePath';

export default function wrapDraw(drawDefinition, parentPath) {
	return function (pixiContainer, app) {
		const pathContainer = parentPath || new Path();

		const renderableContainer = new PixiPath(pixiContainer, pathContainer);
		const draw = drawDefinition(pathContainer);
		return {
			update(opts) {
				const { a, r, g, b } = opts.backgroundColor || { a: 0 };
				if (a > 0) {
					// eslint-disable-next-line no-bitwise
					app.renderer.backgroundColor = r << 16 ^ g << 8 ^ b << 0;
				} else if (opts.bgColor && opts.bgColor[0] === '#') {
					app.renderer.backgroundColor = parseInt(opts.bgColor.substring(1), 16);
				}

				draw.update(opts);
				renderableContainer.update();
			},
			resize(w, h) {
				if (draw.resize) {
					draw.resize(w, h);
					renderableContainer.update();
				}
			},
			destroy() {
				if (draw.destroy) {
					draw.destroy();
				}
				if (!parentPath) {
					pathContainer.destroyAll();
				}
				renderableContainer.destroy();
			}
		};
	};
}