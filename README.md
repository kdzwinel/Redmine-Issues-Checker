REDMINE ISSUES CHECKER
======================

Highly configurable extension displaying number of active and/or new issues assigned to logged in user. Extension includes optional notifications about new issues.

This extension was inspired by 'Google Mail Checker'.

Usage
-----

You may install this extension from its google chrome webstore page

https://chrome.google.com/webstore/detail/cmfcfjopbfmekonldgghddhkphapbpek

or download it and manually load as an 'Unpacked extension' via chrome extensions page.

To start working with this extension (after installation) go to the options page and enter your Redmine URL. You have to be logged in to Redmine for this extension to work or you have to provide your login credentials on the options page.

Bug Tracker
-----------

Have a bug? Please create an issue here on GitHub!

https://github.com/kdzwinel/Redmine-Issues-Checker/issues

Developers
----------
+ background.html - extension core code (ajax calls, toolbar icon, notifications)
+ options.html - options page (options form, validation and saving)
+ Base64.js - Base64 encoding/decoding by webtoolkit (used for encoding login data)
+ manifest.json - configuration file used by google chrome webstore

+ gfx - graphic files (logo, promotional banners) in xcf format

Author
------

**Konrad Dzwinel**

+ https://github.com/kdzwinel
+ http://www.linkedin.com/pub/konrad-dzwinel/53/599/366/en

License
-------

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.