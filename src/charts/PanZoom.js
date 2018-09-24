import {
	ZOOM_SPEED,
	MOVE_THRESHOLD
} from './constants';

export default function PanZoom(element, onPan, onZoom) {
	function wheel(event) {
		const delta = event.deltaY === undefined && event.detail !== undefined ? -event.detail : -event.deltaY || 0;
		const wheelScale = event.deltaMode === 1 ? 100 : 1;

		event.preventDefault();

		onZoom(Math.pow(1.0001, delta * wheelScale * ZOOM_SPEED));
	}

	let dragging = false;
	let moved = false;
	let zoomed = false;
	let pinchStartDist = 0;
	let dragStartX = 0;
	let dragStartY = 0;
	let dragX = 0;
	let dragY = 0;

	function start(x, y) {
		dragging = true;
		dragX = dragStartX = x;
		dragY = dragStartY = y;
	}

	function move(x, y) {
		if (dragging) {

			if (Math.abs(dragStartX - x) <= MOVE_THRESHOLD &&
				Math.abs(dragStartY - y) <= MOVE_THRESHOLD) {
				return;
			}

			moved = true;

			const dX = x - dragX;
			const dY = y - dragY;
			dragX = x;
			dragY = y;

			onPan(dX, dY);
		}
	}

	function mouseDown(event) {
		const target = event.target;
		let el = element;
		while (el !== target && el.parentNode) {
			el = el.parentNode;
		}
		if (el === target) {
			start(event.pageX, event.pageY);
			event.preventDefault();
		}
	}

	function stop() {
		dragging = false;
		moved = false;
		zoomed = false;
	}

	function mouseMove(event) {
		const x = event.pageX;
		const y = event.pageY;
		move(x, y);
	}

	function touchStart(event) {
		if (event.touches.length === 1) {
			start(event.touches[0].pageX, event.touches[0].pageY);
		} else if (event.touches.length === 2) {
			const t0 = event.touches[0];
			const t1 = event.touches[1];
			const dx = t0.pageX - t1.pageX;
			const dy = t0.pageY - t1.pageY;
			pinchStartDist = Math.sqrt(dx * dx + dy * dy);
		}
	}

	function touchMove(event) {
		event.preventDefault();

		if (event.touches.length === 2) {
			const t0 = event.touches[0];
			const t1 = event.touches[1];
			const dx = t0.pageX - t1.pageX;
			const dy = t0.pageY - t1.pageY;
			const pinchDist = Math.sqrt(dx * dx + dy * dy);
			const pinchDelta = pinchDist - pinchStartDist;
			const factor = pinchDelta > 0 ? 1.01 : 0.99;

			zoomed = true;

			onZoom(factor);

			event.preventDefault();
			event.stopPropagation();

			return;
		}

		if (!zoomed) {
			//todo: invert x direction on iOS
			move(event.touches[0].pageX, event.touches[0].pageY);
		}
	}

	function touchEnd(event) {
		if (!event.touches.length || event.touches.length < 2 && zoomed) {
			stop();
		}
	}

	this.start = () => {
		// todo: handle touch/pinch as well
		window.addEventListener('wheel', wheel);
		element.addEventListener('mousedown', mouseDown);
		window.addEventListener('mouseup', stop);
		window.addEventListener('mousemove', mouseMove);

		element.addEventListener('touchstart', touchStart);
		element.addEventListener('touchmove', touchMove);
		element.addEventListener('touchend', touchEnd);
	};

	this.stop = () => {
		stop();

		// todo: handle touch/pinch as well
		window.removeEventListener('wheel', wheel);
		element.removeEventListener('mousedown', mouseDown);
		window.removeEventListener('mouseup', stop);
		window.removeEventListener('mousemove', mouseMove);

		element.removeEventListener('touchstart', touchStart);
		element.removeEventListener('touchmove', touchMove);
		element.removeEventListener('touchend', touchEnd);
	};

	Object.defineProperties(this, {
		dragging: {
			get: () => dragging
		},
		moved: {
			get: () => moved
		},
		changed: {
			get: () => moved || zoomed
		}
	});
}