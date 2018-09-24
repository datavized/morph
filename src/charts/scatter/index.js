import draw from './draw';
import { defaultColorValues } from '../geneColor';

export default {
	key: 'scatter',
	name: 'Scatter Plot',
	preview: require('./thumb.png'),
	draw,
	required: ['area', 'x', 'y'],
	valid: fields =>
		fields.has('area') ||
		fields.has('x') ||
		fields.has('y'),
	randomize(fields) {
		if (!fields.length) {
			return {};
		}

		const horizontal = Math.random() > 0.5;
		const posField = horizontal ? 'y' : 'x';

		const fieldNames = [posField, 'area'];

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
		return fieldMap;
	},
	properties: [
		{
			key: 'area',
			name: 'Area'
		},
		{
			key: 'x',
			name: 'X Position'
		},
		{
			key: 'y',
			name: 'Y Position'
		},
		{
			key: 'order',
			name: 'Order'
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
			category: 'Area',
			genes: [
				['Offset', 'areaOffset']//,
				// ['Rank Factor', 'areaRankFactor'],
				// ['Random Factor', 'areaRandomFactor']
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
		}
	],
	genes: {
		areaOffset: -0.5,
		areaRankFactor: 0,
		areaRandomFactor: 0,

		xOffset: 0,
		xRankFactor: 0,
		xRandomFactor: 0,

		yOffset: 0,
		yRankFactor: 0,
		yRandomFactor: 0,

		...defaultColorValues
	}
};