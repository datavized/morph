const exportFormats = {
	png: {
		name: 'PNG (Raster)',
		mime: 'image/png',
		ext: 'png',
		share: true
	},
	svg: {
		name: 'SVG (Vector)',
		mime: 'image/svg+xml',
		ext: 'svg'
	},
	html: {
		name: 'HTML (Vector/Interactive)',
		mime: 'text/html',
		ext: 'html'
	},
	gif: {
		name: 'Animated GIF',
		mime: 'image/gif',
		ext: 'gif',
		anim: true,
		transparent: false,
		maxFrameRate: 30,
		share: true
	},
	webm: {
		name: 'WebM Video',
		mime: 'video/webm',
		ext: 'webm',
		anim: true,
		transparent: false,
		maxFrameRate: 60,
		share: true
	},
	frames: {
		name: 'PNG Frame Sequence',
		mime: 'application/zip',
		ext: 'zip',
		anim: true
	}
};

const supportsExportWebM = (function () {
	try {
		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = tempCanvas.height = 1;
		const dataURL = tempCanvas.toDataURL('image/webp');
		return /^data:image\/webp/.test(dataURL);
	} catch (e) {}
	return false;
}());

if (!supportsExportWebM) {
	delete exportFormats.webm;
}

export default exportFormats;