/*
Adapted from https://github.com/mattdesl/svg-mesh-3d/
MIT License
- Code style change for readability
- Use custom adaptation of normalize function (don't convert lines to curves)
- Don't convert points to 3D or flip Y axis
- Remove modules we don't plan to run to save on size
*/

import parseSVG from 'parse-svg-path';
import getContours from './contours';
import cdt2d from 'cdt2d';
import cleanPSLG from 'clean-pslg';
// import getBounds from 'bound-points';
// import normalize from 'normalize-path-scale';
// import random from 'random-float';
import assign from 'object-assign';
// import simplify from 'simplify-path';

// function to3D(positions) {
// 	for (let i = 0; i < positions.length; i++) {
// 		const xy = positions[i];
// 		xy[1] *= -1;
// 		xy[2] = xy[2] || 0;
// 	}
// }

// function addRandomPoints(positions, bounds, count) {
// 	const min = bounds[0];
// 	const max = bounds[1];

// 	for (let i = 0; i < count; i++) {
// 		positions.push([ // random [ x, y ]
// 			random(min[0], max[0]),
// 			random(min[1], max[1])
// 		]);
// 	}
// }

function denestPolyline(nested) {
	const positions = [];
	const edges = [];

	for (let i = 0; i < nested.length; i++) {
		const path = nested[i];
		const loop = [];
		for (let j = 0; j < path.length; j++) {
			const pos = path[j];
			let idx = positions.indexOf(pos);
			if (idx === -1) {
				positions.push(pos);
				idx = positions.length - 1;
			}
			loop.push(idx);
		}
		edges.push(loop);
	}
	return {
		positions: positions,
		edges: edges
	};
}

function svgToMesh(svgPath, opt) {
	if (typeof svgPath !== 'string') {
		throw new TypeError('must provide a string as first parameter');
	}

	opt = assign({
		delaunay: true,
		clean: true,
		exterior: false,
		randomization: 0,
		simplify: 0,
		scale: 1
	}, opt);

	// parse string as a list of operations
	const svg = parseSVG(svgPath);

	// convert curves into discrete points
	const contours = getContours(svg, opt.scale);

	// optionally simplify the path for faster triangulation and/or aesthetics
	// if (opt.simplify > 0 && typeof opt.simplify === 'number') {
	// 	for (let i = 0; i < contours.length; i++) {
	// 		contours[i] = simplify(contours[i], opt.simplify);
	// 	}
	// }

	// prepare for triangulation
	const polyline = denestPolyline(contours);
	const positions = polyline.positions;
	// const bounds = getBounds(positions);

	// optionally add random points for aesthetics
	// const randomization = opt.randomization;
	// if (typeof randomization === 'number' && randomization > 0) {
	// 	addRandomPoints(positions, bounds, randomization);
	// }

	const loops = polyline.edges;
	const edges = [];
	for (let i = 0; i < loops.length; ++i) {
		const loop = loops[i];
		for (let j = 0; j < loop.length; j++) {
			edges.push([loop[j], loop[(j + 1) % loop.length]]);
		}
	}

	// this updates points/edges so that they now form a valid PSLG
	if (opt.clean !== false) {
		cleanPSLG(positions, edges);
	}

	// triangulate mesh
	const cells = cdt2d(positions, edges, opt);

	// rescale to [-1 ... 1]
	// if (opt.normalize !== false) {
	// 	normalize(positions, bounds);
	// }

	// convert to 3D representation and flip on Y axis for convenience w/ OpenGL
	// to3D(positions);

	return {
		positions: positions,
		cells: cells
	};
}

export default svgToMesh;