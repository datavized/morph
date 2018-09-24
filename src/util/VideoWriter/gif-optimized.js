import GIF from 'gif.js.optimized';
import assign from 'object-assign';

export default function gif({quality, frameRate, ...options}, videoWriter, finish) {
	// todo: set quality correctly - the lower the better
	quality = 8; //quality || 1;
	frameRate = frameRate || 30;

	// todo: figure out what to do about transparency

	const gifWriter = new GIF(assign({
		workerScript: require('!!file-loader!gif.js/dist/gif.worker.js'),
		workers: 4,
		quality
	}, options));

	const frameOptions = {
		delay: 1000 / frameRate
	};

	gifWriter.on('progress', p => videoWriter.emit('progress', p));
	gifWriter.on('finished', finish);

	return {
		reportsProgress: true,
		addFrame: canvas => gifWriter.addFrame(canvas, frameOptions),
		finish: () => gifWriter.render(),
		destroy: () => gifWriter.abort()
	};
}