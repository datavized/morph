/* global DEBUG */

import React from 'react';
import assign from 'object-assign';

/*
Material UI components
*/
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Select from '@material-ui/core/Select';
import RadioGroup from '@material-ui/core/RadioGroup';
import RadioOption from './RadioOption';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import LinearProgress from '@material-ui/core/LinearProgress';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

import SocialShareDialog from './SocialShareDialog';

import Sketch from './Sketch';
import Slider from './Slider';
import ColorPicker from './ColorPicker';
import NodeInspector from './NodeInspector';

import fieldMappedTable from '../util/fieldMappedTable';
import downloadFile from '../util/downloadFile';
import charts from '../charts';
import Path from '../drawing/Path';
import drawTitle from '../drawing/drawTitle';

import { requestIdleCallback, cancelIdleCallback } from '../util/requestIdleCallback';
import logExportEvent from '../util/analytics';

import isMobile from 'ismobilejs';

// SVG dependencies
import exportSVG from '../util/exportSVG';

// PIXI dependencies
import drawPixi from '../drawing/drawPixi';
import { Application as PIXIApplication } from '@pixi/app';
import canvasToBlob from '../util/canvasToBlob';
import { Container } from '@pixi/display';

import exportFormats from '../export/formats';
import VideoWriter from '../util/VideoWriter';
import webm from '../util/VideoWriter/webm';
import frames from '../util/VideoWriter/png';
import gif from '../util/VideoWriter/quick-gif';
// import gif from '../util/VideoWriter/gif';
// import gif from '../util/VideoWriter/gif-optimized';
const videoFormats = {
	frames,
	webm,
	gif
};

const canSave = !/(iPad|iPhone|iPod)/g.test(navigator.userAgent) &&
	'download' in document.createElementNS('http://www.w3.org/1999/xhtml', 'a');

const MAX_DURATION = isMobile.phone ? 5 : 30;
const DEFAULT_DURATION = isMobile.phone ? 1 : 5;
const DEFAULT_SIZE = isMobile.phone ? 800 : 1200;
const MAX_SIZE = isMobile.phone ? 1000 : 10000;
const DEFAULT_STILL_FORMAT = 'png';

// todo: move to constants
import {
	IMGUR_CLIENT_ID,
	IMGUR_UPLOAD_URL,
	IMGUR_DESCRIPTION,
	IMGUR_LINK_PREFIX
} from '../constants';

const frameRates = [
	15, 23.976, 24, 25, 29.97, 30, 50, 59.94, 60, 90
];

const formatFrameRate = n => Math.round(n * 100) / 100;
const mix = (t, x, y) => x * (1 - t) + y * t;
const easeInOut2 = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
// const easeInOut4 = t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;

function updateGenes(geneKeyframes, targetGenes, animationProgress) {
	const numKeyframes = geneKeyframes.length;
	const maxKeyframeIndex = numKeyframes - 1;
	const keyframeIndex = Math.max(0, animationProgress) * maxKeyframeIndex;
	const lo = Math.floor(keyframeIndex);
	const hi = Math.ceil(keyframeIndex);
	const loFrame = geneKeyframes[lo];
	const hiFrame = geneKeyframes[hi];
	const t = easeInOut2(keyframeIndex - lo);

	let outputGenes = targetGenes;
	loFrame.forEach((a, key) => {
		const b = hiFrame.get(key);
		outputGenes = outputGenes.set(key, mix(t, a, b));
	});
	return outputGenes;
}

const stillFormats = [];
const animationFormats = [];
Object.keys(exportFormats).forEach(key => {
	const format = exportFormats[key];
	const array = format.anim ? animationFormats : stillFormats;
	array.push([key, format.name]);
});

/*
todo:
- ideal export settings seem to depend on what we're drawing.
	e.g. bar chart looks better with antialias off, but not pie chart.
- video exporters may require 2d canvas
- try FXAA?
- webm does not support transparent. gif.js may not either
*/
const pixiOptions = {
	resolution: 1,
	backgroundColor: 0,
	antialias: true,
	transparent: true,
	preserveDrawingBuffer: true
};

const styles = theme => ({
	exportControls: {
		overflowY: 'auto',
		flex: 1//,
		// padding: theme.spacing.unit
	},
	formControl: {
		display: 'flex'
	},
	formControlLabel: {
		display: 'flex',
		marginLeft: 0
	},
	checkbox: {
		width: 24,
		height: 24,
		padding: '0 8px 0 0'
	},
	label: {
		fontSize: '0.875rem'
	},
	buttons: {
		marginTop: theme.spacing.unit,
		flexDirection: 'row',
		lineHeight: '44px'
	},
	button: {
		marginRight: theme.spacing.unit
	},
	progressDialog: {
		minWidth: '35%',
		maxHeight: '60%',
		width: 'min-content',
		maxWidth: '90%'
	},
	backdrop: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		boxSizing: 'border-box',
		backgroundColor: 'rgba(0, 0, 0, 0.5)'
	}
});

const urls = new Set();
function cleanUrls() {
	urls.forEach(url => URL.revokeObjectURL(url));
	urls.clear();
}

function configCacheKey(config) {
	const { format } = config;
	const exportFormat = exportFormats[format];

	const title = config.showTitle ? config.title : '';
	const backgroundColor = config.transparentBackground && exportFormat.transparent ?
		null :
		config.backgroundColor;

	config = assign({}, config, {
		title,
		backgroundColor
	});
	return Object.keys(config).map(key =>
		JSON.stringify(config[key] === 'undefined' ? '' : config[key])
	).join(',');
}

const resolutionErrors = val => {
	if (isNaN(val) || val === '') {
		return 'Resolution must be a number';
	}
	val = Number(val);
	if (val < 16) {
		return 'Resolution must be at least 16 pixels';
	}
	if (val > MAX_SIZE) {
		return 'Resolution cannot be more than ' + MAX_SIZE;
	}
};

const Def = class Export extends React.Component {
	static propTypes = {
		data: PropTypes.object.isRequired,
		nodePath: PropTypes.array.isRequired,
		onComplete: PropTypes.func,
		classes: PropTypes.object.isRequired,
		className: PropTypes.string,
		navigation: PropTypes.oneOfType([
			PropTypes.arrayOf(PropTypes.node),
			PropTypes.node
		]),
		highlightColor: PropTypes.string
	}

	sketch = null
	blobCache = new Map()

	constructor(props) {
		super(props);

		let exportOptions = null;
		try {
			exportOptions = JSON.parse(localStorage.getItem('exportOptions') || '{}');
		} catch (e) {}

		this.frameId = 0;
		this.lastRenderTime = 0;

		const config = assign({
			resolution: DEFAULT_SIZE,
			margin: true,
			showLabels: true,
			labelFontSize: 26,
			format: 'gif',
			title: 'Chart',
			showTitle: false,
			frameRate: 30,
			duration: DEFAULT_DURATION,
			bounce: true,
			transparentBackground: true,
			backgroundColor: {
				// r: 255,
				// g: 255,
				// b: 255,
				r: 0,
				g: 0,
				b: 0,
				a: 1
			}
		}, exportOptions);

		this.state = {
			canAnimate: false,
			animating: false,
			exportAnimation: false,
			animationProgress: 0,
			mutableGenes: null,
			geneKeyframes: null,
			drawFunction: null,
			previewFunction: null,
			sourceData: null,

			exporting: false,
			savingProgress: 0,

			savedContent: null,
			downloadURL: '',
			shareURL: '',

			config
		};
	}

	close = () => {
		if (this.props.onComplete) {
			this.props.onComplete();
		}
	}

	initAnimation = () => {
		const {
			data,
			nodePath
		} = this.props;

		if (nodePath.length < 4) {
			return;
		}

		if (!this.state.mutableGenes) {
			const genes = data.getIn(nodePath).get('genes');

			const geneKeyframes = [];
			for (let i = 2; i <= nodePath.length; i += 2) {
				const keyframePath = nodePath.slice(0, i);
				const keyframe = data.getIn(keyframePath).get('genes');
				geneKeyframes.push(keyframe);
			}
			const mutableGenes = genes.asMutable();
			this.setState({
				mutableGenes,
				geneKeyframes
			});
		}
	}

	startAnimating = () => {
		if (!this.state.canAnimate) {
			return;
		}
		this.initAnimation();
		this.setState({
			animating: true
		});
		cancelAnimationFrame(this.frameId);
		this.frameId = requestAnimationFrame(this.tick);
	}

	stopAnimating = () => {
		cancelAnimationFrame(this.frameId);
		this.setState({
			animationProgress: 0,
			animating: false
		});
	}

	endAnimationRender = null
	cancelAnimationRender = () => {
		logExportEvent(this.state.config, 'cancel');
		this.setState({
			exporting: false
		});
		if (this.endAnimationRender) {
			this.endAnimationRender();
		}
		this.endAnimationRender = null;
		this.startAnimating();
	}

	cancelShare = () => {
		logExportEvent(this.state.config, 'share-cancel');
		this.setState({
			exporting: false,
			shareURL: ''
		});
		if (this.endAnimationRender) {
			this.endAnimationRender();
		}
		this.endAnimationRender = null;
		this.startAnimating();
	}

	tick = time => {
		if (!this.state.animating) {
			return;
		}

		if (!this.state.mutableGenes) {
			this.startAnimating();
			return;
		}

		const delta = this.lastRenderTime ? time - this.lastRenderTime : 0;
		this.lastRenderTime = time;
		this.frameId = requestAnimationFrame(this.tick);

		const {
			geneKeyframes,
			mutableGenes
		} = this.state;

		const {
			duration,
			bounce
		} = this.state.config;

		const timeIncrement = delta / (duration * 1000);
		let animationProgress = this.state.animationProgress + timeIncrement;
		animationProgress -= Math.floor(animationProgress);

		// handle bouncing
		const t = bounce ? 1 - Math.abs(2 * animationProgress - 1) : animationProgress;
		updateGenes(geneKeyframes, mutableGenes, t);

		this.setState({
			mutableGenes,
			animationProgress
		});
	}

	saveSVG = onComplete => {
		const {
			data,
			nodePath
		} = this.props;

		const { drawFunction } = this.state;

		const {
			backgroundColor,
			transparentBackground,
			...otherConfig
		} = this.state.config;
		const {
			a,
			...rgb
		} = backgroundColor;

		const config = {
			backgroundColor: {
				a: transparentBackground ? 0 : a,
				...rgb
			},
			...otherConfig
		};

		const svgSource = exportSVG({
			data,
			nodePath,
			drawFunction,
			...config
		});

		// save SVG
		onComplete(svgSource);
	}

	savePNG = onComplete => {
		const {
			data,
			nodePath
		} = this.props;
		const { config, sourceData } = this.state;
		const genes = data.getIn(nodePath).get('genes');
		const resolution = Number(config.resolution);

		const pathContainer = new Path();
		if (config.margin) {
			const scale = 0.8;
			const margin = resolution * (1 - scale) / 2;
			pathContainer.scale.set(scale, scale);
			pathContainer.position.set(margin, margin);
		}

		const pixiOpts = assign({}, pixiOptions);
		const { a, r, g, b } = config.backgroundColor;
		if (a > 0 && !config.transparentBackground) {
			assign(pixiOpts, {
				// eslint-disable-next-line no-bitwise
				backgroundColor: r << 16 ^ g << 8 ^ b << 0,
				transparent: a < 1
			});
		}

		const app = new PIXIApplication({
			width: resolution,
			height: resolution,
			...pixiOpts
		});

		const container = new Container();
		app.stage.addChild(container);

		const drawFn = drawPixi(this.state.drawFunction, pathContainer);
		const draw = drawFn(container, app);
		if (draw.update) {
			draw.update({
				sourceData,
				genes,
				title: config.showTitle && config.title,
				showLabels: !!config.showLabels,
				fontSize: config.labelFontSize,
				backgroundColor: {
					a: config.transparentBackground ? 0 : a,
					r,
					g,
					b
				}
			});
		}

		if (draw.resize) {
			draw.resize(resolution, resolution);
		}

		app.render();

		const { mime } = exportFormats.png;

		canvasToBlob(app.renderer.view, blob => {
			onComplete(blob);

			// clean up
			if (draw.destroy) {
				draw.destroy();
			}
			try {
				app.destroy();
			} catch (e) {}
		}, mime);
	}

	saveHTML = onComplete => {
		const {
			data,
			nodePath
		} = this.props;
		const { drawFunction, config } = this.state;

		const svgSource = exportSVG({
			data,
			nodePath,
			drawFunction,
			...config
		});

		const template = require('html-loader!../export/template.html');

		const title = config.showTitle && config.title || 'Chart';
		const titleSpan = document.createElement('span');
		titleSpan.appendChild(document.createTextNode(title));

		const htmlSource = template
			.replace('INSERT_TITLE_HERE', titleSpan.innerHTML)
			.replace('INSERT_SVG_HERE', svgSource);

		// save HTML
		onComplete(htmlSource);
	}

	saveVideo = (onComplete, onProgress) => {
		this.stopAnimating();

		const { config, sourceData } = this.state;
		const resolution = Number(config.resolution);
		const {
			geneKeyframes,
			mutableGenes
		} = this.state;
		const {
			duration,
			format,
			bounce
		} = config;

		const pathContainer = new Path();
		if (config.margin) {
			const scale = 0.8;
			const margin = resolution * (1 - scale) / 2;
			pathContainer.scale.set(scale, scale);
			pathContainer.position.set(margin, margin);
		}

		const pixiOpts = assign({}, pixiOptions);
		const exportFormat = exportFormats[format];

		if (exportFormat.transparent !== undefined) {
			pixiOpts.transparent = exportFormat.transparent;
		}

		const { a, r, g, b } = config.backgroundColor;
		if (a > 0 && !config.transparentBackground || !pixiOpts.transparent) {
			assign(pixiOpts, {
				// eslint-disable-next-line no-bitwise
				backgroundColor: r << 16 ^ g << 8 ^ b << 0,
				transparent: a < 1 && pixiOpts.transparent
			});
		}

		const app = new PIXIApplication({
			width: resolution,
			height: resolution,
			...pixiOpts
		});

		const container = new Container();
		app.stage.addChild(container);

		const maxFrameRate = exportFormat.maxFrameRate || Infinity;
		const frameRate = Math.min(config.frameRate, maxFrameRate);

		const drawFn = drawPixi(this.state.drawFunction, pathContainer);
		const draw = drawFn(container, app);
		const drawOptions = {
			sourceData,
			genes: mutableGenes,
			title: config.showTitle && config.title,
			showLabels: !!config.showLabels,
			fontSize: config.labelFontSize,
			backgroundColor: {
				a: config.transparentBackground ? 0 : a,
				r,
				g,
				b
			}
		};

		if (draw.resize) {
			draw.resize(resolution, resolution);
		}

		/*
		todo:
		- allow canceling
		- make form elements for frame rate and duration
		*/
		const videoWriter = new VideoWriter(videoFormats[format], {
			width: resolution,
			height: resolution,
			quality: 1,
			frameRate,
			transparent: !!exportFormat.transparent
			// todo: digits based on number of frames
		});
		this.videoWriter = videoWriter;

		videoWriter.start();

		let renderProgress = 0;
		let exportProgress = 0;
		const renderProgressFactor = videoWriter.reportsProgress ? 0.5 : 0.9;
		const exportProgressFactor = videoWriter.reportsProgress ? 0.5 : 0;

		const me = this;
		function updateProgress() {
			onProgress(renderProgress * renderProgressFactor +
				exportProgress * exportProgressFactor);
		}

		let currentFrame = 0;
		const frameCount = frameRate * duration;
		function renderFrames(idleDeadline) {
			// true if it took longer to render a single frame than idle time allows
			let tooLong = false;
			let framesRendered = 0;
			let totalTime = 0;

			do {
				console.time('Frame', currentFrame);
				const timeLeft = idleDeadline.timeRemaining();
				const startTime = Date.now();

				const animationProgress = currentFrame / frameCount;
				const t = bounce ? 1 - Math.abs(2 * animationProgress - 1) : animationProgress;
				updateGenes(geneKeyframes, mutableGenes, t);
				if (draw.update) {
					draw.update(drawOptions);
				}

				app.render();
				videoWriter.addFrame(app.renderer.view);
				if (DEBUG) {
					console.timeEnd('Frame', currentFrame);
				}
				currentFrame++;

				if (currentFrame > frameCount) {
					console.time('write video');
					videoWriter.finish();
					return;
				}

				const frameRenderTime = Date.now() - startTime;
				totalTime += frameRenderTime;
				tooLong = !framesRendered && frameRenderTime > timeLeft;

				framesRendered++;
			} while (idleDeadline.timeRemaining() >= totalTime / framesRendered);

			renderProgress = Math.min(1, currentFrame / frameCount);
			updateProgress();

			if (tooLong) {
				// take a few milliseconds to let the CPU cool down
				me.frameId = setTimeout(() => {
					me.frameId = requestIdleCallback(renderFrames);
				}, 10);
			} else {
				me.frameId = requestIdleCallback(renderFrames);
			}
		}

		videoWriter.on('progress', progress => {
			if (progress < exportProgress) {
				console.warn('progress regressed');
			}
			exportProgress = Math.max(progress, exportProgress);
			updateProgress();
		});

		const processBlob = blob => {
			onComplete(blob);

			if (this.endAnimationRender) {
				this.endAnimationRender();
			}
		};

		videoWriter.on('finish', processBlob);

		this.endAnimationRender = () => {
			clearTimeout(this.frameId);
			cancelIdleCallback(this.frameId);

			if (DEBUG) {
				console.timeEnd('write video');
			}

			// clean up
			videoWriter.destroy();

			if (draw.destroy) {
				draw.destroy();
			}
			try {
				app.destroy();
			} catch (e) {}
		};

		me.frameId = requestIdleCallback(renderFrames);
	}

	save = () => {
		this.dismissRender();

		const { config } = this.state;

		logExportEvent(config);

		const { format } = config;
		const exportFormat = exportFormats[format];
		const { mime, ext } = exportFormat;
		const fileName = `chart-${Date.now()}.${ext}`;

		// get file from cache if possible
		const cacheKey = configCacheKey(config);
		if (this.blobCache.has(cacheKey)) {
			const blobData = this.blobCache.get(cacheKey);
			const { blob } = blobData;
			this.downloadFile(fileName, blob);
			return;
		}

		this.setState({
			savingProgress: 0,
			exporting: true
		});

		const renderCallback = (content) => {
			const blob = this.storeRenderedFile(content, mime, cacheKey);
			this.downloadFile(fileName, blob);
			logExportEvent(config, 'complete');

			this.setState({
				savingProgress: 1,
				exporting: false
			});
		};
		const progressCallback = savingProgress => {
			this.setState({
				savingProgress
			});
		};

		this.setState({
			savingProgress: 0
		});

		if (config.format === 'png') {
			this.savePNG(renderCallback, progressCallback);
		} else if (config.format === 'html') {
			this.saveHTML(renderCallback, progressCallback);
		} else if (config.format === 'svg') {
			this.saveSVG(renderCallback, progressCallback);
		} else {
			this.saveVideo(renderCallback, progressCallback);
		}
	}

	exportToShare = () => {
		this.dismissRender();
		this.setState({
			savingProgress: 0,
			exporting: true
		});

		const { config } = this.state;

		logExportEvent(config, 'export-share');

		const { format } = config;
		const exportFormat = exportFormats[format];
		const { mime, ext } = exportFormat;
		const fileName = `chart-${Date.now()}.${ext}`;

		let renderProgress = 0;
		let uploadProgress = 0;

		const updateProgress = () => {
			this.setState({
				savingProgress: renderProgress * 0.8 + uploadProgress * 0.2
			});
		};

		const onUploadProgress = progress => {
			uploadProgress = progress;
			updateProgress();
		};

		const onUpload = blobData => {
			uploadProgress = 1;
			updateProgress();

			const { shareURL } = blobData;
			this.setState({
				savingProgress: 1,
				exporting: false,
				shareURL
			});
		};

		// get file from cache if possible
		const cacheKey = configCacheKey(config);
		if (this.blobCache.has(cacheKey)) {
			const blobData = this.blobCache.get(cacheKey);
			const { blob, shareURL } = blobData;

			// go do upload now, unless it's already cached
			if (shareURL) {
				onUpload(blobData);
			} else {
				this.uploadFile(fileName, blob, cacheKey, onUpload, onUploadProgress);
			}
			return;
		}

		const onRender = (content) => {
			renderProgress = 1;

			const blob = this.storeRenderedFile(content, mime, cacheKey);
			// todo: logExportEvent(config, 'complete');

			// todo: go do upload now
			this.uploadFile(fileName, blob, cacheKey, onUpload, onUploadProgress);

			updateProgress();
		};
		const onRenderProgress = progress => {
			renderProgress = progress;
			updateProgress();
		};

		if (config.format === 'png') {
			this.savePNG(onRender, onRenderProgress);
		} else {
			this.saveVideo(onRender, onRenderProgress);
		}
	}

	dismissRender = () => {
		this.setState({
			savedContent: null,
			downloadURL: ''
		});
	}

	storeRenderedFile = (content, type, cacheKey) => {
		const blob = content instanceof Blob && content.type ?
			content :
			new Blob([content], { type });

		this.blobCache.set(cacheKey, { blob });

		return blob;
	}

	uploadFile = (fileName, blob, cacheKey, onComplete, onProgress) => {
		if (!blob) {
			throw new Error('Cannot upload. no content found');
		}

		const auth = 'Client-ID ' + IMGUR_CLIENT_ID;
		const xhr = new XMLHttpRequest();
		xhr.open('POST', IMGUR_UPLOAD_URL, true);
		xhr.setRequestHeader('Authorization', auth);
		xhr.setRequestHeader('Accept', 'application/json');

		const formData = new FormData();
		formData.append('type', 'file');
		formData.append('name', fileName);
		formData.append('image', blob, fileName);
		formData.append('description', IMGUR_DESCRIPTION);
		formData.append('title', this.state.config.title || fileName);

		// todo: save xhr somewhere so we can cancel it
		this.endAnimationRender = () => xhr.abort();

		if (xhr.upload) {
			xhr.upload.onprogress = evt => {
				onProgress(evt.loaded / evt.total);
			};
		}

		xhr.onreadystatechange = () => {
			if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {

				this.endAnimationRender = null;

				// todo: catch error or failure and report it
				const response = JSON.parse(xhr.response);
				const blobData = this.blobCache.get(cacheKey);
				blobData.shareData = response.data;
				blobData.shareURL = IMGUR_LINK_PREFIX + response.data.id;

				onComplete(blobData);
			}
		};

		xhr.send(formData);
	}

	downloadFile = (fileName, blob) => {
		let downloadURL = '';
		if (canSave) {
			downloadFile(fileName, blob, blob.type);
		} else {
			downloadURL = URL.createObjectURL(blob);
			urls.add(downloadURL);
		}
		this.setState({
			downloadURL,
			savedContent: blob,
			fileName
		});
	}

	setOptions = opts => {
		const config = assign({}, this.state.config, opts);
		this.setState({ config });
		try {
			localStorage.setItem('exportOptions', JSON.stringify(config));
		} catch (e) {}
	}

	changeType = event => {
		const exportAnimation = event.target.value === 'true';
		if (exportAnimation !== this.state.exportAnimation) {
			if (exportAnimation) {
				this.startAnimating();
			} else {
				this.stopAnimating();
			}

			const format = (exportAnimation ? animationFormats : stillFormats)[0][0];
			this.setState({
				exportAnimation
			});
			this.setOptions({
				format
			});
		}
	}

	changeFormat = event => {
		const format = event.target.value;
		this.setOptions({
			format
		});
	}

	changeNumber = (name, precision = 0) => arg => {
		const input = arg.target ? arg.target.value : arg;
		const val = precision ? Math.round(Number(input) / precision) * precision : Number(input);
		if (val > 0) {
			this.setOptions({
				[name]: val
			});
		} else {
			const config = assign({}, this.state.config, {
				[name]: input
			});
			this.setState({
				config
			});
		}
	}

	changeBoolean = name => event => {
		const val = !!event.target.checked;
		this.setOptions({
			[name]: val
		});
	}

	changeBounce = event => {
		const bounce = !!event.target.checked;
		this.setOptions({
			bounce
		});

		// avoid abrupt change in animation preview
		let animationProgress = this.state.animationProgress;
		if (animationProgress > 0.5) {
			if (bounce) {
				animationProgress /= 2;
			} else {
				animationProgress = (1 - animationProgress) * 2;
			}
			this.setState({
				animationProgress
			});
		}
	}

	changeTitle = event => {
		const title = event.target.value || '';
		this.setOptions({
			title
		});
	}

	changeBackgroundColor = backgroundColor => {
		this.setOptions({ backgroundColor });
	}

	// eslint-disable-next-line camelcase
	UNSAFE_componentWillMount() {
		const chartType = this.props.data.get('chartType');
		const chartDef = charts[chartType];
		const drawFunction = drawTitle(chartDef.draw);
		const sourceData = fieldMappedTable(this.props.data);

		const topContainer = new Path();
		const previewFunction = drawPixi(drawFunction, topContainer);
		const canAnimate = this.props.nodePath.length >= 4;
		const config = this.state.config;
		const format = config.format;
		const exportAnimation = canAnimate && !!exportFormats[format].anim;

		if (!canAnimate && exportFormats[format].anim) {
			config.format = DEFAULT_STILL_FORMAT;
		}

		this.setState({
			exportAnimation,
			config,
			canAnimate,
			sourceData,
			drawFunction,
			previewFunction
		});
	}

	// eslint-disable-next-line camelcase
	UNSAFE_componentWillReceiveProps(newProps) {
		const oldChartType = this.props.data && this.props.data.get('chartType');
		const chartType = newProps.data && newProps.data.get('chartType');
		if (chartType !== oldChartType) {
			const chartDef = charts[chartType];
			const drawFunction = drawTitle(chartDef.draw);

			const topContainer = new Path();
			const previewFunction = drawPixi(drawFunction, topContainer);
			this.setState({ drawFunction, previewFunction });
		}

		let sourceData = this.state.sourceData;
		if (newProps.data !== this.props.data) {
			sourceData = fieldMappedTable(newProps.data);
		}

		const canAnimate = newProps.nodePath.length >= 4;
		const config = this.state.config;
		const format = config.format;
		const exportAnimation = canAnimate && !!exportFormats[format].anim;

		if (!canAnimate && exportFormats[format].anim) {
			config.format = DEFAULT_STILL_FORMAT;
		}

		// force rebuild of rendering parameters
		this.setState({
			animating: exportAnimation,
			exportAnimation,
			config,
			canAnimate,
			sourceData,
			mutableGenes: exportAnimation ? this.state.mutableGenes : null,
			geneKeyframes: exportAnimation ? this.state.geneKeyframes : null
		});
		if (!canAnimate) {
			this.stopAnimating();
		} else if (exportAnimation) {
			this.startAnimating();
		}
	}

	componentDidMount() {
		const format = this.state.config.format || DEFAULT_STILL_FORMAT;
		const animating = !!exportFormats[format].anim;
		if (animating) {
			this.startAnimating();
		}
	}

	componentWillUnmount() {
		if (this.endAnimationRender) {
			this.endAnimationRender();
		}
		this.stopAnimating();
		cleanUrls();
		this.blobCache.clear();
	}

	render() {
		const {
			classes,
			data,
			nodePath,
			navigation
		} = this.props;
		const { config, sourceData } = this.state;

		const genes = this.state.animating &&
			this.state.mutableGenes ||
			data.getIn(nodePath).get('genes');

		const resolutionError = resolutionErrors(config.resolution);
		const hasError = !!resolutionError;

		const exportFormat = exportFormats[config.format];
		const usesAnimation = this.state.canAnimate && exportFormat.anim;
		const disableAlpha = exportFormat.transparent === false;
		const maxFrameRate = exportFormat.maxFrameRate || Infinity;
		const canShare = !!exportFormat.share;

		const {
			a,
			...rgb
		} = config.backgroundColor;

		const alpha = disableAlpha ? 1 :
			config.transparentBackground ? 0 : a;

		const backgroundColor = {
			a: alpha,
			...rgb
		};

		return <React.Fragment>
			<NodeInspector
				tip="Choose a still image or animation, customize, save and share your leaf."
				tipCompact="Export"
				title="Export File"
				PreviewComponent={Sketch}
				sourceData={sourceData}
				data={data}
				genes={genes}
				highlightColor={this.props.highlightColor}
				previewProps={{
					sketch: this.state.previewFunction,
					data,
					showLabels: config.showLabels,
					title: config.showTitle && config.title,
					fontSize: config.labelFontSize,
					backgroundColor
				}}
				navigation={navigation}
				onClose={this.close}
			>
				<div className={classes.exportControls}>
					<FormControl className={classes.formControl}>
						<FormLabel>Type</FormLabel>
						<RadioGroup
							aria-label="animation"
							name="animation"
							value={String(this.state.exportAnimation)}
							onChange={this.changeType}
						>
							<RadioOption value="false">Still Image</RadioOption>
							<RadioOption value="true" disabled={!this.state.canAnimate}>Animation</RadioOption>
						</RadioGroup>
					</FormControl>
					<FormControl className={classes.formControl}>
						<InputLabel htmlFor="file-format">Format</InputLabel>
						<Select
							native
							value={config.format}
							onChange={this.changeFormat}
							inputProps={{
								id: 'file-format'
							}}
						>
							{(this.state.exportAnimation ? animationFormats : stillFormats)
								.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
						</Select>
					</FormControl>
					<TextField
						type="number"
						error={hasError}
						label="Resolution"
						helperText={resolutionError || 'Resolution in pixels of output image'}
						value={config.resolution}
						required={true}
						onChange={this.changeNumber('resolution')}
						onBlur={this.changeNumber('resolution', 1)}
						inputProps={{
							min: 16,
							max: MAX_SIZE,
							step: 1
						}}
					/>
					{usesAnimation ?
						<React.Fragment>
							<FormControl className={classes.formControl}>
								<InputLabel htmlFor="file-format">Frame Rate (fps)</InputLabel>
								<Select
									native
									value={Math.min(config.frameRate, maxFrameRate)}
									onChange={this.changeNumber('frameRate')}
									inputProps={{
										id: 'file-format'
									}}
								>
									{frameRates
										.filter(rate => rate <= maxFrameRate)
										.map(val => <option key={val} value={val}>{formatFrameRate(val)}</option>)}
								</Select>
							</FormControl>

							<Typography variant="body1" className={classes.label}>Duration ({config.duration} sec)</Typography>
							<Slider
								className={classes.slider}
								min={1}
								max={MAX_DURATION}
								step={0.1}
								tipFormatter={value => `${value} sec`}
								value={config.duration}
								onChange={this.changeNumber('duration')}
							/>

							<FormControlLabel
								className={classes.formControlLabel}
								control={
									<Checkbox
										className={classes.checkbox}
										checked={config.bounce}
										onChange={this.changeBounce}
										color="primary"
									/>
								}
								label="Seamless Loop"
							/>
						</React.Fragment> : null
					}

					{
						!disableAlpha ?
							<FormControlLabel
								className={classes.formControlLabel}
								control={
									<Checkbox
										className={classes.checkbox}
										checked={config.transparentBackground}
										onChange={this.changeBoolean('transparentBackground')}
										color="primary"
									/>
								}
								label="Transparent Background"
							/> :
							null
					}
					{
						disableAlpha || !config.transparentBackground ?
							<FormControlLabel
								className={classes.formControlLabel}
								control={
									<ColorPicker
										className={classes.button}
										disableAlpha={disableAlpha}
										onChange={this.changeBackgroundColor}
										color={config.backgroundColor}
									/>
								}
								label="Background Color"
							/> :
							null
					}

					<FormControlLabel
						className={classes.formControlLabel}
						control={
							<Checkbox
								className={classes.checkbox}
								checked={config.margin}
								onChange={this.changeBoolean('margin')}
								color="primary"
							/>
						}
						label="Add Margin"
					/>
					{ sourceData.has('label') ?
						<React.Fragment>
							<FormControlLabel
								className={classes.formControlLabel}
								control={
									<Checkbox
										className={classes.checkbox}
										checked={config.showLabels}
										onChange={this.changeBoolean('showLabels')}
										color="primary"
									/>
								}
								label="Show Labels"
							/>
							{config.showLabels ?
								<React.Fragment>
									<Typography variant="body1" className={classes.label}>Font Size</Typography>
									<Slider
										className={classes.slider}
										min={10}
										max={40}
										step={1}
										value={config.labelFontSize}
										onChange={this.changeNumber('labelFontSize')}
									/>
								</React.Fragment> : null
							}
						</React.Fragment> :
						null
					}
					<FormControlLabel
						className={classes.formControlLabel}
						control={
							<Checkbox
								className={classes.checkbox}
								checked={config.showTitle}
								onChange={this.changeBoolean('showTitle')}
								color="primary"
							/>
						}
						label="Show Title"
					/>
					<TextField
						type="string"
						label="Title"
						helperText="Title"
						value={config.title}
						required={false}
						onChange={this.changeTitle}
					/>
				</div>
				<div className={classes.buttons}>
					<Button color="secondary" variant="raised" onClick={this.close} className={classes.button}>Back</Button>
					<Button color="secondary" variant="raised" onClick={this.save} className={classes.button} disabled={hasError}>Save {config.format.toUpperCase()}</Button>
					<Button color="secondary" variant="raised" onClick={this.exportToShare} className={classes.button} disabled={hasError || !canShare}>Share Social</Button>
				</div>
			</NodeInspector>
			{
				this.state.exporting ?
					<Dialog
						id="export-progress"
						aria-labelledby="export-progress-title"
						open={true}
						onClose={this.cancelAnimationRender}
						disableBackdropClick={true}
						BackdropProps={{
							className: classes.backdrop
						}}
						classes={{
							paper: classes.progressDialog
						}}
					>
						<DialogTitle id="export-progress-title">Exporting...</DialogTitle>
						<DialogContent>
							<LinearProgress
								variant="determinate"
								value={this.state.savingProgress * 100}
							/>
							<DialogActions>
								<Button onClick={this.cancelAnimationRender} color="secondary">Cancel</Button>
							</DialogActions>

						</DialogContent>
					</Dialog> :
					null
			}
			{
				this.state.shareURL ?
					<SocialShareDialog
						url={this.state.shareURL}
						title={config.title}
						text="Made with Morph"
						onClose={this.cancelShare}
						BackdropProps={{
							className: classes.backdrop
						}}
					/> :
					null
			}
			<Snackbar
				open={!!this.state.savedContent}
				onClose={this.dismissRender}
				autoHideDuration={canSave ? 2000 : null}
				ContentProps={{
					'aria-describedby': 'message-id'
				}}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left'
				}}
				message={<span id="message-id">Export Complete</span>}
				action={[
					canSave ?
						null :
						<Button key="download" color="secondary" size="small"
							target="_blank"
							rel="noopener noreferrer"
							onClick={() => setTimeout(this.dismissRender, 1000)}
							href={this.state.downloadURL}>
							Open
						</Button>,
					<IconButton
						key="close"
						aria-label="Close"
						color="inherit"
						onClick={this.dismissRender}
					>
						<CloseIcon />
					</IconButton>
				]}
			/>
		</React.Fragment>;
	}
};

const Export = withStyles(styles)(Def);
export default Export;