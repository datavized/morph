import { GIF } from 'quick-gif.js';
import assign from 'object-assign';

const contexts = new WeakMap();

function getImageData(canvas) {
	/*
	todo: if canvas is 2d, don't bother copying
	*/
	if (canvas instanceof CanvasRenderingContext2D) {
		throw new Error('not implemented yet');
	}
	let ctx = contexts.get(canvas);
	let c = ctx && ctx.canvas || null;
	if (!ctx) {
		c = document.createElement('canvas');
		ctx = c.getContext('2d');
		contexts.set(canvas, ctx);
	}
	c.width = canvas.width;
	c.height = canvas.height;

	ctx.drawImage(canvas, 0, 0);

	return ctx.getImageData(0, 0, c.width, c.height);
}

export default function gif({quality, frameRate, width, height, transparent, ...options}, videoWriter, finish) {
	// todo: set quality correctly - the lower the better
	quality = 6; //quality || 1;
	frameRate = frameRate || 30;

	const gifWriter = new GIF(width, height, assign({
		workers: 4,
		quality
	}, {
		transparent: transparent ? 0 : null,
		...options
	}));

	const frameOptions = {
		delay: 1000 / frameRate
	};

	// gifWriter.on('progress', p => videoWriter.emit('progress', p));
	gifWriter.on('finished', finish);

	return {
		start: () => gifWriter.start(),
		addFrame: canvas => {
			// todo: get ImageData from webgl canvas
			gifWriter.addFrame(getImageData(canvas), frameOptions);
		},
		finish: () => gifWriter.finish(),
		destroy: () => gifWriter.destroy()
	};
}