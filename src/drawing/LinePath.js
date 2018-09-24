/*
This PIXI Transform object is pretty good,
so let's borrow it for now
*/
import Drawable from './Drawable';

function Path(points) {
	Drawable.call(this);

	let color = 0x888888;
	let lineWidth = 1;

	this.points = points;

	Object.defineProperties(this, {
		lineWidth: {
			get: () => lineWidth,
			set: w => {
				w = Math.max(0, w);
				if (w !== lineWidth && w >= 0) {
					lineWidth = w;
					this.emit('update');
				}
			}
		},

		color: {
			get: () => color,
			set: c => {
				if (c !== color) {
					color = c;
					this.emit('update');
				}
			}
		}
	});
}

Path.prototype = Object.create(Drawable.prototype);

export default Path;