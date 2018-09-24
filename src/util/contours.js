/*
Adapted from https://github.com/mattdesl/svg-path-contours
MIT License
- Code style change for readability
- Don't convert lines to curves, since they waste points
*/


import bezier from 'adaptive-bezier-curve';
import abs from 'abs-svg-path';
// import norm from 'normalize-svg-path';
import norm from './normalize';

import copy from 'vec2-copy';

function set(out, x, y) {
	out[0] = x;
	out[1] = y;
	return out;
}

const tmp1 = [0, 0];
const tmp2 = [0, 0];
const tmp3 = [0, 0];

function bezierTo(points, scale, start, seg) {
	bezier(start,
		set(tmp1, seg[1], seg[2]),
		set(tmp2, seg[3], seg[4]),
		set(tmp3, seg[5], seg[6]), scale, points);
}

function lineTo(points, scale, start, seg) {
	const [x1, y1] = start;
	points.push(
		[x1, y1],
		[seg[1], seg[2]]
	);
}

export default function contours(svg, scale) {
	const paths = [];

	const points = [];
	const pen = [0, 0];
	norm(abs(svg)).forEach(segment => {
		if (segment[0] === 'M') {
			copy(pen, segment.slice(1));
			if (points.length > 0) {
				paths.push(points);
				points.length = 0;
			}
		} else if (segment[0] === 'L') {
			lineTo(points, scale, pen, segment);
			set(pen, segment[1], segment[2]);
		} else if (segment[0] === 'C') {
			bezierTo(points, scale, pen, segment);
			set(pen, segment[5], segment[6]);
		} else {
			throw new Error('illegal type in SVG: ' + segment[0]);
		}
	});

	if (points.length > 0) {
		paths.push(points);
	}
	return paths;
}