'use strict'

let getImportedNode = nodeName => {
	let importBody = $make.qs(`link[data-import='${nodeName}']`).import.body

	return $make.qsf('[data-node]', importBody)
}

let popup = content => {

}

let customizeExternalLinks = () => {
	Array.from(document.querySelectorAll('a[href^="http"], a[data-nfnr]')).forEach(link => {
		link.setAttribute('target', '_blank')
		link.setAttribute('rel', 'nofollow noreffer')
	})
}

let appData = {
	set: (data = { token, userID, expiresTime, scope }) => {
		$ls.set(
			APP_CONFIG.storage.appData,
			JSON.stringify(data)
		)
	},

	get: (key) => {
		let neededData = ''

		let data = {}

		try {
			data = JSON.parse($ls.get(APP_CONFIG.storage.appData))

			if (data == null) {
				throw 0 // такое бывает, если айтем в хранилище - не объект, а строка
			}
		} catch (e) {
			console.warn('Неизвестные данные. Необходимо авторизоваться.')
			return
		}

		if (
			'token' in data &&
			'userID' in data &&
			'expiresTime' in data &&
			'scope' in data
		) {
			switch (key) {
				case 'token':
				case 'userID':
				case 'expiresTime':
				case 'scope':
					neededData = data[key]; break
			}
		} else {
			console.warn('Данные приложения не установлены. Необходимо авторизоваться.')
			return
		}

		return neededData
	},

	remove: () => {
		$ls.rm(APP_CONFIG.storage.appData)
	}
}

let auth = ({ type = 'normal' }) => {
	/*
	 * https://vk.com/dev/newsfeed.get
	 * https://vk.com/dev/permissions
	 * https://vk.com/dev/implicit_flow_user
	 */

	if (type == 'forever') {
		APP_CONFIG.vk.scope.push('offline')
	} else {
		// сохранять время нажатия на кнопку необходимо для вычисления примерного времени действия токена
		$ls.set(
			APP_CONFIG.storage.timeOfButtonClick,
			new Date().getTime() / 1000
		)
	}

	let vkAuthURL =
		`https://${APP_CONFIG.vk.domain_oauth}` +
		`/authorize?client_id=${APP_CONFIG.vk.app_id}&display=page` +
		`&redirect_uri=https://${APP_CONFIG.vk.domain_oauth}/blank.html` +
		`&response_type=token&scope=${APP_CONFIG.vk.scope.toString()}` +
		`&v=${APP_CONFIG.vk.version}&state=${APP_CONFIG.app_name}`

	window.open(vkAuthURL)
}

let queryURL = ({ method = '', params = false }) =>
	`https://${APP_CONFIG.vk.domain_api}` +
	`/method/${method}?${params ? params + '&' : '' }` +
	`access_token=${appData.get('token')}&v=${APP_CONFIG.vk.version}`

let getFeed = ({ feedContainer = $create.elem('div'), next = '' }) => {
	// https://vk.com/dev/newsfeed.get

	let params = {
		count: 10,
		filter: ['post'].toString(),
		fields: ['verified', 'photo_100'].toString(),
		sources: ['g47590299'].toString()
	}

	let source = params.sources
		? `source_ids=${params.sources}&`
		: ''

	next = next ? `&start_from=${next}` : ''

	fetchJsonp(queryURL({
		method: 'newsfeed.get',
		params: `${source}filters=${params.filter}&count=${params.count}&fields=${params.fields}${next}`
	}))
		.then(response => response.json())
		.then(data => feedRender({
			data: data.response,
			feedContainer: feedContainer
		}))
		.catch(error => {
			console.warn(error)
		})
}

let exit = () => {
	appData.remove()
	location.reload()
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

	let showHelloPage = () => {
		mainContent.textContent = ''

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

				let authInputValidity = { error: false }

				let authInputIsInvalid = text => {
					if (authInputValidity.error != true) {
						authInputValidity = {
							error: true,
							alertText: `Ошибка: ${text}. Попробуйте ещё раз.`
						}
					}

					return authInputValidity
				}

				let authInputURL = new URL(authInput.value)

				let authInputURLhashParams =
					new URLSearchParams(
						authInputURL.hash.substring(1)
					)

				if (
					!authInput.checkValidity() ||
					!authInputURL ||
					!authInputURLhashParams
				) {
					authInputIsInvalid('Некорректный URL')
				}

				if (authInputURL.hostname != APP_CONFIG.vk.domain_oauth) {
					authInputIsInvalid('Неверный домен VK API')
				}

				if (authInputURLhashParams.get('state') != APP_CONFIG.app_name) {
					authInputIsInvalid('VK API выдал Вам некорректный URL.')
				}

				if (
					!authInputURLhashParams.has('access_token') ||
					!authInputURLhashParams.has('expires_in') ||
					!authInputURLhashParams.has('user_id') ||
					!authInputURLhashParams.has('state')
				) {
					authInputIsInvalid('Во введённом URL нет одного или нескольких необходимых параметров')
				}

				if (authInputValidity.error == true) {
					authInput.value = ''
 					alert(authInputValidity.alertText)
					return
				} else {
					appData.set({
						token:        authInputURLhashParams.get('access_token'),
						userID:       Number(authInputURLhashParams.get('user_id')),
						expiresTime:  Number(authInputURLhashParams.get('expires_in')),
						scope:        APP_CONFIG.vk.scope
					})

					appInit()
				}
			})
	}

	let appInit = () => {
		// https://vk.com/dev/execute

		let vkScript =
			'var profileInfo = API.account.getProfileInfo({});' +

			'var profilePhoto =' +
				` API.photos.get({ owner_id: ${appData.get('userID')},` +
				' album_id: "profile", count: 1, rev: 1 });' +

			'return' +
				' { "name": profileInfo.first_name,' +
				' "photo": profilePhoto.items@.sizes[0][0].url };'

		fetchJsonp(queryURL({ method: 'execute', params: `code=${vkScript}` }))
			.then(response => response.json())
			.then(_data => {
				let data = _data.response

				let profileBlock = $make.qs('.profile')

				profileBlock.appendChild(
					$create.elem('span', data.name, 'profile-name')
				)

				let profileImage = $create.elem('div', '', 'profile-image')

				profileImage.style.backgroundImage = `url(${data.photo})`

				profileBlock.appendChild(profileImage)

				mainContent.textContent = ''
				setMainContentDataset('style')

				getFeed({ feedContainer: mainContent })
			})
			.catch(error => {
				//exit()
			})

		customizeExternalLinks()
	}

	setMainContentDataset('error')

	if (!appData.get('token')) {
		showHelloPage()
	} else {
		appInit()
	}

	$make.qs('[data-action="settings"]')
		.onclick = () => {}

	$make.qs('[data-action="exit"]')
		.onclick = () => exit()

})
