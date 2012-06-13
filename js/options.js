var redmineUrlTextbox, redmineUpdateUrlTextbox, showActiveIssues, showNewIssues, showActiveNewIssues, iconPressUrl, iconPressDontRedirect;
var userLogin, userPassword;
var showNotifications, notificationsType, notificationsTimeout, notificationFieldsDiv, notificationFields, notificationColors;
var saveButton;

init();

function init() {
	redmineUrlTextbox = document.getElementById("redmine-url");
	redmineUpdateUrlTextbox = document.getElementById("redmine-update-url");

	updateDelayMinSec = document.getElementById("update-delay-min");
	updateDelayMaxSec = document.getElementById("update-delay-max");
	
	showActiveIssues = document.getElementById("issues-active");
	showNewIssues = document.getElementById("issues-new");
	showActiveNewIssues = document.getElementById("issues-active-new");

	userLogin = document.getElementById("user-login");
	userPassword = document.getElementById("user-password");

	showNotifications = document.getElementById("notifications-show");
	notificationsType = {
		'standard': document.getElementById("notifications-type-standard"),
		'extended': document.getElementById("notifications-type-extended"),
	};

	notificationColors = {
		'bg': document.getElementById("notification-colors-bg"),
		'text': document.getElementById("notification-colors-text"),
		'link': document.getElementById("notification-colors-link"),
	}

	notificationsTimeout = document.getElementById("notifications-timeout");

	notificationFieldsDiv = document.getElementById("notification-fields-div");
	notificationFields = {
		'author': document.getElementById("notification-field-author"),
		'time': document.getElementById("notification-field-time"),
		'project': document.getElementById("notification-field-project"),
		'priority': document.getElementById("notification-field-priority"),
		'tracker': document.getElementById("notification-field-tracker")
	};

	iconPressUrl = {
		'myPage': document.getElementById("icon-press-url-my-page"),
		'home': document.getElementById("icon-press-url-home"),
		'custom': document.getElementById("icon-press-url-custom"),
		'customText': document.getElementById("icon-press-url-custom-text")
	}

	iconPressDontRedirect = document.getElementById("icon-press-dont-redirect");

	saveButton = document.getElementById("save-button");

	loadDefaults();
	markClean();
}

function loadDefaults()
{
	redmineUrlTextbox.value = localStorage.redmineUrl || "";
	redmineUpdateUrlTextbox.value = localStorage.redmineUpdateUrl || "";
	updateDelayMinSec.value = localStorage.updateDelayMinMS / 1000 || 60;
	updateDelayMaxSec.value = localStorage.updateDelayMaxMS / 1000 || 60 * 60;

	showActiveIssues.checked = false;
	showNewIssues.checked = false;
	showActiveNewIssues.checked = false;

	if(localStorage.showIssues == 'active' || !localStorage.showIssues) {
		showActiveIssues.checked = true;
	} else if(localStorage.showIssues == 'new') {
		showNewIssues.checked = true;
	} else if(localStorage.showIssues == 'active-new') {
		showActiveNewIssues.checked = true;
	}

	if(localStorage.userLogin){
		userLogin.value = localStorage.userLogin;
	}

	if(localStorage.userPassword) {
		userPassword.value = localStorage.userPassword;
	}

	if(localStorage.iconPressUrl == '/my/page' || !localStorage.iconPressUrl) {
		iconPressUrl.myPage.checked = true;
	} else if(localStorage.iconPressUrl == '/') {
		iconPressUrl.home.checked = true;
	} else {
		iconPressUrl.custom.checked = true;
		iconPressUrl.customText.value = localStorage.iconPressUrl;
	}

	iconPressDontRedirect.checked = (localStorage.iconPressDontRedirect == '1');

	//notifications
	showNotifications.checked = (localStorage.showNotifications == '1');

	if(!localStorage.notificationsType || localStorage.notificationsType == 'standard') {
		notificationsType.standard.checked = true;
		notificationsType.extended.checked = false;

		notificationFieldsDiv.style.display = 'none';
	} else if (localStorage.notificationsType == 'extended') {
		notificationsType.standard.checked = false;
		notificationsType.extended.checked = true;

		notificationFieldsDiv.style.display = 'block';
	}

	notificationColors.bg.value = localStorage.notificationBgColor || 'white';
	notificationColors.text.value = localStorage.notificationTextColor || 'black';
	notificationColors.link.value = localStorage.notificationLinkColor || '#961b25';

	notificationFields.author.checked = (localStorage.notificationFieldAuthor == '1' || !localStorage.notificationFieldAuthor);
	notificationFields.time.checked = (localStorage.notificationFieldTime == '1' || !localStorage.notificationFieldTime);
	notificationFields.project.checked = (localStorage.notificationFieldProject == '1' || !localStorage.notificationFieldProject);
	notificationFields.priority.checked = (localStorage.notificationFieldPriority == '1');
	notificationFields.tracker.checked = (localStorage.notificationFieldTracker == '1');


	if(localStorage.notificationsTimeout) {
		notificationsTimeout.value = localStorage.notificationsTimeout;
	}
}

function toggleNotificationFields() {
	if(notificationsType.standard.checked) {
		notificationFieldsDiv.style.display = 'none';
	} else if (notificationsType.extended.checked) {
		notificationFieldsDiv.style.display = 'block';
	}

	markDirty();
}

function save() {
	var newUrl = redmineUrlTextbox.value;
	var updateUrl = redmineUpdateUrlTextbox.value;

	if( !isUrl(newUrl) ) {
		loadDefaults();
		markClean();
		alert('Invalid redmine url.');
		return false;
	}

	if(newUrl.charAt(newUrl.length-1) != '/') {
		newUrl += '/';
	}

	if(showNewIssues.checked) {
		localStorage.showIssues = 'new';
	} else if(showActiveIssues.checked) {
		localStorage.showIssues = 'active';
	} else if(showActiveNewIssues.checked) {
		localStorage.showIssues = 'active-new';
	}

	localStorage.userLogin = userLogin.value;
	localStorage.userPassword = userPassword.value;

	if(iconPressUrl.myPage.checked) {
		localStorage.iconPressUrl = iconPressUrl.myPage.value;
	} else if(iconPressUrl.home.checked) {
		localStorage.iconPressUrl = iconPressUrl.home.value;
	} else if(iconPressUrl.custom.checked) {
		var url = iconPressUrl.customText.value;
		if(url.length == 0 && url.indexOf('/') != 0) {
			loadDefaults();
			markClean();
			alert('Invalid `icon pressed` custom url.');
			return false;
		}

		localStorage.iconPressUrl = url;
	}

	localStorage.iconPressDontRedirect = (iconPressDontRedirect.checked)?'1':'0';

	//notifications
	localStorage.showNotifications = (showNotifications.checked)?'1':'0';

	if(notificationsType.standard.checked) {
		localStorage.notificationsType = 'standard';
	} else if (notificationsType.extended.checked) {
		localStorage.notificationsType = 'extended';
	}

	localStorage.notificationBgColor = notificationColors.bg.value;
	localStorage.notificationTextColor = notificationColors.text.value;
	localStorage.notificationLinkColor = notificationColors.link.value;

	localStorage.notificationFieldAuthor = (notificationFields.author.checked)?'1':'0';
	localStorage.notificationFieldTime = (notificationFields.time.checked)?'1':'0';
	localStorage.notificationFieldProject = (notificationFields.project.checked)?'1':'0';
	localStorage.notificationFieldPriority = (notificationFields.priority.checked)?'1':'0';
	localStorage.notificationFieldTracker = (notificationFields.tracker.checked)?'1':'0';

	var newTimeout = parseInt(notificationsTimeout.value);
	if(newTimeout < 2 || newTimeout > 60) {
		loadDefaults();
		markClean();
		alert('Invalid notifications timeout.');
		return false;
	}

	localStorage.notificationsTimeout = newTimeout;
	localStorage.updateDelayMinMS = parseInt(updateDelayMinSec.value) * 1000;
	localStorage.updateDelayMaxMS = parseInt(updateDelayMaxSec.value) * 1000;

	localStorage.redmineUrl = newUrl;
	localStorage.redmineUpdateUrl = updateUrl;
	markClean();

	chrome.extension.getBackgroundPage().init();
}

function markDirty() {
	saveButton.disabled = false;
}

function markClean() {
	saveButton.disabled = true;
}

var notification;
var notificationTimeout;

function testNotification() {
	save();

	if(notification) {
		notification.cancel();
		clearTimeout(notificationTimeout);
	}

	var now = new Date();
	var issue = {
		subject: 'Test subject: Lorem ipsum dolor sit amet',
		id: 123,
		description: 'Test description: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris venenatis, magna non elementum faucibus, nisi nibh ultricies arcu, vitae sagittis purus erat eget leo. Donec magna lectus, consectetur vitae molestie at, laoreet id dui. Sed molestie egestas erat, et ullamcorper eros rhoncus sit amet. ',
		project: {id:123, name:'Test project'},
		author: {id:123, name:'Test Author'},
		created_on: now.getFullYear() + '/' + (now.getMonth()+1) + '/' + now.getDate() +' 06:00:00 +0200',
		tracker: {name: 'Bug'},
		priority: {name: 'Normal'}
	};

	if(localStorage.notificationsType == 'standard') {
		notification = webkitNotifications.createNotification(
			'img/redmine_logo_128.png',  // icon url - can be relative
			'"' + issue.subject + '" by ' + issue.author.name,  // notification title
			issue.description  // notification body text
		);
	} else {
		notification = webkitNotifications.createHTMLNotification(
			'notification.html'
		);

		chrome.extension.getBackgroundPage().setNewIssue(issue);
	}

	notification.show();

	notificationTimeout = window.setTimeout(function(notification){
				notification.cancel();
	}, localStorage.notificationsTimeout * 1000, notification);
}

function isUrl(s) {
	var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
	return regexp.test(s);
}