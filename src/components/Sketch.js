import React from 'react';
import PropTypes from 'prop-types';
import assign from 'object-assign';

import { Application as PIXIApplication } from '@pixi/app';
import { Container } from '@pixi/display';

import hexColor from '../util/hexColor';

const style = {
	// black background because of Safari webgl bug
	// https://github.com/pixijs/pixi.js/issues/4523
	backgroundColor: '#000',
	overflow: 'hidden'
};

const RESOLUTION = window.devicePixelRatio;

const defaultPixiOptions = {
	resolution: RESOLUTION,
	backgroundColor: 0xffffff,
	antialias: true,
	forceCanvas: false
};

const contexts = [];

function patchPixiContext(pixiContext) {
	if (pixiContext.gl.glVersion === 2) {
		pixiContext.webGLVersion = 2;
	} else {
		const { extensions, gl } = pixiContext;
		extensions.drawBuffers = gl.getExtension('WEBGL_draw_buffers');
		extensions.depthTexture = gl.getExtension('WEBKIT_WEBGL_depth_texture');
		extensions.floatTexture = gl.getExtension('OES_texture_float');
		extensions.loseContext = gl.getExtension('WEBGL_lose_context');
		extensions.vertexArrayObject = gl.getExtension('OES_vertex_array_object')
			|| gl.getExtension('MOZ_OES_vertex_array_object')
			|| gl.getExtension('WEBKIT_OES_vertex_array_object');
	}
}

const Def = class Sketch extends React.Component {
	pixiApp = null
	sketch = null
	container = null

	static propTypes = {
		className: PropTypes.string,
		sketch: PropTypes.func.isRequired,
		height: PropTypes.number,
		width: PropTypes.number,
		style: PropTypes.object,
		centerOrigin: PropTypes.bool,
		forceCanvas: PropTypes.bool,
		bgColor: PropTypes.string
	}

	emit = (name, options) => {
		if (this.sketch && this.sketch[name]) {
			this.sketch[name](options);
		}
	}

	resize = (props) => {
		const width = props.width || this.props.width || window.innerWidth;
		const height = props.height || this.props.height || window.innerHeight;
		const app = this.pixiApp;
		app.renderer.resize(width, height);

		// need to scale the canvas by devicePixelRatio
		app.view.style.width = width + 'px';
		app.view.style.height = height + 'px';

		// center app
		if (props.centerOrigin) {
			this.container.x = app.screen.width / 2;
			this.container.y = app.screen.height / 2;
		} else {
			this.container.x = 0;
			this.container.y = 0;
		}
		this.container.updateTransform();

		if (this.sketch.resize) {
			this.sketch.resize(width, height);
		}
	}

	onResize = () => this.resize(this.props)

	componentDidMount() {
		const {
			sketch,
			height,
			width,
			centerOrigin,
			forceCanvas,
			...otherProps
		} = this.props;

		let view = null;
		let context = null;
		const pixiOptions = assign({}, defaultPixiOptions);

		pixiOptions.backgroundColor = hexColor(this.props.bgColor, pixiOptions.backgroundColor);

		if (forceCanvas) {
			pixiOptions.forceCanvas = true;
		} else {
			// todo: if getting from pool, make sure options match
			const glOpts = {
				alpha: !!pixiOptions.transparent,
				antialias: !!pixiOptions.antialias,
				depth: pixiOptions.depth !== false,
				failIfMajorPerformanceCaveat: !!pixiOptions.failIfMajorPerformanceCaveat,
				premultipliedAlpha: !!pixiOptions.transparent && pixiOptions.transparent !== 'notMultiplied',
				stencil: true,
				preserveDrawingBuffer: !!pixiOptions.preserveDrawingBuffer,
				powerPreference: pixiOptions.powerPreference
			};

			for (let i = contexts.length - 1; i >= 0; i--) {
				const c = contexts[i];
				const attr = c.getContextAttributes();
				if (!attr) {
					// attr is null, which means the context has been lost
					// it is no longer usable, so take it out of the queue
					contexts.splice(i, 1);
				} else if (!Object.keys(attr).some(key => attr[key] !== glOpts[key])) {
					contexts.splice(i, 1);
					context = c;
					view = context.canvas;
					break;
				}
			}

			if (!context) {
				view = document.createElement('canvas');

				try {
					context = view.getContext('webgl2', glOpts);
					if (context) {
						context.glVersion = 2;
					}
					if (!context) {
						context = view.getContext('webgl', glOpts) ||
							view.getContext('experimental-webgl', glOpts);
					}
				} catch (e) {}
			}

			assign(pixiOptions, {
				view,
				context
			});
		}

		const app = this.pixiApp = new PIXIApplication({
			width: width || window.innerWidth,
			height: height || window.innerHeight,
			...pixiOptions
		});
		patchPixiContext(app.renderer.context);

		this.wrapper.appendChild(app.view);
		this.wrapper.className = this.props.className || '';
		this.container = new Container();
		app.stage.addChild(this.container);

		this.sketch = sketch(this.container, app, otherProps);

		if (this.sketch.update) {
			this.sketch.update(otherProps);
		}

		this.resize({ height, width, centerOrigin });

		window.addEventListener('resize', this.onResize);

		// render right away to prevent flash of black #12
		app.render();
	}

	// eslint-disable-next-line camelcase
	UNSAFE_componentWillReceiveProps(newProps) {
		const {
			sketch,
			height,
			width,
			centerOrigin,
			...otherProps
		} = newProps;

		this.wrapper.className = newProps.className || '';

		if (this.props.sketch !== sketch) {
			if (this.wrapper.childNodes.length) {
				this.wrapper.removeChild(this.wrapper.childNodes[0]);
			}

			// call destroy on old sketch
			if (this.sketch) {
				if (this.sketch.destroy) {
					this.sketch.destroy();
				}
				this.sketch = null;
			}

			let view = null;
			let context = null;

			// destroy old app
			if (this.pixiApp && this.pixiApp.renderer) {
				view = this.pixiApp.renderer.view;
				context = this.pixiApp.renderer.context;

				this.pixiApp.destroy();
			}

			const pixiOptions = assign({}, defaultPixiOptions, {
				view,
				context
			});

			pixiOptions.backgroundColor = hexColor(newProps.bgColor, pixiOptions.backgroundColor);

			const app = this.pixiApp = new PIXIApplication({
				width: width || window.innerWidth,
				height: height || window.innerHeight,
				...pixiOptions
			});
			patchPixiContext(app.renderer.context);
			this.wrapper.appendChild(app.view);
			this.container = new Container();
			app.stage.addChild(this.container);
			this.sketch = sketch(this.container, app, otherProps);
		}

		if (this.sketch.update) {
			this.sketch.update(otherProps);
		}

		if (this.props.sketch !== sketch ||
				this.props.width !== width ||
				this.props.height !== height ||
				!!this.props.centerOrigin !== !!centerOrigin) {
			this.resize({ height, width, centerOrigin });
		}
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.onResize);
		if (this.sketch) {
			if (this.sketch.destroy) {
				this.sketch.destroy();
			}
			this.sketch = null;
		}
		if (this.pixiApp) {
			const context = this.pixiApp.renderer.context.gl;
			if (context) {
				contexts.push(context);
			}
			this.pixiApp.destroy();
			this.pixiApp = null;
		}
	}

	render() {
		const wrapperStyle = assign({}, style, this.props.style);
		if (this.props.height) {
			wrapperStyle.height = this.props.height;
		}
		if (this.props.width) {
			wrapperStyle.width = this.props.width;
		}

		return <div
			style={wrapperStyle}
			ref={wrapper => this.wrapper = wrapper}/>;
	}
};

const Sketch = Def;
export default Sketch;