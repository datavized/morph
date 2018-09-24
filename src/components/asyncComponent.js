import React, { Component } from 'react';

const queue = new Set();

function isConnected() {
	return navigator.onLine === undefined || navigator.onLine;
}

function renderComponent(component) {
	return typeof component === 'function' ?
		React.createElement(component) :
		component || null;
}

function asyncComponent(importComponent, options = {}) {
	const {
		load: loadingComponents,
		fail: failComponents,
		defer
	} = options;

	let preloadTimeout = 0;

	function load() {
		clearTimeout(preloadTimeout);
		queue.add(importComponent);

		const p = importComponent().then(component => {
			queue.delete(importComponent);
			return component;
		});
		p.catch(() => {
			queue.delete(importComponent);
		});
		return p;
	}

	function attemptPreload() {
		if (queue.size) {
			preloadTimeout = setTimeout(attemptPreload, 500);
		} else {
			load();
		}
	}

	class AsyncComponent extends Component {
		state = {
			component: null,
			connected: isConnected(),
			requested: false,
			failed: false,
			attempts: 0
		}

		isMounted = false

		load = () => {
			if (this.state.requested) {
				// don't request twice
				return;
			}


			this.setState({
				component: null,
				requested: true,
				attempts: this.state.attempts + 1
			});

			// todo: maybe load doesn't return a promise?
			load().then(component => new Promise(resolve => {
				if (this.isMounted) {
					this.setState({
						// handle both es imports and cjs
						component: component.default ? component.default : component,
						requested: false
					}, () => resolve());
				}
			})).catch(err => {
				console.error('Failed to load component', err);
				if (this.isMounted) {
					this.setState({
						requested: false,
						failed: true
					});
				}
			});
		}

		retry = () => {
			if (this.state.attempts >= 3 && !this.state.requested) {
				window.location.reload();
			} else {
				this.load();
			}
		}

		updateOnlineStatus = () => {
			const connected = isConnected();
			if (connected && !queue.size) {
				this.load();
			}
			this.setState({
				connected
			});
		}

		componentDidMount() {
			this.isMounted = true;
			window.addEventListener('online',  this.updateOnlineStatus);
			window.addEventListener('offline', this.updateOnlineStatus);
			this.load();
		}

		componentWillUnmount() {
			this.isMounted = false;
			window.removeEventListener('online',  this.updateOnlineStatus);
			window.removeEventListener('offline', this.updateOnlineStatus);
		}

		render() {
			const C = this.state.component;
			if (C) {
				return <C {...this.props} />;
			}

			if (this.state.failed && !this.state.requested && failComponents) {
				if (typeof failComponents === 'function') {
					const F = failComponents;
					return <F onRetry={this.retry} connected={this.state.connected}/>;
				}
				return failComponents;
			}

			return renderComponent(loadingComponents);
		}
	}

	if (!defer) {
		setTimeout(attemptPreload, 200);
	}

	return AsyncComponent;
}

export default asyncComponent;