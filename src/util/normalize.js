/*
Adapted from https://github.com/jkroso/normalize-svg-path
MIT License
- Code style change for readability
- Don't convert lines to curves, since they waste points
*/

const π = Math.PI;
const c120 = radians(120);

function line(x1, y1, x2, y2) {
	// return ['C', x1, y1, x2, y2, x2, y2];
	return ['L', x2, y2];
}

function radians(degress) {
	return degress * (π / 180);
}

function rotate(x, y, rad) {
	return {
		x: x * Math.cos(rad) - y * Math.sin(rad),
		y: x * Math.sin(rad) + y * Math.cos(rad)
	};
}

/* eslint-disable max-params */
function quadratic(x1, y1, cx, cy, x2, y2) {
	return [
		'C',
		x1 / 3 + 2 / 3 * cx,
		y1 / 3 + 2 / 3 * cy,
		x2 / 3 + 2 / 3 * cx,
		y2 / 3 + 2 / 3 * cy,
		x2,
		y2
	];
}

// This function is ripped from
// github.com/DmitryBaranovskiy/raphael/blob/4d97d4/raphael.js#L2216-L2304
// which references w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
// TODO: make it human readable

function arc(x1, y1, rx, ry, angle, largeArcFlag, sweepFlag, x2, y2, recursive) {
	let f1 = 0;
	let f2 = 0;
	let cx = 0;
	let cy = 0;

	if (!recursive) {
		let xy = rotate(x1, y1, -angle);
		x1 = xy.x;
		y1 = xy.y;

		xy = rotate(x2, y2, -angle);
		x2 = xy.x;
		y2 = xy.y;

		const x = (x1 - x2) / 2;
		const y = (y1 - y2) / 2;
		let h = x * x / (rx * rx) + y * y / (ry * ry);
		if (h > 1) {
			h = Math.sqrt(h);
			rx = h * rx;
			ry = h * ry;
		}

		const rx2 = rx * rx;
		const ry2 = ry * ry;
		let k = (largeArcFlag === sweepFlag ? -1 : 1) *
			Math.sqrt(Math.abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x)));
		if (k === Infinity) {
			// neutralize
			k = 1;
		}
		cx = k * rx * y / ry + (x1 + x2) / 2;
		cy = k * -ry * x / rx + (y1 + y2) / 2;
		f1 = Math.asin(((y1 - cy) / ry).toFixed(9));
		f2 = Math.asin(((y2 - cy) / ry).toFixed(9));

		f1 = x1 < cx ? π - f1 : f1;
		f2 = x2 < cx ? π - f2 : f2;

		if (f1 < 0) {
			f1 = π * 2 + f1;
		}
		if (f2 < 0) {
			f2 = π * 2 + f2;
		}
		if (sweepFlag && f1 > f2) {
			f1 = f1 - π * 2;
		}
		if (!sweepFlag && f2 > f1) {
			f2 = f2 - π * 2;
		}
	} else {
		[f1, f2, cx, cy] = recursive;
	}

	// greater than 120 degrees requires multiple segments
	let res = 0;
	if (Math.abs(f2 - f1) > c120) {
		const f2old = f2;
		const x2old = x2;
		const y2old = y2;
		f2 = f1 + c120 * (sweepFlag && f2 > f1 ? 1 : -1);
		x2 = cx + rx * Math.cos(f2);
		y2 = cy + ry * Math.sin(f2);
		res = arc(x2, y2, rx, ry, angle, 0, sweepFlag, x2old, y2old, [f2, f2old, cx, cy]);
	}
	const t = Math.tan((f2 - f1) / 4);
	const hx = 4 / 3 * rx * t;
	const hy = 4 / 3 * ry * t;
	let curve = [
		2 * x1 - (x1 + hx * Math.sin(f1)),
		2 * y1 - (y1 - hy * Math.cos(f1)),
		x2 + hx * Math.sin(f2),
		y2 - hy * Math.cos(f2),
		x2,
		y2
	];
	if (recursive) {
		return curve;
	}
	if (res) {
		curve = curve.concat(res);
	}
	for (let i = 0; i < curve.length;) {
		const rot = rotate(curve[i], curve[i + 1], angle);
		curve[i++] = rot.x;
		curve[i++] = rot.y;
	}
	return curve;
}
/* eslint-enable max-params */

export default function normalize(path) {
	// init state;
	const result = [];
	let prev;
	let bezierX = 0;
	let bezierY = 0;
	let startX = 0;
	let startY = 0;
	let quadX = null;
	let quadY = null;
	let x = 0;
	let y = 0;

	path.forEach(seg => {
		const command = seg[0];

		if (command === 'M') {
			startX = seg[1];
			startY = seg[2];
		} else if (command === 'A') {
			seg = arc(x, y, seg[1], seg[2], radians(seg[3]), seg[4], seg[5], seg[6], seg[7]);
			// split multi part
			seg.unshift('C');
			if (seg.length > 7) {
				result.push(seg.splice(0, 7));
				seg.unshift('C');
			}
		} else if (command === 'S') {
			// default control point;
			let cx = x;
			let cy = y;
			if (prev === 'C' || prev === 'S') {
				cx += cx - bezierX; // reflect the previous command's control
				cy += cy - bezierY; // point relative to the current point
			}
			seg = ['C', cx, cy, seg[1], seg[2], seg[3], seg[4]];
		} else if (command === 'T') {
			if (prev === 'Q' || prev === 'T') {
				quadX = x * 2 - quadX; // as with 'S' reflect previous control point;
				quadY = y * 2 - quadY;
			} else {
				quadX = x;
				quadY = y;
			}
			seg = quadratic(x, y, quadX, quadY, seg[1], seg[2]);
		} else if (command === 'Q') {
			quadX = seg[1];
			quadY = seg[2];
			seg = quadratic(x, y, seg[1], seg[2], seg[3], seg[4]);
		} else if (command === 'H') {
			seg = line(x, y, seg[1], y);
		} else if (command === 'V') {
			seg = line(x, y, x, seg[1]);
		} else if (command === 'Z') {
			seg = line(x, y, startX, startY);
		}

		// update state
		prev = command;
		x = seg[seg.length - 2];
		y = seg[seg.length - 1];
		if (seg.length > 4) {
			bezierX = seg[seg.length - 4];
			bezierY = seg[seg.length - 3];
		} else {
			bezierX = x;
			bezierY = y;
		}
		result.push(seg);
	});

	return result;
}
