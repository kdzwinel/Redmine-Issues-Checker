//create a storage object and load default settings
var settings = new Store("settings", {
	'redmineUrl': '',
	'showIssues': 'active',
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
	'notificationFieldTracker': false,

	'notificationBgColor': 'white',
	'notificationTextColor': 'black',
	'notificationLinkColor': '#961b25'
});

var oldOptions = ['redmineUrl', 'showIssues', 'userLogin', 'userPassword', 'iconPressUrl', 'iconPressDontRedirect', 'showNotifications', 'notificationsTimeout', 'notificationsType', 'notificationFieldAuthor', 'notificationFieldPriority', 'notificationFieldProject', 'notificationFieldTime', 'notificationFieldTracker', 'notificationLinkColor', 'notificationTextColor', 'notificationBgColor'];

//import old options
for(idx in oldOptions) {
	var optionName = oldOptions[idx];

	if(localStorage.hasOwnProperty(optionName)) {
		var oldValue = localStorage[optionName];

		if(optionName == 'notificationsTimeout') {
			oldValue = oldValue * 1000;
		} else if(optionName == 'iconPressDontRedirect' || optionName == 'showNotifications' || optionName == 'notificationFieldAuthor' || optionName == 'notificationFieldPriority' || optionName == 'notificationFieldProject' || optionName == 'notificationFieldTime' || optionName == 'notificationFieldTracker') {
			oldValue = (oldValue == '1');
		}

		settings.set(optionName, oldValue);
		localStorage.removeItem(optionName);
	}
}