var iconAnimation;
var BADGE_COLOR_INACTIVE = [190, 190, 190, 230];
var BADGE_COLOR_ACTIVE = [208, 0, 24, 255];
var PLANIO_BADGE_COLOR_INACTIVE = [255, 255, 255, 50];
var PLANIO_BADGE_COLOR_ACTIVE = [87, 165, 189, 255];

//REQUEST VARIABLES
var requestFailureCount = 0;  // used for exponential backoff
var requestTimeout = 1000 * 5;  // 5 seconds
var requestTimeoutHandler = null;

//OTHER VARIABLES
var issuesCount = -1;
var issuesNewCount = -1;
var currentUserId = null;
var currentUserName = null;
var issuesIds = null;
var newIssueStack = []; //issues that just arrived

function init() {
	issuesCount = -1;
	issuesNewCount = -1;
	currentUserId = null;
	currentUserName = null;
	issuesIds = null;

	if (!iconAnimation) {
		iconAnimation = new IconAnimation({
			canvasObj: document.getElementById('canvas'),
			imageObj: document.getElementById('image'),
			defaultIcon: redmineUrlIsPlanio() ? "img/planio_logged_in.png" : "img/redmine_logged_in.png"
		});
	} else {
		iconAnimation.reset();
	}

	chrome.browserAction.setBadgeBackgroundColor({color: redmineUrlIsPlanio() ? PLANIO_BADGE_COLOR_ACTIVE : BADGE_COLOR_ACTIVE});
	iconAnimation.startLoading();

	startRequest();
}

function redmineUrlIsPlanio() {
  return getRedmineUrl().match(/^https:\/\/\w+\.plan\.io\//);
}

function getRedmineUrl() {
	var url = settings.get('redmineUrl');

	if (!url) {
		return null;
	}

	if (url.substr(-1) !== '/') {
		url += '/';
	}

	return url;
}

function getRedmineUpdateUrl() {
	if (!settings.get('requestUrl')) {
		return null;
	}

	return settings.get('requestUrl');
}

function isRedmineUrl(url) {
	var redmine = getRedmineUrl();

	return (url.indexOf(redmine) == 0);
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
	if (changeInfo.url && isRedmineUrl(changeInfo.url)) {
		startRequest();
	}
});

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function (tab) {
	goToRedmine();
});

function goToRedmine() {
	if (getRedmineUrl() == null) {
		return;
	}

	chrome.tabs.getAllInWindow(undefined, function (tabs) {
		var page = 'my/page';
		if (settings.get('iconPressUrl')) {
			page = settings.get('iconPressUrl');
			if (page.length > 0 && page.indexOf('/') == 0) {
				page = page.substring(1);
			}
		}

		for (var i = 0, tab; tab = tabs[i]; i++) {
			if (tab.url && isRedmineUrl(tab.url)) {
				var tabOptions = {selected: true};

				if (!settings.get('iconPressDontRedirect')) {
					tabOptions.url = getRedmineUrl() + page;
				}

				chrome.tabs.update(tab.id, tabOptions);
				return;
			}
		}

		chrome.tabs.create({url: getRedmineUrl() + page});
	});
}

function updateIssuesCount(allCount, newCount) {
	//if number off issues changed, do a flip
	if (
		(settings.get('showIssues') == 'active-new' && (issuesCount != allCount || issuesNewCount != newCount)) ||
		(settings.get('showIssues') == 'active' && issuesCount != allCount) ||
		(settings.get('showIssues') == 'new' && issuesNewCount != newCount)
	) {
		iconAnimation.flip();
	}

	issuesCount = allCount;
	issuesNewCount = newCount;

	chrome.browserAction.setBadgeBackgroundColor({color: redmineUrlIsPlanio() ? PLANIO_BADGE_COLOR_ACTIVE : BADGE_COLOR_ACTIVE});
	chrome.browserAction.setBadgeText({
		text: printIssuesCount()
	});
	chrome.browserAction.setTitle({'title': 'issues: ' + issuesCount + ' (' + newCount + ' new)'});
}

function printIssuesCount() {
	if (settings.get('showIssues') == 'active-new') {
		return issuesNewCount + ':' + issuesCount;
	}

	if (settings.get('showIssues') == 'new') {
		if (issuesNewCount != "0") {
			return issuesNewCount.toString();
		}
	}

	if (settings.get('showIssues') == 'active') {
		if (issuesCount != "0") {
			return issuesCount.toString();
		}
	}

	return "";
}

function countNewIssues(issuesObj) {
	var newIssues = 0;
	for (var i = 0; i < issuesObj.length; i++) {
		var issue = issuesObj[i];
		if (issue.status !== undefined && issue.status.id == 1) {//new
			newIssues++;
		}
	}

	return newIssues;
}

function showLoggedOut() {
	issuesCount = -1;
	issuesNewCount = -1;

	chrome.browserAction.setIcon({path: redmineUrlIsPlanio() ? "img/planio_not_logged_in.png" : "img/redmine_not_logged_in.png"});
	chrome.browserAction.setBadgeBackgroundColor({color: redmineUrlIsPlanio() ? BADGE_COLOR_INACTIVE : PLANIO_BADGE_COLOR_INACTIVE});
	chrome.browserAction.setBadgeText({text: "?"});
	chrome.browserAction.setTitle({'title': 'disconnected'});
}

//NOTIFICATIONS
function showNotificationOnNewIssue(issuesObj) {
	var newIssuesIds = [];
	for (var i = 0; i < issuesObj.length; i++) {
		var issue = issuesObj[i];
		newIssuesIds.push(issue.id);

		//check if issue is new (if id array exists)
		if (issuesIds != null && (issuesIds.indexOf(issue.id) == -1)) {

			//issue.author.name
			//issue.status.name
			//issue.project.name
			//issue.created_on
			//issue.updated_on

			NotificationsProxy.create(settings, issue, redmineUrlIsPlanio() ? "/img/planio_logo_128.png" : "/img/redmine_logo_128.png");
		}
	}

	issuesIds = newIssuesIds;
}

function setNewIssue(issue) {
	newIssueStack.push(issue);
}

function getNewIssue() {
	return newIssueStack.pop();
}

//AJAX REQUESTS
function startRequest() {
	//redmine url is set by user
	if (getRedmineUrl() != null) {
		//current user data are not loaded
		if (currentUserId == null) {
			getCurrentUser(
				function () {
					startRequest();
				},
				function () {
					iconAnimation.stopLoading();
					showLoggedOut();
					scheduleRequest();
				}
			);
		} else {
			getIssuesCount(
				function (allCount, newCount) {
					iconAnimation.stopLoading();
					updateIssuesCount(allCount, newCount);
					scheduleRequest();
				},
				function () {
					iconAnimation.stopLoading();
					if (requestFailureCount > 1) {
						showLoggedOut();
					}
					scheduleRequest();
				}
			);
		}
	} else {
		iconAnimation.stopLoading();
		showLoggedOut();
	}
}

function getCurrentUser(onSuccess, onError) {
	getJSON("users/current.json",
		function (json) {
			if (json.user) {
				currentUserName = json.user.firstname + ' ' + json.user.lastname;
				currentUserId = json.user.id;
				onSuccess();
			} else {
				onError();
			}
		},
		onError
	);
}

function getIssuesCount(onSuccess, onError) {
	var jsonRequestUrl = "";
	if (getRedmineUpdateUrl() != null) {
		jsonRequestUrl = getRedmineUpdateUrl();
	} else {
		jsonRequestUrl = "issues.json?assigned_to_id=" + currentUserId + "&limit=50";
	}
	getJSON(jsonRequestUrl,
		function (json) {
			if (json.issues != undefined && settings.get('showNotifications') == '1') {
				showNotificationOnNewIssue(json.issues);
			}
			if (json.total_count != undefined) {
				onSuccess(json.total_count, countNewIssues(json.issues));
			} else {
				onError();
			}
		},
		onError
	);
}

//REQUEST SCHEDULING AND SENDING
function scheduleRequest() {
	var randomness = Math.random() + 1;
	var exponent = Math.pow(2, requestFailureCount);
	var pollIntervalMin = settings.get('updateDelayMinMS');
	var pollIntervalMax = 1000 * 60 * 60;//1 hour
	var delay = Math.min(randomness * pollIntervalMin * exponent, pollIntervalMax);
	delay = Math.round(delay);

	if (requestTimeoutHandler != null) {
		window.clearTimeout(requestTimeoutHandler);
	}

	requestTimeoutHandler = window.setTimeout(startRequest, delay);
}

function getJSON(url, onSuccess, onError) {
	var xhr = new XMLHttpRequest();

	var abortTimerId = window.setTimeout(function () {
		xhr.abort();  // synchronously calls onreadystatechange
	}, requestTimeout);

	function handleSuccess(jsonObj) {
		requestFailureCount = 0;
		window.clearTimeout(abortTimerId);
		if (onSuccess)
			onSuccess(jsonObj);
	}

	function handleError() {
		++requestFailureCount;
		window.clearTimeout(abortTimerId);
		if (onError)
			onError();
	}

	try {
		xhr.onreadystatechange = function () {
			if (xhr.readyState != 4)
				return;

			if (xhr.responseText) {
				var jsonDoc = xhr.responseText;

				if (jsonDoc != undefined && jsonDoc.trim().length > 0) {
					try {
						jsonObj = JSON.parse(jsonDoc);
					} catch (e) {
						handleError();
						return;
					}

					if (jsonObj) {
						handleSuccess(jsonObj);
						return;
					}
				}
			}

			handleError();
		};

		xhr.onerror = function (error) {
			handleError();
		};

		xhr.open("GET", getRedmineUrl() + url, true);

		//attach authorization credentials if available
		if (settings.get('apiKey')) {
			var apiKeyHash = Base64.encode(settings.get('apiKey') + ':random');
			xhr.setRequestHeader('Authorization', "Basic " + apiKeyHash);
		} else if (settings.get('userLogin') && settings.get('userPassword')) {
			var loginPasswordHash = Base64.encode(settings.get('userLogin') + ':' + settings.get('userPassword'));
			xhr.setRequestHeader('Authorization', "Basic " + loginPasswordHash);
		}

		xhr.send(null);
	} catch (e) {
		console.error('Exception: ' + e);
		handleError();
	}
}

//call init on window load
window.onload = init;