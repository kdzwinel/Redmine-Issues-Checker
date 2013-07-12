var NotificationsProxy = (function () {

    function formatTime(time) {
        var createdOn = new Date(time);
        var today = new Date();

        if(createdOn.getDate() == today.getDate() && createdOn.getMonth() == today.getMonth() && createdOn.getYear() == today.getYear()) {
            var timeNow = today.getHours() * 60 + today.getMinutes();
            var timeIssue = createdOn.getHours() * 60 + createdOn.getMinutes();

            if(timeNow - timeIssue == 0) {
                return 'today (just now)';
            } else if((timeNow - timeIssue) < 60 && (timeNow - timeIssue) > 0) {
                return 'today (' + (timeNow-timeIssue) +' minute(s) ago)';
            } else {
                var hours = createdOn.getHours();
                if(hours < 10) {
                    hours = '0'+hours;
                }

                var minutes = createdOn.getMinutes();
                if(minutes < 10) {
                    minutes = '0'+minutes;
                }

                return 'today (' + hours + ':' + minutes + ')';
            }
        } else {
            return createdOn.getDate() + '.' + (createdOn.getMonth()+1) + '.' + createdOn.getFullYear();
        }
    }

    function createNotification(settings, issue) {
        var opt = {
            type: "basic",
            title: '"' + issue.subject + '" by ' + issue.author.name,
            message: issue.description,
            iconUrl: "/img/redmine_logo_128.png"
        };

        if (settings.get('notificationsType') == 'extended') {
            var items = [];
            if (settings.get('notificationFieldAuthor')) {
                items.append({
                    title: 'Author',
                    message: issue.author.name
                });
            }
            if (settings.get('notificationFieldTime')) {
                items.append({
                    title: 'Created',
                    message: formatTime(issue.created_on)
                });
            }
            if (settings.get('notificationFieldProject')) {
                items.append({
                    title: 'Project Name',
                    message: issue.project.name
                });
            }
            if (settings.get('notificationFieldPriority')) {
                items.append({
                    title: 'Priority',
                    message: issue.priority.name
                });
            }
            if (settings.get('notificationFieldTracker')) {
                items.append({
                    title: 'Tracker',
                    message: issue.tracker.name
                });
            }

            opt = {
                type: "list",
                title: '"' + issue.subject + '" by ' + issue.author.name,
                message: "Primary message to display",
                iconUrl: "/img/redmine_logo_128.png",
                items: items
            }
        }

        chrome.notifications.create(Math.random().toString(), opt, function (nid) {
            console.log('Notification ID: ' + nid);
            window.setTimeout(function () {
                chrome.notifications.clear(nid, function(){});
            }, settings.get('notificationsTimeout'));
        });
    }

    function createWebNotification(settings, issue) {
        var notification;

        if (settings.get('notificationsType') == 'extended' && webkitNotifications.createHTMLNotification) {
            notification = webkitNotifications.createHTMLNotification(
                '/notification.html'
            );

            chrome.extension.getBackgroundPage().setNewIssue(issue);
        } else {
            notification = webkitNotifications.createNotification(
                '/img/redmine_logo_128.png',  // icon url - can be relative
                '"' + issue.subject + '" by ' + issue.author.name,  // notification title
                issue.description  // notification body text
            );
        }

        notification.show();

        window.setTimeout(function () {
            notification.cancel();
        }, settings.get('notificationsTimeout'));
    }

    function create(settings, issue) {
        if (webkitNotifications && webkitNotifications.createHTMLNotification) {
            //use web notifications API
            createWebNotification(settings, issue);
        } else if (chrome.notifications) {
            //use new Notifications API (https://developer.chrome.com/extensions/notifications.html)
            createNotification(settings, issue);
        }
    }

    return {
        create: create
    };
})();