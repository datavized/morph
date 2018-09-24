import geneColor from '../geneColor';
import random from '../../util/random';
import getContrastTextColor from '../../util/getContrastTextColor';
import { circle } from '../../drawing/shapes/arc';
import Path from '../../drawing/Path';
import Text from '../../drawing/Text';

import num from '../../util/num';

// hard limit on max number of rows allowed in spreadsheet.
import { DISPLAY_ROW_LIMIT } from '../constants';

const TEXT_SCALE = 1 / 200;

function generateChart(parent, indices, sourceData) {
	parent.destroyChildren();

	const hasArea = sourceData.has('area');
	const hasX = sourceData.has('x');
	const hasY = sourceData.has('y');

	const circlePath = circle(0, 0, 1);
	const radiusScale = Math.PI / Math.log2(indices.length);

	indices.forEach((index, rank) => {
		// one bar for each row
		const area = hasArea ? sourceData.value('area', index) : 1;
		const radius = radiusScale * Math.sqrt(area / Math.PI);

		const progress = rank / indices.length;

		const x = hasX ? sourceData.value('x', index) || 0 : progress;
		const y = 1 - (hasY ? sourceData.value('y', index) || 0 : progress);

		const posContainer = new Path();
		const mutateContainer = new Path();

		const shape = new Path(circlePath);
		posContainer.position.set(x, y);
		shape.scale.set(radius, radius);

		parent.add(posContainer);
		posContainer.add(mutateContainer);
		mutateContainer.add(shape);
	});
}

function mutateChart(parent, indices, sourceData, genes) {
	const pathContainer = parent.children[0];
	const textContainer = parent.children[1];

	const areaOffset = genes.get('areaOffset') || 0;
	// const areaRankFactor = genes.get('areaRankFactor') || 0;
	// const areaRandomFactor = genes.get('areaRandomFactor') || 0;
	// const totalAreaFactor = Math.max(1, Math.abs(areaOffset) + Math.abs(areaRankFactor) + Math.abs(areaRandomFactor));

	const xOffset = genes.get('xOffset') || 0;
	const xRankFactor = genes.get('xRankFactor') || 0;
	const xRandomFactor = genes.get('xRandomFactor') || 0;
	const totalXFactor = Math.max(1, Math.abs(xOffset) + Math.abs(xRankFactor) + Math.abs(xRandomFactor));

	const yOffset = genes.get('yOffset') || 0;
	const yRankFactor = genes.get('yRankFactor') || 0;
	const yRandomFactor = genes.get('yRandomFactor') || 0;
	const totalYFactor = Math.max(1, Math.abs(yOffset) + Math.abs(yRankFactor) + Math.abs(yRandomFactor));

	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	indices.forEach((index, rank) => {
		const posContainer = pathContainer.children[rank];
		if (!posContainer) {
			return;
		}
		const mutateContainer = posContainer.children[0];
		const shape = mutateContainer.children[0];
		shape.data.id = index;

		const progress = rank / indices.length;
		const progressSpread = 2 * rank / indices.length - 1;

		const randSeed = index + num(sourceData.value('x', index), 5) +
			num(sourceData.value('y', index), 1) +
			num(sourceData.value('area', index), 2) +
			num(sourceData.value('color', index), 3);

		const radius = shape.scale.x;
		const left = posContainer.position.x - radius;
		const top = posContainer.position.y - radius;
		const right = left + radius;
		const bottom = top + radius;

		const x = (xOffset +
			xRankFactor * progressSpread +
			xRandomFactor * random(randSeed)) / (totalXFactor || 1);
		const dx = x < 0 ? x * left : x * (1 - right);

		const y = (yOffset +
			yRankFactor * progressSpread +
			yRandomFactor * random(randSeed + 1)) / (totalYFactor || 1);
		const dy = y < 0 ? y * top : y * (1 - bottom);

		// const r = 1 + (areaOffset +
		// 	areaRankFactor * progressSpread +
		// 	areaRandomFactor * random(randSeed)) / (totalAreaFactor || 1);
		const r = 1.1 + areaOffset;

		const scaledRadius = r * radius;

		mutateContainer.position.set(dx, dy);
		mutateContainer.scale.set(r, r);

		const colorVal = sourceData.has('color') ? sourceData.value('color', index) : progress;
		shape.color = geneColor(genes, colorVal);

		const cx = posContainer.x + dx;
		const cy = posContainer.y + dy;
		minX = Math.min(minX, cx - scaledRadius);
		maxX = Math.max(maxX, cx + scaledRadius);
		minY = Math.min(minY, cy - scaledRadius);
		maxY = Math.max(maxY, cy + scaledRadius);

		// position text at center of rectangle
		const text = textContainer.children[rank];
		if (text && textContainer.visible) {
			const cx = dx + posContainer.position.x;
			const cy = dy + posContainer.position.y;
			text.position.set(cx, cy);
		}
	});

	const xScale = 1 / (maxX - minX || 1);
	const yScale = 1 / (maxY - minY || 1);
	return [-minX, -minY, Math.min(xScale, yScale)];
}

function setLabels(parent, indices, sourceData, fontSize, color) {
	const textScale = TEXT_SCALE / Math.log2(indices.length);
	indices.forEach((index, rank) => {
		let text = parent.children[rank];
		const textValue = sourceData.original('label', index);
		if (text && textValue === text.text && fontSize === text.size && color === text.color) {
			// no change needed
			return;
		}

		if (text) {
			text.text = textValue;
		} else {
			text = new Text(textValue);
			text.id = 'label-' + index;
			text.data.id = index;
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
	const chart = new Path();
	container.add(chart);

	const pathContainer = new Path();
	chart.add(pathContainer);

	const textContainer = new Path();
	textContainer.id = 'labels';
	chart.add(textContainer);

	let height = 1;
	let width = 1;
	let fontSize = 0;
	let textColor = 0x0;
	let xOffset = 0;
	let yOffset = 0;
	let boundsScale = 1;

	let data = null;
	let indices = null;
	let fieldMap = null;

	function scaleChart() {
		// scale the chart to fill the space
		const scale = Math.min(width, height) * boundsScale;
		chart.scale.set(scale, scale);
		chart.position.set(xOffset * scale, yOffset * scale);
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
				const rowCount = Math.min(DISPLAY_ROW_LIMIT, sourceData.count);

				// we may want to draw background, axis lines, etc. here

				if (!rowCount/* || !sourceData.has('height') && !sourceData.has('area')*/) {
					// nothing to draw
					// todo: maybe a placeholder here? or some random data?

					pathContainer.destroyChildren();
					textContainer.destroyChildren();
					return;
				}

				// sort rows by 'order' field
				const orderIndices = normalized.map((row, index) => index);
				if (sourceData.has('order')) {
					orderIndices.sort((aIndex, bIndex) => {
						const aRank = sourceData.value('order', aIndex);
						const bRank = sourceData.value('order', bIndex);
						return aRank - bRank;
					});
				}
				orderIndices.length = rowCount;

				indices = orderIndices;
				generateChart(pathContainer, indices, sourceData);

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
				[xOffset, yOffset, boundsScale] = mutateChart(chart, indices, sourceData, genes);
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
