import { Container } from '@pixi/display';
import { Renderer } from '@pixi/core';

import { Graphics, GraphicsRenderer } from '@pixi/graphics';
Renderer.registerPlugin('graphics', GraphicsRenderer);

import {
	MAX_SPRITE_SIZE,

	CHILD_SPACING_ANGLE,
	CHILD_SPACING_RADIUS,
	// COLLISION_RADIUS,
	LINE_WIDTH,
	ANIMATION_DURATION
} from './constants';

import num from '../util/num';

const LINE_SPACING = Math.sqrt(0.5);

const easeInOutCubic = t => t < 0.5 ?
	4 * t * t * t :
	(t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

// assumes x and y scale are the same
const worldScale = displayObject => {
	const wt = displayObject.worldTransform;
	const { a, b } = wt;
	return Math.sqrt(a * a + b * b);
};

export default function Node(options) {
	const {
		parent,
		container,
		app,
		chartDefinition,
		allNodes,
		quadTree,
		spritePool,
		path,
		rotation,
		...otherOpts
	} = options;

	const pathString = path.join('/');
	const res = app.renderer.resolution;
	const maxSpriteSize = MAX_SPRITE_SIZE * res;
	const lineColor = num(options.lineColor, 0xFF8888);

	let sketchDirty = true;
	let spriteDirty = true;
	let geneNode = null;
	let genes = null;
	let line = null;
	let x = 0;
	let y = 0;

	const qtRect = {
		node: this,
		x: 0,
		y: 0,
		width: 1,
		height: 1
	};

	const insertNode = () => {
		if (allNodes.has(pathString)) {
			quadTree.removeObject(qtRect);
		}
		qtRect.x = x - 0.5;
		qtRect.y = y - 0.5;
		allNodes.set(pathString, this);
		quadTree.insert(qtRect);
	};

	function drawLine() {
		if (line) {
			const dx = x - parent.x;
			const dy = y - parent.y;
			const len = Math.sqrt(dx * dx + dy * dy);
			const dirX = dx / len;
			const dirY = dy / len;
			const spacingX = dirX * LINE_SPACING;
			const spacingY = dirY * LINE_SPACING;

			line.clear();
			line.lineStyle(LINE_WIDTH, lineColor, .3);

			line.moveTo(spacingX, spacingY);
			line.lineTo(dx - spacingX, dy - spacingY);
			line.position.set(parent.x, parent.y);
		}
	}

	this.parent = parent;
	this.children = [];
	this.container = new Container();
	this.container.visible = false;
	this.path = path;
	this.time = 0;

	const spriteSource = spritePool.get(pathString);
	const spriteContainer = new Container();
	spriteContainer.position.set(-0.5, -0.5);
	this.container.addChild(spriteContainer);

	const drawingContainer = new Container();
	drawingContainer.position.set(-0.5, -0.5);
	this.container.addChild(drawingContainer);

	insertNode();

	if (parent) {
		line = new Graphics();
		container.addChildAt(line, 0);
	}
	container.addChild(this.container);

	const renderCallback = rt => {
		// temporarily set drawingContainer size to match target resolution
		const size = rt.width;
		drawingContainer.visible = true;
		drawingContainer.position.set(0, 0);
		drawingContainer.scale.set(size, size);

		app.renderer.render(drawingContainer, rt, true);

		// set back to original
		drawingContainer.position.set(-0.5, -0.5);
		drawingContainer.scale.set(1, 1);

		spriteDirty = false;
	};

	const render = () => {
		if (!this.visible) {
			spriteSource.release();
			return;
		}

		this.container.updateTransform();

		const renderSize = worldScale(this.container) * res;
		const sprite = renderSize <= maxSpriteSize && spriteSource.render(renderSize, renderCallback, !!spriteDirty);
		if (sprite) {
			spriteContainer.visible = true;
			drawingContainer.visible = false;
			if (sprite !== spriteContainer.children[0]) {
				spriteContainer.removeChildren();
				spriteContainer.addChild(sprite);
			}
		} else {
			spriteContainer.visible = false;
			drawingContainer.visible = true;
		}
	};

	const animate = () => {
		const diff = Date.now() - this.time;
		const t = Math.max(0, Math.min(1, diff / ANIMATION_DURATION));
		const r = easeInOutCubic(t);
		const parentX = parent ? parent.x : 0;
		const parentY = parent ? parent.y : 0;
		const xOffset = x - parentX;
		const yOffset = y - parentY;
		this.container.x = parentX + xOffset * r;
		this.container.y = parentY + yOffset * r;
		if (line) {
			line.scale.set(r, r);
		}
		if (t >= 1) {
			app.ticker.remove(animate);
		}
	};
	app.ticker.add(animate);

	this.sketch = chartDefinition.draw(drawingContainer, app, {
		genes,
		...otherOpts
	});

	this.updateGenes = newGeneNode => {
		if (geneNode === newGeneNode) {
			return;
		}

		sketchDirty = true;

		geneNode = newGeneNode;
		genes = geneNode.get('genes');

		const children = geneNode.get('children');

		this.time = geneNode.get('time');

		// remove any deleted child nodes
		for (let i = this.children.length - 1; i >= children.size; i--) {
			const childGeneNode = this.children.pop();
			childGeneNode.destroy();
		}

		const totalSpread = (children.size - 1) * CHILD_SPACING_ANGLE;
		const centerAngle = rotation - Math.PI / 2;
		const startAngle = centerAngle - totalSpread / 2;// - CHILD_SPACING_ANGLE / 2;

		const cos = Math.cos(centerAngle);
		const sin = Math.sin(centerAngle);

		// update existing nodes and add new ones
		children.forEach((childGeneNode, i) => {
			let drawNode = this.children[i];
			if (!drawNode) {
				const angle = startAngle + i * CHILD_SPACING_ANGLE;

				const offset = childGeneNode.getIn(['opts', 'offset']) || 0;
				const xOffset = cos * offset;
				const yOffset = sin * offset;

				const x = this.x + xOffset + Math.cos(angle) * CHILD_SPACING_RADIUS;
				const y = this.y + yOffset + Math.sin(angle) * CHILD_SPACING_RADIUS;

				drawNode = this.children[i] = new Node({
					parent: this,
					container,
					app,
					rotation: angle + Math.PI / 2,
					chartDefinition,
					allNodes,
					quadTree,
					spritePool,
					path: path.concat(['children', i]),
					...otherOpts
				});

				drawNode.setPosition(x, y);
			}
			drawNode.updateGenes(childGeneNode);
		});
	};

	this.update = opts => {
		if (sketchDirty) {
			this.sketch.update({
				genes,
				...otherOpts
			});
			sketchDirty = false;
			spriteDirty = true;
			animate();
			render();
		}

		this.children.forEach(child => child.update(opts));
	};

	this.render = render;

	this.destroy = () => {
		this.children.forEach(child => child.destroy());

		allNodes.delete(pathString);
		quadTree.removeObject(qtRect);
		spriteSource.destroy();

		app.ticker.remove(animate);
		if (this.sketch.destroy) {
			this.sketch.destroy();
		}

		if (line) {
			line.clear();
			line.parent.removeChild(line);
			line = null;
		}

		this.container.removeChildren();
		container.removeChild(this.container);
	};

	this.setPosition = (newX, newY) => {
		if (x !== newX && y !== newY) {
			x = newX;
			y = newY;
			this.container.position.set(x, y);
			drawLine();
			insertNode();
		}
	};

	Object.defineProperties(this, {

		// probably temporary
		rotation: {
			get: () => rotation
		},

		x: {
			get: () => x,
			set: val => this.setPosition(val, y)
		},
		y: {
			get: () => y,
			set: val => this.setPosition(x, val)
		},
		visible: {
			get: () => this.container.visible,
			set: val => {
				val = !!val;

				this.container.visible = val;
				if (line) {
					line.visible = val || parent.visible;
				}
				if (val) {
					for (let i = 0; i < this.children.length; i++) {
						const child = this.children[i];
						child.visible = !!child.visible;
					}
				}
			}
		}
	});
}
