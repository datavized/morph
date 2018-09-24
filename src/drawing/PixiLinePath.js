import PixiDrawable from './PixiDrawable';
import LinePath from './LinePath';

import { Graphics, GraphicsRenderer } from '@pixi/graphics';
import { Renderer } from '@pixi/core';
import { Container } from '@pixi/display';

Renderer.registerPlugin('graphics', GraphicsRenderer);

function PixiLinePath(parent, drawable) {
	PixiDrawable.call(this, parent, drawable);

	const points = drawable && drawable.points;

	const superUpdate = this.update;
	this.update = () => {
		const drawable = this.drawable;

		// create mesh or container if haven't done it yet
		if (!this.pixiObject) {
			if (points && points.length > 1) {
				const graphics = new Graphics();
				graphics.lineColor = 0;
				graphics.lineAlpha = 1;
				graphics.lineWidth = drawable.lineWidth;

				const firstPoint = points[0];
				graphics.moveTo(firstPoint[0], firstPoint[1]);
				for (let i = 1; i < points.length; i++) {
					const point = points[i];
					graphics.lineTo(point[0], point[1]);
				}

				this.pixiObject = graphics;
			} else {
				this.pixiObject = new Container();
			}
			if (parent) {
				parent.addChild(this.pixiObject);
			}
		}

		const pixiObject = this.pixiObject;
		if (drawable && pixiObject.graphicsData &&
				(pixiObject.lineColor !== drawable.color || pixiObject.lineAlpha !== drawable.opacity)) {

			pixiObject.lineColor = drawable.color;
			pixiObject.graphicsData.forEach(data => {
				data.lineColor = drawable.color;
				data.lineAlpha = drawable.opacity;
			});
			pixiObject.dirty++;

			/*
			PIXI Doesn't provide a way to change the colors of lines
			once they are converted to geometry, so we need to reach
			under the hood to do it. This is a bit slow and clunky,
			but it's much faster than it would be to regenerate the
			entire geometry from scratch every time
			*/

			// eslint-disable-next-line no-underscore-dangle
			const webglData = pixiObject._webGL;
			if (webglData) {
				const color = drawable.color;
				const alpha = drawable.opacity;

				/* eslint-disable no-bitwise */
				const r = (color >> 16 & 255) / 255; // red
				const g = (color >> 8 & 255) / 255; // green
				const b = (color & 255) / 255; // blue
				/* eslint-enable no-bitwise */

				Object.keys(webglData).forEach(i => {
					webglData[i].data.forEach(webglGraphicsData => {
						for (let i = 0, n = webglGraphicsData.points.length; i < n; i += 6) {
							const ri = i + 2;
							const gi = i + 3;
							const bi = i + 4;
							const ai = i + 5;
							webglGraphicsData.points[ri] = r;
							webglGraphicsData.glPoints[ri] = r;

							webglGraphicsData.points[gi] = g;
							webglGraphicsData.glPoints[gi] = g;

							webglGraphicsData.points[bi] = b;
							webglGraphicsData.glPoints[bi] = b;

							webglGraphicsData.points[ai] = alpha;
							webglGraphicsData.glPoints[ai] = alpha;
						}
						webglGraphicsData.dirty = true;
					});
				});
			}
		}
		superUpdate.call(this);
	};
}

PixiLinePath.prototype = Object.create(PixiDrawable.prototype);
PixiDrawable.register(LinePath, PixiLinePath);

export default PixiLinePath;