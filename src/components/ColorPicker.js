import React from 'react';
import SketchPicker from 'react-color/lib/components/sketch/Sketch';

/*
Material UI components
*/
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';

const styles = () => ({
	color: {
		width: 36,
		height: 14,
		borderRadius: 2
	},
	swatch: {
		padding: 5,
		background: '#fff',
		borderRadius: 1,
		boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
		display: 'inline-block',
		cursor: 'pointer'
	},
	popover: {
		position: 'absolute',
		zIndex: 2
	},
	cover: {
		position: 'fixed',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	}
});

const Def = class ColorPicker extends React.Component {
	state = {
		displayColorPicker: false,
		color: {
			r: 255,
			g: 255,
			b: 255,
			a: '1'
		}
	}

	static propTypes = {
		classes: PropTypes.object.isRequired,
		className: PropTypes.string,
		color: PropTypes.object,
		onChange: PropTypes.func,
		disableAlpha: PropTypes.bool
	}

	static defaultProps = {
		forwardDisabled: false
	}

	// eslint-disable-next-line camelcase
	UNSAFE_componentWillMount() {
		if (this.props.color) {
			this.setState({
				color: this.props.color
			});
		}
	}

	// eslint-disable-next-line camelcase
	UNSAFE_componentWillReceiveProps(newProps) {
		if (newProps.color) {
			this.setState({
				color: newProps.color
			});
		}
	}

	handleClick = () => {
		this.setState({ displayColorPicker: !this.state.displayColorPicker });
	}

	handleClose = () => {
		this.setState({ displayColorPicker: false });
	}

	handleChange = color => {
		this.setState({ color: color.rgb });
		if (this.props.onChange) {
			this.props.onChange(color.rgb);
		}
	}

	render() {
		const {
			classes,
			disableAlpha
		} = this.props;

		const {
			color,
			displayColorPicker
		} = this.state;

		const alpha = disableAlpha ? 1 : color.a;
		const backgroundColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;

		return <div className={this.props.className}>
			<div className={classes.swatch} onClick={this.handleClick}>
				<div className={classes.color} style={{ backgroundColor }}/>
			</div>
			{
				displayColorPicker ?
					<div className={classes.popover}>
						<div className={classes.cover} onClick={this.handleClose}/>
						<SketchPicker
							color={color}
							disableAlpha={disableAlpha}
							onChange={this.handleChange}
						/>
					</div> :
					null
			}
		</div>;
	}
};

const ColorPicker = withStyles(styles)(Def);
export default ColorPicker;