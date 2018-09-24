import WebMWriter from 'webm-writer';
import assign from 'object-assign';

export default function webm({quality, frameRate, ...options}, videoWriter, finish) {
	// WebM image quality from 0.0 (worst) to 1.0 (best)
	quality = quality || 1;
	frameRate = frameRate || 30;

	const webmWriter = new WebMWriter(assign({
		quality,
		frameRate
	}, options));

	return {
		addFrame(canvas) {
			webmWriter.addFrame(canvas);
		},
		finish() {
			webmWriter.complete().then(finish);
		}
	};
}