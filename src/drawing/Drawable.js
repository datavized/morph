/*
This PIXI Transform object is pretty good,
so let's borrow it for now
*/
import { Transform } from '@pixi/math';
import eventEmitter from 'event-emitter';
import allOff from 'event-emitter/all-off';

let id = 0;

function Drawable() {
	eventEmitter(this);

	this.data = {};
	this.id = id++;
	this.children = [];
	this.transform = new Transform();
	this.visible = true;
	this.opacity = 1;

	this.update = () => {
		/* eslint-disable no-underscore-dangle */
		const needsUpdate = this.transform._localID !== this.transform._currentLocalID;
		/* eslint-enable no-underscore-dangle */
		this.transform.updateLocalTransform();
		if (needsUpdate) {
			this.emit('update');
		}
	};

	this.add = child => {
		this.remove(child);
		this.children.push(child);
		this.emit('add', child);
	};

	this.remove = child => {
		const index = this.children.indexOf(child);
		if (index >= 0) {
			this.children.splice(index, 1);
			this.emit('remove', child);
		}
	};

	this.clear = () => {
		while (this.children.length) {
			this.remove(this.children[0]);
		}
	};

	this.destroy = () => {
		this.emit('destroy');
		allOff(this);
	};

	this.destroyChildren = () => {
		while (this.children.length) {
			const child = this.children[0];
			this.remove(child);
			child.destroyAll();
		}
	};

	this.destroyAll = () => {
		this.destroyChildren();
		this.destroy();
	};

	Object.defineProperties(this, {
		position: {
			get: () => this.transform.position
		},
		x: {
			get: () => this.transform.position.x,
			set: val => this.transform.position.x = val
		},
		y: {
			get: () => this.transform.position.y,
			set: val => this.transform.position.y = val
		},
		rotation: {
			get: () => this.transform.rotation,
			set: val => this.transform.rotation = val
		},
		scale: {
			get: () => this.transform.scale
		},
		pivot: {
			get: () => this.transform.pivot
		},
		skew: {
			get: () => this.transform.skew
		},
		matrix: {
			get: () => {
				this.update();
				return this.transform.localTransform;
			}
		}
	});
}

export default Drawable;