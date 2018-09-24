import SVGDrawable from './SVGDrawable';
import LinePath from './LinePath';
import createSVGElement from './createSVGElement';

function SVGLinePath(parent, drawable) {
	SVGDrawable.call(this, parent, drawable);

	const points = drawable && drawable.points;

	const superUpdate = this.update;
	this.update = () => {
		// create path or container if haven't done it yet
		if (!this.element) {
			if (points) {
				const [
					first,
					...rest
				] = points;
				const path = 'M ' + first.join(' ') +
					rest.map(p => 'L ' + p.join(' ')).join(' ');

				this.element = createSVGElement('path');
				this.element.setAttribute('d', path);
				this.element.setAttribute('fill', 'transparent');
			} else {
				this.element = createSVGElement('g');
			}
			if (parent) {
				parent.appendChild(this.element);
			}
		}

		if (drawable && points) {
			const hex = ('00000' + drawable.color.toString(16)).slice(-6);
			this.element.setAttribute('stroke', '#' + hex);

			this.element.setAttribute('stroke-width', drawable.lineWidth);
		}
		superUpdate.call(this);
	};
}

SVGLinePath.prototype = Object.create(SVGDrawable.prototype);
SVGDrawable.register(LinePath, SVGLinePath);

export default SVGLinePath;