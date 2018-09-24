import React from 'react';

import withStyles from '@material-ui/core/styles/withStyles';
import PropTypes from 'prop-types';
import ListItem from '@material-ui/core/ListItem';

const styles = theme => ({
	root: {
		height: theme.spacing.unit * 4
	}
});

const Def = ({children, ...props}) =>
	<ListItem divider={true} disableGutters={true} {...props}>
		{children}
	</ListItem>;

Def.propTypes = {
	children: PropTypes.oneOfType([
		PropTypes.arrayOf(PropTypes.node),
		PropTypes.node
	]),
	className: PropTypes.string
};

const ListEntry = withStyles(styles)(Def);
export default ListEntry;