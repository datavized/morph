import { RenderTexture as RenderTexture } from '@pixi/core';
import { SCALE_MODES } from '@pixi/constants';

import { Renderer } from '@pixi/core';
import { Sprite as PIXISprite, SpriteRenderer } from '@pixi/sprite';
Renderer.registerPlugin('sprite', SpriteRenderer);

import { nextLog2 } from '../util/nextPowerOfTwo';

function Sprite(spriteLevel, index) {
	const rt = RenderTexture.create(spriteLevel.size, spriteLevel.size, SCALE_MODES.LINEAR, 1);
	rt.baseTexture.mipmap = true;

	this.pixiSprite = new PIXISprite(rt);
	this.rt = rt;
	this.client = null;
	this.spriteLevel = spriteLevel;
	this.level = spriteLevel.level;
	this.index = index;

	const scale = 1 / spriteLevel.size;
	this.pixiSprite.scale.set(scale, scale);

	this.destroy = () => {
		rt.destroy();
		this.pixiSprite.destroy();
	};
}

function SpriteLevel(level, maxTextureSize) {
	/* eslint-disable no-bitwise */
	const size = 1 << level;
	/* eslint-enable no-bitwise */
	const d = maxTextureSize / size;
	const numSprites = d * d;
	const available = new Set(); // sprite.index
	const availableQueue = [];
	const sprites = [];
	const claims = new Map(); // index on client

	this.level = level;
	this.size = size;
	this.dimension = d;

	const getSprite = () =>{
		let index = -1;
		if (sprites.length < numSprites) {
			index = sprites.length;
		} else if (availableQueue.length) {
			index = availableQueue.shift();
			available.delete(index);
		} else {
			return null;
		}

		if (!sprites[index]) {
			sprites[index] = new Sprite(this, index);
		}
		return sprites[index];
	};

	this.release = client => {
		const claim = claims.get(client);
		if (claim) {
			const sprite = claim.sprite;
			if (claim.exclusive && sprite && !available.has(sprite.index)) {
				available.add(sprite.index);
				availableQueue.push(sprite.index);
			}
			claim.exclusive = false;
		}
	};

	this.requestSprite = client => {
		let claim = claims.get(client);
		if (!claim) {
			claim = {
				exclusive: false,
				sprite: null
			};
			claims.set(client, claim);
		}

		const sprite = claim.sprite || getSprite();
		if (!sprite) {
			return null;
		}

		// re-using an existing sprite and making it exclusive
		// so make sure it's not available anymore
		if (sprite === claim.sprite && available.has(sprite.index)) {
			const i = availableQueue.indexOf(sprite.index);
			availableQueue.splice(i, 1);
			available.delete(sprite.index);
		}

		if (sprite.client && sprite.client !== client) {
			const otherClaim = claims.get(sprite.client);
			if (otherClaim) {
				otherClaim.sprite = null;
				otherClaim.exclusive = false;
			}
		}
		claim.sprite = sprite;
		claim.exclusive = true;

		return sprite;
	};

	this.destroy = () => {
		sprites.forEach(s => s.destroy());
		sprites.length = 0;

		claims.clear();

		available.clear();
		availableQueue.length = 0;

		// brt.destroy();
	};
}

function SpritePool({
	max = 1024,
	min = 64,
	maxTextureSize = 4096
} = {}) {

	const minLevel = nextLog2(min);
	const maxLevel = nextLog2(Math.min(max, maxTextureSize));

	const levels = new Map();
	const clients = new Set();

	function getSpriteLevel(level) {
		if (levels.has(level)) {
			return levels.get(level);
		}

		const spriteLevel = new SpriteLevel(level, maxTextureSize);
		levels.set(level, spriteLevel);
		return spriteLevel;
	}

	this.get = name => {
		let visible = false;
		const client = {
			name,
			release() {
				if (visible) {
					levels.forEach(level => level.release(client));
					visible = false;
				}
			},
			render(minResolution, callback, forceRender) {
				const level = Math.max(minLevel, Math.min(maxLevel, nextLog2(minResolution)));
				let sprite = null;
				for (let l = maxLevel; l >= level && !sprite; l--) {
					sprite = getSpriteLevel(l).requestSprite(client);
				}

				visible = true;

				if (!sprite) {
					return null;
				}

				if (forceRender || sprite.client !== client) {
					sprite.client = client;
					callback(sprite.rt);
				}

				return sprite.pixiSprite;
			},
			destroy() {
				client.release();
				clients.delete(client);
			}
		};
		clients.add(client);
		return client;
	};

	this.destroy = () => {
		clients.forEach((claims, client) => client.destroy());
		levels.forEach(level => level.destroy());
	};
}

export default SpritePool;