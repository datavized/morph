import hsv2rgb from '../util/hsv2rgb';
import fmod from '../util/fmod';

export const defaultColorValues = {
	hueOffset: 0,
	hueRange: 0.6,
	saturationOffset: 1,
	saturationValueFactor: 0,
	lightnessOffset: 0.6,
	lightnessValueFactor: 0
};

export default function geneColor(genes, colorVal) {
	const hueOffset = genes.get('hueOffset') || 0;
	const hueRange = genes.get('hueRange') || 0;
	const saturationOffset = genes.get('saturationOffset') || 0;
	const saturationValueFactor = genes.get('saturationValueFactor') || 0;
	const lightnessOffset = genes.get('lightnessOffset') || 0;
	const lightnessValueFactor = genes.get('lightnessValueFactor') || 0;

	const hue = fmod(hueOffset + hueRange * colorVal + 0.5, 1);
	const saturation = saturationOffset + saturationValueFactor * colorVal;
	const lightness = lightnessOffset + lightnessValueFactor * colorVal;

	/*
	We're using HSV instead of HSL, even though it's called lightness.
	The hope is that this will result in more saturated colors.
	*/
	return hsv2rgb(hue, Math.abs(saturation), lightness);
}