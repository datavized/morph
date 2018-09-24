import React from 'react';
import classNames from 'classnames';

import withStyles from '@material-ui/core/styles/withStyles';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import ArrowDropUp from '@material-ui/icons/ArrowDropUp';
import HelpIcon from '@material-ui/icons/Help';
import morphLogo from '../images/morph-logo-text.svg';
// import SvgIcon from '@material'

const styles = theme => ({
	root: {
		position: 'relative'
	},
	tip: {
		marginTop: theme.spacing.unit * 4,
		marginBottom: theme.spacing.unit * 4,
		marginLeft: theme.spacing.unit * 2,
		marginRight: theme.spacing.unit * 2,
		fontSize: '1.1em',
		fontWeight: 'normal',

		'& > p': {
			marginBottom: 0,
			marginTop: '0.5em'
		},

		'& > p:first-child': {
			marginTop: 0,
			fontSize: '1.25em'
		}
	},
	canCompact: {
		marginBottom: theme.spacing.unit * 2,
		borderBottom: `${theme.palette.divider} solid 1px`,
		'& > a > $logo': {
			display: 'none'
		}
	},
	icon: {
		position: 'absolute',
		bottom: 0,
		right: 6,
		width: 24,
		height: 36,
		fill: 'white'
	},
	logo: {
		position: 'absolute',
		top: 0,
		left: 0,
		height: '100%',
		boxSizing: 'border-box',
		padding: theme.spacing.unit,
		backgroundColor: theme.palette.background.default
	},
	compact: {
		'& > $tip': {
			margin: theme.spacing.unit,
			padding: `0 40px`
		}
	}
});

// global for now
let expanded = false;
const compactMediaQuery = window.matchMedia('(max-width: 620px), (max-height: 450px)');

const Def = class Tip extends React.Component {
	state = {
		expanded,
		isCompact: compactMediaQuery.matches
	}

	static propTypes = {
		classes: PropTypes.object.isRequired,
		className: PropTypes.string,
		theme: PropTypes.object.isRequired,
		children: PropTypes.oneOfType([
			PropTypes.arrayOf(PropTypes.node),
			PropTypes.node
		]),
		compact: PropTypes.string,
		color: PropTypes.string
	}
	toggle = () => {
		expanded = !expanded;
		this.setState({
			expanded
		});
	}

	setCompact = () => {
		this.setState({
			isCompact: compactMediaQuery.matches
		});
	}

	componentDidMount() {
		compactMediaQuery.addListener(this.setCompact);
	}

	componentWillUnmount() {
		compactMediaQuery.removeListener(this.setCompact);
	}

	render() {
		const {classes, children, compact, color, theme, ...otherProps} = this.props;
		const { isCompact } = this.state;
		const canCompact = compact && isCompact;
		const content = canCompact && !expanded && compact || children;
		const Arrow = expanded ? ArrowDropUp : HelpIcon;

		const backgroundColor = color || 'transparent';
		const textColor = backgroundColor !== 'transparent' ?
			theme.palette.getContrastText(color) :
			theme.palette.text.primary;

		return <div
			onClick={this.toggle}
			className={classNames(classes.root, {
				[classes.canCompact]: canCompact,
				[classes.compact]: isCompact
			})}
			style={{
				backgroundColor,
				color: textColor
			}}
		>
			<Typography
				variant="title"
				className={classes.tip}
				align="center"
				color="inherit"
				{...otherProps}
			>
				{content}
			</Typography>
			{ canCompact ? <Arrow className={classes.icon}/> : null }
			<a href="https://morph.graphics" target="_blank" rel="noopener noreferrer"><img src={morphLogo} className={classes.logo} alt="About Morph"/></a>
		</div>;
	}
};

const Tip = withStyles(styles, { withTheme: true })(Def);
export default Tip;