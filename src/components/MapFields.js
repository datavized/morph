import React from 'react';
import classNames from 'classnames';
import { fromJS } from 'immutable';

import chartTypes from '../charts';
import fieldMappedTable from '../util/fieldMappedTable';
import translucentBackgroundColor from '../util/translucentBackgroundColor';

/*
Material UI components
*/
import withStyles from '@material-ui/core/styles/withStyles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import Tip from './Tip';
import Section from './Section';
import ChartPreview from './ChartPreview';

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
		flex: 1,
		overflow: 'hidden'
	},
	thumbnail: {
		filter: 'grayscale(85%)',
		objectFit: 'scale-down',
		maxWidth: '100%',
		maxHeight: '100%',
		transform: 'scale(0.9)' // so blurred edge doesn't get clipped
	},
	propertiesPanel: {
		margin: `0 ${theme.spacing.unit * 4}px 0 0`,
		padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
		flex: '0 0 240px',
		display: 'flex',
		flexDirection: 'column'
	},
	propsHeader: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	properties: {
		overflowY: 'auto',
		flex: 1,
		minHeight: 0
	},
	property: {
		margin: `${theme.spacing.unit * 2}px 0`,
		padding: theme.spacing.unit,
		border: `${theme.palette.divider} solid 1px`
	},
	formControl: {
		display: 'flex'
	},
	button: {
		marginRight: theme.spacing.unit
	},
	propsEditButton: {
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
		propertiesPanel: {
			position: 'absolute',
			top: 0,
			left: 0,
			maxHeight: 'calc(100% - 16px)',
			minWidth: 230,
			margin: 0,
			backgroundColor: translucentBackgroundColor(theme.palette.background.paper, 0.75),
			zIndex: 2
		},
		propsEditButton: {
			display: 'inherit'
		},
		hidden: {
			display: 'none'
		}
	}
});

const Def = class MapFields extends Section {
	chartPreview = null

	state = {
		previewSize: 512,
		propsExpanded: true
	}

	handleChange = propertyKey => event => {
		this.props.setData(data => {
			const chartType = data.get('chartType');
			const fieldIndex = event.target.value === '' ? -1 : parseInt(event.target.value, 10);

			if (fieldIndex >= 0) {
				return data.setIn(['fieldMap', chartType, propertyKey], fieldIndex);
			}
			return data.deleteIn(['fieldMap', chartType, propertyKey]);
		});
	}

	randomize = () => {
		this.props.setData(data => {
			const chartType = data.get('chartType');
			const chartDef = chartTypes[chartType];
			if (chartDef.randomize) {
				const fields = data.get('fields').toJS();
				return data.setIn(['fieldMap', chartType], fromJS(chartDef.randomize(fields)));
			}
		});
	}

	clearAll = () => {
		this.props.setData(data => {
			const chartType = data.get('chartType');

			// todo: delete gene tree for this chart type?

			return data
				.deleteIn(['fieldMap', chartType]);
		});
	}

	toggleExpanded = () => {
		this.setState({
			propsExpanded: !this.state.propsExpanded
		});
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

	previewRef = (chartPreview) => {
		this.chartPreview = chartPreview;
		this.onResize();
	}

	componentDidMount() {
		window.addEventListener('resize', this.onResize);
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.onResize);
	}

	render() {
		const {
			classes,
			data //,
			// navigation
		} = this.props;
		const { previewSize, propsExpanded } = this.state;
		const chartType = data.get('chartType') || '';
		const fieldMap = data.getIn(['fieldMap', chartType]) || new Map();
		const fields = data.get('fields');
		const chartDef = chartTypes[chartType];
		const chartProperties = chartDef.properties;

		const fieldsValid = chartDef.valid ?
			chartDef.valid(fieldMap) :
			!chartDef.required.some(key => !fieldMap.has(key));

		const fieldMenuItems = fields.map((field, i) => <MenuItem value={i} key={i}>{field.get('name')}</MenuItem>);

		const renderProperty = def => <div className={classes.property} key={def.key}>
			<FormControl
				classes={{
					root: classes.formControl
				}}
				required={chartDef.required.indexOf(def.key) >= 0}
				error={!fieldsValid && !(fieldMap.get(def.key) >= 0) && chartDef.required.indexOf(def.key) >= 0}
			>
				<InputLabel htmlFor={'select-' + def.key} shrink={true}>{def.name}</InputLabel>
				<Select
					autoWidth={true}
					value={fieldMap.get(def.key) >= 0 ? fieldMap.get(def.key) : ''}
					onChange={this.handleChange(def.key)}
					inputProps={{
						name: def.name,
						id: 'select-' + def.key
					}}
				>
					<MenuItem value="">
						<em>None</em>
					</MenuItem>
					{fieldMenuItems}
				</Select>
			</FormControl>
		</div>;

		return <React.Fragment>
			<div className={classNames(classes.root, this.props.className)}>
				<Tip compact="4. Organize" color={this.props.highlightColor}>
					<p>Step 4 - <strong>Organize</strong></p>
					{ !fieldsValid ?
						<p>Choose different fields to build your chart and when you&apos;re ready select <strong>Evolve</strong>.</p> :
						<p>Looks like your chart is shaping up nicely. Keep exploring variations or select <strong>Evolve</strong> to start your tree.</p>}
				</Tip>
				<div className={classes.main}>
					<Paper className={classes.propertiesPanel}>
						<div className={classes.propsHeader}>
							<Typography variant="subheading">Variable Fields</Typography>
							<Button
								variant="raised"
								size="small"
								className={classes.propsEditButton}
								onClick={this.toggleExpanded}
							>{ propsExpanded ?
									<React.Fragment><span>Hide</span> <ExpandLessIcon/></React.Fragment> :
									<React.Fragment><span>Edit</span> <ExpandMoreIcon/></React.Fragment> }
							</Button>
						</div>
						<div className={classNames(classes.properties, propsExpanded ? null : classes.hidden)}>
							{chartProperties.map(renderProperty)}
						</div>
						<div className={propsExpanded ? null : classes.hidden}>
							<Button variant="raised" color="secondary" onClick={this.randomize} className={classes.button}>Fill Random</Button>
							<Button variant="raised" color="secondary" onClick={this.clearAll} disabled={!fieldMap.size} className={classes.button}>Clear</Button>
						</div>
					</Paper>
					<div className={classes.preview}>
						{ fieldsValid ? <ChartPreview
							chartType={chartType}
							sourceData={fieldMappedTable(data)}
							genes={data.getIn(['tree', chartType, 'genes'])}
							width={previewSize}
							height={previewSize}
							bgColor={this.props.theme.palette.background.default}
							showLabels={true}
							ref={this.previewRef}
						/> : <img className={classes.thumbnail} src={chartDef.preview} alt={chartDef.name}/> }
					</div>
				</div>
			</div>
			{/*navigation*/}
		</React.Fragment>;

	}
};

const MapFields = withStyles(styles, { withTheme: true })(Def);
export default MapFields;