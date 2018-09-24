const keys = ['installing', 'waiting', 'active'];
export default function onNewServiceWorker(reg, callback) {
	const key = keys.find(k => reg[k]);
	const original = reg[key];

	if (reg.waiting) {
		// SW is waiting to activate. Can occur if multiple clients open and
		// one of the clients is refreshed.
		return callback();
	}

	function listenInstalledStateChange() {
		const key = keys.find(k => reg[k] !== original && reg[k]);
		const next = reg[key];
		if (!next) {
			return;
		}

		if (next.state === 'installed' || next !== original && next.state === 'activated') {
			callback();
		} else {
			next.addEventListener('statechange', () => {
				// console.log('statechange', event.target, event.target === next);
				if (next.state === 'installed') {
					callback();
				}
			});
		}
	}

	if (reg.installing) {
		return listenInstalledStateChange();
	}

	// We are currently controlled so a new SW may be found...
	// Add a listener in case a new SW is found,
	reg.addEventListener('updatefound', listenInstalledStateChange);
}
