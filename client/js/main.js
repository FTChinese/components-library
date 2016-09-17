const iframeEls = document.querySelectorAll('.demo__frame');

for (let i = 0; i < iframeEls.length; i++) {
	const iframeEl = iframeEls[i];
	iframeEl.onload = function() {
		const demoEl = iframeEl.closest('.demo');
		const spinnerEl = demoEl.querySelector('.js-activity');
		spinnerEl.classList.remove('js-activity');
	}
}