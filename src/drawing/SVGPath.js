import SVGDrawable from './SVGDrawable';
import Path from './Path';
import createSVGElement from './createSVGElement';

function SVGPath(parent, drawable) {
	SVGDrawable.call(this, parent, drawable);

	const path = drawable && drawable.path;

	const superUpdate = this.update;
	this.update = () => {
		// create path or container if haven't done it yet
		if (!this.element) {
			if (path) {
				this.element = createSVGElement('path');
				this.element.setAttribute('d', path);
				this.element.setAttribute('stroke', 'transparent');
				this.element.setAttribute('stroke-width', 0);
			} else {
				this.element = createSVGElement('g');
			}
			if (parent) {
				parent.appendChild(this.element);
			}
		}

		if (drawable && path) {
			const hex = ('00000' + drawable.color.toString(16)).slice(-6);
			this.element.setAttribute('fill', '#' + hex);
		}
		superUpdate.call(this);
	};
}

SVGPath.prototype = Object.create(SVGDrawable.prototype);
SVGDrawable.register(Path, SVGPath);

export default SVGPath;