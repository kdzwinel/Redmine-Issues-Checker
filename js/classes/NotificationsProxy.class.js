var NotificationsProxy = (function () {

    function createNotification(settings, issue) {
        var opt = {
            type: "basic",
            title: '"' + issue.subject + '" by ' + issue.author.name,
            message: issue.description,
            iconUrl: "/img/redmine_logo_128.png"
        };

        chrome.notifications.create(Math.random().toString(), opt, function (nid) {
            console.log('Notification ID: ' + nid);
            window.setTimeout(function () {
                chrome.notifications.clear(nid, function(){});
            }, settings.get('notificationsTimeout'));
        });
    }

    function create(settings, issue) {
        //use new Notifications API (https://developer.chrome.com/extensions/notifications.html)
        createNotification(settings, issue);
    }

    return {
        create: create
    };
})();