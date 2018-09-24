import React from 'react';
import PropTypes from 'prop-types';

import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';

let reloadRequested = false;

const Def = class UpgradePrompt extends React.Component {
	static propTypes = {
		upgradeReady: PropTypes.bool
	}

	state = {
		dismissed: false
	}

	onDismiss = () => {
		this.setState({
			dismissed: true
		});
	}

	onReload = () => {
		if (reloadRequested) {
			return;
		}
		reloadRequested = true;
		this.setState({
			dismissed: true
		});
		window.location.reload();
	}

	render() {
		const { upgradeReady } = this.props;

		if (!upgradeReady || this.state.dismissed) {
			return null;
		}
		return <Snackbar
			anchorOrigin={{
				vertical: 'bottom',
				horizontal: 'center'
			}}
			open={true}
			onClose={this.onDismiss}
			ContentProps={{
				'aria-describedby': 'app-upgrade-message'
			}}
			message={<span id="app-upgrade-message">Morph has upgraded. Reload for the latest version.</span>}
			action={[
				<Button key="undo" color="secondary" size="small" onClick={this.onReload}>
					Reload
				</Button>
			]}
		/>;
	}
};

const UpgradePrompt = Def;
export default UpgradePrompt;
