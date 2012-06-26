var issue;

//http://stackoverflow.com/questions/1787322/htmlspecialchars-equivalent-in-javascript
function escapeHtml(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function getIssueUrl() {
	var baseurl = chrome.extension.getBackgroundPage().getRedmineUrl();
	
	return baseurl + 'issues/' + issue.id;
}

function getProjectUrl() {
	var baseurl = chrome.extension.getBackgroundPage().getRedmineUrl();
	
	return baseurl + 'projects/' + issue.project.id;
}

function getAuthorUrl() {
	var baseurl = chrome.extension.getBackgroundPage().getRedmineUrl();
	
	return baseurl + 'users/' + issue.author.id;
}

function shortenString(input, maxlength) {
	if(maxlength < 3) {
		return;
	}

	if(input.length > maxlength) {
		return input.substr(0, maxlength-3) + '...';
	}

	return input;
}

function formatTime() {
	var createdOn = new Date(issue.created_on);
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

function init() {
	//issue.assigned_to id, name
	//issue.author id, name
	//issue.status.name
	//issue.project.name
	//issue.created_on
	//issue.updated_on
	//issue.done_ratio
	//issue.id
	//issue.start_date
	//issue.subject
	//issue.tracker id, name (Bug)
	//issue.status id, name (New)
	//issue.project id, name
	//issue.priority id name (Normal)
	issue = chrome.extension.getBackgroundPage().getNewIssue();

	var wrapper = document.getElementById('wrapper');

	var title = document.getElementById('title');
	var desc = document.getElementById('desc');
	var author = document.getElementById('author');
	var date = document.getElementById('time');
	var project = document.getElementById('project');
	var tracker = document.getElementById('tracker');
	var priority = document.getElementById('priority');

	title.innerHTML = '<a href="' + getIssueUrl() + '" target="_blank">' + escapeHtml(shortenString(issue.subject, 25)) + '</a>';
	desc.innerHTML = escapeHtml(shortenString(issue.description, 120));
	author.innerHTML = 'by <a href="' + getAuthorUrl() + '" target="_blank">' + escapeHtml(issue.author.name) + '</a>';
	
	time.innerHTML = formatTime();

	project.innerHTML = 'in <a href="' + getProjectUrl() + '" target="_blank">' + escapeHtml(shortenString(issue.project.name, 30)) + '</a>';

	tracker.innerHTML = 'tracker: <strong>' + issue.tracker.name + '</strong>';
	priority.innerHTML = 'priority: <strong>' + issue.priority.name + '</strong>';

	if(!settings.get('notificationFieldAuthor')) {
		wrapper.removeChild(author);
	}
	if(!settings.get('notificationFieldTime')) {
		wrapper.removeChild(time);
	}
	if(!settings.get('notificationFieldProject')) {
		wrapper.removeChild(project);
	}
	if(!settings.get('notificationFieldPriority')) {
		wrapper.removeChild(priority);
	}
	if(!settings.get('notificationFieldTracker')) {
		wrapper.removeChild(tracker);
	}

	document.body.style.backgroundColor = settings.get('notificationBgColor');
	document.body.style.color = settings.get('notificationTextColor');
	var links = document.body.getElementsByTagName('a');
	for(index in links) {
		links[index].style.color = settings.get('notificationLinkColor');
	}
}