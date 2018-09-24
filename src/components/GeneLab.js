import React from 'react';

/*
Material UI components
*/
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import Tip from './Tip';
import NodeInspector from './NodeInspector';
import Slider from './Slider';

import { mutate } from '../evolution';
import num from '../util/num';
import charts from '../charts';

const styles = theme => ({
	root: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		flex: 1,

		'& > *': {
			margin: '0 10%'
		},
		'& > *:first-child': {
			margin: 0,
			marginBottom: theme.spacing.unit * 2
		}
	},
	main: {
		display: 'flex',
		flexDirection: 'row',
		flex: 1
	},
	geneCategories: {
		overflowY: 'auto',
		flex: 1,
		padding: `${theme.spacing.unit}px 0`
	},
	geneControls: {
		display: 'grid',
		gridTemplateColumns: 'auto auto',
		gridRowGap: theme.spacing.unit + 'px',
		alignItems: 'center',
		paddingTop: 0,

		fontSize: theme.typography.pxToRem(15),

		'& * + $geneCategoryName': {
			marginTop: theme.spacing.unit * 2
		},

		// needs to be more specific than the existing width rule
		'& $slider': {
			width: 200
		}
	},
	geneCategoryPanel: {
		backgroundColor: 'transparent',
		border: `${theme.palette.divider} solid 1px`,

		'&:not($geneCategoryExpanded) + *:not($geneCategoryExpanded)': {
			borderTopWidth: 0
		}
	},
	geneCategoryName: {
		gridColumn: '1 / 4',
		padding: 0,
		fontSize: theme.typography.pxToRem(15),
		fontWeight: theme.typography.fontWeightRegular,
		lineHeight: '32px',
		flexGrow: 1
	},
	geneCategoryExpanded: {
		// borderTopWidth: 1
	},
	expansionPanelSummary: {
		margin: 0
	},
	slider: {},
	buttons: {
		marginTop: theme.spacing.unit,
		flexDirection: 'row'
	},
	button: {
		marginRight: theme.spacing.unit
	},
	'@media (max-width: 400px)': {
		geneCategories: {
			padding: `${theme.spacing.unit}px 0`
		}
	}
});


const Def = class GeneLab extends React.Component {
	static propTypes = {
		data: PropTypes.object.isRequired,
		nodePath: PropTypes.array.isRequired,
		setData: PropTypes.func.isRequired,
		onComplete: PropTypes.func,
		classes: PropTypes.object.isRequired,
		className: PropTypes.string,
		navigation: PropTypes.oneOfType([
			PropTypes.arrayOf(PropTypes.node),
			PropTypes.node
		]),
		highlightColor: PropTypes.string
	}

	state = {
		genes: null,
		previewSize: 600
	}

	chartPreview = null

	// eslint-disable-next-line camelcase
	UNSAFE_componentWillMount() {
		this.reset();
	}

	// eslint-disable-next-line camelcase
	UNSAFE_componentWillReceiveProps(newProps) {
		if (newProps.data.equals(this.props.data)) {
			let equal = true;
			for (let i = 0, n = Math.max(this.props.nodePath.length, newProps.nodePath.length); i < n; i++) {
				if (this.props.nodePath[i] !== newProps.nodePath[i]) {
					equal = false;
					break;
				}
			}
			if (!equal) {
				return;
			}

			this.setState({
				genes: newProps.data.getIn(newProps.nodePath).get('genes')
			});
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

	shuffleCategory = index => e => {
		const {
			data
		} = this.props;

		const chartType = data.get('chartType');
		const { geneCategories } = charts[chartType];
		const geneNames = geneCategories[index].genes;
		const oldGenes = this.state.genes;
		const genes = oldGenes.withMutations(newGenes => {
			geneNames.forEach(gene => {
				const key = gene[1];
				const value = mutate(oldGenes.get(key), 0.2);
				newGenes.set(key, value);
			});
		});

		this.setState({
			genes
		});

		// stop it from closing category section
		e.stopPropagation();
		e.nativeEvent.stopImmediatePropagation();
	}

	resetCategory = index => e => {
		const {
			data,
			nodePath
		} = this.props;

		const chartType = data.get('chartType');
		const { geneCategories } = charts[chartType];
		const geneNames = geneCategories[index].genes;
		const originalGenes = data.getIn(nodePath).get('genes');
		const oldGenes = this.state.genes;
		const genes = oldGenes.withMutations(newGenes => {
			geneNames.forEach(gene => {
				const key = gene[1];
				const value = originalGenes.get(key);
				newGenes.set(key, value);
			});
		});

		this.setState({
			genes
		});

		// stop it from closing category section
		e.stopPropagation();
		e.nativeEvent.stopImmediatePropagation();
	}

	reset = () => {
		const {
			data,
			nodePath
		} = this.props;

		this.setState({
			genes: data.getIn(nodePath).get('genes')
		});
	}

	setGene = (key, val) => {
		this.setState({
			genes: this.state.genes.set(key, val)
		});
	}

	close = () => {
		if (this.props.onComplete) {
			this.props.onComplete();
		}
	}

	save = () => {
		const {
			nodePath
		} = this.props;

		this.props.setData(data => {
			const node = this.props.data.getIn(nodePath);
			return data.setIn(nodePath, node.set('genes', this.state.genes));
		});

		this.close();
	}

	render() {
		const {
			classes,
			data,
			navigation
		} = this.props;

		const chartType = data.get('chartType');
		const {
			geneCategories,
			genes: geneDefaults
		} = charts[chartType];

		if (!this.state.genes) {
			return null;
		}

		return <React.Fragment>
			<NodeInspector
				tip={<Tip compact="Lab" color={this.props.highlightColor}>
					<p>Modify your leaf with sliders, select shuffle, or reset to start again.</p>
					<p>Save to apply your new leaf back to your tree.</p>
				</Tip>}
				title="Edit Leaf"
				data={data}
				genes={this.state.genes}
				navigation={navigation}
				onClose={this.close}
			>
				<div className={classes.geneCategories}>
					{geneCategories.map((geneCat, i) =>
						<ExpansionPanel
							key={i}
							defaultExpanded={false}
							className={classes.geneCategoryPanel}
							classes={{
								expanded: classes.geneCategoryExpanded
							}}
							elevation={0}
						>
							<ExpansionPanelSummary className={classes.expansionPanelSummary} expandIcon={<ExpandMoreIcon />}>
								<Typography className={classes.geneCategoryName}>{geneCat.category}</Typography>
								<span>
									<Button color="primary" size="small" onClick={this.shuffleCategory(i)}>Shuffle</Button>
									<Button color="primary" size="small" onClick={this.resetCategory(i)}>Reset</Button>
								</span>
							</ExpansionPanelSummary>
							<ExpansionPanelDetails className={classes.geneControls}>
								{geneCat.genes.map((gene, j) => {
									const key = gene[1];
									const val = num(this.state.genes.get(key), geneDefaults[key]);
									return <React.Fragment key={j}>
										<Typography>{gene[0]}</Typography>
										<Slider
											className={classes.slider}
											min={-1}
											max={1}
											step={0.01}
											value={val}
											onChange={v => this.setGene(gene[1], v)}
										/>
									</React.Fragment>;
								})}
							</ExpansionPanelDetails>
						</ExpansionPanel>)}
				</div>
				<div className={classes.buttons}>
					<Button color="secondary" variant="raised" onClick={this.close} className={classes.button}>Back</Button>
					<Button color="secondary" variant="raised" onClick={this.reset} className={classes.button}>Reset</Button>
					<Button color="secondary" variant="raised" onClick={this.save} className={classes.button}>Save</Button>
				</div>
			</NodeInspector>
		</React.Fragment>;
	}
};

const GeneLab = withStyles(styles)(Def);
export default GeneLab;