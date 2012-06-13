//ANIMATION VARIABLES
var animationFrames = 36;
var animationSpeed = 10; // ms
var canvas;
var canvasContext;
var loggedInImage;
var rotation = 0;
var loadingAnimation = new LoadingAnimation();

//REQUEST VARIABLES
var DEFAULT_POLL_INTERVAL_MIN_MS = 1000 * 60;  // 1 minute
var DEFAULT_POLL_INTERVAL_MAX_MS = 1000 * 60 * 60;  // 1 hour
var requestFailureCount = 0;  // used for exponential backoff
var requestTimeout = 1000 * 5;  // 5 seconds
var requestTimeoutHandler = null;

//OTHER VARIABLES
var issuesCount = -1;
var issuesNewCount = -1;
var currentUserId = null;
var currentUserName = null;
var issuesIds = null;
var newIssueStack = new Array(); //issues that just arrived

function init() {
	issuesCount = -1;
	issuesNewCount = -1;
	currentUserId = null;
	currentUserName = null;
	issuesIds = null;

	canvas = document.getElementById('canvas');
	loggedInImage = document.getElementById('logged_in');
	canvasContext = canvas.getContext('2d');

	chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
	chrome.browserAction.setIcon({path: "img/redmine_logged_in.png"});
	loadingAnimation.start();

	startRequest();
}

function getUpdateDelayMinMS() {
	if( !localStorage.updateDelayMinMS ) {
		return DEFAULT_POLL_INTERVAL_MIN_MS;
	}

	return localStorage.updateDelayMinMS;
}

function getUpdateDelayMaxMS() {
	if( !localStorage.updateDelayMaxMS ) {
		return DEFAULT_POLL_INTERVAL_MAX_MS;
	}

	return localStorage.updateDelayMaxMS;
}

function getRedmineUrl() {
	if( !localStorage.redmineUrl ) {
		return null;
	}

	return localStorage.redmineUrl;
}

function getRedmineUpdateUrl() {
	if( !localStorage.redmineUpdateUrl ) {
		return null;
	}

	return localStorage.redmineUpdateUrl;
}

function isRedmineUrl(url) {
	var redmine = getRedmineUrl();

	return (url.indexOf(redmine) == 0);
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
	if (changeInfo.url && isRedmineUrl(changeInfo.url)) {
		startRequest();
	}
});

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
	goToRedmine();
});

function goToRedmine() {
	if(getRedmineUrl() == null) {
		return;
	}

	chrome.tabs.getAllInWindow(undefined, function(tabs) {
		var page = 'my/page';
		if(localStorage.iconPressUrl) {
			page = localStorage.iconPressUrl;
			if(page.length > 0 && page.indexOf('/') == 0) {
				page = page.substring(1);
			}
		}

		for (var i = 0, tab; tab = tabs[i]; i++) {
			if (tab.url && isRedmineUrl(tab.url)) {
				var tabOptions = {selected: true};

				if(localStorage.iconPressDontRedirect != '1') {
					tabOptions.url = getRedmineUrl() + page;
				}

				chrome.tabs.update(tab.id, tabOptions);
				return;
			}
		}

		chrome.tabs.create({url: getRedmineUrl() + page});
	});
}

function scheduleRequest() {
	var randomness = Math.random() + 1;
	var exponent = Math.pow(2, requestFailureCount);
	var pollIntervalMin = getUpdateDelayMinMS();
	var pollIntervalMax = getUpdateDelayMaxMS();
	var delay = Math.min(randomness * pollIntervalMin * exponent, pollIntervalMax);
	delay = Math.round(delay);

	if(requestTimeoutHandler != null) {
		window.clearTimeout(requestTimeoutHandler);
	}

	requestTimeoutHandler = window.setTimeout(startRequest, delay);
}

// ajax stuff
function startRequest() {
	//redmine url is set by user
	if(getRedmineUrl() != null) {
		//current user data are not loaded
		if(currentUserId == null) {
			getCurrentUser(
				function() {
					startRequest();
				},
				function() {
					loadingAnimation.stop();
					showLoggedOut();
					scheduleRequest();
				}
			);
		} else {
			getIssuesCount(
				function(allCount, newCount) {
					loadingAnimation.stop();
					updateIssuesCount(allCount, newCount);
					scheduleRequest();
				},
				function() {
					loadingAnimation.stop();
					if(requestFailureCount > 1) {
						showLoggedOut();
					}
					scheduleRequest();
				}
			);
		}
	} else {
		loadingAnimation.stop();
		showLoggedOut();
	}
}

function getCurrentUser(onSuccess, onError) {
	getJSON("users/current.json",
		function(json){
			if( json.user ) {
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
	if(getRedmineUpdateUrl() != null) {
		jsonRequestUrl = getRedmineUpdateUrl();
	} else {
		jsonRequestUrl = "issues.json?assigned_to_id=" + currentUserId + "&limit=50";
	}
	getJSON(jsonRequestUrl,
		function(json){
			if(json.issues != undefined && localStorage.showNotifications == '1') {
				showNotificationOnNewIssue(json.issues);
			}
			if(json.total_count != undefined) {
				onSuccess(json.total_count, countNewIssues(json.issues));
			} else {
				onError();
			}
		},
		onError
	);
}

function showNotificationOnNewIssue(issuesObj) {
	var newIssuesIds = new Array();
	for(var i=0; i<issuesObj.length; i++) {
		var issue = issuesObj[i];
		newIssuesIds.push(issue.id); 

		//check if issue is new (if id array exists)
		if(issuesIds != null && (issuesIds.indexOf(issue.id) == -1)) {
			
			//issue.author.name
			//issue.status.name
			//issue.project.name
			//issue.created_on
			//issue.updated_on

			if(!localStorage.notificationsType || localStorage.notificationsType == 'standard') {
				var notification = webkitNotifications.createNotification(
					'img/redmine_logo_128.png',  // icon url - can be relative
					'"' + issue.subject + '" by ' + issue.author.name,  // notification title
					issue.description  // notification body text
				);
			} else {//extended notification
				var notification = webkitNotifications.createHTMLNotification(
					'notification.html'
				);

				setNewIssue(issue);
			}

			notification.show();

			window.setTimeout(function(notification){
				notification.cancel();
			}, localStorage.notificationsTimeout * 1000, notification);
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

function getJSON(url, onSuccess, onError) {
  var xhr = new XMLHttpRequest();

  var abortTimerId = window.setTimeout(function() {
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
    xhr.onreadystatechange = function(){
      if (xhr.readyState != 4)
        return;

      if (xhr.responseText) {
        var jsonDoc = xhr.responseText;

        if(jsonDoc != undefined && jsonDoc.trim().length > 0)
        {
           jsonObj = JSON.parse(jsonDoc);

           if (jsonObj) {
             handleSuccess(jsonObj);
             return;
           } else {
             console.error('Error: node error');
           }
        }
      }

      handleError();
    }

    xhr.onerror = function(error) {
      handleError();
    }

    xhr.open("GET", getRedmineUrl() + url, true);

    //attach authorization credentials if avaiable
    if(localStorage.userLogin && localStorage.userPassword) {
      var hash = Base64.encode(localStorage.userLogin + ':' + localStorage.userPassword);
      xhr.setRequestHeader('Authorization', "Basic " + hash);
    }

    xhr.send(null);
  } catch(e) {
    console.error('Exception: ' + e);
    handleError();
  }
}

function updateIssuesCount(allCount, newCount) {
	if(
		(localStorage.showIssues == 'active-new' && (issuesCount != allCount || issuesNewCount != newCount)) || 
		(localStorage.showIssues == 'active' && issuesCount != allCount) ||
		(localStorage.showIssues == 'new' && issuesNewCount != newCount)
	){
		animateFlip();
	}

		issuesCount = allCount;
		issuesNewCount = newCount;
		chrome.browserAction.setTitle({'title':'issues: ' + issuesCount + ' (' + newCount + ' new)'});
}

function printIssuesCount() {
	if(localStorage.showIssues == 'active-new') {
		return issuesNewCount + ':' + issuesCount;
	}

	if(localStorage.showIssues == 'new') {
		if(issuesNewCount != "0") {
			return issuesNewCount.toString();
		}
	}

	if(localStorage.showIssues == 'active') {
		if(issuesCount != "0") {
			return issuesCount.toString();
		}
	}

	return "";
}

function countNewIssues(issuesObj) {
	var newIssues = 0;
	for(var i=0; i<issuesObj.length; i++) {
		var issue = issuesObj[i];
		if(issue.status !== undefined && issue.status.id == 1) {//new
			newIssues ++;
		}
	}

	return newIssues;
}

function showLoggedOut() {
	issuesCount = -1;
	issuesNewCount = -1;

	chrome.browserAction.setIcon({path:"img/redmine_not_logged_in.png"});
	chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
	chrome.browserAction.setBadgeText({text:"?"});
	chrome.browserAction.setTitle({'title':'disconnected'});
}

/*******************
ANIMATION STUFF
********************/

// A "loading" animation displayed while we wait for the first response from
// Gmail. This animates the badge text with a dot that cycles from left to
// right.
function LoadingAnimation() {
	this.timerId_ = 0;
	this.maxCount_ = 8;  // Total number of states in animation
	this.current_ = 0;  // Current state
	this.maxDot_ = 4;  // Max number of dots in animation
}

LoadingAnimation.prototype.paintFrame = function() {
  var text = "";
  for (var i = 0; i < this.maxDot_; i++) {
    text += (i == this.current_) ? "." : " ";
  }
  if (this.current_ >= this.maxDot_)
    text += "";

  chrome.browserAction.setBadgeText({text:text});
  this.current_++;
  if (this.current_ == this.maxCount_)
    this.current_ = 0;
}

LoadingAnimation.prototype.start = function() {
  if (this.timerId_)
    return;

  var self = this;
  this.timerId_ = window.setInterval(function() {
    self.paintFrame();
  }, 100);
}

LoadingAnimation.prototype.stop = function() {
  if (!this.timerId_)
    return;

  window.clearInterval(this.timerId_);
  this.timerId_ = 0;
}

function ease(x) {
  return (1-Math.sin(Math.PI/2+x*Math.PI))/2;
}

function animateFlip() {
  rotation += 1/animationFrames;
  drawIconAtRotation();

  if (rotation <= 1) {
    setTimeout("animateFlip()", animationSpeed);
  } else {
    rotation = 0;
    drawIconAtRotation();
    chrome.browserAction.setBadgeText({
      text: printIssuesCount()
    });
    chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
  }
}

function drawIconAtRotation() {
  canvasContext.save();
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  canvasContext.translate(
      Math.ceil(canvas.width/2),
      Math.ceil(canvas.height/2));
  canvasContext.rotate(2*Math.PI*ease(rotation));
  canvasContext.drawImage(loggedInImage,
      -Math.ceil(canvas.width/2),
      -Math.ceil(canvas.height/2));
  canvasContext.restore();

  chrome.browserAction.setIcon({imageData:canvasContext.getImageData(0, 0,
      canvas.width,canvas.height)});
}