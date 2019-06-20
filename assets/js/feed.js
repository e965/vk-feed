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

		tmp = `<p>${tmp.replace(/\n/g, '<br>')}</p>`

		tmp = Autolinker.link(tmp, {
			truncate: 50
		})

		// https://git.io/fxvBn
		let vkLinksRegExp = /\[((?:id|club)\d+)\|([^\]]+)\]/

		let vkLinksInText = tmp.match(
			new RegExp(vkLinksRegExp, 'g')
		)

		if (vkLinksInText) {
			vkLinksInText.forEach(link => {
				let linkTmp = link.split('|')

				tmp = tmp.replace(
					vkLinksRegExp,
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

		// TODO: поддержка хэштегов (надо найти/написать регулярку для хештегов вида #тест@test)

		// https://git.io/fxvRC
		// let vkHashTagRegExp = /#[a-zA-Zа-яА-Я0-9\-_]+/

		tmp = twemoji.parse(tmp, {
			folder: 'svg', ext: '.svg'
		})

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

	let attachmentsRender = ({ attachments = [], postData = { postID, authorID } }) => {
		let attachmentsElem = $create.elem('div', '', 'post-attachments')

		let tmpObject = {
			photo: [], album: [], video: [], podcast: [], doc: [], link: []
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
			} else {
				photos.dataset.single = ''
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

				let biggestImgURL = photoSizes[photoSizes.length - 1].url

				let imgLink = $create.link(biggestImgURL)

				img.src = photoSizesObj.x.url

				img.dataset.bp = biggestImgURL

				if (photo.text != '') {
					img.caption = photo.text
				}

				imgLink.appendChild(img)

				imgLink.onclick = e => {
					e.preventDefault()

					BigPicture({
						el: e.target,
						gallery: $make.qsf(`img`, photos, ['a'])
					})
				}

				photoElem.appendChild(imgLink)

				photos.appendChild(photoElem)
			})

			attachmentsElem.appendChild(photos)
		}

		if (tmpObject.album.length != 0) {
			let albums = $create.elem('ul', '', 'post-albums')

			tmpObject.album.forEach(album => {
				let albumElem = $create.elem('li')

				let albumBlock = $create.link(
					`https://${APP_CONFIG.vk.domain}/album${album.owner_id}_${album.id}`,
					'',
					'post-album'
				)

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

				albumBlock.appendChild(albumThumb)

				let albumInfo = $create.elem('div', '', 'album-info')

				let infoTitle = $create.elem('h4', `Альбом <q>${album.title}</q>`, 'text album-title')

				albumInfo.appendChild(infoTitle)

				if (album.description != '') {
					let cutLength = 200

					let infoDescription = $create.elem(
						'div',
						album.description.length > cutLength
							? album.description.substring(0, cutLength) + '...'
							: album.description,
						'text album-description'
					)

					albumInfo.appendChild(infoDescription)
				}

				let albumFakeBtn = $create.elem('button', 'Смотреть фото','button album-btn')

				albumInfo.appendChild(albumFakeBtn)

				albumBlock.appendChild(albumInfo)

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
				let videoBlock = $create.link(
					`https://${APP_CONFIG.vk.domain}/` +
						`wall${postData.authorID}_${postData.postID}` +
						`?z=video${video.owner_id}_${video.id}`,
					'',
					'post-video'
				)

				let videoThumb = $create.elem('picture', '', 'video-thumb')

				let videoThumbImg = $create.elem('img')

				videoThumbImg.src = video.photo_320

				videoThumb.appendChild(videoThumbImg)

				let infoDuration = $create.elem(
					'div',
					durationToTime(video.duration),
					'video-duration'
				)

				videoThumb.appendChild(infoDuration)

				videoBlock.appendChild(videoThumb)

				let videoInfo = $create.elem('div', '', 'video-info')

				let infoTitle = $create.elem('h4', video.title, 'text video-title')

				videoInfo.appendChild(infoTitle)

				if (video.description != '') {
					let cutLength = 200

					let infoDescription = $create.elem(
						'div',
						video.description.length > cutLength
							? video.description.substring(0, cutLength) + '...'
							: video.description,
						'text video-description'
					)

					videoInfo.appendChild(infoDescription)
				}

				let videoFakeBtn = $create.elem('button', 'Смотреть видео','button video-btn')

				videoInfo.appendChild(videoFakeBtn)

				videoBlock.appendChild(videoInfo)

				videoElem.appendChild(videoBlock)

				videos.appendChild(videoElem)
			})

			attachmentsElem.appendChild(videos)
		}

		if (tmpObject.doc.length != 0) {
			let docs = $create.elem('ul', '', 'post-docs')

			tmpObject.doc.forEach(doc => {
				let docElem = $create.elem('li')

				// ...

				docs.appendChild(docElem)
			})

			attachmentsElem.appendChild(docs)
		}

		if (tmpObject.link.length != 0) {
			let link = $create.elem('div', '', 'post-link')

			// TODO: сделать так, что если к посту прикреплена хоть одна картинка, то ссылка становится маленькой (наподобие видео/альбомов/подкастов)
			// TODO: не у всех ссылок бывают картинки, нужно пофиксить

			let linkData = tmpObject.link[0]

			let linkURL = new URL(linkData.url)

			let linkType = 'link'

			if (
				linkURL.hostname.match('vk.com') &&
				linkURL.pathname.substring(1).startsWith('@')
			) {
				linkType = 'article'
			}

			link.dataset.type = linkType

			let linkLink = $create.link(
				linkData.url,
				'',
				'link-link', // lol
				['e']
			)

			let linkSize = 'regular'

			if ('photo' in linkData) {
				let photoSizes = linkData.photo.sizes
			    photoSizes.sort((a, b) => a.width - b.width)

				let biggestCoverImg = photoSizes[photoSizes.length - 1]

				if (biggestCoverImg.width <= 500) {
					linkSize = 'mini'
				}

				let linkCover = $create.elem('img', '', 'link-cover')
					linkCover.src = biggestCoverImg.url

				linkLink.appendChild(linkCover)
			} else {
				linkSize = 'micro'
			}

			link.dataset.size = linkSize

			let linkInfo = $create.elem('div', '', 'link-info')

			let linkTitle = $create.elem('h4', linkData.title, 'text link-title')

			linkInfo.appendChild(linkTitle)

			let linkFakeButton = $create.elem('button', '', 'button link-btn')

			if (linkType == 'article') {
				linkFakeButton.textContent = '🗲 Читать'
				linkInfo.appendChild(linkFakeButton)
			} else if (linkType == 'link' || linkSize == 'mini') {
				let linkSource = $create.elem('div', linkURL.hostname, 'text link-source')

				linkInfo.appendChild(linkSource)
			}

			if (linkSize == 'mini') {
				linkFakeButton.textContent = 'Открыть ссылку'
				linkInfo.appendChild(linkFakeButton)
			}

			linkLink.appendChild(linkInfo)

			link.appendChild(linkLink)

			attachmentsElem.appendChild(link)
		}

		if (tmpObject.podcast.length != 0) {
			let podcast = $create.elem('div', '', 'post-podcast')

			let podcastData = tmpObject.podcast[0]

			let photoSizes = podcastData.podcast_info.cover.sizes
			    photoSizes.sort((a, b) => a.width - b.width)

			let biggestImgURL = photoSizes[photoSizes.length - 1].url

			let podcastCover = $create.elem('picture', '', 'podcast-cover')
			    podcastCover.style.gridArea = 'p-covr'

			let podcastCoverImg = $create.elem('img')
			    podcastCoverImg.src = biggestImgURL

			podcastCover.appendChild(podcastCoverImg)

			podcast.appendChild(podcastCover)

			let podcastInfo = $create.elem('div', '', 'podcast-info')
				podcastInfo.style.gridArea = 'p-info'

			let podcastTitleLink = $create.link(
				`https://${APP_CONFIG.vk.domain}/podcast${podcastData.owner_id}_${podcastData.id}`,
				'',
				'podcast-title'
			)

			let podcastTitle = $create.elem('h4', `${podcastData.artist}: ${podcastData.title}`, 'text')

			podcastTitleLink.appendChild(podcastTitle)

			podcastInfo.appendChild(podcastTitleLink)

			if (podcastData.podcast_info.description != '') {
				let cutLength = 200

				let podcastDescription = $create.elem(
					'div',
					podcastData.podcast_info.description.length > cutLength
						? podcastData.podcast_info.description.substring(0, cutLength) + '...'
						: podcastData.podcast_info.description,
					'text podcast-description'
				)

				podcastInfo.appendChild(podcastDescription)
			}

			podcast.appendChild(podcastInfo)

			let podcastListen = $create.elem('div', '', 'podcast-listen')
			    podcastListen.style.gridArea = 'p-lstn'

			let podcastListenAudio = new Audio(podcastData.url)
			    podcastListenAudio.controls = true
			    podcastListenAudio.preload = 'metadata'

			podcastListen.appendChild(podcastListenAudio)

			podcast.appendChild(podcastListen)

			attachmentsElem.appendChild(podcast)
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

		postMeta.appendChild(postMetaAuthor)

		let postMetaTime = $create.elem('div', '', 'post-time')

		let authorID = ('name' in author ? '-' : '') + author.id

		post.dataset.author = authorID

		if ('data' in item.post_source && item.post_source.data != '') {
			if (item.post_source.data == 'profile_photo') {
				postMeta.appendChild(
					$create.elem(
						'div',
						'В сообществе обновилась фотография',
						'post-source'
					)
				)
			}
		}

		let postMetaTimeLink = $create.link(
			`https://${APP_CONFIG.vk.domain}/wall${authorID}_${item.post_id}`,
			timeRender(item.date),
			'',
			['e']
		)

		postMetaTime.appendChild(postMetaTimeLink)

		postMeta.appendChild(postMetaTime)

		postHeader.appendChild(authorImage)
		postHeader.appendChild(postMeta)

		postContent.appendChild(postHeader)

		if ('text' in item && item.text != '') {
			postContent.appendChild(
				$create.elem(
					'div',
					textRender({ text: item.text }),
					'text post-text'
				)
			)
		}

		if ('attachments' in item) {
			postContent.appendChild(
				attachmentsRender({
					attachments: item.attachments,
					postData: {
						postID: item.post_id,
						authorID: authorID
					}
				})
			)
		}

		postContent.appendChild(separatorLine)

		post.appendChild(postContent)

		feed.appendChild(post)
	})

	// TODO: сделать автоподгрузку новостей (настраиваемую)

	let feedLoadBtn = $make.qs('.load-btn')
	    feedLoadBtn.dataset.next = data.next_from
}
