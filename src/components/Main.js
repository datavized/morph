import React from 'react';

import App from './App';
import Theme from './Theme';

const Def = class Main extends React.Component {
	componentDidCatch(error) {
		if (this.props.onError) {
			this.props.onError(error);
		}
	}

	render() {
		return <Theme><App {...this.props}/></Theme>;
	}
};

const Main = Def;
export default Main;