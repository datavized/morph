import PixiDrawable from './PixiDrawable';
import Text from './Text';

import { Container } from '@pixi/display';
import { Renderer } from '@pixi/core';
import { /*Sprite as PIXISprite, */SpriteRenderer } from '@pixi/sprite';
import { Text as PIXIText, TextStyle } from '@pixi/text';
Renderer.registerPlugin('sprite', SpriteRenderer);

// just mapping by font size
const styles = new Map();
function fontStyle(size) {
	let style = styles.get(size);
	if (!style) {
		style = new TextStyle({
			fontSize: size
		});
		styles.set(size, style);
	}
	return style;
}

function PixiText(parent, drawable) {
	PixiDrawable.call(this, parent, drawable);

	let textObject = null;

	const superUpdate = this.update;
	this.update = () => {
		const text = drawable && drawable.text || '';
		if (!this.pixiObject) {
			this.pixiObject = new Container();
			if (parent) {
				parent.addChild(this.pixiObject);
			}

			textObject = new PIXIText(text, fontStyle(drawable.size));
			this.pixiObject.addChild(textObject);
		} else {
			textObject.text = text;
			textObject.style = fontStyle(drawable.size);
		}

		// center
		textObject.position.set(
			-textObject.width / 2,
			-textObject.height / 2
		);

		const hex = ('00000' + drawable.color.toString(16)).slice(-6);
		textObject.style.fill = '#' + hex;
		textObject.alpha = drawable.opacity;

		superUpdate.call(this);
	};
}

PixiText.prototype = Object.create(PixiDrawable.prototype);

PixiDrawable.register(Text, PixiText);

export default PixiText;