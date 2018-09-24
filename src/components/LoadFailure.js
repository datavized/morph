import React from 'react';
import PropTypes from 'prop-types';

import withStyles from '@material-ui/core/styles/withStyles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import ErrorIcon from '@material-ui/icons/Error';

const styles = theme => ({
	root: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1
	},
	warning: {
		// cursor: 'pointer',
		textAlign: 'center'
	},
	icon: {
		color: theme.palette.error.main,
		width: theme.spacing.unit * 8,
		height: theme.spacing.unit * 8
	}
});

const Def = class LoadFailure extends React.Component {
	static propTypes = {
		classes: PropTypes.object.isRequired,
		onRetry: PropTypes.func,
		connected: PropTypes.bool
	}

	onClick = () => {
		this.props.onRetry();
	}

	render() {
		const { classes, connected } = this.props;
		return <div className={classes.root}>
			<div className={classes.warning}>
				<ErrorIcon className={classes.icon}/>
				{connected ?
					<div>
						<Typography>Error loading app.</Typography>
						<Button color="primary" onClick={this.onClick}>Try Again</Button>
					</div> :
					<Typography>Error loading app. Network offline.</Typography>
				}
			</div>
		</div>;
	}
};

Def.propTypes = {
	classes: PropTypes.object.isRequired
};

const LoadFailure = withStyles(styles)(Def);
export default LoadFailure;