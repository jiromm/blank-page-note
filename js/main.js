// TODO Use https://developer.chrome.com/extensions/storage as a storage

var converter = new Showdown.converter(),
	NEW_TAB_NAME = 'New Tab Name',
	NEW_TAB_CONTENT = 'Don\'t make me think...';

$(function () {
	var code = $('code'),
		nav = $('.nav'),
		linksModal = $('#links-modal');

	setupEditor();
	migrate();
	setupEnv();

	$('.new').click(function (e) {
		e.preventDefault();

		if ($('.tab').length == 5) {
			return;
		}

		drawNewTab(NEW_TAB_NAME, NEW_TAB_CONTENT);
	});

	nav.on('click', '.delete-tab', function (e, force) {
		e.preventDefault();

		if (force) {
			deleteTab($(this).closest('li'));
		}
	});

	linksModal.on('click', '.delete-link', function (e) {
		e.preventDefault();

		$(this).closest('.form-group').remove();
	});

	nav.on('input change', '.tab-name-input', function () {
		saveTabName($(this).closest('a').attr('data-id'), $(this).val());
	});

	$('.tabs').on('click', '.tab', function (e) {
		e.preventDefault();

		if ($(e.target).hasClass('delete-tab')) {
			return;
		}

		switchTab($(this));
	});

	$('.add-new-link').on('click', function (e) {
		e.preventDefault();

		drawNewLinkInput();
	});

	$(document).on('click', 'code', function () {
		var range, selection;

		selection = window.getSelection();
		range = document.createRange();
		range.selectNodeContents($(this)[0]);
		selection.removeAllRanges();
		selection.addRange(range);

		// Copy to clipboard
		document.execCommand('copy');
	});

	$('#generic-modal').on('show.bs.modal', function (e) {
		var deleteBtn = $('.delete-tab-confirm'),
			button = $(e.relatedTarget),
			modal = $(this),
			tabName = button.closest('.tab').find('.tab-name-input').val();

		modal.find('.tab-name').text(tabName);

		deleteBtn.off('click');
		deleteBtn.on('click', function () {
			button.trigger('click', [true]);
		});
	});

	linksModal.on('show.bs.modal', function (e) {
		var links = JSON.parse(localStorage.getItem('links'));

		if (!links.length) {
			$(this).find('.add-new-link').trigger('click');
		}
	});

	$('.save-links').on('click', function (e) {
		e.preventDefault();

		saveLinks();
	});

	// to force focus and change css style
	code.attr('tabindex', 0);

	drawLinkInputs();
	drawLinks();
});

function drawLinks() {
	var links = JSON.parse(localStorage.getItem('links'));

	$('.link-item').remove();

	if (links.length) {
		for (var i in links) {
			if (links.hasOwnProperty(i)) {
				drawNewLink(links[i]['name'], links[i]['url']);
			}
		}
	}
}

function drawNewLink(linkName, linkUrl) {
	var linkItem = $('.link-template').clone();

	linkItem
		.removeClass('link-template')
		.removeClass('hide')
		.addClass('link-item');

	linkItem.find('a')
		.attr('href', linkUrl)
		.text(linkName);

	$('.links').append(linkItem);
}

function drawLinkInputs() {
	if (!localStorage.hasOwnProperty('links')) {
		localStorage.setItem('links', JSON.stringify([]));
	}

	var links = JSON.parse(localStorage.getItem('links'));

	if (links.length) {
		for (var i in links) {
			if (links.hasOwnProperty(i)) {
				drawNewLinkInput(links[i]['name'], links[i]['url']);
			}
		}
	}
}

function drawNewLinkInput(name, url) {
	var linkTemplate = $('.link-input-template').clone();

	linkTemplate
		.removeClass('hide')
		.removeClass('link-input-template')
		.addClass('link-group-item');

	if (name) {
		linkTemplate.find('.link-name').val(name);
	}

	if (url) {
		linkTemplate.find('.link-url').val(url);
	}

	$('.link-group').append(
		linkTemplate
	);

	activateSortableLinks();
}

function saveLinks() {
	var links = [],
		linkGroupItems = $('.link-group-item'),
		linkName,
		linkUrl;

	linkGroupItems.each(function () {
		linkName = $(this).find('.link-name').val();
		linkUrl = $(this).find('.link-url').val();

		if (linkName && linkUrl) {
			links.push({
				name: linkName,
				url: linkUrl
			});
		}
	});

	localStorage.setItem('links', JSON.stringify(links));

	linksModal.modal('hide');
	drawLinks();
}

function setupEnv() {
	var editor = $('.editor'),
		source = $('.source'),
		preview = $('.preview'),
		switcher = $('.switcher');

	drawTabs();
	var activeTabId = setFirstTabActive();

	if (drawTabContent(activeTabId)) {
		source.keyup(function () {
			var tabContentSource = source.val(),
				tabContentPreview = converter.makeHtml(tabContentSource),
				tabId = $('.tabs li.active a').attr('data-id');

			saveTabContent(tabId, tabContentSource);
			preview.html(tabContentPreview);
			preview.find('code').attr('tabindex', 1);
		});

		switcher.on('click', function (e) {
			e.preventDefault();

			if (switcher.text() == 'Enable') {
				editor.addClass('active');
				source.trigger('input');
				switcher.text('Disable');
			} else {
				editor.removeClass('active');
				switcher.text('Enable');
			}
		});
	}
}

function saveTabContent(tabId, tabContent) {
	var tabsData = JSON.parse(localStorage.getItem('data'));

	tabsData[tabId]['content'] = tabContent;
	localStorage.setItem('data', JSON.stringify(tabsData));
}

function saveTabName(tabId, tabName) {
	var tabsData = JSON.parse(localStorage.getItem('data'));

	tabsData[tabId]['name'] = tabName;
	localStorage.setItem('data', JSON.stringify(tabsData));
}

function drawTabContent(tabId) {
	var tabData = getTabData(tabId),
		tabContentMd = tabData.content;

	if (tabData === false) {
		alert('Cannot draw a tab with id #' + tabId);

		return false;
	}

	$('.source').val(tabContentMd);
	$('.preview').html(
		converter.makeHtml(
			converter.makeHtml(tabContentMd)
		)
	).find('code').attr('tabindex', 1);

	return true;
}

function drawTabs() {
	var data = JSON.parse(localStorage.getItem('ids'));

	for (var index in data) {
		if (data.hasOwnProperty(index)) {
			drawTab(data[index], index == 0);
		}
	}
}

function saveNewTabData(tabId, tabName, tabContent) {
	var tabData = JSON.parse(localStorage.getItem('data')),
		idList = JSON.parse(localStorage.getItem('ids'));

	idList.push(tabId);
	tabData[tabId] = {
		name: tabName,
		content: tabContent
	};

	localStorage.setItem('ids', JSON.stringify(idList));
	localStorage.setItem('data', JSON.stringify(tabData));
}

function drawTab(tabId, isPersistant) {
	var tabData = getTabData(tabId),
		tabName = tabData.name;

	drawTabElement(tabId, tabName, isPersistant);
}

function drawNewTab(tabName, tabContent) {
	var tabId = getNextTabId(),
		tabEl;

	tabEl = drawTabElement(tabId, tabName, false);

	saveNewTabData(tabId, tabName, tabContent);
	switchTab(tabEl);
}

function drawTabElement(tabId, tabName, isPersistant) {
	var tabEl = $('.tab-template.hide').clone(),
		aEl;

	if (isPersistant) {
		tabEl.find('.delete-tab').remove();
	}

	tabEl
		.removeClass('tab-template')
		.removeClass('hide')
		.addClass('tab');

	aEl = tabEl.find('a');
	aEl.attr({
		'data-name': '#' + tabName.replace(' ', '_').toLowerCase(),
		'data-id': tabId,
	});

	tabEl.find('.tab-name-input').val(tabName);

	$('.tabs').append(tabEl);

	return tabEl;
}

function getNextTabId() {
	var data = JSON.parse(localStorage.data),
		maxId = 0,
		id;

	for (id in data) {
		id = parseInt(id);

		if (id > maxId) {
			maxId = id;
		}
	}

	return ++maxId;
}

function getTabData(tabId) {
	var tabData = JSON.parse(localStorage.getItem('data'));

	if (tabData.hasOwnProperty(tabId)) {
		return tabData[tabId];
	}

	removeTabId(tabId);

	return false;
}

function removeTabId(tabId) {
	var tabIdList = JSON.parse(localStorage.getItem('ids'));

	for (var id in tabIdList) {
		if (id == tabId) {
			delete tabIdList[tabId];
		}
	}
}

function setFirstTabActive() {
	var firstTab = $('.tab').eq(0);
	firstTab.addClass('active');

	return firstTab.find('a').attr('data-id');
}

function switchTab(tabEl) {
	var tabData = JSON.parse(localStorage.getItem('data')),
		tabId = parseInt(tabEl.find('a').attr('data-id')),
		tabContent = tabData[tabId]['content'];

	$('.source').val(tabContent);
	$('.preview')
		.html(converter.makeHtml(tabContent))
		.find('code').attr('tabindex', 1);

	$('.tabs > li').removeClass('active');
	tabEl.addClass('active');
}

function deleteTab(tabEl) {
	var idList = JSON.parse(localStorage.getItem('ids')),
		tabId = parseInt(tabEl.find('a').attr('data-id'));

	for (var i = 0; i < idList.length; i++) {
		if (idList[i] == tabId) {
			idList.splice(i, 1);
			break;
		}
	}

	localStorage.setItem('ids', JSON.stringify(idList));
	tabEl.remove();

	setTimeout(function () {
		switchTab($('.tab').eq(0));
	}, 1);
}

function migrate() {
	if (localStorage.getItem('v') == 1) {
		localStorage.setItem('data', JSON.stringify({
			1: {
				name: 'General',
				content: localStorage.getItem('content')
			}
		}));
		localStorage.setItem('ids', JSON.stringify([1]));
	}

	if (localStorage.hasOwnProperty('account')) {
		localStorage.removeItem('account');
	}

	localStorage.removeItem('content');
	localStorage.setItem('v', 2);
}

function setupEditor() {
	$(window).resize(function () {
		$('.source').css({
			height: (window.innerHeight - 123) + 'px'
		});
	}).trigger('resize');

	if (!localStorage.hasOwnProperty('v')) {
		localStorage.setItem('v', 1);
	}

	if (!localStorage.hasOwnProperty('content')) {
		localStorage.setItem('content', NEW_TAB_CONTENT);
	}
}

function activateSortableLinks() {
	$('.link-group')
		.sortable('destroy')
		.sortable({
			handle: '.sort-handler',
			placeholderClass: 'link-group-item-placeholder'
		});
}

let storageDarkMode = localStorage.getItem('Dark Mode On/Off');
let checkbox = document.querySelector("input[id=darkMode]");
let darkModeCss = document.getElementById("darkModeCss");

if (typeof storageDarkMode == undefined) {
	storageDarkMode = false;
	darkModeCss.disabled = true;
	checkbox.checked = false;
} else if (storageDarkMode == "on") {
	storageDarkMode = true;
	darkModeCss.disabled = false;
	checkbox.checked = true;
} else {
	storageDarkMode = false;
	darkModeCss.disabled = true;
	checkbox.checked = false;
};


checkbox.addEventListener('change', function () {
	if (this.checked) {
		localStorage.setItem('Dark Mode On/Off', "on")
		darkModeCss.disabled = false;

	} else {
		localStorage.setItem('Dark Mode On/Off', "off")
		darkModeCss.disabled = true;
	}
});