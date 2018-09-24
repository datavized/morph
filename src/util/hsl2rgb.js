// convert HSL to RGB as a single integer usable by PIXI
// assume HSL are already normalized 0 to 1
export default function color(hue, sat, lum) {
	function calcHue(h, m1, m2) {
		h = h < 0 ?
			h + 1 :
			h > 1 ? h - 1 : h;

		if (h * 6 < 1) {
			return m1 + (m2 - m1) * h * 6;
		}
		if (h * 2 < 1) {
			return m2;
		}
		if (h * 3 < 2) {
			return m1 + (m2 - m1) * (2 / 3 - h) * 6;
		}

		return m1;
	}

	/*
	Sometimes we get negative lum values, which results in
	a lot of black once you clamp it. To keep things interesting,
	if we get a negative, we'll use it as an indication to invert the
	color like a photo negative.
	*/
	const invert = lum < 0;
	if (invert) {
		lum = 1 + lum;
	}

	lum = Math.max(0, Math.min(1, lum));
	sat = Math.max(0, Math.min(1, sat));

	const m2 = lum <= 0.5 ? lum * (sat + 1) : lum + sat - lum * sat;
	const m1 = lum * 2 - m2;

	let r = calcHue(hue + 1 / 3, m1, m2);
	let g = calcHue(hue, m1, m2);
	let b = calcHue(hue - 1 / 3, m1, m2);
	if (invert) {
		r = 1 - r;
		g = 1 - g;
		b = 1 - b;
	}

	// eslint-disable-next-line no-bitwise
	return r * 255 << 16 ^ g * 255 << 8 ^ b * 255 << 0;
}