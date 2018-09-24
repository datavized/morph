import React from 'react';

import withStyles from '@material-ui/core/styles/withStyles';
import PropTypes from 'prop-types';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';

const styles = theme => ({
	root: {
		height: theme.spacing.unit * 4
	}
});

const Def = ({classes, children, ...otherProps}) => {
	const label = children && typeof children === 'string' ?
		children :
		'';
	const control = !label && children && children.length ? children : <Radio color="primary"/>;
	return <FormControlLabel
		classes={classes}
		control={control}
		label={label}
		{...otherProps}/>;
};

Def.propTypes = {
	classes: PropTypes.object.isRequired,
	children: PropTypes.oneOfType([
		PropTypes.arrayOf(PropTypes.node),
		PropTypes.node
	])
};

const RadioOption = withStyles(styles)(Def);
export default RadioOption;