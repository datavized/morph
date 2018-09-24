import React from 'react';
import classNames from 'classnames';
import { createConfirmation } from 'react-confirm';

import { List } from 'immutable';
import { defaultTree, spawnNodes } from '../evolution';
import fieldMappedTable from '../util/fieldMappedTable';
import Sketch from './Sketch';
import charts from '../charts/drawable';
import drawTree from '../charts/tree';
import hexColor from '../util/hexColor';

/*
Material UI components
*/
import withStyles from '@material-ui/core/styles/withStyles';
import Button from '@material-ui/core/Button';

import asyncComponent from './asyncComponent';
const Export = asyncComponent(() => import('./Export'));
import GeneLab from './GeneLab';
import Section from './Section';
import ConfirmationDialog from './ConfirmationDialog';
import Tip from './Tip';

import {
	// ANIMATION_DURATION,
	NUM_CHILDREN
} from '../charts/constants';

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
		flex: 1,
		overflow: 'hidden',

		'& canvas': {
			userSelect: 'none',
			'-webkit-touch-callout': 'none',
			'-webkit-tap-highlight-color': 'rgba(0,0,0,0)'
		}
	},
	'@media (max-width: 704px)': {
		main: {
			margin: `${theme.spacing.unit}px calc(50% - 288px)`
		}
	},
	'@media (max-width: 576px)': {
		main: {
			margin: `${theme.spacing.unit}px 0`
		}
	},
	moreButtons: {
		position: 'fixed',
		bottom: 72,
		right: 0,
		paddingRight: theme.spacing.unit * 2,

		display: 'flex',
		flex: 'auto',
		flexDirection: 'column-reverse',
		alignItems: 'stretch',

		'& Button': {
			margin: theme.spacing.unit//,
			// display: 'flex'
		}
	},
	'@media (orientation: portrait)': {
		moreButtons: {
			bottom: 54
		}
	}
});

function isParent(node) {
	return node.get('children').size > 0;
}

function isGrandparent(node) {
	return isParent(node) &&
		node.get('children').reduce((reduction, child) =>
			reduction || child.get('children').size > 0, false);
}

const modeTips = {
	'tree': <p>Click your chart to evolve your tree. Click again to make new leaves to find one you like. Then select <strong>Editor</strong> to modify your leaf</p>,
	'export-select': <p>Select a leaf to <strong>Export</strong> as either an image or animation.</p>,
	'gene-lab-select': <p>Select a leaf to modify its design in the <strong>Editor</strong></p>,
	'reset-select': 'All branches available to undo are highlighted with a red outline'
};

const confirm = createConfirmation(ConfirmationDialog);

const Def = class Evolution extends Section {
	state = {
		mode: 'tree',
		nodePath: null,
		tree: null,
		treeWidth: 100,
		treeHeight: 100,
		clickQueue: []
	}

	treeSketch = null

	componentWillMount() {
		const { data } = this.props;
		const chartType = data.get('chartType');
		const tree = data.get(['tree', chartType]);
		this.setState({ tree });
	}

	componentWillReceiveProps(newProps) {
		const { data } = newProps;
		const chartType = data.get('chartType');
		const tree = data.get(['tree', chartType]);

		this.setState({ tree });
	}

	componentDidUpdate() {
		const clickQueue = this.state.clickQueue.slice(0);

		if (clickQueue.length) {
			const clickOpts = clickQueue.shift();
			this.treeSketch.emit('click', clickOpts);
			this.setState({ clickQueue });
		}
	}

	resetTree = () => {
		const confirmation = 'Are you sure you want to clear the tree and start over?';
		confirm({ confirmation, options: {
			no: 'Cancel',
			yes: 'Clear'
		} }).then(() => {
			this.props.setData(data => {
				const chartType = data.get('chartType');
				const nodePath = ['tree', chartType];
				if (this.treeSketch) {
					this.treeSketch.emit('focus', nodePath.join('/'));
				}
				return data.setIn(nodePath, defaultTree(charts[chartType]));
			});
		}, () => {
			console.log('Reset tree canceled');
		});
	}

	resetNode = nodePath => {
		this.props.setData(data => {
			return data.setIn(nodePath.concat('children'), new List());
		});
		if (this.treeSketch) {
			this.treeSketch.emit('focus', nodePath.join('/'));
		}
	}

	spawnRandom = () => {
		const clickQueue = this.state.clickQueue.slice(0);
		const { data } = this.props;
		const chartType = data.get('chartType');
		const rootPath = ['tree', chartType];

		const spawnableNodes = [];
		function findSpawnables(path) {
			const node = data.getIn(path);
			if (isParent(node)) {
				for (let i = 0; i < NUM_CHILDREN; i++) {
					findSpawnables(path.concat(['children', i]));
				}
			} else {
				spawnableNodes.push(path);
			}
		}

		findSpawnables(rootPath);
		for (let i = 0; i < 4; i++) {
			const index = Math.floor(Math.random() * spawnableNodes.length) % spawnableNodes.length;
			const spawnPath = spawnableNodes[index];
			spawnableNodes.splice(index, 1);

			clickQueue.push({
				// delay: ANIMATION_DURATION * i,
				path: spawnPath
			});
			for (let c = 0; c < NUM_CHILDREN; c++) {
				spawnableNodes.push(spawnPath.concat(['children', c]));
			}
		}

		this.setState({
			clickQueue
		});
	}

	spawnNode = (nodePath, {delay, ...opts}) => {
		const node = this.props.data.getIn(nodePath);
		if (!isParent(node)) {
			this.props.setData(data => {
				return data.setIn(nodePath, spawnNodes(node, opts, delay));
			});
			if (this.treeSketch) {
				this.treeSketch.emit('focus', nodePath.join('/'));
			}
		}
	}

	hoverNode = nodePath => {
		const { mode } = this.state;
		if (mode === 'export-select') {
			return true;
		}

		if (mode === 'gene-lab-select') {
			return nodePath.length >= 3;
		}

		if (mode === 'reset-select') {
			const node = this.props.data.getIn(nodePath);
			return isParent(node) && !isGrandparent(node);
		}

		if (mode === 'tree') {
			const node = this.props.data.getIn(nodePath);
			return !isParent(node);
		}

		return false;
	}

	clickNode = (nodePath, opts) => {
		const { mode } = this.state;
		if (mode === 'tree') {
			this.spawnNode(nodePath, opts);
		} else if (mode === 'reset-select') {
			const node = this.props.data.getIn(nodePath);
			if (isParent(node) && !isGrandparent(node)) {
				this.setMode('tree');
				this.resetNode(nodePath);
			}
		} else if (mode === 'export-select') {
			this.setState({
				nodePath,
				mode: 'export'
			});
		} else if (mode === 'gene-lab-select') {

			// disallow editing first node
			if (nodePath.length < 3) {
				return;
			}

			this.setState({
				nodePath,
				mode: 'gene-lab'
			});
		}
	}

	setMode = mode => {
		this.setState({ mode });
	}

	onResize = () => {
		const treeElement = this.treeSketch && this.treeSketch.wrapper;
		if (!treeElement) {
			return;
		}
		const treeContainer = treeElement.parentElement;
		const treeWidth = treeContainer.offsetWidth;
		const treeHeight = treeContainer.offsetHeight;
		this.setState({ treeWidth, treeHeight });
	}

	treeRef = treeSketch => {
		this.treeSketch = treeSketch;
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
			data,
			className,
			// navigation,
			theme,
			...otherProps
		} = this.props;

		const chartType = data.get('chartType');
		const chartDefinition = charts[chartType];
		const sourceData = fieldMappedTable(data);

		const { mode, treeWidth, treeHeight } = this.state;
		const hideTree = mode === 'export' || mode === 'gene-lab';

		const sketch = <Sketch
			sketch={drawTree}
			sourceData={sourceData}
			chartDefinition={chartDefinition}
			clickNode={this.clickNode}
			hoverNode={this.hoverNode}
			highlightNodes={mode === 'reset-select'}
			lineColor={hexColor(theme.palette.divider)}
			width={treeWidth}
			height={treeHeight}
			ref={this.treeRef}
			style={{
				display: hideTree ? 'none' : ''
			}}
			bgColor={theme.palette.background.default}
			hidden={hideTree}
			{...otherProps}
		/>;

		if (mode === 'export') {
			return <React.Fragment>
				<Export
					data={data}
					sourceData={sourceData}
					nodePath={this.state.nodePath}
					setData={this.props.setData}
					highlightColor={this.props.highlightColor}
					onComplete={() => this.setMode('tree')}
				/>
				{/*sketch*/}
			</React.Fragment>;
		}

		if (mode === 'gene-lab') {
			const { nodePath } = this.state;
			return <React.Fragment>
				<GeneLab
					data={data}
					sourceData={sourceData}
					nodePath={nodePath}
					setData={this.props.setData}
					highlightColor={this.props.highlightColor}
					onComplete={() => {
						this.setMode('tree');
						setTimeout(() => {
							if (this.treeSketch) {
								this.treeSketch.emit('focus', nodePath.join('/'));
							}
						}, 10);
					}}
				/>
				{/*sketch*/}
			</React.Fragment>;
		}

		let navContent = null;
		if (mode === 'reset-select') {
			navContent = <React.Fragment>
				<Button color="secondary" variant="raised" onClick={() => this.setMode('tree')}>Cancel</Button>
				<Button color="secondary" variant="raised" disabled={true}>Select Leaf to Reset</Button>
			</React.Fragment>;
		} else if (mode === 'gene-lab-select') {
			navContent = <React.Fragment>
				<Button color="secondary" variant="raised" onClick={() => this.setMode('tree')}>Cancel</Button>
				<Button color="secondary" variant="raised" disabled={true}>Select Leaf to Edit</Button>
			</React.Fragment>;
		} else if (mode === 'export-select') {
			navContent = <React.Fragment>
				<Button color="secondary" variant="raised" onClick={() => this.setMode('tree')}>Cancel</Button>
				<Button color="secondary" variant="raised" disabled={true}>Select Leaf to Export</Button>
			</React.Fragment>;
		} else {
			navContent = <React.Fragment>
				<Button color="secondary" variant="raised" onClick={this.resetTree}>Clear Tree</Button>
				<Button color="secondary" variant="raised" onClick={this.spawnRandom}>Random</Button>
				<Button color="secondary" variant="raised" onClick={() => this.setMode('reset-select')} disabled={!isParent(sourceData.tree)}>Reset Leaf</Button>
				<Button color="secondary" variant="raised" onClick={() => this.setMode('gene-lab-select')} disabled={!isParent(sourceData.tree)}>Editor</Button>
				<Button color="secondary" variant="raised" onClick={() => this.setMode('export-select')}>Export</Button>
			</React.Fragment>;
		}

		return <React.Fragment>
			<div className={classNames(classes.root, className)}>
				<Tip compact="5. Evolve" color={this.props.highlightColor}>
					<p>Step 5 - <strong>Evolve</strong></p>
					{modeTips[mode]}
				</Tip>
				<div className={classes.main}>
					{ sketch }
					<div className={classes.moreButtons}>
						{ navContent }
					</div>
				</div>
			</div>
			{/*navigation*/}
		</React.Fragment>;
	}
};

const Evolution = withStyles(styles, { withTheme: true })(Def);
export default Evolution;