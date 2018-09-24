import React from 'react';
// import classNames from 'classnames';

/*
Material UI components
*/
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import Stepper from '@material-ui/core/Stepper';

const styles = theme => ({
	stepper: {
		backgroundColor: theme.palette.background.default,
		display: 'none'
	},
	stepperRoot: {
		padding: theme.spacing.unit * 2,
		flexGrow: 1
	},
	'@media (max-width: 620px)': {
		endButton: {}, // we need this here so the next bit works
		stepper: {
			'& $endButton': {
				display: 'none'
			}
		}
	},
	'@media (min-width: 620px)': {
		stepper: {
			display: 'inherit'
		},
		mobileStepper: {
			display: 'none'
		}
	}
});

const Def = class StyledStepper extends React.Component {
	static propTypes = {
		className: PropTypes.string,
		classes: PropTypes.object.isRequired,
		children: PropTypes.oneOfType([
			PropTypes.arrayOf(PropTypes.node),
			PropTypes.node
		])
	}

	render() {
		const {
			classes,
			children,
			...otherProps
		} = this.props;

		return <div className={classes.stepper}>
			<Stepper
				classes={{root: classes.stepperRoot}}
				{...otherProps}
			>
				{children}
			</Stepper>
		</div>;
	}
};

const StyledStepper = withStyles(styles)(Def);
export default StyledStepper;