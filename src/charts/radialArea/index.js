import draw from './draw';
import { defaultColorValues } from '../geneColor';

export default {
	key: 'radialArea',
	name: 'Radial Area',
	preview: require('./thumb.png'),
	required: ['radius'],
	// valid: fields =>
	// 	fields.has('height') ||
	// 	fields.has('width') ||
	// 	fields.has('x') ||
	// 	fields.has('y'),
	randomize(fields) {
		if (!fields.length) {
			return {};
		}

		const fieldNames = ['radius', 'time'];

		if (Math.random() > 0.75) {
			fieldNames.push('angle');
		}

		const indices = Object.keys(fields).map(parseFloat);
		let numericFieldIndices = indices.filter(index => {
			const f = fields[index];
			const type = f.type;
			return type === 'int' || type === 'float';
		});

		const fieldMap = {};
		fieldNames.forEach(name => {
			if (!numericFieldIndices.length) {
				numericFieldIndices = indices;
			}
			const count = numericFieldIndices.length;
			const i = Math.floor(Math.random() * count) % count;
			const index = numericFieldIndices[i];
			numericFieldIndices.splice(i, 1);
			fieldMap[name] = index;
		});

		let stringFieldIndices = indices.filter(index => {
			const f = fields[index];
			return f.type === 'string';
		});
		if (!stringFieldIndices.length) {
			stringFieldIndices = indices;
		}
		if (!indices.length) {
			stringFieldIndices = Object.keys(fields).map(parseFloat);
		}
		const count = stringFieldIndices.length;
		const i = Math.floor(Math.random() * count) % count;
		const index = numericFieldIndices[i];
		numericFieldIndices.splice(i, 1);
		fieldMap.group = index;

		return fieldMap;
	},
	draw,
	properties: [
		{
			key: 'group',
			name: 'Group'
		},
		{
			key: 'time',
			name: 'Time'
		},
		{
			key: 'radius',
			name: 'Radius'
		},
		{
			key: 'angle',
			name: 'Angle'
		},
		{
			key: 'order',
			name: 'Depth Order'
		},
		{
			key: 'color',
			name: 'Color'
		},
		{
			key: 'label',
			name: 'Label'
		}
	],
	geneCategories: [
		{
			category: 'Color',
			genes: [
				['Hue Range', 'hueRange'],
				['Hue Offset', 'hueOffset'],
				['Saturation Offset', 'saturationOffset'],
				['Saturation Factor', 'saturationValueFactor'],
				['Lightness Offset', 'lightnessOffset'],
				['Lightness Factor', 'lightnessValueFactor']
			]
		},
		{
			category: 'X Position',
			genes: [
				['Offset', 'xOffset'],
				['Rank Factor', 'xRankFactor'],
				['Random Factor', 'xRandomFactor']
			]
		},
		{
			category: 'Y Position',
			genes: [
				['Offset', 'yOffset'],
				['Rank Factor', 'yRankFactor'],
				['Random Factor', 'yRandomFactor']
			]
		},
		{
			category: 'Scale',
			genes: [
				['Offset', 'scaleOffset'],
				['Rank Factor', 'scaleRankFactor']
			]
		},
		{
			category: 'Rotation',
			genes: [
				['Offset', 'rotationOffset'],
				['Rank Factor', 'rotationRankFactor'],
				// ['Value Factor', 'rotationValueFactor'],
				['Random Factor', 'rotationRandomFactor']
			]
		}
	],
	genes: {
		xOffset: 0,
		xRankFactor: 0,
		xRandomFactor: 0,

		yOffset: 0,
		yRankFactor: 0,
		yRandomFactor: 0,

		rotationOffset: 0,
		rotationRankFactor: 0,
		rotationValueFactor: 0,
		rotationRandomFactor: 0,

		scaleOffset: 0.9,
		scaleRankFactor: 0,

		...defaultColorValues
	}
};