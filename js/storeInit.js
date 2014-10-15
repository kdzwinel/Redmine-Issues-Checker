//create a storage object and load default settings
var settings = new Store("settings", {
	'redmineUrl': '',
	'showIssues': 'active',
	'apiKey':'',
	'userLogin': '',
	'userPassword': '',
	'iconPressUrl': '/my/page',
	'iconPressDontRedirect': false,
	
	'requestUrl': '',
	'updateDelayMinMS': 60000,

	'showNotifications': false,
	'notificationsTimeout': 5000,
	'notificationsType': 'standard',

	'notificationFieldAuthor': true,
	'notificationFieldTime': true,
	'notificationFieldProject': true,
	'notificationFieldPriority': false,
	'notificationFieldTracker': false
});