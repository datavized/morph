export function luminance(r, g, b) {
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export default function getContrastTextColor(backgroundColorObject) {
	if (!backgroundColorObject || !backgroundColorObject.a) {
		return 0x888888; // gray
	}

	const {r, g, b} = backgroundColorObject;
	if (luminance(r / 255, g / 255, b / 255) < 0.5) {
		return 0xffffff; // white
	}

	return 0x0; // black
}