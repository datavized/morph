import PixiDrawable from './PixiDrawable';
import Path from './Path';

import ShapeShader from './shader';
import PathGeometry from './shapes/PathGeometry';
import setColorArray from '../util/setColorArray';

import { Container } from '@pixi/display';
import { Renderer } from '@pixi/core';
import { MeshRenderer, RawMesh } from '@pixi/mesh';
Renderer.registerPlugin('mesh', MeshRenderer);

const geometries = new Map();

const GEOMETRY_LIFETIME = 10000;
let cleanTimeout = 0;
function pruneGeometries() {
	const now = Date.now();
	let next = Infinity;
	geometries.forEach((geo, path) => {
		if (geo.count <= 0) {
			if (now - geo.latest >= GEOMETRY_LIFETIME) {
				geo.geometry.destroy();
				geometries.delete(path);
			} else {
				next = Math.min(next, geo.latest);
			}
		}
	});

	if (geometries.size && next < Infinity) {
		cleanTimeout = setTimeout(pruneGeometries, next - now);
	} else {
		cleanTimeout = 0;
	}
}

function getGeometry(path) {
	let geo;
	if (geometries.has(path)) {
		geo = geometries.get(path);
	} else {
		geo = {
			geometry: new PathGeometry(path),
			count: 0,
			latest: 0
		};
		geometries.set(path, geo);
	}
	geo.latest = Date.now();
	geo.count++;
	return geo.geometry;
}

function releaseGeometry(path) {
	const geo = geometries.get(path);
	if (geo) {
		geo.count--;
		if (!cleanTimeout && geo.count <= 0) {
			cleanTimeout = setTimeout(pruneGeometries, GEOMETRY_LIFETIME);
		}
	}
}

function PixiPath(parent, drawable) {
	PixiDrawable.call(this, parent, drawable);

	const path = drawable && drawable.path;

	const superUpdate = this.update;
	this.update = () => {
		// create mesh or container if haven't done it yet
		if (!this.pixiObject) {
			if (path) {
				const geometry = path && getGeometry(path);
				const shader = geometry && new ShapeShader();
				this.pixiObject = new RawMesh(geometry, shader);
			} else {
				this.pixiObject = new Container();
			}
			if (parent) {
				parent.addChild(this.pixiObject);
			}
		}

		const drawable = this.drawable;
		const pixiObject = this.pixiObject;
		if (drawable) {
			// set color uniform
			if (this.pixiObject.shader) {
				const { uColor: color } = pixiObject.shader.uniforms;
				setColorArray(color, drawable.color, drawable.opacity);
			}
		}
		superUpdate.call(this);
	};

	const superDestroy = this.destroy;
	this.destroy = () => {
		if (path) {
			releaseGeometry(path);
		}

		superDestroy();
	};
}

PixiPath.prototype = Object.create(PixiDrawable.prototype);
PixiDrawable.register(Path, PixiPath);

export default PixiPath;