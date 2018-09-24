import assign from 'object-assign';
import { Shader } from '@pixi/core';

import vertexShader from './shape.vert';
import fragmentShader from './shape.frag';

export default function ShapeShader(uniforms) {
	return Shader.from(vertexShader, fragmentShader, assign({
		uColor: [0.5, 0.5, 0.5, 1]
	}, uniforms));
}