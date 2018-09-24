import draw from './draw';
export default {
	key: 'bar',
	name: 'Bar Chart',
	preview: require('./thumb.png'),
	draw,
	required: ['height', 'width', 'x', 'y'],
	valid: fields =>
		fields.has('height') ||
		fields.has('width') ||
		fields.has('x') ||
		fields.has('y'),
	randomize(fields) {
		if (!fields.length) {
			return {};
		}

		const horizontal = Math.random() > 0.5;
		const dimField = horizontal ? 'width' : 'height';
		const posField = horizontal ? 'y' : 'x';

		const fieldNames = [dimField, posField];

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
			key: 'height',
			name: 'Height'
		},
		{
			key: 'width',
			name: 'Width'
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
			category: 'Width',
			genes: [
				['Offset', 'widthOffset'],
				['Rank Factor', 'widthRankFactor'],
				['Random Factor', 'widthRandomFactor']
			]
		},
		{
			category: 'Height',
			genes: [
				['Offset', 'heightOffset'],
				['Rank Factor', 'heightRankFactor'],
				['Random Factor', 'heightRandomFactor']
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
		widthOffset: 0,
		widthRankFactor: 0,
		widthRandomFactor: 0,

		heightOffset: 0,
		heightRankFactor: 0,
		heightRandomFactor: 0,

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

		hueOffset: 0,
		hueRange: 0.6,
		saturationOffset: 1,
		saturationValueFactor: 0,
		lightnessOffset: 0.5,
		lightnessValueFactor: 0
	}
};