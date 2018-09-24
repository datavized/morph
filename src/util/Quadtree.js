import Quadtree from 'exports-loader?Quadtree!quadtree-js';

function contains(outer, inner) {
	const outerRight = outer.x + outer.width;
	const outerBottom = outer.y + outer.height;
	const innerRight = inner.x + inner.width;
	const innerBottom = inner.y + inner.height;

	return inner.x >= outer.x && inner.y >= outer.y && innerRight < outerRight && innerBottom < outerBottom;
}

function Q(bounds, maxObjects, maxLevels) {
	const root = new Quadtree(bounds, maxObjects, maxLevels);

	this.getIndex = pRect => root.getIndex(pRect);
	this.getAll = () => root.getAll();
	this.getObjectNode = obj => root.getObjectNode(obj);
	this.removeObject = obj => root.removeObject(obj);
	this.clear = () => root.clear();
	this.cleanup = () => root.cleanup();

	function retrieveByFunction(node, check) {
		if (!check(node.bounds)) {
			return null;
		}

		let objects = node.objects.filter(check);
		node.nodes.forEach(child => {
			const childObjects = child && retrieveByFunction(child, check);
			if (childObjects && childObjects.length) {
				objects = objects.concat(childObjects);
			}
		});
		return objects;
	}

	this.retrieve = bounds => {
		if (typeof bounds === 'function') {
			return retrieveByFunction(root, bounds) || [];
		}

		const boundsRight = bounds.x + bounds.width;
		const boundsBottom = bounds.y + bounds.height;
		return root.retrieve(bounds).filter(obj => {
			const objRight = obj.x + obj.width;
			const objBottom = obj.y + obj.height;
			return obj.x < boundsRight && obj.y < boundsBottom && objRight >= bounds.x && objBottom >= bounds.y;
		});
	};

	this.insert = obj => {
		const bounds = root.bounds;

		if (!contains(bounds, obj)) {
			const halfWidth = bounds.width / 2;
			const halfHeight = bounds.height / 2;
			const cx = bounds.x + halfWidth;
			const cy = bounds.y + halfHeight;

			bounds.x = Math.min(cx - bounds.width, obj.x);
			bounds.y = Math.min(cy - bounds.height, obj.y);

			const newRight = Math.max(obj.x + obj.width, cx + bounds.width);
			bounds.width = newRight - bounds.x;

			const newBottom = Math.max(obj.y + obj.height, cy + bounds.height);
			bounds.height = newBottom - bounds.y;

			if (root.nodes.length) {
				root.cleanup();
			}
		}

		root.insert(obj);
	};
}

export default Q;