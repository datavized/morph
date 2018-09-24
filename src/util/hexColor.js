import { decomposeColor } from '@material-ui/core/styles/colorManipulator';

export default function hexColor(color, defaultVal) {
	if (color !== undefined) {
		if (color === 'number') {
			return color;
		}

		if (typeof color === 'string') {
			/*
			warning: this assumes RGB. if we need to support other formats,
			we'll need a lot more code here
			*/
			if (color[0] === '#') {
				return parseInt(color.substring(1), 16);
			}

			const { type, values } = decomposeColor(color);
			if (type === 'rgb' || type === 'rgba') {
				const [r, g, b] = values;

				// eslint-disable-next-line no-bitwise
				return r << 16 ^ g << 8 ^ b << 0;
			}
		}
	}
	return defaultVal;
}
