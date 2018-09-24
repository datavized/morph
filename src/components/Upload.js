import React from 'react';
import Dropzone from 'react-dropzone';
import classNames from 'classnames';
import { fromJS, Map } from 'immutable';

import UploadWorker from 'worker-loader!../workers/upload.js';
import { MAX_DATA_FILE_SIZE } from '../constants';

/*
Material UI components
*/
import withStyles from '@material-ui/core/styles/withStyles';
import Typography from '@material-ui/core/Typography';

import FileUploadIcon from './FileUploadIcon';
import ViewListIcon from '@material-ui/icons/ViewList';

import Section from './Section';
import Tip from './Tip';
import UploadDialog from './UploadDialog';
import SampleDataDialog from './SampleDataDialog';

const styles = theme => ({
	root: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		flex: 1
	},
	main: {
		flex: 1,
		display: 'flex',
		flexDirection: 'row',
		margin: `${theme.spacing.unit}px 10%`
	},
	// tip: {
	// 	marginTop: theme.spacing.unit * 1,
	// 	marginBottom: theme.spacing.unit * 1
	// },
	// welcome: {
	// 	margin: `${theme.spacing.unit * 4}px 0`
	// },
	actionContent: {
		flexDirection: 'column',
		alignItems: 'stretch',
		margin: 'auto',
		minWidth: '40%'
	},
	actionTitle: {
		borderBottom: `${theme.palette.divider} solid 1px`,
		paddingBottom: theme.spacing.unit
	},
	// dropZone: {
	// 	border: `2px dashed ${theme.palette.grey.main}`,
	// 	cursor: 'pointer'
	// },
	backdrop: {},
	dropzoneAccepted: {
		border: `2px dashed ${theme.palette.primary.main}`
	},
	dropZoneRejected: {
		border: `2px dashed ${theme.palette.error.main}`
	},
	mainAction: {
		display: 'flex',
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		textAlign: 'center',
		cursor: 'pointer'
	},
	bigIcon: {
		width: 64,
		height: 64,
		padding: '0 36px'
	},
	button: {
		marginRight: theme.spacing.unit
	},
	moreButtons: {
		flex: 'auto',
		textAlign: 'right'
	}
});

/*
Supported file formats
https://github.com/SheetJS/js-xlsx#file-formats
*/
const fileAcceptTypes = [
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.oasis.opendocument.spreadsheet',
	'text/csv',
	'text/plain',
	'.ods',
	'.fods',
	'.txt',
	'.dsv',
	'.csv',
	'.xsl',
	'.xslx'
];
const fileAcceptTypeString = fileAcceptTypes.join(', ');
const fileExt = /\.([a-z0-9]+)$/i;

const Def = class Upload extends Section {
	state = {
		data: null,
		waiting: false,
		fileError: '',
		draggingFile: false,
		sampleDataMenu: false,
		worksheets: null,
		worksheet: null
	}

	dropZone = null

	destroyUploadWorker() {
		if (this.uploadWorker) {
			this.uploadWorker.terminate();
			this.uploadWorker = null;
		}
	}

	componentWillUnmount() {
		this.destroyUploadWorker();
	}

	uploadWorkerMessage = response => {
		const responseData = response.data;

		/*
		compare responseData.file to this.state.file
		if they don't match, ignore this message
		*/
		if (this.state.file &&
			(responseData.file.name !== this.state.file.name ||
				responseData.file.size !== this.state.file.size ||
				responseData.file.lastModified !== this.state.file.lastModified)) {

			return;
		}

		if (responseData.error) {
			this.destroyUploadWorker();
			this.setState({
				fileError: responseData.error,
				waiting: false
			});
			return;
		}

		if (responseData.sheets) {
			this.setState({
				waiting: false,
				worksheets: responseData.sheets,
				worksheet: responseData.sheets[0]
			});
			return;
		}

		this.destroyUploadWorker();

		let data = null;

		if (responseData && responseData.rows.length && responseData.fields) {
			const { fields, rows, normalized } = responseData;
			data = {
				fields,
				rows,
				normalized,
				title: (responseData.file.name || 'Chart').replace(/\.([a-z0-9]+)$/, '')
			};
		}

		this.saveData(data);
		this.setState({
			waiting: false
		});
		if (this.props.onNext) {
			this.props.onNext();
		}
	}

	onDrop = (files, rejected) => {
		let fileError = '';

		if (rejected.length + files.length > 1) {
			fileError = 'Only one file at a time is allowed.';
		} else if (rejected.length) {
			if (fileAcceptTypes.indexOf(rejected[0].type) < 0) {
				const fileTypeTest = fileExt.exec(rejected[0].name);
				const type = fileTypeTest && fileTypeTest[1] || rejected[0].type;
				fileError = `Unsupported file type: ${type}`;
			} else if (rejected[0].size === 0) {
				fileError = 'File is empty.';
			} else if (rejected[0].size > MAX_DATA_FILE_SIZE) {
				fileError = 'File is too big.';
			}
		}

		if (fileError) {
			this.setState({
				fileError,
				waiting: false
			});
			return;
		}

		this.setState({
			waiting: true
		});

		this.uploadWorker = new UploadWorker();
		this.uploadWorker.onmessage = this.uploadWorkerMessage;

		this.uploadWorker.postMessage({
			file: files[0]
		});
	}

	saveData = data => {
		this.props.setData(previous => {
			/*
			For now, rows and normalized are straight JS objects,
			since we don't mutate them anyway. We'll see if this needs
			to change.
			*/
			const title = data.title;
			let fields = null;
			let rows = null;
			let normalized = null;
			if (!data) {
				data = new Map();
			} else if (data instanceof Map) {
				fields = data.get('fields');
				rows = data.get('rows');
				normalized = data.get('normalized');
			} else {
				fields = fromJS(data.fields);
				rows = data.rows;
				normalized = data.normalized;
			}
			data = previous
				.set('fields', fields)
				.set('rows', rows)
				.set('normalized', normalized);

			const resetFields = !fields.equals(previous.get('fields'));

			if (fields) {
				// reset certain export configuration options
				try {
					const exportOptions = JSON.parse(localStorage.getItem('exportOptions') || '{}');

					if (resetFields) {
						delete exportOptions.transparentBackground;
						delete exportOptions.backgroundColor;
					}

					// save file name as default title for export
					if (title) {
						exportOptions.title = title;
					}
					localStorage.setItem('exportOptions', JSON.stringify(exportOptions));
				} catch (e) {}
			}

			if (resetFields) {
				return data
					.remove('fieldMap');
			}

			return data;
		});
	}

	clearData = () => {
		const data = this.props.data || new Map();
		this.saveData(data
			.remove('rows')
			.remove('normalized'));
		this.setState({
			waiting: false,
			worksheets: null,
			worksheet: null
		});
	}

	cancelUpload = () => {
		this.setState({
			waiting: false,
			worksheets: null,
			worksheet: null
		});
	}

	handleChangeWorksheet = event => {
		this.setState({
			worksheet: event.target.value
		});
	}

	onSubmitWorksheetSelection = () => {
		if (this.uploadWorker && this.state.worksheet) {
			this.uploadWorker.postMessage({
				file: this.state.file,
				worksheet: this.state.worksheet
			});
		}
	}

	openUpload = () => {
		this.setState({
			sampleDataMenu: false,
			draggingFile: true
		});
	}

	openSampleDataMenu = () => {
		this.setState({
			sampleDataMenu: true,
			draggingFile: false
		});
	}

	close = e => {
		this.setState({
			sampleDataMenu: false,
			draggingFile: false
		});

		// stop it from opening file selector
		e.stopPropagation();
		if (e.nativeEvent) {
			e.nativeEvent.stopImmediatePropagation();
		}
	}

	loadSampleData = (load, metadata) => {
		// todo: when sample selected, allow cancel loading

		this.destroyUploadWorker();

		this.setState({
			draggingFile: false,
			waiting: true
		});

		load().then(data => {
			if (this.state.waiting) {
				const title = metadata && metadata.title;
				if (title && !data.title) {
					data.title = title;
				}
				this.saveData(data);
				this.setState({
					sampleDataMenu: false,
					waiting: false
				});
			}
			if (this.props.onNext) {
				this.props.onNext();
			}
		});
	}

	render() {
		const { classes, data/*, navigation*/ } = this.props;

		return <Dropzone
			accept={fileAcceptTypeString}
			onDrop={this.onDrop}
			onDragEnter={this.openUpload}
			disableClick={true}
			minSize={1}
			maxSize={MAX_DATA_FILE_SIZE}
			multiple={false}
			rejectClassName={classes.dropZoneRejected}
			acceptClassName={classes.dropzoneAccepted}
			className={classNames(classes.root, this.props.className)}
			ref={dropZone => this.dropZone = dropZone}
		>
			{/*<Typography variant="display3" align="center" className={classes.welcome}>Welcome to Morph</Typography>*/}
			<Tip color={this.props.highlightColor} compact="1. Data">
				<p>Step 1 - <strong>Data</strong></p>
				{ !data.get('rows') ?
					<p>To get started, choose either to upload your own data or select from one of our samples.</p> :
					<p>You can change data at any time by either uploading or choosing another sample.</p>
				}
			</Tip>
			<div className={classes.main}>
				{/*content*/}
				<div className={classes.mainAction} onClick={this.openUpload}>
					<FileUploadIcon color="primary" className={classes.bigIcon}/>
					<Typography variant="display1">Upload</Typography>
				</div>
				<div className={classes.mainAction} onClick={this.openSampleDataMenu}>
					<ViewListIcon color="primary" className={classes.bigIcon}/>
					<Typography variant="display1">Select Sample</Typography>
				</div>
			</div>

			{ this.state.draggingFile ?
				<UploadDialog
					id="upload-data-dialog"
					aria-labelledby="upload-data-title"
					onClose={this.close}
					onClick={() => this.dropZone.open()}
					overwriteWarning={!!data.get('rows')}
					fileError={this.state.fileError}
					waiting={this.state.waiting}
					worksheet={this.state.worksheet}
					worksheets={this.state.worksheets}
					handleChangeWorksheet={this.handleChangeWorksheet}
					cancelUpload={this.cancelUpload}
					onSubmitWorksheetSelection={this.onSubmitWorksheetSelection}
					BackdropProps={{
						/*todo: className: backdropClasses*/
					}}
				/> : null }

			{this.state.sampleDataMenu ?
				<SampleDataDialog
					/*keepMounted={true}*/
					onClose={this.close}
					disableBackdropClick={false}
					loadSampleData={this.loadSampleData}
					overwriteWarning={!!data.get('rows')}
					waiting={this.state.waiting}
					BackdropProps={{
						/*todo: className: backdropClasses*/
					}}
				/> : null }
		</Dropzone>;
	}
};

const Upload = withStyles(styles)(Def);
export default Upload;