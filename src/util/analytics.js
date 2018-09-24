/*
todo: log these config properties
- margin
- showLabels
- showTitle
- bounce
- transparentBackground
*/
import exportFormats from '../export/formats';

const metrics = {
	resolution: 1,
	frameRate: 2,
	duration: 3
};

const dimensions = {
	format: 1
};

const animationProperties = new Set(['frameRate', 'duration']);

const ga = self.ga;

export default function logExportEvent(config, action = 'save') {
	const data = {};
	const format = exportFormats[config.format];
	const animation = !!format.anim;

	Object.keys(metrics).forEach(key => {
		const val = config[key];
		if (val !== undefined && (animation || !animationProperties.has(key))) {
			const saveKey = 'metric' + metrics[key];
			data[saveKey] = val;
		}
	});
	Object.keys(dimensions).forEach(key => {
		const val = config[key];
		if (val !== undefined && (animation || !animationProperties.has(key))) {
			const saveKey = 'dimension' + dimensions[key];
			data[saveKey] = val;
		}
	});
	ga('send', 'event', 'export', action, data);

}