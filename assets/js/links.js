'use strict'

void(() => {
	Array.from(document.querySelectorAll('a[href^="http"], a[data-nfnr]')).forEach(link => {
		link.setAttribute('target', '_blank')
		link.setAttribute('rel', 'nofollow noreffer')
    })
})()
