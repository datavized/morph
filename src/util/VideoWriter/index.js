import eventEmitter from 'event-emitter';
import allOff from 'event-emitter/all-off';

/*
*/

export default function VideoWriter(implementation, options) {
	eventEmitter(this);

	let started = false;
	let destroyed = false;

	const finish = blob => {
		if (!destroyed) {
			this.emit('finish', blob);
		}
	};

	const impl = implementation(options || {}, this, finish);


	/*
	todo:
	- implement detection for whether the format is supported
	- report mime type
	- report pixi renderer options?
	*/

	Object.defineProperty(this, 'reportsProgress', {
		value: impl.reportsProgress === true
	});

	this.start = () => {
		if (!started && impl.start) {
			impl.start();
		}
		started = true;
	};

	this.finish = () => {
		if (started && impl.finish) {
			impl.finish();
		}
		started = false;
	};

	this.addFrame = canvas => {
		if (impl.addFrame) {
			impl.addFrame(canvas);
		}
	};

	this.destroy = () => {
		destroyed = true;
		if (impl.destroy) {
			impl.destroy();
		}
		allOff(this);
	};
}