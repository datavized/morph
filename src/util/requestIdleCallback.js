// shim requestIdleCallback
const requestIdleCallback = window.requestIdleCallback ||
	function (cb) {
		return setTimeout(() => {
			const start = Date.now();
			cb({
				didTimeout: false,
				timeRemaining: function () {
					return Math.max(0, 10 - (Date.now() - start));
				}
			});
		}, 1);
	};
const cancelIdleCallback = window.cancelIdleCallback || (id => clearTimeout(id));

export default requestIdleCallback;
export { requestIdleCallback, cancelIdleCallback };
