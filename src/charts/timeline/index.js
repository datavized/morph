import draw from './draw';
import randomize from '../../util/randomizeTimeline';
import { defaultColorValues } from '../geneColor';

export default {
	key: 'timeline',
	name: 'Area Timeline',
	preview: require('./thumb.png'),
	required: ['x', 'y', 'group', 'time'],
	valid: fields =>
		fields.has('group') && fields.has('time') &&
		(fields.has('x') || fields.has('y')),
	randomize,
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
			key: 'x',
			name: 'Width'
		},
		{
			key: 'y',
			name: 'Height'
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
		}
	],
	genes: {
		xOffset: 0,
		xRankFactor: 0,
		xRandomFactor: 0,

		yOffset: 0,
		yRankFactor: 0,
		yRandomFactor: 0,

		scaleOffset: 0,
		scaleRankFactor: 0,

		...defaultColorValues
	}
};