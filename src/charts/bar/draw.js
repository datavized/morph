import geneColor from '../geneColor';
import random from '../../util/random';
import getContrastTextColor from '../../util/getContrastTextColor';
import rectangle from '../../drawing/shapes/rectangle';
import Path from '../../drawing/Path';
import Text from '../../drawing/Text';

import num from '../../util/num';

// hard limit on max number of rows allowed in spreadsheet.
import { DISPLAY_ROW_LIMIT } from '../constants';

const TEXT_SCALE = 1 / 200;

function generateChart(parent, indices, sourceData) {
	parent.destroyChildren();

	const hasWidth = sourceData.has('width');
	const hasHeight = sourceData.has('height');
	const hasX = sourceData.has('x');
	const hasY = sourceData.has('y');

	let totalBarWidth = 0;
	let totalBarHeight = 0;
	let maxBarWidth = 0;
	let maxBarHeight = 0;
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	indices.forEach(index => {
		const height = hasHeight ? sourceData.value('height', index) : 1;
		const width = hasWidth ? sourceData.value('width', index) : 1;

		// skip empty rows
		if (isNaN(height) || typeof height !== 'number' ||
			isNaN(width) || typeof width !== 'number') {

			return;
		}

		const x = sourceData.value('x', index) || 0;
		const y = sourceData.value('y', index) || 0;
		totalBarWidth += width;
		totalBarHeight += height;
		maxBarWidth = Math.max(maxBarWidth, width);
		maxBarHeight = Math.max(maxBarHeight, height);
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	});

	const xRange = maxX - minX || 1;
	const yRange = maxY - minY || 1;

	let cumulativeWidth = 0;
	let cumulativeHeight = 0;

	indices.forEach(index => {
		// one bar for each row
		const height = hasHeight ? sourceData.value('height', index) : 1;
		const width = hasWidth ? sourceData.value('width', index) : 1;

		const posContainer = new Path();
		parent.add(posContainer);

		// skip empty rows
		if (isNaN(height) || typeof height !== 'number' ||
			isNaN(width) || typeof width !== 'number') {

			return;
		}

		const x = hasX ? ((sourceData.value('x', index) || 0) - minX) / xRange - 0.5 : 0;
		const y = hasY ? 0.5 - ((sourceData.value('y', index) || 0) - minY) / yRange : 0;

		const w = hasHeight || hasX ? width / totalBarWidth : width / maxBarWidth;
		const h = hasWidth || hasY ? height / totalBarHeight : height / maxBarHeight;
		const left = hasHeight ? cumulativeWidth + w / 2 : 0.5;
		const top = hasWidth ? cumulativeHeight + h / 2 : 0.5;

		const mutateContainer = new Path();

		const bar = new Path(rectangle());
		posContainer.position.set(left + x, top + y);
		bar.position.set(-w / 2, -h / 2);
		bar.scale.set(w, h);

		cumulativeWidth += w;
		cumulativeHeight += h;

		posContainer.add(mutateContainer);
		mutateContainer.add(bar);
	});
}

function mutateChart(parent, indices, sourceData, genes) {
	const pathContainer = parent.children[0];
	const textContainer = parent.children[1];

	const widthOffset = genes.get('widthOffset') || 0;
	const widthRankFactor = genes.get('widthRankFactor') || 0;
	const widthRandomFactor = genes.get('widthRandomFactor') || 0;
	const totalWidthFactor = Math.max(1, Math.abs(widthOffset) + Math.abs(widthRankFactor) + Math.abs(widthRandomFactor));

	const heightOffset = genes.get('heightOffset') || 0;
	const heightRankFactor = genes.get('heightRankFactor') || 0;
	const heightRandomFactor = genes.get('heightRandomFactor') || 0;
	const totalHeightFactor = Math.max(1, Math.abs(heightOffset) + Math.abs(heightRankFactor) + Math.abs(heightRandomFactor));

	const xOffset = genes.get('xOffset') || 0;
	const xRankFactor = genes.get('xRankFactor') || 0;
	const xRandomFactor = genes.get('xRandomFactor') || 0;
	const totalXFactor = Math.max(1, Math.abs(xOffset) + Math.abs(xRankFactor) + Math.abs(xRandomFactor));

	const yOffset = genes.get('yOffset') || 0;
	const yRankFactor = genes.get('yRankFactor') || 0;
	const yRandomFactor = genes.get('yRandomFactor') || 0;
	const totalYFactor = Math.max(1, Math.abs(yOffset) + Math.abs(yRankFactor) + Math.abs(yRandomFactor));

	const rotationOffset = genes.get('rotationOffset') || 0;
	const rotationRankFactor = genes.get('rotationRankFactor') || 0;
	// const rotationValueFactor = genes.get('rotationValueFactor');
	const rotationRandomFactor = genes.get('rotationRandomFactor') || 0;

	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	indices.forEach((index, rank) => {
		const posContainer = pathContainer.children[rank];
		const mutateContainer = posContainer && posContainer.children[0];
		if (!posContainer || !mutateContainer) {
			return;
		}
		const bar = mutateContainer.children[0];
		bar.data.id = index;

		const progress = rank / indices.length;
		const progressSpread = 2 * rank / indices.length - 1;

		const randSeed = index + num(sourceData.value('x', index), 5) +
			num(sourceData.value('y', index), 1) +
			num(sourceData.value('width', index), 2) +
			num(sourceData.value('height', index), 3) +
			num(sourceData.value('color', index), 4);

		const width = bar.scale.x;
		const height = bar.scale.y;
		const left = posContainer.position.x - width / 2;
		const top = posContainer.position.y - height / 2;
		const right = left + width;
		const bottom = top + height;

		const x = (xOffset +
			xRankFactor * progressSpread +
			xRandomFactor * random(randSeed)) / (totalXFactor || 1);
		const dx = x < 0 ? x * left : x * (1 - right);

		const y = (yOffset +
			yRankFactor * progressSpread +
			yRandomFactor * random(randSeed + 1)) / (totalYFactor || 1);
		const dy = y < 0 ? y * top : y * (1 - bottom);

		const w = 1 + (widthOffset +
			widthRankFactor * progressSpread +
			widthRandomFactor * random(randSeed)) / (totalWidthFactor || 1);

		const h = 1 + (heightOffset +
			heightRankFactor * progressSpread +
			heightRandomFactor * random(randSeed)) / (totalHeightFactor || 1);

		mutateContainer.position.set(dx, dy);
		mutateContainer.scale.set(w, h);

		const rotation = (rotationOffset +
			rotationRankFactor * progress * 2 +
			// radiusValueFactor * vals[i] / total +
			rotationRandomFactor * (random(randSeed + 5) - 0.5)) * Math.PI;

		mutateContainer.rotation = rotation;

		const scaledWidth = bar.scale.x * w;
		const scaledHeight = bar.scale.y * h;
		const halfWidth = scaledWidth / 2;
		const halfHeight = scaledHeight / 2;
		const cos = rotation ? Math.cos(rotation) : 1;
		const sin = rotation ? Math.sin(rotation) : 0;

		const halfRotatedW = Math.abs(halfWidth * cos - halfHeight * sin);
		const halfRotatedH = Math.abs(halfHeight * cos + halfWidth * sin);

		const bx = dx + posContainer.x;
		const by = dx + posContainer.y;

		minX = Math.min(minX, bx - halfRotatedW);
		maxX = Math.max(maxX, bx + halfRotatedW);
		minY = Math.min(minY, by - halfRotatedH);
		maxY = Math.max(maxY, by + halfRotatedH);

		const colorVal = sourceData.has('color') ? sourceData.value('color', index) : progress;
		bar.color = geneColor(genes, colorVal);

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
	const hasWidth = sourceData.has('width');
	const hasHeight = sourceData.has('height');
	indices.forEach((index, rank) => {
		const height = hasHeight ? sourceData.value('height', index) : 1;
		const width = hasWidth ? sourceData.value('width', index) : 1;

		// skip empty rows
		if (isNaN(height) || typeof height !== 'number' ||
			isNaN(width) || typeof width !== 'number') {

			return;
		}

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

				if (!rowCount/* || !sourceData.has('height') && !sourceData.has('width')*/) {
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
