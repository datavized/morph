import Drawable from './Drawable';

function Text(text) {
	Drawable.call(this);

	let color = 0x888888;

	this.text = text;
	this.size = 26;

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

Text.prototype = Object.create(Drawable.prototype);

export default Text;