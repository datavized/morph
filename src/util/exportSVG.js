import fieldMappedTable from './fieldMappedTable';
import createSVGElement from '../drawing/createSVGElement';
import Path from '../drawing/Path';
import SVGPath from '../drawing/SVGPath';
import '../drawing/SVGText';
import '../drawing/SVGLinePath';

export default function exportSVG(options) {
	const {
		data,
		nodePath,
		drawFunction,
		resolution,
		backgroundColor
	} = options;
	const sourceData = fieldMappedTable(data);
	const genes = data.getIn(nodePath).get('genes');

	const svg = createSVGElement('svg');
	const attributes = {
		xmlns: 'http://www.w3.org/2000/svg',
		version: '1.1',
		baseProfile: 'full',
		width: resolution,
		height: resolution,
		viewBox: '0 0 1 1'
	};
	Object.keys(attributes).forEach(key => {
		svg.setAttribute(key, attributes[key]);
	});

	if (backgroundColor && backgroundColor.a) {
		const {
			r, g, b, a
		} = backgroundColor;
		svg.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
	}

	const pathContainer = new Path();
	if (options.margin) {
		pathContainer.scale.set(0.8, 0.8);
		pathContainer.position.set(0.1, 0.1);
	}

	const renderableContainer = new SVGPath(svg, pathContainer);
	const draw = drawFunction(pathContainer);
	if (draw.update) {
		draw.update({
			sourceData,
			genes,
			backgroundColor: options.backgroundColor,
			title: options.showTitle && options.title,
			showLabels: !!options.showLabels,
			fontSize: options.labelFontSize
		});
	}
	renderableContainer.update();

	const svgSource = svg.outerHTML;

	// clean up
	if (draw.destroy) {
		draw.destroy();
	}
	pathContainer.destroyAll();
	renderableContainer.destroy();

	return svgSource;
}