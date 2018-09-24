import React from 'react';
import classNames from 'classnames';
import { Map as map } from 'immutable';

import charts from '../charts';
import { defaultTree } from '../evolution';

/*
Material UI components
*/
import withStyles from '@material-ui/core/styles/withStyles';
import GridListTileBar from '@material-ui/core/GridListTileBar';

import Tip from './Tip';
import Section from './Section';

const styles = theme => ({
	root: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		flex: 1,
		minHeight: 0
	},
	main: {
		flex: 1,
		overflowY: 'auto',
		margin: `${theme.spacing.unit}px 10%`
	},
	gridList: {
		display: 'grid',
		gridGap: `${theme.spacing.unit}px`,
		gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 256px))',
		gridAutoRows: 'minmax(150px, 256px)',
		justifyContent: 'center'
	},
	'@media (max-width: 450px), (max-height: 450px)': {
		gridList: {
			gridTemplateColumns: 'repeat(auto-fill, 140px)',
			gridAutoRows: '140px'
		},
		instructions: {
			margin: `${theme.spacing.unit * 1}px 0`
		}
	},
	tile: {
		cursor: 'pointer',
		border: '4px solid transparent',
		boxSizing: 'border-box',
		display: 'inline-block',
		position: 'relative',
		padding: theme.spacing.unit,

		'& > img': {
			maxWidth: '100%',
			maxHeight: '100%'
		}
	},
	selected: {
		border: `4px solid ${theme.palette.primary.main}`
	}
});

const chartTypes = Object.values(charts);

const Def = class SelectChartType extends Section {
	setChartType = chartType => {
		this.props.setData(data => {
			const previousChartType = data.get('chartType');
			if (previousChartType !== chartType) {
				data = data.set('chartType', chartType);

				// add default gene tree with single node for chartType
				const allTreesData = map().set(chartType, defaultTree(charts[chartType]));
				data = data.set('tree', allTreesData);
			}

			return data;
		});
	}

	render() {
		const { classes, data, onNext/*, navigation*/ } = this.props;
		const chartType = data.get('chartType') || '';
		return <React.Fragment>
			<div className={classNames(classes.root, this.props.className)}>
				<Tip compact="3. Design" color={this.props.highlightColor}>
					<p>Step 3 - <strong>Design</strong></p>
					<p>Choose any chart type, then select <strong>Organize</strong> to prepare visualization.</p>
				</Tip>
				<div className={classes.main}>
					<div className={classes.gridList}>
						{chartTypes.map(chart =>
							<span
								key={chart.key}
								className={classNames(classes.tile, {
									[classes.selected]: chart.key === chartType
								})}
								onClick={() => {
									this.setChartType(chart.key);
									if (onNext) {
										setTimeout(onNext, 0);
									}
								}}
							>
								{<img
									src={chart.preview}
									alt={chart.name}/>}
								<GridListTileBar
									title={chart.name}
									actionIcon={null}
								/>
							</span>
						)}
					</div>
				</div>
			</div>
			{/*navigation*/}
		</React.Fragment>;

	}
};

const SelectChartType = withStyles(styles)(Def);
export default SelectChartType;