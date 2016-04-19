var db;

$(function() {
	var code = $('code');

	setupEditor();
	migrate();
	setupEnv();

	$('.new').click(function(e) {
		e.preventDefault();

		drawTab('New Tab');
	});

	$('.nav').on('click', '.delete-tab', function(e) {
		e.preventDefault();

		$(this).closest('li').remove();
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
		switcher = $('.switcher'),
		converter = new Showdown.converter();

	drawTabs();
	var activeTabId = setTabActive();

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

function drawTabContent(tabId) {
	var tabData = getTabData(tabId),
		converter = new Showdown.converter(),
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

function drawTab(tabId, persistant) {
	var tabEl = $('.tab-template.hide').clone(),
		tabData = getTabData(tabId);

	if (persistant) {
		tabEl.find('.delete-tab').remove();
	}

	tabEl
		.removeClass('tab-template')
		.removeClass('hide')
		.addClass('tab')
		.find('a').attr({
			'href': '#' + tabData.name,
			'data-id': tabId,
			'title': tabData.content
		});

	tabEl.find('.tab-name-input').val(tabData.name);

	$('.tabs').append(tabEl);
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

function setTabActive() {
	var firstTab = $('.tab').eq(0);
	firstTab.addClass('active');

	return firstTab.find('a').attr('data-id');
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
		localStorage.setItem('content', 'Don\'t make me think...');
	}
}
