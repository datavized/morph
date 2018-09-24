// Opens a pop-up with twitter sharing dialog
export function popup(url, params) {
	const query = Object.keys(params)
		.map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key] || ''))
		.join('&');
	window.open(
		url + '?' + query,
		'',
		'left=0,top=0,width=550,height=450,personalbar=0,toolbar=0,scrollbars=0,resizable=0'
	);
}

export function shareFacebook(u) {
	popup('https://www.facebook.com/sharer/sharer.php', {
		u
	});
}

export function shareTwitter(title = '', text, url, hashtags) {
	if (Array.isArray(hashtags)) {
		hashtags = hashtags.join(',');
	}
	text = [text];
	if (title) {
		text.unshift(title);
	}
	popup('https://twitter.com/intent/tweet', {
		text: text.join('\n'),
		url,
		hashtags
	});
}

export function shareEmail(title = 'Morph image', text, url) {
	const mailLink = `mailto:?body=${encodeURIComponent(text + '\n' + url)}&subject=${encodeURIComponent(title)}`;
	window.open(mailLink);
}

export function shareNative(title = '', text = '', url, hashtags) {
	if (navigator.share) {
		hashtags = hashtags.map(t => '#' + t).join(' ');
		if (hashtags) {
			text = text + ' ' + hashtags;
		}
		return navigator.share({
			title,
			text,
			url
		});
	}
	return Promise.reject(new Error('Native social sharing not supported'));
}