import React from 'react';
import classNames from 'classnames';

/*
Material UI components
*/
import withStyles from '@material-ui/core/styles/withStyles';

import Tip from './Tip';
import Section from './Section';
import DataTable from './DataTable';

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
	'@media (max-width: 704px)': {
		main: {
			margin: `${theme.spacing.unit}px calc(50% - 288px)`
		}
	},
	'@media (max-width: 576px)': {
		main: {
			margin: `${theme.spacing.unit}px 0`
		}
	}
});

const Def = class ReviewData extends Section {
	render() {
		const { classes, data/*, navigation*/ } = this.props;
		return <React.Fragment>
			<div className={classNames(classes.root, this.props.className)}>
				<Tip compact="2. Review" color={this.props.highlightColor}>
					<p>Step 2 - <strong>Review</strong></p>
					<p>Examine your data below, then select <strong>Design</strong> to pick your chart type.</p>
				</Tip>
				<div className={classes.main}>
					<DataTable data={data}/>
				</div>
			</div>
			{/*navigation*/}
		</React.Fragment>;
	}
};

const ReviewData = withStyles(styles)(Def);
export default ReviewData;