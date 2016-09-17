function sendResizeToParent(el) {
 if (!parent || !parent.postMessage || window.top === window) {
 	return;
 }
 el = (el && el instanceof HTMLElement) ? el : document.documentElement;
 
 var msg = {
 	type: 'resize',
 	url: location.href
 };

 if (el == document.documentElement) {
 	document.body.style.overflow = 'hidden';
 	document.documentElement.style.overflow = 'hidden';
 } else {
 	msg.width = el.offsetWidth;
 }
 msg.height = el.offsetHeight;
 parent.postMessage(JSON.stringify(msg), '*');
}

function processPostMessage(msg) {

	var data;
	var iframeEl;
	var iframeSelector;
	var plusborders;
	var borders;
	var style;

	try {
		data = JSON.parse(msg.data);
	} catch (e) {
		return;
	}

	data.url = data.url.replace(location.protocol + '\/\/' + location.host, '');

	iframeSelector = 'iframe[src="' + data.url + '"]';

	iframeEl = document.querySelector(iframeSelector);

	if (data.type == 'resize' && iframeEl) {

		style = getComputedStyle(iframeEl);
		plusborders = style.getPropertyValue('box-sizing') == 'border-box';

		if (data.width) {
			borders = plusborders ? parseInt(style.getPropertyValue('border-left-width')) + parseInt(style.getPropertyValue('border-right-width')) : 0;

			iframeEl.style.width = data.width + borders + 'px';
		}

		if (data.height) {
			borders = plusborders ? parseInt(style.getPropertyValue('border-top-width'))+parseInt(style.getPropertyValue('border-bottom-width')) : 0;

			iframeEl.style.height = data.height + borders + 'px';
		}

		iframeEl.classList.add('sized');
		
		sendResizeToParent();
	}
}

if (window.addEventListener) {

	window.addEventListener('message', processPostMessage);

	if (window.top !== window) {

		window.addEventListener('load', function() {

			sendResizeToParent();

			if ('MutationObserver' in window) {
				var observer = new MutationObserver(function() {
					sendResizeToParent();
				});
				observer.observe(document.documentElement, {
					subtree: true,
					childList: true
				});
			}

			window.addEventListener('resize', sendResizeToParent, false);		
		});
	}
}