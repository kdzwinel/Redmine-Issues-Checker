function IconAnimation(config) {
	var animationFrames = 36,
	animationSpeed = 10,//ms
	rotation = 0,
	canvas = config.canvasObj,
	canvasContext,
	image = config.imageObj,
	defaultIcon = config.defaultIcon,
	loadingTimer = 0,
	loadingStatesCount = 8,// Total number of states in animation
	loadingCurrentState = 0,// Current state
	loadingMaxDots = 4;// Max number of dots in animation

	this.flip = function (otherIcon) {
		var icon = (otherIcon) ? otherIcon : defaultIcon;

		image.src = icon;
		chrome.browserAction.setIcon({path: icon});
		setTimeout(animateFlip, 1500);
	};

	this.startLoading = function () {
		if (loadingTimer) {
			return;
		}

		loadingTimer = setInterval(drawIconAtLoading, 100);
	};

	this.stopLoading = function () {
		if (!loadingTimer) {
			return;
		}

		clearInterval(loadingTimer);
		loadingTimer = 0;
		chrome.browserAction.setBadgeText({text:""});
	};
	
	this.reset = function () {
		this.stopLoading();
		clearInterval(animateFlip);
		chrome.browserAction.setIcon({path: defaultIcon});
	};

	var drawIconAtLoading = function() {
		var text = "";
		for (var i = 0; i < loadingMaxDots; i++) {
			text += (i == loadingCurrentState) ? "." : " ";
		}
		if (loadingCurrentState >= loadingMaxDots) {
			text += "";
		}

		chrome.browserAction.setBadgeText({text:text});
		loadingCurrentState++;
		if (loadingCurrentState == loadingStatesCount) {
			loadingCurrentState = 0;
		}
	};

	var ease = function(x) {
		return (1-Math.sin(Math.PI/2+x*Math.PI))/2;
	};

	var animateFlip = function () {
		rotation += 1/animationFrames;
		drawIconAtRotation();
		if (rotation <= 1) {
			setTimeout(animateFlip, animationSpeed);
		} else {
			rotation = 0;
			drawIconAtRotation();
			chrome.browserAction.setIcon({path: defaultIcon});
		}
	};

	var drawIconAtRotation = function () {
		canvasContext.save();
		canvasContext.clearRect(0, 0, canvas.width, canvas.height);
		canvasContext.translate(
			Math.ceil(canvas.width/2),
			Math.ceil(canvas.height/2));
		canvasContext.rotate(2*Math.PI*ease(rotation));
		canvasContext.drawImage(image,
			-Math.ceil(canvas.width/2),
			-Math.ceil(canvas.height/2));
		canvasContext.restore();

		chrome.browserAction.setIcon({imageData:canvasContext.getImageData(0, 0, canvas.width,canvas.height)});
	};

	canvasContext = canvas.getContext('2d');

	this.reset();
}