import JSZip from 'jszip';

const FRAME_DIGITS = 5;
const MIME_TYPE = 'image/png';
const DATA_URL_SLICE = 'data:image/png;base64,'.length;
const base64Opt = {base64: true};

function promise(fn) {
	return new Promise(resolve => fn(resolve));
}

export default function png({ quality, digits }, videoWriter, finish) {
	digits = digits || FRAME_DIGITS;
	quality = quality || 1;

	const zip = new JSZip();
	const promises = [];

	let frameCount = 0;

	let maxProgress = 0;

	function onUpdate({ percent, currentFile }) {
		if (percent < maxProgress) {
			console.warn('progress regressed', currentFile, percent);
			// debugger;
		}
		maxProgress = Math.max(maxProgress, percent);

		videoWriter.emit('progress', percent / 100);
	}

	return {
		reportsProgress: true,
		addFrame: canvas => {
			let frame = String(frameCount++);
			while (frame.length < digits) {
				frame = '0' + frame;
			}

			const fileName = 'image-' + frame + '.png';
			if (canvas.toBlob) {
				promises.push(promise(cb => canvas.toBlob(
					blob => {
						zip.file(fileName, blob);
						cb();
					},
					MIME_TYPE,
					quality
				)));
			} else {
				const dataURL = canvas.toDataURL(MIME_TYPE, quality);
				const base64 = dataURL.slice(DATA_URL_SLICE);
				zip.file(fileName, base64, base64Opt);
			}
		},
		finish: () => Promise.all(promises)
			.then(() => zip.generateAsync({ type: 'blob' }, onUpdate))
			.then(finish),
		destroy: () => zip.forEach(name => zip.remove(name))
	};
}