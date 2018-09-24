import geneColor from '../geneColor';
import random from '../../util/random';
import getContrastTextColor from '../../util/getContrastTextColor';
import arc from '../../drawing/shapes/arc';
import Path from '../../drawing/Path';
import Text from '../../drawing/Text';

import num from '../../util/num';

// hard limit on max number of rows allowed in spreadsheet.
import { DISPLAY_ROW_LIMIT } from '../constants';

// const mix = (t, x, y) => x * (1 - t) + y * t;

const TEXT_SCALE = 1 / 200;

function generateChart(parent, indices, getvalue, total) {
	parent.destroyChildren();

	let startAngle = 0;

	indices.forEach(index => {
		// one pie slice for each row
		const size = getvalue('size', index) / total;

		const outer = new Path();
		outer.id = 'outer-' + index;
		outer.data.id = index;
		parent.add(outer);

		if (!size) {
			// no need to bother drawing anything
			return;
		}

		const angle = Math.PI * 2 * size;
		const halfAngle = angle / 2;

		// used for setting the fixed rotation of the wedge
		outer.rotation = startAngle + halfAngle;

		// the actual wedge, with the start angle at zero
		const slice = new Path(arc(0, 0, 0.5, -halfAngle, halfAngle));
		outer.add(slice);

		startAngle += angle;
	});
}

function mutateChart(parent, indices, sourceData, genes, total) {
	const pathContainer = parent.children[0];
	const textContainer = parent.children[1];

	const radiusOffset = genes.get('radiusOffset') || 0;
	const radiusRankFactor = genes.get('radiusRankFactor') || 0;
	const radiusValueFactor = genes.get('radiusValueFactor') || 0;
	const radiusRandomFactor = genes.get('radiusRandomFactor') / 6;
	const totalRadiusFactor = Math.max(1, Math.abs(radiusOffset) + Math.abs(radiusRankFactor) + Math.abs(radiusValueFactor) + Math.abs(radiusRandomFactor));

	// const scale = genes.get('scale');
	// const scaleFactor = genes.get('scaleFactor');

	// const rotationOffset = genes.get('rotationOffset');
	// const rotationRankFactor = genes.get('rotationRankFactor');
	// const rotationValueFactor = genes.get('rotationValueFactor');
	// const rotationRandomFactor = genes.get('rotationRandomFactor');

	let maxRadius = 0;

	indices.forEach((index, rank) => {
		const outer = pathContainer.children[rank];
		const slice = outer && outer.children[0];
		if (!outer || !slice) {
			return;
		}

		const progress = rank / indices.length;

		// adjust position
		const size = sourceData.value('size', index); // todo: divide by total
		const radius = (radiusOffset +
			radiusRankFactor * progress +
			radiusValueFactor * size / total * 10 +
			radiusRandomFactor * random(index + size)) / (totalRadiusFactor || 1);

		maxRadius = Math.max(maxRadius, 0.25 + Math.abs(radius + 0.25));
		slice.x = radius;

		// slice.rotation = (rotationOffset +
		// 	rotationRankFactor * progress +
		// 	radiusValueFactor * vals[i] / total +
		// 	rotationRandomFactor * random(i + 2) / 2) * Math.PI / 2;

		/*
		If a hue field is provided, use it. If not, pick a random value.
		Hue range is scaled down by 90% to prevent looping red to red
		*/
		const colorVal = sourceData.has('color') ? sourceData.value('color', index) : progress;
		slice.color = geneColor(genes, colorVal);

		const text = textContainer.children[rank];
		if (text && textContainer.visible) {
			// const size = sourceData.value('size', index) / total;
			const angle = outer.rotation;
			const x = Math.cos(angle) * (radius + 0.25);
			const y = Math.sin(angle) * (radius + 0.25);
			text.position.set(x, y);
		}
	});

	return maxRadius;
}

function setLabels(parent, indices, sourceData, fontSize, color) {
	indices.forEach((index, rank) => {
		let text = parent.children[rank];
		const textValue = sourceData.original('label', index);
		if (text && textValue === text.text && fontSize === text.size && text.color === color) {
			// no change needed
			return;
		}

		if (text) {
			text.text = textValue;
		} else {
			text = new Text(textValue);
			text.id = 'label-' + index;
			text.data.id = index;
			const textScale = TEXT_SCALE / Math.log2(indices.length);
			text.scale.set(textScale, textScale);
			parent.add(text);
		}
		text.size = fontSize;
		text.color = color;
	});
}

/*
drawChart function parameters:
- container: a PIXI.Container object. Everything goes in here
- app: a reference to the PIXI.Application. Probably won't need it
*/
export default function drawChart(container/*, app*/) {
	const scaleContainer = new Path();
	container.add(scaleContainer);

	const chart = new Path();
	chart.position.set(0.5, 0.5);
	scaleContainer.add(chart);

	const pathContainer = new Path();
	chart.add(pathContainer);

	const textContainer = new Path();
	textContainer.id = 'labels';
	chart.add(textContainer);

	let maxRadius = 0.5;
	let height = 1;
	let width = 1;
	let data = null;
	let indices = null;
	let fieldMap = null;
	let total = 0;
	let fontSize = 0;
	let textColor = 0x0;

	function scaleChart() {
		// e.g. scale the chart to fill the space
		const adjustScale = (maxRadius || 1) * 2;
		const scale = Math.min(width, height) / adjustScale;
		scaleContainer.scale.set(scale, scale);

		const pos = 0.5 * adjustScale;
		chart.position.set(pos, pos);
	}

	return {
		/*
		Data, genes, tree structure, etc. will be provided in `props`,
		and this update function will be run every time any of those
		things change.
		*/
		update({ sourceData, genes, ...otherOpts }) {
			const showLabels = !!otherOpts.showLabels && sourceData.has('label');
			const newFontSize = otherOpts.fontSize || 26;
			let needTextUpdate = showLabels && (!textContainer.children.length || newFontSize !== fontSize);
			if (data !== sourceData.data || !fieldMap.equals(sourceData.fieldMap)) {
				data = sourceData.data;
				fieldMap = sourceData.fieldMap;
				indices = null;

				const { normalized } = sourceData;
				const rowCount = sourceData.count;
				const maxRows = Math.min(DISPLAY_ROW_LIMIT, rowCount);

				// sorting
				const orderIndices = normalized.map((row, index) => index);
				if (sourceData.has('order')) {
					orderIndices.sort((aIndex, bIndex) => {
						const aRank = sourceData.value('order', aIndex);
						const bRank = sourceData.value('order', bIndex);
						return aRank - bRank;
					});
				}
				orderIndices.length = Math.min(orderIndices.length, maxRows);

				indices = orderIndices;

				const sizeFieldType = sourceData.data.getIn(['fields', sourceData.field('size'), 'type']);
				const getValue = sizeFieldType === 'int' || sizeFieldType === 'float' ?
					sourceData.original :
					sourceData.value;
				total = indices.reduce((sum, i) => sum + num(getValue('size', i), 0), 0);
				generateChart(pathContainer, indices, getValue, total);

				needTextUpdate = showLabels;
			}

			if (showLabels) {
				const newTextColor = getContrastTextColor(otherOpts.backgroundColor);
				if (newTextColor !== textColor) {
					textColor = newTextColor;
					needTextUpdate = true;
				}
			}

			textContainer.visible = showLabels;
			if (needTextUpdate && showLabels) {
				fontSize = newFontSize;
				setLabels(textContainer, indices, sourceData, fontSize, textColor);
			}

			if (indices) {
				maxRadius = mutateChart(chart, indices, sourceData, genes, total);
			}
			scaleChart();
		},

		/*
		This function will run every time the window or container
		changes size.
		This is optional.
		*/
		resize(w, h) {
			height = h;
			width = w;

			scaleChart();
		},

		/*
		This runs before the PIXI Application is destroyed.
		Optional.
		*/
		destroy() {
			// clear out chart
			container.destroyChildren();
		}
	};
}
