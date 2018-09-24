import React from 'react';

import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

/*
Material UI stuff
*/
import withStyles from '@material-ui/core/styles/withStyles';
import PropTypes from 'prop-types';
import Tooltip from '@material-ui/core/Tooltip';

const styles = theme => ({
	container: {
		padding: `0 ${theme.spacing.unit * 2}px`
	}
});

const Handle = Slider.Handle;

function createSliderWithTooltip(Component) {
	return class HandleWrapper extends React.Component {
		static propTypes = {
			classes: PropTypes.object.isRequired,
			theme: PropTypes.object.isRequired,
			marks: PropTypes.object,
			tipFormatter: PropTypes.func,
			handleStyle: PropTypes.arrayOf(PropTypes.object),
			tipProps: PropTypes.object
		}

		static defaultProps = {
			tipFormatter: value => value,
			handleStyle: [{}],
			tipProps: {}
		}

		constructor(props) {
			super(props);
			this.state = { visibles: {} };
		}

		handleTooltipVisibleChange = (index, visible) => {
			this.setState((prevState) => {
				return {
					visibles: {
						...prevState.visibles,
						[index]: visible
					}
				};
			});
		}
		handleWithTooltip = ({ value, dragging, index, disabled, ...restProps }) => {
			const {
				tipFormatter,
				tipProps,
				theme
			} = this.props;

			const {
				title = tipFormatter(value),
				placement = 'top',
				...restTooltipProps
			} = tipProps;

			// todo: replace prefixCls with className?
			// todo: override tooltipOpen to remove animation

			const handleStyle = {
				borderColor: theme.palette.primary.main
			};

			return (
				<Tooltip
					{...restTooltipProps}
					title={title}
					placement={placement}
					open={!disabled && (this.state.visibles[index] || dragging)}
					key={index}
				>
					<Handle
						{...restProps}
						style={handleStyle}
						value={value}
						onMouseEnter={() => this.handleTooltipVisibleChange(index, true)}
						onMouseLeave={() => this.handleTooltipVisibleChange(index, false)}
					/>
				</Tooltip>
			);
		}
		render() {
			const { classes, theme } = this.props;
			const trackStyle = {
				backgroundColor: theme.palette.primary.main
			};

			const style = {};
			if (this.props.marks) {
				style.marginBottom = 32;
			}

			const props = {
				style,
				trackStyle,
				...this.props
			};
			return <div className={classes.container}>
				<Component
					{...props}
					handle={this.handleWithTooltip}
				/>
			</div>;
		}
	};
}

const Def = withStyles(styles, { withTheme: true })(createSliderWithTooltip(Slider));
export default Def;

// const Range = withStyles(styles)(createSliderWithTooltip(Slider.Range));
// export Range