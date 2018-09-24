import SVGDrawable from './SVGDrawable';
import Text from './Text';

import createSVGElement from './createSVGElement';

const stylesheets = new WeakMap();
const elementSizes = new WeakMap();

function fontStyleRule(size) {
	return `.font-${size} {
		font-family: Arial;
		font-size: ${size}px;
		text-anchor: middle;
		dominant-baseline: middle;
	}`;
}

function setFontStyle(svg, element, size) {
	let sheetSizes = stylesheets.get(svg);
	if (elementSizes.has(element)) {
		// clear out old style if it exists
		const oldSize = elementSizes.get(element);
		if (oldSize === size) {
			return;
		}

		element.classList.remove('font-' + oldSize);
		if (oldSize && sheetSizes && sheetSizes.has(oldSize)) {
			const sheetInfo = sheetSizes.get(oldSize);
			const { elements, styleElement } = sheetInfo;
			if (elements && elements.has(element)) {
				elements.delete(element);
				if (!elements.size && styleElement.parentNode) {
					styleElement.parentNode.removeChild(styleElement);
					sheetSizes.delete(oldSize);
				}
			}
		}
	}
	if (!size) {
		return;
	}

	elementSizes.set(element, size);

	if (!sheetSizes) {
		sheetSizes = new Map();
		stylesheets.set(svg, sheetSizes);
	}
	let sheetInfo = sheetSizes.get(size);
	if (!sheetInfo) {
		const styleElement = createSVGElement('style', svg.ownerDocument);
		svg.insertBefore(styleElement, svg.firstChild);
		const rule = fontStyleRule(size);
		styleElement.appendChild(svg.ownerDocument.createTextNode(rule));
		sheetInfo = {
			styleElement,
			elements: new Set()
		};
		sheetSizes.set(size, sheetInfo);
	}
	sheetInfo.elements.add(element);
	element.classList.add('font-' + size);
}

function SVGText(parent, drawable) {
	SVGDrawable.call(this, parent, drawable);

	let textElement = null;

	const svg = parent.ownerSVGElement;

	const superUpdate = this.update;
	this.update = () => {
		const text = drawable && drawable.text || '';
		if (!this.element) {
			textElement = this.element = createSVGElement('text');
			textElement.appendChild(document.createTextNode(text));

			if (parent) {
				parent.appendChild(this.element);
			}
		} else {
			textElement.firstChild.nodeValue = text;
		}

		setFontStyle(svg, textElement, drawable.visible ? drawable.size : undefined);

		if (drawable && text) {
			const hex = ('00000' + drawable.color.toString(16)).slice(-6);
			textElement.setAttribute('fill', '#' + hex);
		}

		superUpdate.call(this);
	};

	const superDestroy = this.destroy;
	this.destroy = () => {
		if (textElement) {
			setFontStyle(svg, textElement, undefined);
		}
		superDestroy.call(this);
	};
}

SVGText.prototype = Object.create(SVGDrawable.prototype);
SVGDrawable.register(Text, SVGText);

export default SVGText;