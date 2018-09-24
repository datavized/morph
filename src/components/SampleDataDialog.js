import React from 'react';

import withStyles from '@material-ui/core/styles/withStyles';
import PropTypes from 'prop-types';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import MenuList from '@material-ui/core/MenuList';
import LinearProgress from '@material-ui/core/LinearProgress';

import SampleMenuItem from './SampleMenuItem';
import OverwriteWarning from './OverwriteWarning';

import sampleData from '../data';

const styles = () => ({
	dialog: {
		minWidth: '35%',
		maxHeight: '60%',
		width: 'min-content',
		maxWidth: '90%'
	},
	dialogContent: {
		display: 'flex',
		flexDirection: 'column'
	},
	dialogListContainer: {
		display: 'block',
		overflow: 'auto'
	}
});

const Def = ({
	classes,
	open,
	onClose,
	loadSampleData,
	waiting,
	overwriteWarning
}) => {

	return <Dialog
		id="sample-data-dialog"
		aria-labelledby="sample-data-title"
		open={open !== false}
		/*keepMounted={true}*/
		onClose={onClose}
		disableBackdropClick={false}
		classes={{
			paper: classes.dialog
		}}
	>
		{ waiting ?
			<React.Fragment>
				<DialogTitle id="sample-data-title">Loading...</DialogTitle>
				<DialogContent><LinearProgress/></DialogContent>
			</React.Fragment>
			:
			<React.Fragment>
				<DialogTitle id="sample-data-title">Select Sample Data</DialogTitle>
				<DialogContent classes={{root: classes.dialogContent}}>
					<div className={classes.dialogListContainer}>
						{/*<ViewListIcon color="action" className={classes.bigIcon}/>*/}
						<MenuList dense={true}>
							{sampleData.map(({load, ...metadata}, i) =>
								<SampleMenuItem key={i} onClick={() => loadSampleData(load, metadata)} {...metadata}/>
							)}
						</MenuList>
					</div>
					{ overwriteWarning ? <OverwriteWarning/> : null }
					<DialogActions>
						<Button onClick={onClose} color="secondary">Cancel</Button>
					</DialogActions>
				</DialogContent>
			</React.Fragment>
		}
	</Dialog>;
};

Def.propTypes = {
	classes: PropTypes.object.isRequired,
	open: PropTypes.bool,
	onClose: PropTypes.func.isRequired,
	loadSampleData: PropTypes.func.isRequired,
	overwriteWarning: PropTypes.bool,
	waiting: PropTypes.bool
};
const SampleDataDialog = withStyles(styles)(Def);
export default SampleDataDialog;