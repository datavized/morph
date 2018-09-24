import React from 'react';
import copy from 'clipboard-copy';

import withStyles from '@material-ui/core/styles/withStyles';
import PropTypes from 'prop-types';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import List from '@material-ui/core/List';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import ListEntry from './ListEntry';

// import ImageIcon from '@material-ui/icons/Image';
import ShareIcon from '@material-ui/icons/Share';
import MailIcon from '@material-ui/icons/Mail';
import TwitterIcon from './icons/Twitter';
import FacebookIcon from './icons/Facebook';
import {
	shareFacebook,
	shareTwitter,
	shareNative,
	shareEmail
} from '../util/share';
import { SHARE_HASHTAGS } from '../constants';


const styles = theme => ({
	dialog: {
		minWidth: '30%',
		maxHeight: '60%',
		width: 'min-content',
		maxWidth: '90%'
	},
	dialogContent: {
		display: 'flex',
		flexDirection: 'column',
		color: theme.palette.text.primary
	},
	dialogListContainer: {
		display: 'block',
		overflow: 'auto',
		'& a': {
			color: 'inherit',
			textDecoration: 'none'
		},
		'& svg': {
			marginRight: theme.spacing.unit
		}
	},
	listEntry: {
		cursor: 'pointer'
	},
	copy: {
		display: 'flex',
		justifyItems: 'stretch',
		'& > input': {
			flex: 1,
			border: 'none',
			fontSize: 14,
			minWidth: 40,
			background: 'transparent',
			color: theme.palette.text.primary
		},
		marginTop: theme.spacing.unit,
		padding: `0 ${theme.spacing.unit}px`,
		border: `${theme.palette.divider} solid 1px`,
		backgroundColor: theme.palette.background.default
	}
});

const selectInput = evt => evt.target.select();

const Def = class SocialShareDialog extends React.Component {
	static propTypes = {
		classes: PropTypes.object.isRequired,
		open: PropTypes.bool,
		onClose: PropTypes.func.isRequired,
		title: PropTypes.string.isRequired,
		text: PropTypes.string.isRequired,
		url: PropTypes.string.isRequired
	}

	static defaultProps = {
		title: '',
		text: ''
	}

	copyURL = () => copy(this.props.url)

	render() {

		const {
			classes,
			open,
			onClose,
			url,
			title,
			text,
			...otherProps
		} = this.props;
		const shareActions = navigator.share ?
			[<ListEntry key="native" onClick={() => shareNative(title, text, url, SHARE_HASHTAGS)} className={classes.listEntry}><ShareIcon /> Share</ListEntry>] :
			[
				<ListEntry key="twitter" onClick={() => shareTwitter(title, text, url, SHARE_HASHTAGS)} className={classes.listEntry}><TwitterIcon /> Twitter</ListEntry>,
				<ListEntry key="fb" onClick={() => shareFacebook(url)} className={classes.listEntry}><FacebookIcon /> Facebook</ListEntry>
			];
		// shareActions.push(<ListEntry key="email">
		// 	<a href={`mailto:?body=${text + '\n' + url}&subject=${title}`} target="_blank" rel="noopener noreferrer">
		// 		<MailIcon /> email
		// 	</a>
		// </ListEntry>);
		shareActions.push(<ListEntry key="email" onClick={() => shareEmail(title, text, url)} className={classes.listEntry}>
			<MailIcon /> Email
		</ListEntry>);

		return <Dialog
			id="export-share"
			aria-labelledby="export-share-title"
			open={open !== false}
			onClose={onClose}
			disableBackdropClick={false}
			classes={{
				paper: classes.dialog
			}}
			{...otherProps}
		>
			<DialogTitle id="export-share-title">Share</DialogTitle>
			<DialogContent className={classes.dialogContent}>
				<div className={classes.dialogListContainer}>
					{/*<FileUploadIcon color="action" className={classes.bigIcon}/>*/}
					<List dense={true}>
						{shareActions}
					</List>
				</div>
				<div className={classes.copy}>
					<input readOnly value={url} onClick={selectInput} />
					<Button onClick={this.copyURL} color="primary">Copy</Button>
				</div>
				<DialogActions>
					<Button onClick={onClose} color="secondary">Close</Button>
				</DialogActions>
			</DialogContent>
		</Dialog>;
	}
};

const SocialShareDialog = withStyles(styles)(Def);
export default SocialShareDialog;