import React from 'react';
import PropTypes from 'prop-types';

import withStyles from '@material-ui/core/styles/withStyles';
import CircularProgress from '@material-ui/core/CircularProgress';

const styles = theme => ({
	root: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1
	},
	circle: {
		color: theme.palette.grey[500]
	}
});

const Def = ({classes, ...otherProps}) =>
	<div className={classes.root}>
		<CircularProgress size={50} classes={{colorPrimary: classes.circle}} {...otherProps}/>
	</div>;

Def.propTypes = {
	classes: PropTypes.object.isRequired
};

const SectionLoader = withStyles(styles)(Def);
export default SectionLoader;