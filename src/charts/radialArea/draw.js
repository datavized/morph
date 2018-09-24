import geneColor from '../geneColor';
import random from '../../util/random';
import getContrastTextColor from '../../util/getContrastTextColor';
import Path from '../../drawing/Path';
import Text from '../../drawing/Text';
import { circle } from '../../drawing/shapes/arc';

import num from '../../util/num';

import { DISPLAY_ROW_LIMIT } from '../constants';

const TEXT_SCALE = 1 / 50;
const OPACITY = 0.7;
const TAU = Math.PI * 2;

function generateChart(parent, groupIndices, groups, sourceData) {
	parent.destroyChildren();

	const hasAngle = sourceData.has('angle');
	const hasRadius = sourceData.has('radius');
	const hasTime = sourceData.has('time');
	const radiusField = hasRadius ? sourceData.field('radius') : sourceData.field('angle');

	groupIndices.forEach((id, rank) => {
		const group = groups.get(id);
		let pathString = '';
		const numPoints = group.indices.length;
		if (numPoints < 2 || !hasTime) {
			/*
			Just make a circle
			Two points is a weird case, and it's not clear what to do about it
			so for now we'll just ignore the second point
			*/
			const radius = group.aggregate[radiusField];
			pathString = circle(0, 0, radius);
			group.bounds = [-1, -1, 1, 1];
		} else {
			const scaleTau = numPoints / (numPoints + 1);
			const points = group.indices.map(index => [
				(hasAngle ?
					sourceData.value('angle', index) :
					sourceData.value('time', index)
				) * TAU * scaleTau,
				hasRadius ? sourceData.value('radius', index) : sourceData.value('time', index)
			]).map(([angle, radius]) => [
				Math.cos(angle) * radius,
				Math.sin(angle) * radius
			]);

			group.bounds.forEach((start, i) => {
				const dim = i % 2;
				const fn = i < 2 ? Math.min : Math.max;
				group.bounds[i] = points.reduce((v, p) => fn(v, p[dim]), start);
			});

			// todo: smooth this curve out!
			pathString = points.map((point, i) => (i ? 'L ' : 'M ') + point.join(', ')).join(' ');
		}

		const path = new Path(pathString);
		path.data.id = rank;
		path.opacity = OPACITY;
		path.color = 0xff00ff;
		parent.add(path);
	});
}

function mutateChart(parent, groups, groupIndices, sourceData, genes) {
	const pathContainer = parent.children[0];
	const textContainer = parent.children[1];

	const scaleOffset = genes.get('scaleOffset') || 0;
	const scaleRankFactor = genes.get('scaleRankFactor') || 0;
	const totalScaleFactor = Math.max(1, Math.abs(scaleOffset) + Math.abs(scaleRankFactor));

	const rotationOffset = genes.get('rotationOffset') || 0;
	const rotationRankFactor = genes.get('rotationRankFactor') || 0;
	// const rotationValueFactor = genes.get('rotationValueFactor') || 0;
	const rotationRandomFactor = genes.get('rotationRandomFactor') || 0;

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

		const randSeed = rank + (num(aggregate[sourceData.field('group')], 5) +
			num(aggregate[sourceData.field('angle')], 1) +
			num(aggregate[sourceData.field('radius')], 2) +
			num(aggregate[sourceData.field('color')], 3)) * 100;

		const scaleFactor = 0.55 + 0.45 * (scaleOffset +
			scaleRankFactor * progressSpread) / (totalScaleFactor || 1);
		const scale = scaleFactor * scaleFactor * scaleFactor;

		path.scale.set(scale, scale);

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

		path.position.set(x, y);

		path.rotation = (rotationOffset +
			rotationRankFactor * progress * 2 +
			// radiusValueFactor * vals[i] / total +
			rotationRandomFactor * (random(randSeed + 5) - 0.5)) * Math.PI;

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
			text.scale.set(TEXT_SCALE * scale, TEXT_SCALE * scale);
		}
	});

	const xScale = 1 / (maxX - minX || 1);
	const yScale = 1 / (maxY - minY || 1);
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
			text.scale.set(TEXT_SCALE, TEXT_SCALE);
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
	let textColor = 0;

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
					// !sourceData.has('group') ||
					// !sourceData.has('time') ||
					!sourceData.has('angle') && !sourceData.has('radius')) {

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

					const groupId = sourceData.has('group') ?
						sourceData.original('group', index) :
						index;
					if (!groups.has(groupId) && groups.size >= DISPLAY_ROW_LIMIT) {
						return;
					}

					const sortValue = sourceData.has('order') ?
						sourceData.value('order', index) :
						sourceData.has('radius') ?
							sourceData.value('radius', index) :
							groupId;
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
					if (sourceData.has('time')) {
						group.indices.sort((aIndex, bIndex) => {
							const aRank = sourceData.value('time', aIndex);
							const bRank = sourceData.value('time', bIndex);
							return aRank - bRank;
						});
					}
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

			[xOffset, yOffset, boundsScale] = mutateChart(chart, groups, groupIndices, sourceData, genes);
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
