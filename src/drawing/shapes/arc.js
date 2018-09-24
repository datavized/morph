import fmod from '../../util/fmod';

const TAU = Math.PI * 2;
const EPSILON = 0.000001;

const fix = n => Math.round(n * 1e9) / 1e9;

/*
Our code for converting SVG arcs to meshes doesn't do well when
we give it a circle, so as a workaround, we'll give it two half-circles
*/
export function circle(x, y, radius) {
	const startX = x + radius;
	const halfX = x - radius;
	return [
		'M', startX, y,
		'A', radius, radius, 0, 1, 0, halfX, y,
		'A', radius, radius, 0, 1, 0, startX, y
	].join(' ');
}

export default function arc(x, y, radius, startAngle, endAngle) {
	if (Math.abs(fmod(startAngle - endAngle, TAU)) < EPSILON) {
		return circle(x, y, radius);
	}

	const startX = fix(x + radius * Math.cos(endAngle));
	const startY = fix(y + radius * Math.sin(endAngle));
	const endX = fix(x + radius * Math.cos(startAngle));
	const endY = fix(y + radius * Math.sin(startAngle));
	const deltaAngle = endAngle - startAngle;

	const largeArcFlag = deltaAngle <= Math.PI ? 0 : 1;

	const path = [
		'M', x, y,
		'L', startX, startY,
		'A', radius, radius, 0, largeArcFlag, 0, endX, endY
	];

	return path.join(' ');
}