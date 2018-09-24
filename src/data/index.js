export default [
	{
		title: 'Largest cities in the world',
		source: 'https://en.wikipedia.org/wiki/List_of_largest_cities',
		license: 'Creative Commons Attribution-ShareAlike 3.0',
		licenseLink: 'https://en.wikipedia.org/wiki/Wikipedia:Text_of_Creative_Commons_Attribution-ShareAlike_3.0_Unported_License',
		load: () => import('./large-cities.json')
	},
	{
		title: `Fisher's Iris data set`,
		description: `Fisher's Iris data set\nDua, D. and Karra Taniskidou, E. (2017). UCI Machine Learning Repository Irvine, CA: University of California, School of Information and Computer Science.`,
		source: 'http://archive.ics.uci.edu/ml/datasets/Iris',
		load: () => import('./iris.json')
	},
	{
		title: 'European Parliament election, 2004',
		source: 'https://en.wikipedia.org/wiki/European_Parliament_election,_2004',
		license: 'Creative Commons Attribution-ShareAlike 3.0',
		licenseLink: 'https://en.wikipedia.org/wiki/Wikipedia:Text_of_Creative_Commons_Attribution-ShareAlike_3.0_Unported_License',
		load: () => import('./european-parliament-2004.json')
	},
	{
		title: 'Honey Production in the USA (1998-2012)',
		description: 'Honey Production Figures and Prices by National Agricultural Statistics Service',
		source: 'https://www.kaggle.com/jessicali9530/honey-production',
		license: 'CC0: Public Domain',
		licenseLink: 'https://creativecommons.org/publicdomain/zero/1.0/',
		load: () => import('./honeyproduction.json')
	},
	{
		title: 'Mathematical Number Sequences',
		description: 'Primes, powers of two, powers of ten, Fibonacci sequence',
		load: () => import('./number-sequences.json')
	},
	{
		title: 'World Happiness Report',
		source: 'https://www.kaggle.com/unsdsn/world-happiness',
		description: 'Happiness scored according to economic production, social support, etc.',
		license: 'CC0: Public Domain',
		licenseLink: 'https://creativecommons.org/publicdomain/zero/1.0/',
		load: () => import('./world-happiness.json')
	}/*,
	{
		title: 'FIFA World Cup',
		source: 'https://www.kaggle.com/abecklas/fifa-world-cup',
		description: '',
		license: 'CC0: Public Domain',
		licenseLink: 'https://creativecommons.org/publicdomain/zero/1.0/',
		load: () => import('./fifa-world-cup.json')
	}*/
];
