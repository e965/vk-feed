'use strict'

let isVKtokenActive = () => {
	let state = false

	if ((Date.now() / 1000) > Number(localStorage['vk-token-expires-date'])) {
		localStorage.removeItem('vk-token')
	} else {
		state = true
	}

	return state
}

let getImportedNode = nodeName => {
	let importBody = $make.qs(`link[data-import='${nodeName}']`).import.body

	return $make.qsf('[data-node]', importBody)
}

document.addEventListener('DOMContentLoaded', () => {
	let mainContent = $make.qs('.main .content')

	let setMainContentDataset = (dataset = '', data = false) => {
		data
			? mainContent.dataset[dataset] = data
			: delete mainContent.dataset[dataset]
	}

	setMainContentDataset('error')
	mainContent.textContent = ''

	mainContent.appendChild(getImportedNode('hello'))
})
