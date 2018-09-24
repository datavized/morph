/* global COMMIT_HASH, DEBUG_SERVICE_WORKER */

import React from 'react';
import ReactDOM from 'react-dom';
import onNewServiceWorker from './util/onNewServiceWorker';

import './index.css';
import Main from './components/Main';

const handleError = event => {
	console.error(event.error || event);

	const details = event instanceof window.ErrorEvent ?
		[
			(event.filename || '').replace(window.location.origin, ''),
			event.lineno,
			event.colno
		].join(':') :
		event.toString();
	window.ga('send', 'exception', {
		exDescription: `${event.message} [${details}]`
	});
};

if (window.ga) {
	window.ga('set', {
		appName: 'morph',
		appVersion: COMMIT_HASH
	});
	window.addEventListener('error', handleError);
}
console.log(`Morph by Datavized Technologies (build ${COMMIT_HASH})`);

const rootEl = document.getElementById('root');

let upgradeReady = false;
let render = () => {};

if (module.hot) {
	const { AppContainer } = require('react-hot-loader');
	render = () => {
		ReactDOM.render(<AppContainer><Main upgradeReady={upgradeReady} onError={handleError}/></AppContainer>, rootEl);
	};

	render();
	module.hot.accept('./components/Main', render);
} else {
	render = () => {
		ReactDOM.render(<Main upgradeReady={upgradeReady} onError={handleError}/>, rootEl);
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

	ReactDOM.render(<Main />, rootEl);
}
