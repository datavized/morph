import React from 'react';
import PropTypes from 'prop-types';

import Sketch from './Sketch';
import chartTypes from '../charts/drawable';

function nothing() {
	return Object.create(null);
}

const Def = class ChartPreview extends React.Component {
	static propTypes = {
		className: PropTypes.string,
		chartType: PropTypes.string.isRequired
	}
	render() {
		const {
			chartType
		} = this.props;
		const chartDefinition = chartTypes[chartType];

		return (
			<Sketch
				className={this.props.className}
				sketch={chartDefinition && chartDefinition.draw || nothing}
				centerOrigin={false}
				ref={ref => this.wrapper = ref && ref.wrapper}
				{...this.props}
			/>
		);

	}
};

const ChartPreview = Def;
export default ChartPreview;