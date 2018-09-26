import geneColor from '../geneColor';
import random from '../../util/random';
import getContrastTextColor from '../../util/getContrastTextColor';
import Path from '../../drawing/Path';
import LinePath from '../../drawing/LinePath';
import Text from '../../drawing/Text';

import num from '../../util/num';

import { DISPLAY_ROW_LIMIT } from '../constants';

const TEXT_SCALE = 1 / 100;
const LINE_WIDTH = 0.02;

function generateChart(parent, groupIndices, groups, sourceData) {
	parent.destroyChildren();

	// if x and y are the same field, throw out y
	// otherwise we just get a straight line with no area
	const xySame = sourceData.field('x') === sourceData.field('y');
	const hasX = xySame ? false : sourceData.has('x');
	const hasY = sourceData.has('y');

	groupIndices.forEach((id, rank) => {
		const group = groups.get(id);
		const points = group.indices.map(index => [
			(hasX ? sourceData.value('x', index) : sourceData.value('time', index)) - 0.5,
			(hasY ? 1 - sourceData.value('y', index) : sourceData.value('time', index)) - 0.5
		]);

		// special case if we only have a single point
		// draw a very short line
		if (points.length === 1) {
			const dx = hasY ? LINE_WIDTH / 2 : 0;
			const dy = hasX ? LINE_WIDTH / 2 : 0;
			const point = points[0];
			const [x, y] = point;
			point[0] = x - dx;
			point[1] = y - dy;
			points.push([x + dx, y + dy]);
		}

		group.bounds.forEach((start, i) => {
			const dim = i % 2;
			const fn = i < 2 ? Math.min : Math.max;
			group.bounds[i] = points.reduce((v, p) => fn(v, p[dim]), start);
		});

		const path = new LinePath(points);
		path.data.id = rank;
		path.color = 0xff00ff;
		path.lineWidth = LINE_WIDTH;
		parent.add(path);
	});
}

function mutateChart(parent, groups, groupIndices, sourceData, genes) {
	const pathContainer = parent.children[0];
	const textContainer = parent.children[1];

	const scaleOffset = genes.get('scaleOffset') || 0;
	const scaleRankFactor = genes.get('scaleRankFactor') || 0;
	const totalScaleFactor = Math.max(1, Math.abs(scaleOffset) + Math.abs(scaleRankFactor));

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

	groupIndices.forEach((id, rank) => {
		const group = groups.get(id);
		const { aggregate, bounds } = group;
		const path = pathContainer.children[rank];
		if (!path) {
			return;
		}

		const progress = rank / groupIndices.length;
		const progressSpread = 2 * rank / groupIndices.length - 1;

		const scale = 1.1 + (scaleOffset +
			scaleRankFactor * progressSpread) / (totalScaleFactor || 1);

		const randSeed = rank + (num(aggregate[sourceData.field('group')], 5) +
			num(aggregate[sourceData.field('x')], 1) +
			num(aggregate[sourceData.field('y')], 2) +
			num(aggregate[sourceData.field('color')], 3)) * 100;

		const x = (xOffset +
			xRankFactor * progressSpread +
			xRandomFactor * random(randSeed)) / (totalXFactor || 1);
		minX = Math.min(minX, x + bounds[0] * scale);
		maxX = Math.max(maxX, x + bounds[2] * scale);

		const y = (yOffset +
			yRankFactor * progressSpread +
			yRandomFactor * random(randSeed + 1)) / (totalYFactor || 1);
		minY = Math.min(minY, y + bounds[1] * scale);
		maxY = Math.max(maxY, y + bounds[3] * scale);

		path.scale.set(scale, scale);
		path.position.set(x, y);

		/*
		If a hue field is provided, use it. If not, pick a random value.
		Hue range is scaled down by 90% to prevent looping red to red
		*/
		const colorVal = sourceData.has('color') ? group.aggregate[sourceData.field('color')] : progress;
		path.color = geneColor(genes, colorVal);

		// position text at center of shape
		const text = textContainer.children[rank];
		if (text && textContainer.visible) {
			const cx = x + scale * (bounds[0] + bounds[2]) / 2;
			const cy = y + scale * (bounds[1] + bounds[3]) / 2;
			text.position.set(cx, cy);
			const textScale = scale * TEXT_SCALE / Math.log2(groupIndices.length);
			text.scale.set(textScale, textScale);
		}
	});

	// make space for the line thickness
	minX -= 0.02;
	maxX += 0.02;
	minY -= 0.02;
	maxY += 0.02;

	const xRange = maxX - minX || 1;
	const yRange = maxY - minY || 1;
	const xScale = 1 / xRange;
	const yScale = 1 / yRange;

	return [-minX, -minY, Math.min(xScale, yScale)];
}

/* eslint-disable max-params */
function setLabels(parent, groups, groupIndices, sourceData, fontSize, color) {
	groupIndices.forEach((id, rank) => {
		const group = groups.get(id);
		let text = parent.children[rank];
		const textValue = group.original[sourceData.field('label')];
		if (text && textValue === text.text && fontSize === text.size && color === text.color) {
			// no change needed
			return;
		}

		if (text) {
			text.text = textValue;
		} else {
			text = new Text(textValue);
			text.id = 'label-' + rank;
			parent.add(text);
		}
		text.size = fontSize;
		text.color = color;
	});
}
/* eslint-enable max-params */

/*
drawChart function parameters:
- container: a Path object. Everything goes in here
*/
export default function drawChart(container) {
	const chart = new Path();
	chart.position.set(0.5, 0.5);
	container.add(chart);

	const pathContainer = new Path();
	chart.add(pathContainer);

	const textContainer = new Path();
	textContainer.id = 'labels';
	chart.add(textContainer);

	let height = 1;
	let width = 1;
	let xOffset = 0;
	let yOffset = 0;
	let boundsScale = 1;
	let fontSize = 0;
	let textColor = 0x0;

	let data = null;
	let fieldMap = null;

	const groups = new Map();
	const groupIndices = [];

	function getGroup(id, sortValue = id) {
		let group = groups.get(id);
		if (group) {
			group.sortValue = Math.min(sortValue, group.sortValue);
		} else {
			group = {
				id,
				sortValue,
				bounds: [Infinity, Infinity, -Infinity, -Infinity],
				indices: [],
				aggregate: [],
				original: null
			};
			groups.set(id, group);
			groupIndices.push(id);
		}
		return group;
	}

	function scaleChart() {
		// e.g. scale the chart to fill the space
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
				groupIndices.length = 0;
				groups.clear();

				const { rows, normalized } = sourceData;

				// we may want to draw background, axis lines, etc. here

				if (!sourceData.count ||
					!sourceData.has('group') ||
					!sourceData.has('time') ||
					!sourceData.has('x') && !sourceData.has('y')) {

					// nothing to draw

					pathContainer.destroyChildren();
					textContainer.destroyChildren();
					return;
				}

				// put rows into groups
				rows.forEach((row, index) => {
					const norm = normalized[index];

					// if any of the fields we use is missing a value, throw this row out
					if (sourceData.fieldMap.some(fieldIndex => fieldIndex >= 0 && isNaN(norm[fieldIndex]))) {
						return;
					}

					const groupId = sourceData.original('group', index);
					if (!groups.has(groupId) && groups.size >= DISPLAY_ROW_LIMIT) {
						return;
					}

					const sortValue = sourceData.has('order') ?
						sourceData.value('order', index) :
						sourceData.value('group', index);
					const group = getGroup(groupId, sortValue);
					group.indices.push(index);

					// create an aggregate row for each group
					for (let i = 0; i < norm.length; i++) {
						const val = group.aggregate[i] || 0;
						group.aggregate[i] = val + norm[i];
					}

					if (!group.original) {
						group.original = row;
					}
				});

				// sort groups by order field value
				// for now we use lowest value. should it be average?
				groupIndices.sort((aIndex, bIndex) => {
					const a = groups.get(aIndex);
					const b = groups.get(bIndex);

					// descending sort because we'll draw back to front
					// so sort is front to back
					return b.sortValue - a.sortValue;
				});

				groups.forEach(group => {
					// set aggregate from sum to average
					const n = group.indices.length || 1;
					group.aggregate.forEach((val, i) => group.aggregate[i] = val / n);

					// sort each group by time
					group.indices.sort((aIndex, bIndex) => {
						const aRank = sourceData.value('time', aIndex);
						const bRank = sourceData.value('time', bIndex);
						return aRank - bRank;
					});
				});

				generateChart(pathContainer, groupIndices, groups, sourceData);

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
				setLabels(textContainer, groups, groupIndices, sourceData, fontSize, textColor);
			}

			[xOffset, yOffset, boundsScale] = mutateChart(chart, groups, groupIndices, sourceData, genes, textColor);
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
