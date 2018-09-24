import React from 'react';
import PropTypes from 'prop-types';

import withStyles from '@material-ui/core/styles/withStyles';
import Typography from '@material-ui/core/Typography';
import WarningIcon from '@material-ui/icons/Warning';

const styles = theme => ({
	root: {
		marginTop: theme.spacing.unit
	},
	iconContainer: {
		display: 'inline-flex',
		alignSelf: 'center',
		marginRight: theme.spacing.unit / 2,
		color: theme.palette.error.main
	},
	icon: {
		position: 'relative',
		top: '0.25em',
		fontSize: 20
	}
});

const Def = ({classes}) =>
	<Typography className={classes.root}>
		<span className={classes.iconContainer}>
			<WarningIcon className={classes.icon}/>
		</span>
		This will replace existing data
	</Typography>;

Def.propTypes = {
	classes: PropTypes.object.isRequired
};

const OverwriteWarning = withStyles(styles)(Def);
export default OverwriteWarning;