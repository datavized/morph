/* global COMMIT_HASH, DEBUG_SERVICE_WORKER */

import React from 'react';
import ReactDOM from 'react-dom';
import onNewServiceWorker from './util/onNewServiceWorker';
import reportError from './util/reportError';

import './index.css';
import Main from './components/Main';

if (window.ga) {
	window.ga('set', {
		appName: 'morph',
		appVersion: COMMIT_HASH
	});
	window.addEventListener('error', reportError);
}
console.log(`Morph by Datavized Technologies (build ${COMMIT_HASH})`);

const rootEl = document.getElementById('root');

let upgradeReady = false;
let render = () => {};
const MainWithProps = () => <Main upgradeReady={upgradeReady} onError={reportError}/>;

if (module.hot) {
	const { AppContainer } = require('react-hot-loader');
	render = () => {
		ReactDOM.render(<AppContainer><MainWithProps/></AppContainer>, rootEl);
	};

	render();
	module.hot.accept('./components/Main', render);
} else {
	render = () => {
		ReactDOM.render(<MainWithProps/>, rootEl);
	};
	render();
}
if (!module.hot || DEBUG_SERVICE_WORKER) {
	if ('serviceWorker' in navigator) {
		// Use the window load event to keep the page load performant
		window.addEventListener('load', () => {
			navigator.serviceWorker.register('/sw.js').then(reg => {
				// check once an hour
				setInterval(() => reg.update(), 1000 * 60 * 60);

				onNewServiceWorker(reg, () => {
					upgradeReady = true;
					render();
				});
			});
		});
	}
}
