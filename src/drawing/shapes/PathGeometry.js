import svgToMesh from '../../util/svgToMesh';
import { Renderer, Geometry } from '@pixi/core';
import { MeshRenderer } from '@pixi/mesh';
Renderer.registerPlugin('mesh', MeshRenderer);

// quick and dirty implementation
function flatten(source) {
	if (!source || !source.length) {
		return [source];
	}

	if (source.flatten) {
		return source.flatten();
	}

	let out = [];
	for (let i = 0; i < source.length; i++) {
		const val = source[i];
		if (val && val.length) {
			out = out.concat(flatten(val));
		} else {
			out.push(val);
		}
	}

	return out;
}

function PathGeometry(path) {
	Geometry.call(this);

	const { positions, cells } = svgToMesh(path, {
		normalize: false,
		scale: 200
	});
	const vPositions = flatten(positions);
	const indices = flatten(cells);

	this.addAttribute('aVertexPosition', vPositions, 2)
		.addIndex(indices);
}

PathGeometry.prototype = Object.create(Geometry.prototype);

export default PathGeometry;