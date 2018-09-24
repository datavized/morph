import { decomposeColor, recomposeColor } from '@material-ui/core/styles/colorManipulator';

export default function translucentBackgroundColor(paletteColor, alpha) {
	const { values } = decomposeColor(paletteColor);
	return recomposeColor({
		type: 'rgba',
		values: [...values, alpha]
	});
}
