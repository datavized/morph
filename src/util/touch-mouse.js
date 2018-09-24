/**
 * Simulate a mouse event based on a corresponding touch event
 * @param {Object} event A touch event
 * @param {String} simulatedType The corresponding mouse event
 */
function simulateMouseEvent(event, simulatedType) {

	// Ignore multi-touch events
	if (event.touches.length > 1) {
		return;
	}

	event.preventDefault();

	const touch = event.changedTouches[0];
	const simulatedEvent = document.createEvent('MouseEvents');

	// Initialize the simulated mouse event using the touch event's coordinates
	simulatedEvent.initMouseEvent(
		simulatedType, // type
		true, // bubbles
		true, // cancelable
		window, // view
		1, // detail
		touch.screenX, // screenX
		touch.screenY, // screenY
		touch.clientX, // clientX
		touch.clientY, // clientY
		false, // ctrlKey
		false, // altKey
		false, // shiftKey
		false, // metaKey
		0, // button
		null // relatedTarget
	);

	// Dispatch the simulated event to the target element
	event.target.dispatchEvent(simulatedEvent);
}

export default function handleTouch(element) {
	let touchHandled = false;
	let touchMoved = false;

	element.addEventListener('touchstart', event => {
		if (touchHandled) {
			// todo?: !self._mouseCapture(event.changedTouches[0])
			return;
		}

		// Set the flag to prevent other widgets from inheriting the touch event
		touchHandled = true;

		// Track movement to determine if interaction was a click
		touchMoved = false;

		// Simulate the mouseover event
		simulateMouseEvent(event, 'mouseover');

		// Simulate the mousemove event
		simulateMouseEvent(event, 'mousemove');

		// Simulate the mousedown event
		simulateMouseEvent(event, 'mousedown');
	});

	element.addEventListener('touchmove', event => {
		// Ignore event if not handled
		if (!touchHandled) {
			return;
		}

		// Interaction was not a click
		touchMoved = true;

		// Simulate the mousemove event
		simulateMouseEvent(event, 'mousemove');
	});

	element.addEventListener('touchend', event => {
		// Ignore event if not handled
		if (!touchHandled) {
			return;
		}

		// Simulate the mouseup event
		simulateMouseEvent(event, 'mouseup');

		// Simulate the mouseout event
		simulateMouseEvent(event, 'mouseout');

		// If the touch interaction did not move, it should trigger a click
		if (!touchMoved) {

			// Simulate the click event
			simulateMouseEvent(event, 'click');
		}

		// Unset the flag to allow other widgets to inherit the touch event
		touchHandled = false;
	});
}