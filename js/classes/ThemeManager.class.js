function ThemeManager(settings) {
  var themes = {
    default: {
      badge: {
        inactive: [190, 190, 190, 230],
        active: [208, 0, 24, 255]
      },
      icon: {
        logged_in: "img/redmine_logged_in.png",
        logged_out: "img/redmine_not_logged_in.png",
        big: "/img/redmine_logo_128.png"
      }
    },
    planio: {
      badge: {
        inactive: [255, 255, 255, 50],
        active:[87, 165, 189, 255]
      },
      icon: {
        logged_in: "img/planio_logged_in.png",
        logged_out: "img/planio_not_logged_in.png",
        big: "/img/planio_logo_128.png"
      }
    }
    //add your theme settings here
  };

  function isPlanio() {
    return settings.get('redmineUrl') && settings.get('redmineUrl').match(/^https:\/\/\w+\.plan\.io\/?/);
  }

  function getCurrentTheme() {
    if(isPlanio()) {
      return themes.planio;
    }
    //add theme condition here

    return themes.default;
  }

  this.getBadgeColorInactive = function() {
    return getCurrentTheme().badge.inactive;
  };

  this.getBadgeColorActive = function() {
    return getCurrentTheme().badge.active;
  };

  this.getIconLoggedOut = function() {
    return getCurrentTheme().icon.logged_out;
  };

  this.getIconLoggedIn = function() {
    return getCurrentTheme().icon.logged_in;
  };

  this.getIcon = function() {
    return getCurrentTheme().icon.big;
  };
}