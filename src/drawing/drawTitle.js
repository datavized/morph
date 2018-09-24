import Path from './Path';
import Text from './Text';
import getContrastTextColor from '../util/getContrastTextColor';

export default function drawTitle(drawDefinition/*, parentPath*/) {
	return function (container/*, app*/) {
		// const pathContainer = parentPath || new Path();
		// const draw = drawDefinition(pathContainer);
		const drawingContainer = new Path();
		container.add(drawingContainer);

		const text = new Text('');
		text.size = 30;
		container.add(text);

		const draw = drawDefinition(drawingContainer);
		let width = 1;
		let height = 1;

		function updateText(backgroundColor) {
			if (text.visible) {
				drawingContainer.scale.set(0.85, 0.85);
				text.position.set(width / 2, height / 15);
				drawingContainer.position.set(0.075 * width, 0.15 * height);

				const textScale = width / 800;
				text.scale.set(textScale, textScale);

				if (backgroundColor) {
					text.color = getContrastTextColor(backgroundColor);
				}
			} else {
				drawingContainer.scale.set(1, 1);
				drawingContainer.position.set(0, 0);
			}
		}

		return {
			update(opts) {
				const title = opts.title ? opts.title.trim() : '';
				text.text = title;
				text.visible = !!title;
				updateText(opts.backgroundColor);
				draw.update(opts);
			},
			resize(w, h) {
				width = w;
				height = h;
				updateText();
				if (draw.resize) {
					draw.resize(w, h);
				}
			},
			destroy() {
				if (draw.destroy) {
					draw.destroy();
				}
			}
		};
	};
}