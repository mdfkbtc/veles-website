var velesSinglePageApp = {
    'explorerUrl': 'http://35.240.96.108:88',
    'currentPage': null,
    'pageSuffix': '.html',
    'pageHooks': {},
    'cachedPages': {},
    'eventsBound': {},

    'go': function(page = 'index') {
        // cache the previous HTML, index is always cached
        this.cachedPages[this.currentPage] = $('#content-wrapper').html();

        // change the current page pointers and links
        this.currentPage = page;
        this.setActive(page);

        // change browser's url filed
        if (history.pushState) {
            window.history.pushState({'currentPage': page}, this.getTitle(), "./" + page + this.pageSuffix);
        } else {
            document.location.href = "./" + page + this.pageSuffix;
        }

        // close the menu if open
        $('div.navbar-collapse').removeClass('show');
        $('div.navbar-collapse').addClass('hide');
        this.hideMobileMenu();

        // load the content if not cached, init the page scripts
        if (this.cachedPages.hasOwnProperty(page)) {
            $('#content-wrapper').html(this.cachedPages[page]);
            velesSinglePageApp.hideOverlay();
            velesSinglePageApp.runPageHook('init');
            velesSinglePageApp.bindEvents();
        } else {
            $('#content-wrapper').load('./templates/' + page + '.html #content', null, function() {
                velesSinglePageApp.hideOverlay();
                velesSinglePageApp.runPageHook('init');
                velesSinglePageApp.bindEvents();
            }); 
        }

        // just start scrolling to the top
        window.scrollTo(0,0);
    },

    'addPageHook': function(pageName, hookName, callback) {
        if (!this.pageHooks.hasOwnProperty(pageName))
            this.pageHooks[pageName] = {}

        this.pageHooks[pageName][hookName] = callback;
    },

    'runPageHook': function(hookName, pageName = null) {
        if (!pageName)
            pageName = this.currentPage;

        if (this.pageHooks.hasOwnProperty(pageName) && this.pageHooks[pageName].hasOwnProperty(hookName))
            this.pageHooks[pageName][hookName]();
    },

    'setActive': function(page = null) {
        if (!page)
            page = this.currentPage;

        $('.nav-active').removeClass('nav-active'); // deactivate previously active tabs

        if (page == 'index')    // main index link is a special one
            $('a.navbar-brand').addClass('nav-active');
        
        else
            $('a[href$="' + page + this.pageSuffix + '"].nav-link').parent('li').addClass('nav-active');
    },

    'detectCurrentPage': function() {
        var filename = $(window.location.pathname.split('/')).get(-1);

        return (filename) ? filename.replace('.html', '') : 'index';
    },

    'getTitle': function(page = null) {
        // todo: load titles from JSON or parse from loaded content
        return $('title').text();
    },

    'bindEvents': function() {
        // History changed event
        if (!this.eventsBound.hasOwnProperty('popstate') || !this.eventsBound['popstate']) {
            $(window).bind('popstate', function(e) {
                if (e.originalEvent.state && e.originalEvent.state.hasOwnProperty('currentPage'))
                    velesSinglePageApp.go(e.originalEvent.state.currentPage);
                else
                    velesSinglePageApp.go();
            });
            this.eventsBound['popstate'] = true;
        }

        if (!this.eventsBound.hasOwnProperty('navbar-toggler') || !this.eventsBound['navbar-toggler']) {
            $('.navbar-collapse').on('show.bs.collapse', function () {
                velesSinglePageApp.showMobileMenu();
            });
            $('.navbar-collapse').on('hide.bs.collapse', function () {
                velesSinglePageApp.hideMobileMenu();
            });
            this.eventsBound['navbar-toggler'] = true;
        }

        // Click events on navigation links
        $('.nav-link').not('.dropdown-toggle').add('.navbar-brand').add('.dropdown-item')
            .add('.nav-vertical a').add('.breadcrumb-item a')
            .not('.nav-external-app').not('.spa').click(function(e) {
           e.preventDefault();
           velesSinglePageApp.go($(this).attr('href').replace(velesSinglePageApp.pageSuffix, ''));
        }).addClass('spa');
    },

    'hideOverlay': function(overlayName = null, fade = true, delay = 3000) {
        if (!overlayName && this.isMobileMenuShown())
            return;

        if (fade)
            $('#content-overlay').fadeOut(delay);

        if (overlayName) {
            $('#content').addClass(overlayName + '-initial');
            $('#content-overlay').addClass(overlayName + '-initial');
        }
        
        window.setTimeout(function() {
            if (!overlayName && velesSinglePageApp.isMobileMenuShown())
                return;

            if (!fade)
                $('#content-overlay').hide();

            if (overlayName) {
                $('#content').removeClass(overlayName + '-initial');
                $('#content-overlay').removeClass(overlayName + '-initial');
                $('#content').removeClass(overlayName);
                $('#content-overlay').removeClass(overlayName);
            } else {
                $('.navbar-toggler').fadeIn();
            }
            $('body').removeClass('with-overlay');
            
        }, delay);
    },

    'showOverlay': function(overlayName = null, fade = true, delay = 3000) {
        if (overlayName == 'mobile-menu-zoom' && this.isMobileMenuShown())
            return;

        if (overlayName) {
            if (this.isOverlayShown())   // hide loading overlay if still shown
                this.hideOverlay(null, true, 0);

            $('#content-overlay').addClass(overlayName + '-initial');
            $('#content-overlay').addClass(overlayName);
            $('#content').addClass(overlayName + '-initial');
            $('#content').addClass(overlayName);
        }

        if (fade)
            $('#content-overlay').fadeOut(delay);
        else
            $('#content-overlay').show();

        if (overlayName) {
            $('#content').removeClass(overlayName + '-initial');
            $('#content-overlay').removeClass(overlayName + '-initial');
        } else {
            $('.navbar-toggler').fadeOut();
        }
    },

    'isOverlayShown': function() {
        return $('#content-overlay').is(':visible');
    },

    'showMobileMenu': function() {
        this.showOverlay('mobile-menu-zoom', false, 2000);
        $('.navbar').addClass('mobile-menu');
    },

    'hideMobileMenu': function() {
        this.hideOverlay('mobile-menu-zoom', false, 100);
        $('.navbar').removeClass('mobile-menu');
    },

    'isMobileMenuShown': function() {
        return $('#content-overlay').hasClass('mobile-menu-zoom');
    },

    'start': function() {
        this.bindEvents();
        this.currentPage = 'index';

        // only the index is pre-loaded
        if (this.detectCurrentPage() == 'index') {
            this.setActive();
            this.runPageHook('init');
            this.hideOverlay();
        } else {
            this.go(this.detectCurrentPage());
        }
    }
}

/* Mark current page's tab as active (if found in main nav) */
$(document).ready(function() {
    velesSinglePageApp.start();
});


