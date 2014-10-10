function testNotification() {
	var settings = new Store("settings");
	var now = new Date();
	var issue = {
		subject: 'Test subject: Lorem ipsum dolor sit amet',
		id: 123,
		description: 'Test description: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris venenatis, magna non elementum faucibus, nisi nibh ultricies arcu, vitae sagittis purus erat eget leo. Donec magna lectus, consectetur vitae molestie at, laoreet id dui. Sed molestie egestas erat, et ullamcorper eros rhoncus sit amet. ',
		project: {id: 123, name: 'Test project'},
		author: {id: 123, name: 'Test Author'},
		created_on: now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate() + ' 06:00:00 +0200',
		tracker: {name: 'Bug'},
		priority: {name: 'Normal'}
	};

	NotificationsProxy.create(settings, issue);
}

var reloadTimeout;
function reloadBackground() {
	if (reloadTimeout) {
		window.clearTimeout(reloadTimeout);
	}
	//to prevent reloading after each key stroke
	reloadTimeout = window.setTimeout(function () {
		chrome.extension.getBackgroundPage().init();
	}, 1000);
}

window.addEvent("domready", function () {
	var settings = new FancySettings("Redmine Issues Checker", "../../img/redmine_logo_128.png");

	//General
	var redmineUrl = settings.create({
		"tab": i18n.get("General"),
		"group": i18n.get("URL"),
		"name": "redmineUrl",
		"type": "text",
		"label": i18n.get("Enter your redmine base URL:"),
		"text": "http://redmine.example.com",
		"afterSave": reloadBackground
	});

	var authDesc = settings.create({
		"tab": i18n.get("General"),
		"group": i18n.get("Authentication"),
		"name": "authDesc",
		"type": "description",
		"text": i18n.get("Please provide API key *or* login credentials. Extension will only work if REST API is enabled by your Redmine administrator (Administration &raquo; Settings &raquo; Authentication).")
	});

	var apiKey = settings.create({
		"tab": i18n.get("General"),
		"group": i18n.get("Authentication"),
		"name": "apiKey",
		"type": "text",
		"label": i18n.get("API key:"),
		"masked": true,
		"afterSave": reloadBackground
	});

	var userLogin = settings.create({
		"tab": i18n.get("General"),
		"group": i18n.get("Authentication"),
		"name": "userLogin",
		"type": "text",
		"label": i18n.get("Login:"),
		"afterSave": reloadBackground
	});

	var userPassword = settings.create({
		"tab": i18n.get("General"),
		"group": i18n.get("Authentication"),
		"name": "userPassword",
		"type": "password",
		"label": i18n.get("Password:"),
		"masked": true,
		"afterSave": reloadBackground
	});

	var showIssues = settings.create({
		"tab": i18n.get("General"),
		"group": i18n.get("Issues"),
		"name": "showIssues",
		"type": "radioButtons",
		"label": i18n.get("Show number of issues:"),
		"options": [
			["active", i18n.get("active")],
			["new", i18n.get("new")],
			["active-new", i18n.get("new and active (eg \"2:10\")")]
		],
		"afterSave": reloadBackground
	});

	var iconPressUrl = settings.create({
		"tab": i18n.get("General"),
		"group": i18n.get("Toolbar icon"),
		"name": "iconPressUrl",
		"type": "text",
		"label": i18n.get("When pressed go to:"),
		"text": "/my/page"
	});

	var iconPressDontRedirect = settings.create({
		"tab": i18n.get("General"),
		"group": i18n.get("Toolbar icon"),
		"name": "iconPressDontRedirect",
		"type": "checkbox",
		"label": i18n.get("If redmine tab is already open, select it, but don't redirect it")
	});

	//NOTIFICATIONS
	var showNotifications = settings.create({
		"tab": i18n.get("Notifications"),
		"group": i18n.get("General"),
		"name": "showNotifications",
		"type": "checkbox",
		"label": i18n.get("Display notifications when new issues arrive")
	});

	var notificationsTimeout = settings.create({
		"tab": i18n.get("Notifications"),
		"group": i18n.get("General"),
		"name": "notificationsTimeout",
		"type": "slider",
		"label": "Display notifications for:",
		"max": 181000,
		"min": 1000,
		"step": 5000,
		"display": true,
		"displayModifier": function (value) {
			return (value / 1000).floor() + " sec";
		}
	});

	var notificationsType = settings.create({
		"tab": i18n.get("Notifications"),
		"group": i18n.get("General"),
		"name": "notificationsType",
		"type": "radioButtons",
		"label": i18n.get("Notifications to use:"),
		"options": [
			["standard", i18n.get("standard (default Chrome notifications)")],
			["extended", i18n.get("extended (styled notifications with clickable links and more options)")]
		]
	});

	var notificationFieldAuthor = settings.create({
		"tab": i18n.get("Notifications"),
		"group": i18n.get("Extended Notifications Options"),
		"name": "notificationFieldAuthor",
		"type": "checkbox",
		"label": i18n.get("Show issue author")
	});

	var notificationFieldTime = settings.create({
		"tab": i18n.get("Notifications"),
		"group": i18n.get("Extended Notifications Options"),
		"name": "notificationFieldTime",
		"type": "checkbox",
		"label": i18n.get("Show issue creation date")
	});

	var notificationFieldProject = settings.create({
		"tab": i18n.get("Notifications"),
		"group": i18n.get("Extended Notifications Options"),
		"name": "notificationFieldProject",
		"type": "checkbox",
		"label": i18n.get("Show issue project name")
	});

	var notificationFieldPriority = settings.create({
		"tab": i18n.get("Notifications"),
		"group": i18n.get("Extended Notifications Options"),
		"name": "notificationFieldPriority",
		"type": "checkbox",
		"label": i18n.get("Show issue priority (eg \"Normal\", \"Urgent\")")
	});

	var notificationFieldTracker = settings.create({
		"tab": i18n.get("Notifications"),
		"group": i18n.get("Extended Notifications Options"),
		"name": "notificationFieldTracker",
		"type": "checkbox",
		"label": i18n.get("Show issue tracker (eg \"Bug\", \"Feature\")")
	});

	var notificationBgColor = settings.create({
		"tab": i18n.get("Notifications"),
		"group": i18n.get("Extended Notifications Options"),
		"name": "notificationBgColor",
		"type": "text",
		"label": i18n.get("Notification background color:"),
		"text": "gray or #aacf00 or rgb(200, 100, 50)"
	});

	var notificationTextColor = settings.create({
		"tab": i18n.get("Notifications"),
		"group": i18n.get("Extended Notifications Options"),
		"name": "notificationTextColor",
		"type": "text",
		"label": i18n.get("Notification text color:"),
		"text": "gray or #aacf00 or rgb(200, 100, 50)"
	});

	var notificationLinkColor = settings.create({
		"tab": i18n.get("Notifications"),
		"group": i18n.get("Extended Notifications Options"),
		"name": "notificationLinkColor",
		"type": "text",
		"label": i18n.get("Notification links color:"),
		"text": "gray or #aacf00 or rgb(200, 100, 50)"
	});

	settings.create({
		"tab": i18n.get("Notifications"),
		"group": i18n.get("Test"),
		"name": "test_notification",
		"type": "description",
		"text": "<button id='testNotificationBtn'>" + i18n.get("Test notification") + "</button>"
	});

	//ADVANCED
	var requestUrl = settings.create({
		"tab": i18n.get("Advanced"),
		"group": i18n.get("Request URL"),
		"name": "requestUrl",
		"type": "text",
		"label": i18n.get("Enter custom request URL (or leave it empty to use default one):"),
		"text": "issues.json?query_id=6",
		"afterSave": reloadBackground
	});

	var updateDelayMinMS = settings.create({
		"tab": i18n.get("Advanced"),
		"group": i18n.get("Update delay"),
		"name": "updateDelayMinMS",
		"type": "slider",
		"label": "Minimal delay:",
		"max": 600000,
		"min": 10000,
		"step": 10000,
		"display": true,
		"displayModifier": function (value) {
			return (value / 1000).floor() + " sec";
		}
	});

	//ABOUT
	settings.create({
		"tab": i18n.get("About"),
		"group": i18n.get("Source code"),
		"name": "sourceCode",
		"type": "description",
		"text": "Fork the code, report bugs and request the features via <a href='https://github.com/kdzwinel/Redmine-Issues-Checker'>Github</a>."
	});

	settings.create({
		"tab": i18n.get("About"),
		"group": i18n.get("Used projects"),
		"name": "usedProjects",
		"type": "description",
		"text": "<ul>\
		<li><a href='https://github.com/frankkohlhepp/fancy-settings'>Fancy-settings</a></li>\
		<li><a href='https://chrome.google.com/webstore/detail/mihcahmgecmbnbcchbopgniflfhgnkff'>Google Mail Checker</a> - icon animation, request handling</li>\
		<li><a href='http://www.webtoolkit.info/'>Base64 encode / decode</a></li>\
		</ul>"
	});

	settings.create({
		"tab": i18n.get("About"),
		"group": i18n.get("Author"),
		"name": "author",
		"type": "description",
		"text": "<a href='mailto:kdzwinel@gmail.com'>Konrad Dzwinel</a>"
	});

	settings.create({
		"tab": i18n.get("About"),
		"group": i18n.get("Thanks to"),
		"name": "thanks_to",
		"type": "description",
		"text": "<a href='https://github.com/Regul777'>Dima Yakovenko</a> - custom request URL, custom update delay"
	});

	document.getElementById('testNotificationBtn').onclick = testNotification;
});

