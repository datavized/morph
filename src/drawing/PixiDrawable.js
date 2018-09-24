const constructors = [];

function PixiDrawable(parent, drawable) {
	const children = new Map();
	this.drawable = drawable;
	this.pixiObject = null;

	function removeChild(childDrawable) {
		const pixiDrawable = children.get(childDrawable);
		if (pixiDrawable) {
			children.delete(childDrawable);
		}
	}

	this.update = () => {
		// update matrix - copy from drawable
		if (this.drawable) {
			this.pixiObject.visible = drawable.visible;
			this.pixiObject.transform.setFromMatrix(drawable.matrix);

			// update children
			drawable.children.forEach(childDrawable => {
				let pixiDrawable = children.get(childDrawable);
				if (!pixiDrawable) {
					let ChildConstructor = PixiDrawable;
					for (let i = 0; i < constructors.length; i++) {
						const [D, P] = constructors[i];
						if (childDrawable instanceof D) {
							ChildConstructor = P;
							break;
						}
					}

					pixiDrawable = new ChildConstructor(this.pixiObject, childDrawable);
					children.set(childDrawable, pixiDrawable);
				}
				pixiDrawable.update();
			});
		}
	};

	const callDestroy = () => this.destroy();
	this.destroy = () => {
		if (parent && this.pixiObject) {
			parent.removeChild(this.pixiObject);
		}

		if (drawable) {
			drawable.off('destroy', callDestroy);
			drawable.off('remove', removeChild);
		}

		if (this.pixiObject) {
			this.pixiObject.destroy({
				children: true
			});
		}

		children.clear();
	};

	if (drawable) {
		drawable.on('destroy', callDestroy);
		drawable.on('remove', removeChild);
	}
}

PixiDrawable.register = (drawable, pixiDrawable) => constructors.push([drawable, pixiDrawable]);

export default PixiDrawable;