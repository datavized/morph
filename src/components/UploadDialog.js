import React from 'react';

import withStyles from '@material-ui/core/styles/withStyles';
import PropTypes from 'prop-types';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import LinearProgress from '@material-ui/core/LinearProgress';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import List from '@material-ui/core/List';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Typography from '@material-ui/core/Typography';

import OverwriteWarning from './OverwriteWarning';
import ListEntry from './ListEntry';

const styles = theme => ({
	dialog: {
		minWidth: '35%',
		maxWidth: '90%'
	},
	uploadInstructions: {
		cursor: 'pointer',
		color: theme.palette.text.primary
	}
});

const Def = ({
	classes,
	open,
	onClose,
	onClick,
	overwriteWarning,
	fileError,
	waiting,
	worksheet,
	worksheets,
	cancelUpload,
	handleChangeWorksheet,
	onSubmitWorksheetSelection
}) => {
	// todo: display any errors

	let content = null;

	if (waiting) {
		content = <React.Fragment>
			<DialogTitle id="upload-data-title">Uploading...</DialogTitle>
			<DialogContent><LinearProgress/></DialogContent>
		</React.Fragment>;
	} else if (worksheets) {
		content = <React.Fragment>
			<DialogTitle id="upload-data-title">Select a worksheet</DialogTitle>
			<DialogContent>
				{/*<DialogContentText>{state.file.name}</DialogContentText>*/}
				<FormControl style={{ padding: '8px 2px' }}>
					<Select
						value={worksheet}
						onChange={handleChangeWorksheet}
						autoWidth
					>
						{worksheets.map((name, i) => <MenuItem key={i} value={name}>{name}</MenuItem>)}
					</Select>
				</FormControl>
				<DialogActions>
					<Button onClick={cancelUpload} color="secondary">Cancel</Button>
					<Button onClick={onSubmitWorksheetSelection} variant="raised" color="secondary">Select</Button>
				</DialogActions>
			</DialogContent>
		</React.Fragment>;
	} else {
		content = <React.Fragment>
			<DialogTitle id="upload-data-title">Upload File</DialogTitle>
			<DialogContent>
				<div
					className={classes.uploadInstructions}
					onClick={onClick}
				>
					{/*<FileUploadIcon color="action" className={classes.bigIcon}/>*/}
					<List dense={true}>
						<ListEntry>Drop file here or click to select.</ListEntry>
						<ListEntry>File types supported: .xls, .xlsx, .csv, .ods</ListEntry>
						<ListEntry>Maximum file size: 2MB</ListEntry>
						<ListEntry>Up to 300 rows of data</ListEntry>
					</List>
				</div>
				{ overwriteWarning ? <OverwriteWarning/> : null }
				{fileError && <Typography variant="subheading" color="error">{fileError}</Typography>}
				<DialogActions>
					<Button onClick={onClose} color="secondary">Cancel</Button>
				</DialogActions>
			</DialogContent>
		</React.Fragment>;
	}

	return <Dialog
		id="upload-data-dialog"
		aria-labelledby="upload-data-title"
		open={open !== false}
		/*keepMounted={true}*/
		onClose={onClose}
		disableBackdropClick={false}
		classes={{
			paper: classes.dialog
		}}
		BackdropProps={{
			/*todo: className: backdropClasses*/
		}}
	>
		{content}
	</Dialog>;
};

Def.propTypes = {
	classes: PropTypes.object.isRequired,
	className: PropTypes.string,
	children: PropTypes.oneOfType([
		PropTypes.arrayOf(PropTypes.node),
		PropTypes.node
	]),
	open: PropTypes.bool,
	onClose: PropTypes.func.isRequired,
	onClick: PropTypes.func.isRequired,
	cancelUpload: PropTypes.func.isRequired,
	handleChangeWorksheet: PropTypes.func.isRequired,
	onSubmitWorksheetSelection: PropTypes.func.isRequired,
	overwriteWarning: PropTypes.bool,
	fileError: PropTypes.string,
	waiting: PropTypes.bool,
	worksheet: PropTypes.string,
	worksheets: PropTypes.arrayOf(PropTypes.object)
};

const UploadDialog = withStyles(styles)(Def);
export default UploadDialog;