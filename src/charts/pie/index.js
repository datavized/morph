import draw from './draw';
import { defaultColorValues } from '../geneColor';

export default {
	key: 'pie',
	name: 'Pie Chart',
	draw,
	required: ['size'],
	randomize(fields) {
		if (!fields.length) {
			return {};
		}
		const indices = Object.keys(fields).map(parseFloat);
		let numericFieldIndices = indices.filter(index => {
			const f = fields[index];
			const type = f.type;
			return type === 'int' || type === 'float';
		});
		if (!numericFieldIndices.length) {
			numericFieldIndices = indices;
		}
		const count = numericFieldIndices.length;
		const size = numericFieldIndices[Math.floor(Math.random() * count) % count];
		return { size };
	},
	preview: require('./thumb.png'),
	properties: [
		{
			key: 'size',
			name: 'Slice Angle'
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
			category: 'Radius',
			genes: [
				['Offset', 'radiusOffset'],
				['Rank Factor', 'radiusRankFactor'],
				['Value Factor', 'radiusValueFactor'],
				['Random Factor', 'radiusRandomFactor']
			]
		}/*,
		{
			category: 'Rotation',
			genes: [
				['Offset', 'rotationOffset'],
				['Rank Factor', 'rotationRankFactor'],
				['Value Factor', 'rotationValueFactor'],
				['Random Factor', 'rotationRandomFactor']
			]
		}*/
	],
	genes: {
		...defaultColorValues,

		radiusOffset: 0,
		radiusRankFactor: 0,
		radiusValueFactor: 0,
		radiusRandomFactor: 0,

		// scale: 1,
		// scaleFactor: 0,

		rotationOffset: 0,
		rotationRankFactor: 0,
		rotationValueFactor: 0,
		rotationRandomFactor: 0
	}
};