import assign from 'object-assign';

const constructors = [];

function SVGDrawable(parent, drawable) {
	const children = new Map();
	this.element = null;

	function removeChild(childPath) {
		const svgDrawable = children.get(childPath);
		if (svgDrawable) {
			children.delete(childPath);
		}
	}

	this.update = () => {
		// update matrix - copy from drawable
		if (parent && drawable && !drawable.visible && this.element) {
			parent.removeChild(this.element);
			this.element = null;
		}
		if (drawable && drawable.visible && this.element) {
			this.element.id = drawable.id;

			const dataset = this.element.dataset;
			Object.keys(dataset).forEach(k => delete dataset[k]);
			if (drawable.data && typeof drawable.data === 'object') {
				// Object.keys(drawable.data).forEach(k => delete dataset[k]);
				assign(dataset, drawable.data);
			}

			// if (drawable.visible) {
			// 	this.element.removeAttribute('visibility');
			// } else {
			// 	this.element.setAttribute('visibility', 'collapse');
			// }

			if (drawable.opacity < 1) {
				this.element.setAttribute('opacity', drawable.opacity);
			} else {
				this.element.removeAttribute('opacity');
			}

			const {
				a,
				b,
				c,
				d,
				tx,
				ty
			} = drawable.matrix;
			if (a === 1 && b === 0 && c === 0 && d === 1 && tx === 0 && ty === 0) {
				// identity. don't need any transform
				this.element.removeAttribute('transform');
			} else {
				this.element.setAttribute('transform', `matrix(${[a, b, c, d, tx, ty].join(', ')})`);
			}
		}
		if (drawable && drawable.visible) {
			// update children
			drawable.children.forEach(childDrawable => {
				let svgDrawable = children.get(childDrawable);
				if (!svgDrawable) {
					let ChildConstructor = SVGDrawable;
					for (let i = 0; i < constructors.length; i++) {
						const [D, S] = constructors[i];
						if (childDrawable instanceof D) {
							ChildConstructor = S;
							break;
						}
					}

					svgDrawable = new ChildConstructor(this.element, childDrawable);
					children.set(childDrawable, svgDrawable);
				}
				svgDrawable.update();
			});
		}
	};

	const callDestroy = () => this.destroy();
	this.destroy = () => {
		if (parent && this.element && this.element.parentElement === parent) {
			parent.removeChild(this.element);
		}

		if (drawable) {
			drawable.off('destroy', callDestroy);
			drawable.off('remove', removeChild);
		}

		children.clear();
	};

	if (drawable) {
		drawable.on('destroy', callDestroy);
		drawable.on('remove', removeChild);
	}
}

SVGDrawable.register = (drawable, svgDrawable) => constructors.push([drawable, svgDrawable]);

export default SVGDrawable;