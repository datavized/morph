// /* global DEBUG */

import { Graphics, GraphicsRenderer } from '@pixi/graphics';
import { Renderer } from '@pixi/core';
import { Container } from '@pixi/display';
import { Point } from '@pixi/math';

Renderer.registerPlugin('graphics', GraphicsRenderer);

import Node from './tree-node';
import Quadtree from '../util/Quadtree';
import SpritePool from '../drawing/SpritePool';
import PanZoom from './PanZoom';
import fmod from '../util/fmod';
// import num from '../util/num';

import {
	MIN_SCALE,
	MAX_SCALE,
	ZOOM_SPEED,
	DEFAULT_ZOOM,
	PAN_ZOOM_TIME,

	COLLISION_MARGIN,
	CHILD_SPACING_RADIUS
} from './constants';

const collisionPathRadius = CHILD_SPACING_RADIUS + COLLISION_MARGIN;
const collisionRadiusSquared = collisionPathRadius * collisionPathRadius;

// working vector objects
const relativePos = new Point();
const upperLeft = new Point(0, 0);
const lowerRight = new Point(0, 0);
const scratchRect = {
	x: 0,
	y: 0,
	width: 0,
	height: 0
};

const HALF_PI = Math.PI / 2;
const TAU = Math.PI * 2;

const prefixes = ['', '-webkit-', '-moz-'];

function setPrefixedStyleProp(style, key, val) {
	const oldVal = style[key];
	for (let i = 0; i < prefixes.length && style[key] === oldVal; i++) {
		style[key] = prefixes[i] + val;
	}
}

export default function drawTree(container, app, options) {
	const {
		chartDefinition,
		sourceData,
		...other
	} = options;

	const canvas = app.renderer.view;

	const zoomContainer = new Container();
	container.addChild(zoomContainer);

	const panContainer = new Container();
	zoomContainer.addChild(panContainer);

	// const highlightColor = num(options.highlightColor, 0x8888AA);
	// const lineColor = num(options.lineColor, 0xFF8888);
	const highlightColor = 0x8888AA;
	const lineColor = 0xFF8888;

	const highlight = new Graphics();
	highlight.beginFill(highlightColor, 0.5);
	highlight.drawRect(-0.55, -0.55, 1.1, 1.1);
	highlight.endFill();
	highlight.visible = false;
	panContainer.addChild(highlight);

	const unusedHighlights = [];
	const nodeHighlights = new Map();

	const allNodes = new Map(); // path => Node
	const invisibleNodes = new Set();
	const quadTree = new Quadtree({
		x: 0,
		y: 0,
		width: 0,
		height: 0
	});
	const spritePool = new SpritePool({
		maxTextureSize: Math.min(8192, app.renderer.gl.getParameter(
			app.renderer.gl.MAX_RENDERBUFFER_SIZE
		))
	});
	let highlightedNode = null;
	let panZoom = null;

	function highlightNodes() {
		allNodes.forEach(node => {
			// if node is resettable, make/get a highlight
			const hover = node && options.hoverNode ? options.hoverNode(node.path) : !!node;
			if (hover) {
				let hl = unusedHighlights.pop();
				if (!hl) {
					hl = new Graphics();
					hl.beginFill(0, 0);
					hl.lineStyle(0.02, lineColor, 1);
					hl.drawRect(-0.55, -0.55, 1.1, 1.1);
					hl.endFill();
					panContainer.addChild(hl);
				}

				nodeHighlights.set(node, hl);

				const bounds = node.container.getLocalBounds();
				const s = Math.max(bounds.width, bounds.height);
				hl.position.set(node.x, node.y);
				hl.scale.set(s, s);
				hl.visible = true;
			} else if (nodeHighlights.has(node)) {
				const hl = nodeHighlights.get(node);
				hl.visible = false;
				nodeHighlights.delete(node);
				unusedHighlights.push(hl);
			}
		});
	}

	function removeHighlights() {
		highlightedNode = null;
		nodeHighlights.forEach((hl, node) => {
			hl.visible = false;
			nodeHighlights.delete(node);
			unusedHighlights.push(hl);
		});
	}

	function updateMouseCursor() {
		/*
		canvas has `user-select: none`
		*/
		const mouseElement = canvas.parentNode;

		if (panZoom && panZoom.dragging) {
			setPrefixedStyleProp(mouseElement.style, 'cursor', 'grabbing');
		} else if (highlightedNode) {
			setPrefixedStyleProp(mouseElement.style, 'cursor', 'pointer');
		} else {
			setPrefixedStyleProp(mouseElement.style, 'cursor', 'grab');
		}
	}

	function hoverNode(node) {
		const hover = node && options.hoverNode ? options.hoverNode(node.path) : !!node;
		const hn = hover && node || null;
		if (hn !== highlightedNode) {
			highlightedNode = hn;
			if (highlightedNode) {
				const bounds = hn.container.getLocalBounds();
				const s = Math.max(bounds.width, bounds.height);
				highlight.position.set(node.x, node.y);
				highlight.scale.set(s, s);

				highlight.visible = true;
			} else {
				highlight.visible = false;
			}
		}
	}

	// positive = above; negative = below; zero = exactly on line
	function checkPointToLine(m, b, point) {
		const [x, y] = point;
		const lineY = m * x + b;
		return y - lineY;
	}

	function rectPoints(rect) {
		const x1 = rect.x;
		const x2 = x1 + rect.width;
		const y1 = rect.y;
		const y2 = y1 + rect.height;
		return [
			[x1, y1],
			[x1, y2],
			[x2, y1],
			[x2, y2]
		];
	}

	/*
	For now, we're going to run collision detection computation
	to calculate the offset for how far away the next set of
	child nodes needs to be.

	This should probably be moved out of tree code and into
	another module called by the Evolution component, which would
	fully compute the x,y coordinates of each node and store it
	as part of the app state. The tree drawing code should be dumber
	and just place the nodes where the app state tells it to.

	The way it is now, we're probably also wasting time computing offset
	when we don't need it. But let's get it working and committed first,
	and we can worry about restructuring the whole app later.
	*/
	function clickNode(node, delay = 0) {
		const { x, y } = node;
		const rotation = fmod(node.rotation + Math.PI, TAU) - Math.PI;
		const direction = Math.abs(rotation) > HALF_PI ? -1 : 1;

		const mNear = Math.tan(rotation); // todo: what if rotation = 90deg?
		const bNear = y - mNear * x;

		let lowTest;
		let highTest;
		let linePosition;
		let lineDistance;
		if (mNear === 0) {
			lowTest = p => x - p[0] <= collisionPathRadius;
			highTest = p => p[0] - x <= collisionPathRadius;
			linePosition = p => [x, p[1]];
			lineDistance = p => y - p[1];
		} else {
			/*
			Find the line equations for the right and left edges
			of the rectangle representing the collision path of this
			node and its children.

			The slope of those lines (mSide) is derived from the slope
			of the near edge (mNear). We find the near corner points of the
			rectangle and use those to calculate the Y-intercepts of the edge
			lines (b0 and b1)
			*/
			const mSide = -1 / mNear;
			const cos = Math.cos(rotation);
			const xOffset = cos * collisionPathRadius;

			const x0 = x - xOffset;
			const y0 = mNear * x0 + bNear;
			const b0 = y0 - mSide * x0;

			const x1 = x + xOffset;
			const y1 = mNear * x1 + bNear;
			const b1 = y1 - mSide * x1;

			const bLow = Math.min(b0, b1);
			const bHigh = Math.max(b0, b1);
			lowTest = p => checkPointToLine(mSide, bLow, p) >= 0;
			highTest = p => checkPointToLine(mSide, bHigh, p) <= 0;

			/*
			We need to calculate the equation for the center line
			so we can find the minimum distance along that line of
			each node. Sort by that distance and iterate through those
			values until we find a gap with enough space to fit our
			now child nodes.
			*/

			// bMid is Y-intercept of center line
			const bMid = y - mSide * x;

			const aSquaredPlusBSquared = mSide * mSide + 1;
			const a = -mSide;
			const c = -bMid;

			linePosition = ([px, py]) => {
				// find closest point on line to target point
				const lineX = (px - a * py - a * c) / aSquaredPlusBSquared;
				const lineY = (a * (-1 * px + a * py) - c) / aSquaredPlusBSquared;
				return [lineX, lineY];
			};
			lineDistance = p => {
				const [lineX, lineY] = linePosition(p);
				const dx = x - lineX;
				const dy = y - lineY;

				// find distance to new point on line
				const dist = Math.sqrt(dx * dx + dy * dy);

				/*
				We need to know the sign of the distance
				- if angle is positive, +dist will be when lineX > x
				- if angle is negative, +dist will be when lineX < x
				*/
				if (rotation >= 0) {
					return lineX >= x ? dist : -dist;
				}

				return lineX <= x ? dist : -dist;
			};
		}

		// find all objects inside an infinite rectangle reaching out from this node
		const objects = quadTree.retrieve(rect => {
			const points = rectPoints(rect);

			/*
			Test three edges: near, left and right
			- at least one point of each rectangle needs to be inside the rectangle to pass
			- if any edge fails to match a rectangle, return early

			Remember +y goes DOWN the screen, so we're looking for objects BELOW node
			*/

			// first test against near edge
			const aboveNear = points.some(p => direction * checkPointToLine(mNear, bNear, p) <= 0);
			if (!aboveNear) {
				return false;
			}

			// check against low edge
			const insideLow = points.some(lowTest);
			if (!insideLow) {
				return false;
			}

			// check against high edge
			const insideHigh = points.some(highTest);
			if (!insideHigh) {
				return false;
			}

			return true;
		}).map(rect => {
			const points = rectPoints(rect);

			// dist is the farthest point along the line
			const dist = points.reduce((prev, p) => Math.max(lineDistance(p), prev), -Infinity);
			return {
				points,
				node: rect.node,
				dist
			};
		});
		objects.sort((a, b) => a.dist - b.dist);

		let offset = objects.length ? objects[0].dist : 0;
		for (let i = 0; i < objects.length; i++) {
			const object = objects[i];

			// find point along center line at current offset
			const [cx, cy] = linePosition([object.node.x, object.node.y]);

			let collides = false;
			for (let j = i; !collides && j < objects.length; j++) {
				const next = objects[j];
				if (next.dist >= offset) {
					const dx = next.node.x - cx;
					const dy = next.node.y - cy;
					const d2 = dx * dx + dy * dy;
					collides = d2 < collisionRadiusSquared;
				}
			}
			if (collides) {
				offset = object.dist;
			} else {
				break;
			}
		}

		offset = Math.max(0, offset + 0.75); // fudge factor

		if (options.clickNode) {
			options.clickNode(node.path, { offset, delay });
		}
	}

	const tree = new Node({
		container: panContainer,
		parent: null,
		app,
		allNodes,
		quadTree,
		spritePool,
		chartDefinition,
		sourceData,
		rotation: 0,
		path: ['tree', chartDefinition.key],
		...other
	});
	tree.updateGenes(sourceData.tree);
	panContainer.addChild(tree.container);

	let canvasSize = 0;
	let zoomScale = DEFAULT_ZOOM;

	// start centered on first node
	panContainer.y = 0.1 / zoomScale;

	function updateCulling() {
		const r = app.renderer.resolution;

		container.updateTransform();

		upperLeft.set(0, 0);
		lowerRight.set(app.renderer.width / r, app.renderer.height / r);
		panContainer.worldTransform.applyInverse(upperLeft, upperLeft);
		panContainer.worldTransform.applyInverse(lowerRight, lowerRight);

		invisibleNodes.clear();
		allNodes.forEach(node => invisibleNodes.add(node));

		const x = upperLeft.x;
		const y = upperLeft.y;
		const width = lowerRight.x - x;
		const height = lowerRight.y - y;

		const visibleNodes = quadTree.retrieve({ x, y, width, height });
		visibleNodes.forEach(result => invisibleNodes.delete(result.node));
		invisibleNodes.forEach(node => {
			if (node.visible) {
				node.visible = false;
				node.render();
			}
		});
		visibleNodes.forEach(result => {
			result.node.visible = true;
			result.node.render();
		});

		// if (DEBUG) {
		// 	console.log('visibleNodes', visibleNodes.length);
		// }
	}

	function updateScale() {
		if (!canvasSize) {
			// don't run anything until we know the canvas size
			return;
		}

		const scale = canvasSize * zoomScale;
		zoomContainer.scale.set(scale, scale);

		updateCulling();
	}

	let targetZoomScale = zoomScale;
	let targetPanX = 0;
	let targetPanY = panContainer.y;
	let panRateX = 0;
	let panRateY = 0;
	let zoomRate = 0;
	let lastPanZoomTime = 0;
	function animatePanZoom() {
		let keepAnimating = false;
		let x = panContainer.x;
		let y = panContainer.y;

		const now = Date.now();
		const delta = (now - lastPanZoomTime) / 1000;
		if (lastPanZoomTime && delta) {
			// const maxDz = delta * AUTO_ZOOM_SPEED;
			// const dz = Math.max(-maxDz, Math.min(maxDz, targetZoomScale - zoomScale));
			const maxDz = zoomRate * delta;
			const dz = Math.max(-maxDz, Math.min(maxDz, targetZoomScale - zoomScale));
			zoomScale += dz;

			// const maxDist = delta * AUTO_PAN_SPEED;
			// x += Math.max(-maxDist, Math.min(maxDist, targetPanX - x));
			// y += Math.max(-maxDist, Math.min(maxDist, targetPanY - y));
			const maxDistX = delta * panRateX;
			x += Math.max(-maxDistX, Math.min(maxDistX, targetPanX - x));
			const maxDistY = delta * panRateY;
			y += Math.max(-maxDistY, Math.min(maxDistY, targetPanY - y));

			panContainer.position.set(x, y);
			updateScale();
		}
		lastPanZoomTime = now;

		if (Math.abs(zoomScale - targetZoomScale) < Number.EPSILON) {
			zoomScale = targetZoomScale;
		} else {
			keepAnimating = true;
		}
		if (Math.abs(x - targetPanX) < Number.EPSILON) {
			x = targetPanX;
		} else {
			keepAnimating = true;
		}
		if (Math.abs(y - targetPanY) < Number.EPSILON) {
			y = targetPanY;
		} else {
			keepAnimating = true;
		}

		if (!keepAnimating) {
			app.ticker.remove(animatePanZoom);
		}
	}

	function wheel(e) {
		const delta = e.deltaY === undefined && e.detail !== undefined ? -e.detail : -e.deltaY || 0;
		const wheelScale = e.deltaMode === 1 ? 100 : 1;
		zoomScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, zoomScale * Math.pow(1.0001, delta * wheelScale * ZOOM_SPEED)));
		updateScale();

		/*
		todo:
		center zoom on current mouse position
		*/

		// reset pan/zoom animation
		targetZoomScale = zoomScale;
		targetPanX = 0;
		targetPanY = panContainer.y;

		e.preventDefault();
	}

	function findNode(x, y) {
		const matrix = panContainer.worldTransform;
		relativePos.set(x, y);
		matrix.applyInverse(relativePos, scratchRect);

		const nodes = quadTree.retrieve(scratchRect);
		return nodes && nodes[0] && nodes[0].node || null;
	}

	panZoom = new PanZoom(canvas, function onPan(dx, dy) {
		panContainer.x += dx / canvasSize / zoomScale;
		panContainer.y += dy / canvasSize / zoomScale;

		// reset pan/zoom animation
		targetZoomScale = zoomScale;
		targetPanX = 0;
		targetPanY = panContainer.y;

		hoverNode(null);
		updateCulling();
		updateMouseCursor();
	}, function onZoom(zoomFactor) {
		zoomScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, zoomScale * zoomFactor));
		updateScale();

		/*
		todo:
		center zoom on current mouse position
		*/

		// reset pan/zoom animation
		targetZoomScale = zoomScale;
		targetPanX = 0;
		targetPanY = panContainer.y;
	});

	function mouseUp(e) {
		if (!panZoom.changed) {
			let x = e.pageX;
			let y = e.pageY;
			let parent = canvas;
			while (parent) {
				x -= parent.offsetLeft;
				y -= parent.offsetTop;
				parent = parent.offsetParent;
			}

			const node = findNode(x, y);
			if (node) {
				clickNode(node);
			}
		}
		updateMouseCursor();
	}

	function mouseMove(e) {
		if (!panZoom.dragging) {
			let x = e.pageX;
			let y = e.pageY;
			let parent = canvas;
			while (parent) {
				x -= parent.offsetLeft;
				y -= parent.offsetTop;
				parent = parent.offsetParent;
			}
			hoverNode(findNode(x, y));
		}
		updateMouseCursor();
	}

	function focusNode(centerNodePath) {
		const centerNode = allNodes.get(centerNodePath);
		if (!centerNode) {
			return;
		}

		// calculate desired zoom
		// only zoom out to fit. if we're already zoomed out, stay where we are
		const c = centerNode.children.length;
		const z = c ? 1 / 8 : 0.35;
		const n = 1 + c;
		targetZoomScale = Math.min(z, zoomScale);
		zoomRate = Math.abs(z - zoomScale) / PAN_ZOOM_TIME;

		// calculate desired center point
		let x = -centerNode.x / n;
		let y = -centerNode.y / n - 0.1 / z;
		centerNode.children.forEach(childNode => {
			x -= childNode.x / n;
			y -= childNode.y / n;
		});

		// only pan if center point is a minimum distance from current center
		const res = app.renderer.resolution;
		const size = Math.min(app.renderer.width, app.renderer.height) / (canvasSize * targetZoomScale) / res;
		const margin = 0.2 * size / 2;
		targetPanX = Math.max(x - margin, Math.min(x + margin, panContainer.x));
		targetPanY = Math.max(y - margin, Math.min(y + margin, panContainer.y));

		const dx = targetPanX - panContainer.x;
		const dy = targetPanY - panContainer.y;
		panRateX = Math.abs(dx) / PAN_ZOOM_TIME;
		panRateY = Math.abs(dy) / PAN_ZOOM_TIME;

		lastPanZoomTime = 0;

		app.ticker.remove(animatePanZoom);
		app.ticker.add(animatePanZoom);
	}

	function setInteraction(visible) {
		container.visible = visible;
		if (visible) {
			panZoom.start();
			window.addEventListener('wheel', wheel);
			canvas.addEventListener('click', mouseUp);
			window.addEventListener('mousemove', mouseMove);
		} else {
			panZoom.stop();
			window.removeEventListener('wheel', wheel);
			canvas.removeEventListener('click', mouseUp);
			window.removeEventListener('mousemove', mouseMove);

			app.ticker.remove(animatePanZoom);
		}
	}

	return {
		focus: focusNode,
		click: ({path, delay}) =>clickNode(allNodes.get(path.join('/')), delay),
		update(opts) {
			tree.updateGenes(opts.sourceData.tree);
			tree.update(opts);
			updateScale();
			setInteraction(!opts.hidden);

			if (highlightedNode && !allNodes.has(highlightedNode)) {
				hoverNode(null);
			}

			if (opts.highlightNodes) {
				highlightNodes();
			} else {
				removeHighlights();
			}
			updateMouseCursor();
		},
		resize(width, height) {
			container.x = width / 2;
			container.y = height / 2;

			canvasSize = Math.min(width, height);
			updateScale();
		},
		destroy() {
			setInteraction(false);
			spritePool.destroy();
			tree.destroy();
			zoomContainer.destroy(true);
			canvas.style.cursor = '';
		}
	};
}
