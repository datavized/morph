import drawPixi from '../drawing/drawPixi';
import chartTypes from './index';
import assign from 'object-assign';

const drawableCharts = {};
for (const k in chartTypes) {
	if (chartTypes.hasOwnProperty(k)) {
		const chartDefinition = chartTypes[k];
		drawableCharts[k] = assign({}, chartDefinition, {
			draw: drawPixi(chartDefinition.draw)
		});
	}
}

export default drawableCharts;