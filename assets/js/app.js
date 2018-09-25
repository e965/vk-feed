'use strict'

let isVKtokenActive = () => {
	let state = false

	/*if ($ls.get('vk-token-expires-date') != 'never') {
		if ((Date.now() / 1000) > Number($ls.get('vk-token-expires-date'))) {
			$ls.rm('vk-token')
		} else {
			state = true
		}
	} else {

	}*/

	return state
}

let getImportedNode = nodeName => {
	let importBody = $make.qs(`link[data-import='${nodeName}']`).import.body

	return $make.qsf('[data-node]', importBody)
}

let popup = content => {

}

let auth = ({ type = 'normal' }) => {
	let stateString = 'vk-feed-app'

	/*
	 * https://vk.com/dev/newsfeed.get
	 * https://vk.com/dev/permissions
	 * https://vk.com/dev/implicit_flow_user
	 */

	let vkSettings = {
		domain: 'oauth.vk.com',
		appID: 6703086,
		version: 5.85,
		scope: ['friends', 'wall']
	}

	if (type == 'forever') {
		vkSettings.scope.push('offline')
	}

	let vkAuthURL = `https://${vkSettings.domain}/authorize?client_id=${vkSettings.appID}&display=page&redirect_uri=https://${vkSettings.domain}/blank.html&response_type=token&scope=${vkSettings.scope.toString()}&v=5.78&state=${stateString}`

	window.open(vkAuthURL)
}

let authSetAppData = () => {

}

document.addEventListener('DOMContentLoaded', () => {
	let mainContent = $make.qs('.main .content')

	if (location.pathname.search('index') != -1) {
		let newPageURL =
			location.pathname
				.replace('.html', '')
				.replace('.htm', '')
				.replace('index', '')

		history.pushState('', document.title, newPageURL)
	}

	let setMainContentDataset = (dataset = '', data = false) => {
		data
			? mainContent.dataset[dataset] = data
			: delete mainContent.dataset[dataset]
	}

	setMainContentDataset('error')
	mainContent.textContent = ''

	if (!isVKtokenActive()) {
		mainContent.appendChild(getImportedNode('hello'))

		let helloNode = $make.qs('[data-node="hello"]')

		$make.qsf('button[data-action="auth"]', helloNode)
			.addEventListener('click',  () => auth({ type: 'normal' }))

		$make.qsf('button[data-action="auth-forever"]', helloNode)
			.addEventListener('click',  () => auth({ type: 'forever' }))

		$make.qsf('.auth-form', helloNode)
			.addEventListener('submit',  e => {
				e.preventDefault()

				let authInput = $make.qsf('.auth-input', helloNode)

				if (authInput.checkValidity()) {
					console.log('yeah!')
				}
			})
	} else {

	}
})
