import React from 'react';
import classNames from 'classnames';

import fieldMappedTable from '../util/fieldMappedTable';

/*
Material UI components
*/
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import Tip from './Tip';
import ChartPreview from './ChartPreview';

import translucentBackgroundColor from '../util/translucentBackgroundColor';

const compactMediaQuery = window.matchMedia('(max-width: 576px)');

const styles = theme => ({
	root: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		flex: 1,
		minHeight: 0,

		'& > *': {
			margin: `0 10% ${theme.spacing.unit * 2}px`
		},
		'& > *:first-child': {
			margin: `0 0 ${theme.spacing.unit * 2}px`
		}
	},
	main: {
		display: 'flex',
		flexDirection: 'row',
		flex: 1,
		position: 'relative',
		minHeight: 0
	},
	preview: {
		backgroundColor: `${theme.palette.background.default} !important`,
		flex: 1,
		overflow: 'hidden'
	},
	controlsBox: {
		margin: `0px ${theme.spacing.unit * 4}px 0 0`,
		padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
		flex: '0 0 240px',
		display: 'flex',
		flexDirection: 'column',
		minHeight: 0
	},
	controlsHeader: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		'& + *': {
			marginTop: theme.spacing.unit * 2
		}
	},
	controlsButton: {
		padding: `0px ${theme.spacing.unit}px`,
		height: 24,
		minWidth: 'auto',
		minHeight: 'auto',
		display: 'none'
	},
	'@media (max-width: 704px)': {
		main: {
			margin: `${theme.spacing.unit}px calc(50% - 288px)`
		}
	},
	'@media (max-width: 576px)': {
		main: {
			margin: `${theme.spacing.unit}px 0`,
			paddingTop: theme.spacing.unit * 6
		},
		controlsBox: {
			position: 'absolute',
			top: 0,
			left: 0,
			maxHeight: 'calc(100% - 16px)',
			minWidth: 230,
			margin: 0,
			backgroundColor: translucentBackgroundColor(theme.palette.background.paper, 0.75),
			zIndex: 2
		},
		controlsButton: {
			display: 'inherit'
		}
	},
	'@media (max-width: 370px)': {
		controlsBox: {
			padding: `${theme.spacing.unit}px ${theme.spacing.unit / 2}px`
		}
	}
});


const Def = class NodeInspector extends React.Component {
	static propTypes = {
		classes: PropTypes.object.isRequired,
		className: PropTypes.string,
		theme: PropTypes.object.isRequired,
		children: PropTypes.oneOfType([
			PropTypes.arrayOf(PropTypes.node),
			PropTypes.node
		]),
		tip: PropTypes.oneOfType([
			PropTypes.node,
			PropTypes.string
		]),
		data: PropTypes.object.isRequired,
		genes: PropTypes.object.isRequired,
		title: PropTypes.string.isRequired,
		sourceData: PropTypes.object,
		onClose: PropTypes.func.isRequired,
		PreviewComponent: PropTypes.func,
		previewProps: PropTypes.object,
		navigation: PropTypes.object,
		highlightColor: PropTypes.string,
		tipCompact: PropTypes.string
	}

	state = {
		previewSize: 600,
		controlsExpanded: true,
		isCompact: compactMediaQuery.matches,
		sourceData: null
	}

	chartPreview = null

	setCompact = () => {
		this.setState({
			isCompact: compactMediaQuery.matches
		});
	}

	// eslint-disable-next-line camelcase
	UNSAFE_componentWillMount() {
		const sourceData = this.props.sourceData || fieldMappedTable(this.props.data);
		this.setState({ sourceData });
	}

	// eslint-disable-next-line camelcase
	UNSAFE_componentWillReceiveProps(newProps) {
		let sourceData = newProps.sourceData;
		if (!sourceData) {
			if (!newProps.data.equals(this.props.data) && !this.props.sourceData) {
				sourceData = fieldMappedTable(newProps.data);
			} else {
				sourceData = this.state.sourceData;
			}
		}
		this.setState({ sourceData });
	}

	toggleExpanded = () => {
		this.setState({
			controlsExpanded: !this.state.controlsExpanded
		});
	}

	onClose = () => {
		if (this.props.onClose) {
			this.props.onClose();
		}
	}

	onResize = () => {
		const previewElement = this.chartPreview && this.chartPreview.wrapper;
		if (!previewElement) {
			return;
		}
		const previewContainer = previewElement.parentElement;
		const previewSize = Math.min(previewContainer.offsetWidth, previewContainer.offsetHeight);
		this.setState({ previewSize });
	}

	previewRef = chartPreview => {
		this.chartPreview = chartPreview;
		this.onResize();
	}

	componentDidMount() {
		compactMediaQuery.addListener(this.setCompact);
		window.addEventListener('resize', this.onResize);
	}

	componentWillUnmount() {
		compactMediaQuery.removeListener(this.setCompact);
		window.removeEventListener('resize', this.onResize);
	}

	render() {
		const {
			sourceData,
			previewSize
		} = this.state;

		if (!sourceData) {
			return null;
		}

		const {
			classes,
			children,
			className,
			title,
			tip,
			navigation,
			data,
			genes,
			previewProps
		} = this.props;

		const chartType = data.get('chartType');
		const {
			controlsExpanded,
			isCompact
		} = this.state;

		const PreviewComponent = this.props.PreviewComponent || ChartPreview;

		return <React.Fragment>
			<div className={classNames(classes.root, className)}>
				{tip && typeof tip === 'object' ? tip : <Tip compact={this.props.tipCompact} color={this.props.highlightColor}>{tip}</Tip>}
				<div className={classes.main}>
					<Paper className={classes.controlsBox}>
						<div className={classes.controlsHeader}>
							<Typography variant="subheading">{title}</Typography>
							{ !controlsExpanded ? <Button
								variant="raised"
								size="small"
								className={classes.controlsButton}
								onClick={this.onClose}
							>Back</Button> : null}
							<Button
								variant="raised"
								size="small"
								className={classes.controlsButton}
								onClick={this.toggleExpanded}
							>{ controlsExpanded ?
									<React.Fragment><span>Hide</span> <ExpandLessIcon/></React.Fragment> :
									<React.Fragment><span>Show</span> <ExpandMoreIcon/></React.Fragment> }
							</Button>
						</div>
						{controlsExpanded || !isCompact ? children : null}
					</Paper>
					<div className={classes.preview}>
						<PreviewComponent
							chartType={chartType}
							sourceData={sourceData}
							genes={genes}
							showLabels={true}
							width={previewSize}
							height={previewSize}
							ref={this.previewRef}
							bgColor={this.props.theme.palette.background.default}
							{...previewProps}
						/>
					</div>
				</div>
			</div>
			{navigation}
		</React.Fragment>;
	}
};

const NodeInspector = withStyles(styles, { withTheme: true })(Def);
export default NodeInspector;