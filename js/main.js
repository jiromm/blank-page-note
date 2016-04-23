var converter = new Showdown.converter(),

	NEW_TAB_NAME = 'New Tab',
	NEW_TAB_CONTENT = 'Don\'t make me think...';

$(function() {
	var code = $('code');

	setupEditor();
	migrate();
	setupEnv();

	$('.new').click(function(e) {
		e.preventDefault();

		drawNewTab(NEW_TAB_NAME, NEW_TAB_CONTENT);
	});

	$('.nav').on('click', '.delete-tab', function(e) {
		e.preventDefault();

		$(this).closest('li').remove();
	});

	$('.tab-name-input').on('input change', function(e) {
		saveTabName($(this).closest('a').attr('data-id'), $(this).val());
	});

	$('.tabs').on('click', '.tab-el', function (e) {
		e.preventDefault();

		switchTab($(this));
	});

	// to force focus and change css style
	code.attr('tabindex', 0);

	// Select and copy on click
	code.oneClickSelect();
});

$.fn.oneClickSelect = function() {
	return $(this).on('click', function() {
		var range, selection;

		selection = window.getSelection();
		range = document.createRange();
		range.selectNodeContents(this);
		selection.removeAllRanges();
		selection.addRange(range);

		// Copy to clipboard
		document.execCommand('copy');
	});
};

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
	);

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
		'href': '#' + tabName.replace(' ', '_').toLowerCase(),
		'data-id': tabId,
	});

	tabEl.find('.tab-name-input').val(tabName);

	$('.tabs').append(tabEl);

	return tabEl;
}

function getNextTabId() {
	var data = JSON.parse(localStorage.data),
		maxId = 0;

	for (var id in data) {
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
	$('.preview').html(converter.makeHtml(tabContent));

	$('.tabs > li').removeClass('active');
	tabEl.addClass('active');
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
	$(window).resize(function() {
		$('.source').css({
			height: (window.innerHeight - 53) + 'px'
		});
	}).trigger('resize');

	if (!localStorage.hasOwnProperty('v')) {
		localStorage.setItem('v', 1);
	}

	if (!localStorage.hasOwnProperty('content')) {
		localStorage.setItem('content', NEW_TAB_CONTENT);
	}
}
