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

	let textRender = text => {
		let tmp = text

		tmp = tmp.replace(/\n/g, '<br>')

		tmp = Autolinker.link(tmp)

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

	let separatorLine = $create.elem('div', '', 'separator-line')

	items.forEach(item => {
		let post = $create.elem('div', '', 'post block')

		post.dataset.type = item.type

		let postContent = $create.elem('div', '', 'block-content')

		let postHeader = $create.elem('div', '','post-header')

		let author = Math.sign(item.source_id) == 1
			? profiles[item.source_id]
			: groups[Math.abs(item.source_id)]

		console.log(author)

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
			`https://${APP_CONFIG.vk.domain}/wall${author.id}_${item.post_id}`,
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
					textRender(item.text),
					'post-text'
				)
			)
		}

		post.appendChild(postContent)

		feed.appendChild(post)
	})

	let feedLoadBtn = $make.qs('.load-btn')
		feedLoadBtn.dataset.next = data.next_from
}
