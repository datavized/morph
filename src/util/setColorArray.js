export default function setColorArray(array, color, alpha = 1) {
	/* eslint-disable no-bitwise */
	array[0] = (color >> 16 & 255) / 255; // red
	array[1] = (color >> 8 & 255) / 255; // green
	array[2] = (color & 255) / 255; // blue
	array[3] = alpha;
	/* eslint-enable no-bitwise */

	return array;
}