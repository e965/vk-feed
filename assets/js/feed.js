'use strict'

let feedInit = ({ feedContainer }) => {
	let container = feedContainer

	container.textContent = ''

	let feed = $create.elem('div', '', 'feed')

	let feedLoad = $create.elem('div', '', 'block feed-load')

	let feedLoadBtn = $create.elem(
		'button',
		'Загрузить ещё новостей?',
		'block-content load-btn'
	)

	feedLoadBtn.onclick = e => {
		getFeed({ next: e.target.dataset.next })
	}

	feedLoad.appendChild(feedLoadBtn)

	container.appendChild(feed)
	container.appendChild(feedLoad)
}

let feedRender = ({ data = {}, feedContainer }) => {
	let feed = $make.qs('.feed')

	if (!feed) {
		feedInit({ feedContainer: feedContainer })

		feed = $make.qs('.feed')
	}

	let items = data.items

	let convertAuthorsToObj = array => {
		let tmp = {}

		array.forEach(item => {
			tmp[item.id] = item
		})

		return tmp
	}

	let groups = convertAuthorsToObj(data.groups)

	let profiles = convertAuthorsToObj(data.profiles)

	// https://stackoverflow.com/a/51471587
	let alphabet = [...Array(26).keys()].map(i => String.fromCharCode(i + 97))

	let textRender = ({ text = '' }) => {
		let tmp = text

		tmp = tmp.replace(/\n/g, '<br>')

		// TODO: поддержка хэштегов

		tmp = Autolinker.link(tmp, {
			truncate: 50
		})

		let vkLinksRegEx = /\[(.*?)\]/

		let vkLinksInText = tmp.match(
			new RegExp(vkLinksRegEx, 'g')
		)

		if (vkLinksInText) {
			vkLinksInText.forEach(link => {
				let linkTmp = link.split('|')

				tmp = tmp.replace(
					vkLinksRegEx,
					$create.link(
						`https://${APP_CONFIG.vk.domain}/${linkTmp[0]
							.replace(/\[/g, '')}`,
						linkTmp[1].replace(/]/g, ''),
						'',
						['e', 'html']
					)
				)
			})
		}

		return tmp
	}

	let timeRender = timestamp => {
		let formatter = new Intl.DateTimeFormat('ru', {
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric'
		})

		return formatter.format(new Date(timestamp * 1000))
	}

	let attachmentsRender = ({ attachments = [] }) => {
		let attachmentsElem = $create.elem('div', '', 'post-attachments')

		let tmpObject = {
			photo: [], album: [], video: [], doc: [], link: []
		}

		// https://docs.videojs.com/utils_format-time.js.html
		let durationToTime = seconds => {
			seconds = seconds < 0 ? 0 : seconds;

			let s = Math.floor(seconds % 60)
			let m = Math.floor(seconds / 60 % 60)
			let h = Math.floor(seconds / 3600)

			if (isNaN(seconds) || seconds === Infinity) {
				h = m = s = '-'
			}

			h = h > 0 ? h + ':' : ''

			m = (((h || m >= 10) && m < 10) ? '0' + m : m) + ':'

			s = (s < 10) ? '0' + s : s

			return h + m + s
		}

		attachments.forEach(attachment => {
			let _type = attachment.type

			if (_type in tmpObject) {
				tmpObject[_type].push(attachment[_type])
			}
		})

		if (tmpObject.photo.length != 0) {
			let photos = $create.elem('ul', '', 'post-photos')

			if (tmpObject.photo.length > 1) {
				photos.dataset.length = tmpObject.photo.length
			}

			tmpObject.photo.forEach((photo, i) => {
				let photoElem = $create.elem('li')

				photoElem.style.gridArea = alphabet[i]

				let img = $create.elem('img')

				let photoSizes = photo.sizes
					photoSizes.sort((a, b) => a.width - b.width)

				let photoSizesObj = {}

				photoSizes.forEach(size => {
					photoSizesObj[size.type] = size
				})

				let imgLink = $create.link(
					photoSizes[photoSizes.length - 1].url
				)

				img.src = photoSizesObj.r.url

				imgLink.dataset.lightbox = 'photos-123'

				imgLink.appendChild(img)

				photoElem.appendChild(imgLink)

				photos.appendChild(photoElem)
			})

			attachmentsElem.appendChild(photos)
		}

		if (tmpObject.album.length != 0) {
			let albums = $create.elem('ul', '', 'post-albums')

			tmpObject.album.forEach(album => {
				let albumElem = $create.elem('li')

				let albumBlock = $create.elem('div', '', 'post-album')

				let albumThumb = $create.elem('picture', '', 'album-thumb')

				let albumThumbImg = $create.elem('img')

				albumThumbImg.src = album.thumb.sizes.length != 0
					? album.thumb.sizes[0].url
					: `https://${APP_CONFIG.vk.domain}/images/camera_100.png`

				albumThumb.appendChild(albumThumbImg)

				let infoSize = $create.elem(
					'div',
					(album.size ? album.size : 'нет') + ' фото',
					'album-size'
				)

				albumThumb.appendChild(infoSize)

				let alubumInfo = $create.elem('div', '', 'album-info')

				let infoTitle = $create.elem('h4', '', 'album-title')

				let infoTitleLink = $create.link(
					`https://${APP_CONFIG.vk.domain}/album${album.owner_id}_${album.id}`,
					`Альбом <q>${album.title}</q>`
				)

				infoTitle.appendChild(infoTitleLink)

				alubumInfo.appendChild(infoTitle)

				if (album.description != '') {
					let cutLength = 200

					let infoDescription = $create.elem(
						'div',
						album.description.length > cutLength
							? album.description.substring(0, cutLength) + '...'
							: album.description,
						'album-description'
					)

					alubumInfo.appendChild(infoDescription)
				}

				albumBlock.appendChild(albumThumb)
				albumBlock.appendChild(alubumInfo)

				albumElem.appendChild(albumBlock)

				albums.appendChild(albumElem)
			})

			attachmentsElem.appendChild(albums)
		}

		if (tmpObject.video.length != 0) {
			let videos = $create.elem('ul', '', 'post-videos')

			// TODO: сделать просмотр видео в ленте (требуется пермишн "video")

			tmpObject.video.forEach(video => {
				let videoElem = $create.elem('li')

				let videoBlock = $create.elem('div', '', 'post-video')

				console.log(video)

				let videoThumb = $create.elem('picture', '', 'video-thumb')

				let videoThumbImg = $create.elem('img')

				videoThumbImg.src = video.photo_130

				videoThumb.appendChild(videoThumbImg)

				let infoDuration = $create.elem(
					'div',
					durationToTime(video.duration),
					'video-duration'
				)

				videoThumb.appendChild(infoDuration)

				let alubumInfo = $create.elem('div', '', 'video-info')

				let infoTitle = $create.elem('h4', '', 'video-title')

				let infoTitleLink = $create.link(
					`https://${APP_CONFIG.vk.domain}/video${video.owner_id}_${video.id}`,
					video.title
				)

				infoTitle.appendChild(infoTitleLink)

				alubumInfo.appendChild(infoTitle)

				if (video.description != '') {
					let cutLength = 200

					let infoDescription = $create.elem(
						'div',
						video.description.length > cutLength
							? video.description.substring(0, cutLength) + '...'
							: video.description,
						'video-description'
					)

					alubumInfo.appendChild(infoDescription)
				}

				videoBlock.appendChild(videoThumb)
				videoBlock.appendChild(alubumInfo)

				videoElem.appendChild(videoBlock)

				videos.appendChild(videoElem)
			})

			attachmentsElem.appendChild(videos)
		}

		if (tmpObject.doc.length != 0) {

		}

		if (tmpObject.link.length != 0) {

		}

		return attachmentsElem
	}

	let separatorLine = $create.elem('div', '', 'separator-line')

	items.forEach(item => {
		let post = $create.elem('div', '', 'post block')

		post.dataset.type = item.type
		post.dataset.id = item.post_id

		let postContent = $create.elem('div', '', 'block-content')

		let postHeader = $create.elem('div', '','post-header')

		let author = Math.sign(item.source_id) == 1
			? profiles[item.source_id]
			: groups[Math.abs(item.source_id)]

		let authorImage = $create.elem('img', '', 'post-header-img')
		    authorImage.src = author.photo_100

		let postMeta = $create.elem('div', '', 'post-meta')

		let postMetaAuthor = $create.elem('div', '', 'post-author')

		let authorLinkID = ''

		if ('screen_name' in author) {
			authorLinkID = author.screen_name
		} else if ('type' in author) {
			switch (author.type) {
				case 'page':
					authorLinkID = `public${author.id}`; break
				case 'group':
				default:
					authorLinkID = `club${author.id}`; break
			}
		} else {
			authorLinkID = `id${author.id}`
		}

		let authorLinkText = 'name' in author
			? author.name
			: `${author.first_name} ${author.last_name}`

		let postMetaAuthorLink = $create.link(
			`https://${APP_CONFIG.vk.domain}/${authorLinkID}`,
			authorLinkText,
			'',
			['e']
		)

		if (author.verified == 1) {
			postMetaAuthorLink.dataset.verified = ''
		}

		postMetaAuthor.appendChild(postMetaAuthorLink)

		let postMetaTime = $create.elem('div', '', 'post-time')

		let postMetaTimeLink = $create.link(
			`https://${APP_CONFIG.vk.domain}/wall${('name' in author ? '-' : '') + author.id}_${item.post_id}`,
			timeRender(item.date),
			'',
			['e']
		)

		postMetaTime.appendChild(postMetaTimeLink)

		postMeta.appendChild(postMetaAuthor)
		postMeta.appendChild(postMetaTime)

		postHeader.appendChild(authorImage)
		postHeader.appendChild(postMeta)

		postContent.appendChild(postHeader)

		if ('text' in item && item.text != '') {
			postContent.appendChild(
				$create.elem(
					'div',
					textRender({ text: item.text }),
					'post-text'
				)
			)
		}

		if ('attachments' in item) {
			postContent.appendChild(
				attachmentsRender({
					attachments: item.attachments
				})
			)
		}

		post.appendChild(postContent)

		feed.appendChild(post)
	})

	let feedLoadBtn = $make.qs('.load-btn')
	    feedLoadBtn.dataset.next = data.next_from
}
