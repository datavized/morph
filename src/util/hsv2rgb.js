// convert HSV to RGB as a single integer usable by PIXI
import fmod from '../util/fmod';

// assume HSV are already normalized 0 to 1
export default function hsv2rgb(hue, sat, lum) {
	/*
	Sometimes we get negative lum values, which results in
	a lot of black once you clamp it. To keep things interesting,
	if we get a negative, we'll use it as an indication to cycle the
	hue by half a rotation.
	*/
	const invert = lum < 0;
	if (invert) {
		lum = Math.abs(lum);
		hue = fmod(hue + 0.5, 1);
	}

	lum = Math.max(0, Math.min(1, lum));
	sat = Math.max(0, Math.min(1, sat));

	const v = lum;
	const i = Math.floor(hue * 6);
	const f = hue * 6 - i;
	const p = v * (1 - sat);
	const q = v * (1 - f * sat);
	const t = v * (1 - (1 - f) * sat);

	let r = 0;
	let g = 0;
	let b = 0;
	const range = i % 6;

	if (range === 0) {
		r = v;
		g = t;
		b = p;
	} else if (range === 1) {
		r = q;
		g = v;
		b = p;
	} else if (range === 2) {
		r = p;
		g = v;
		b = t;
	} else if (range === 3) {
		r = p;
		g = q;
		b = v;
	} else if (range === 4) {
		r = t;
		g = p;
		b = v;
	} else if (range === 5) {
		r = v;
		g = p;
		b = q;
	}

	// if (invert) {
	// 	r = 1 - r;
	// 	g = 1 - g;
	// 	b = 1 - b;
	// }

	// eslint-disable-next-line no-bitwise
	return r * 255 << 16 ^ g * 255 << 8 ^ b * 255 << 0;
}