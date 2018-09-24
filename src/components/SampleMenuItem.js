import React from 'react';
import classNames from 'classnames';

/*
Material UI components
*/
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import Collapse from '@material-ui/core/Collapse';
import InfoIcon from '@material-ui/icons/Info';

// import { emphasize } from '@material-ui/core/styles/colorManipulator';

const styles = theme => ({
	menuItem: {
		display: 'block',
		height: 'auto',
		minHeight: 24,
		paddingLeft: 0,
		lineHeight: 'initial',
		overflow: 'auto',
		borderBottom: `1px solid ${theme.palette.divider}`
	},
	topLine: {
		display: 'flex',
		justifyContent: 'space-between'
	},
	infoIcon: {
		cursor: 'pointer',
		color: theme.palette.text.hint
	},
	caption: {
		fontSize: '0.6em'
	},
	title: {},
	description: {
		whiteSpace: 'pre-wrap'
	},
	metadata: {
		padding: theme.spacing.unit * 2,
		// backgroundColor: emphasize(theme.palette.background.paper, 0.05),
		boxShadow: `inset 0 11px 15px -11px rgba(0, 0, 0, 0.2)`,
		'& > p': {
			margin: 0
		},
		'& > p > a': {
			// textDecoration: 'none',
			color: theme.palette.text.hint
		},
		'& > p > a:hover': {
			color: theme.palette.text.secondary
		}
	},
	expanded: {
		'& > $topLine > $title': {
			fontWeight: 'bold'
		},
		'& > $topLine > $infoIcon': {
			color: theme.palette.text.primary
		}
	}
});

function noClick(evt) {
	evt.stopPropagation();
}

function metadataLine(text, link, className) {
	if (!text) {
		return null;
	}
	return <Typography variant="caption" paragraph={true} className={className}>{
		link ?
			<a href={link} target="_blank" rel="noopener noreferrer" onClick={noClick}>{text}</a> :
			text
	}</Typography>;
}

const Def = class SampleMenuItem extends React.Component {
	static propTypes = {
		classes: PropTypes.object.isRequired,
		onClick: PropTypes.func.isRequired,
		title: PropTypes.string.isRequired,
		source: PropTypes.string,
		license: PropTypes.string,
		licenseLink: PropTypes.string,
		description: PropTypes.string
	}

	state = {
		expanded: false
	};

	toggleExpanded = evt => {
		const expanded = !this.state.expanded;
		this.setState({ expanded });
		evt.stopPropagation();
	}

	render() {
		const {
			classes,
			onClick,
			title,
			source,
			license,
			licenseLink,
			description
		} = this.props;

		const { expanded } = this.state;
		return <MenuItem onClick={onClick} className={classNames(classes.menuItem, {
			[classes.expanded]: expanded
		})}>
			<div className={classes.topLine}>
				<Typography className={classes.title}>{title}</Typography>
				<InfoIcon className={classes.infoIcon} onClick={this.toggleExpanded}/>
			</div>
			<Collapse in={expanded}>
				<div className={classes.metadata}>
					{metadataLine(description, null, classNames(classes.caption, classes.description))}
					{metadataLine(source && 'Source', source, classes.caption)}
					{metadataLine(license, licenseLink, classes.caption)}
				</div>
			</Collapse>
		</MenuItem>;
	}
};

const SampleMenuItem = withStyles(styles)(Def);
export default SampleMenuItem;