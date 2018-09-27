'use strict'

const APP_CONFIG = {
	// название приложения
	app_name: 'ru.cojam.vkFeed',

	// параметры ВК и приложения
	vk: {
        domain: 'vk.com',
		domain_oauth: 'oauth.vk.com',
		domain_api: 'api.vk.com',
		app_id: 6703807,
		version: 5.85,
		scope: ['friends', 'wall', 'photos']
	},

	// названия кючей у айтемов в локальном хранилище
	storage: {
		appData: 'appData',

		timeOfButtonClick: 'buttonTime'
	}
}

Object.keys(APP_CONFIG.storage).forEach(key => {
	APP_CONFIG.storage[key] = `${APP_CONFIG.app_name}.${key}`
})
