import React from 'react';

/*
Material UI components
*/
import PropTypes from 'prop-types';

class Section extends React.Component {
	static propTypes = {
		onBack: PropTypes.func,
		onNext: PropTypes.func,
		navigation: PropTypes.object,
		data: PropTypes.object.isRequired,
		setData: PropTypes.func.isRequired,
		classes: PropTypes.object.isRequired,
		className: PropTypes.string,
		highlightColor: PropTypes.string
	}

	onBack = () => {
		if (this.props.onBack) {
			this.props.onBack();
		}
	}

	onNext = () => {
		if (this.props.onBack) {
			this.props.onNext();
		}
	}
}

export default Section;
