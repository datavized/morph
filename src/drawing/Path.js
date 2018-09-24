/*
This PIXI Transform object is pretty good,
so let's borrow it for now
*/
import Drawable from './Drawable';

function Path(svgPathString) {
	Drawable.call(this);

	let color = 0x888888;

	this.path = svgPathString;

	Object.defineProperties(this, {
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