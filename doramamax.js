/*
 * DORAMA MAX — Korean drama catalogue for Lampa
 * Version 1.1.0
 * TMDB metadata only. No Lampac, TorrServer, torrent or video providers.
 */
(function () {
    'use strict';

    if (window.dorama_max_ready) return;
    window.dorama_max_ready = true;

    var COMPONENT = 'dorama_max_catalog';
    var today = new Date().toISOString().slice(0, 10);
    var yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    var fromDate = yearAgo.toISOString().slice(0, 10);

    var categories = [
        { id: 'new', title: 'Новинки', sort: 'first_air_date.desc', extra: { 'first_air_date.gte': fromDate, 'first_air_date.lte': today } },
        { id: 'popular', title: 'Популярные', sort: 'popularity.desc' },
        { id: 'school', title: 'Школьные банды и драки', sort: 'popularity.desc', extra: { with_genres: '10759,18', with_keywords: '10873' } },
        { id: 'crime', title: 'Криминал', sort: 'popularity.desc', extra: { with_genres: '80,18' } },
        { id: 'revenge', title: 'Месть', sort: 'popularity.desc', extra: { with_keywords: '9748' } },
        { id: 'action', title: 'Экшен', sort: 'popularity.desc', extra: { with_genres: '10759' } },
        { id: 'romance', title: 'Романтика', sort: 'popularity.desc', extra: { with_genres: '10749' } },
        { id: 'thriller', title: 'Триллеры и детективы', sort: 'popularity.desc', extra: { with_genres: '9648' } },
        { id: 'fantasy', title: 'Мистика и фантастика', sort: 'popularity.desc', extra: { with_genres: '10765' } },
        { id: 'top', title: 'Лучшие дорамы', sort: 'vote_average.desc', extra: { 'vote_count.gte': 100 } }
    ];

    var css = ''
        + '.dmax{padding:1.5em 3em 4em;box-sizing:border-box;width:100%;height:100%;overflow:auto}'
        + '.dmax__head{display:flex;align-items:center;gap:1em;margin-bottom:1.4em;flex-wrap:wrap}'
        + '.dmax__title{font-size:2em;font-weight:700}'
        + '.dmax__tabs{display:flex;gap:.5em;flex-wrap:wrap;margin-bottom:1.5em}'
        + '.dmax__tab{padding:.65em 1em;border-radius:.35em;background:rgba(255,255,255,.09);cursor:pointer}'
        + '.dmax__tab.focus,.dmax__tab:hover{background:#fff;color:#111}'
        + '.dmax__search{padding:.7em 1em;border:1px solid rgba(255,255,255,.35);border-radius:.35em;background:rgba(255,255,255,.08);color:inherit;min-width:15em;font:inherit}'
        + '.dmax__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(10em,1fr));gap:1.2em}'
        + '.dmax__card{min-width:0;cursor:pointer;position:relative}'
        + '.dmax__poster{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:.35em;background:rgba(255,255,255,.08)}'
        + '.dmax__name{font-size:.95em;line-height:1.3;margin-top:.5em;max-height:2.6em;overflow:hidden}'
        + '.dmax__meta{opacity:.65;font-size:.82em;margin-top:.25em}'
        + '.dmax__card.focus .dmax__poster{outline:3px solid #fff;transform:scale(1.025)}'
        + '.dmax__empty,.dmax__loading{padding:2em;opacity:.75}'
        + '.dmax__more{margin:2em auto;padding:.8em 1.5em;border-radius:.35em;background:rgba(255,255,255,.12);text-align:center;cursor:pointer;width:max-content}'
        + '.dmax__more.focus{background:#fff;color:#111}';

    function addStyle() {
        if (document.getElementById('dmax-style')) return;
        var style = document.createElement('style');
        style.id = 'dmax-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function isKorean(item) {
        return item && item.original_language === 'ko' &&
            (!item.origin_country || item.origin_country.indexOf('KR') !== -1);
    }

    function image(path) {
        if (!path) return '';
        return Lampa.Api.img(path);
    }

    function params(category, page) {
        var filter = {
            with_original_language: 'ko',
            with_origin_country: 'KR',
            include_null_first_air_dates: false
        };
        Object.keys(category.extra || {}).forEach(function (key) {
            filter[key] = category.extra[key];
        });
        return {
            source: 'tmdb',
            url: 'discover/tv',
            page: page,
            sort_by: category.sort,
            filter: filter
        };
    }

    function Catalog(object) {
        var self = this;
        this.activity = object;
        this.category = categories[0];
        this.page = 1;
        this.items = [];
        this.loading = false;
        this.searchMode = false;
        this.query = '';
        this.scroll = new Lampa.Scroll({ mask: true, over: true });
        this.render();
        this.load();
    }

    Catalog.prototype.render = function () {
        var self = this;
        addStyle();
        this.activity.render();
        this.activity.toggle();
        this.activity.title('DORAMA MAX');

        this.body = $('<div class="dmax"></div>');
        this.head = $('<div class="dmax__head"><div class="dmax__title">DORAMA MAX</div></div>');
        this.search = $('<input class="dmax__search" type="search" placeholder="Поиск корейских дорам">');
        this.head.append(this.search);
        this.tabs = $('<div class="dmax__tabs"></div>');
        categories.forEach(function (cat) {
            var tab = $('<div class="dmax__tab selector"></div>').text(cat.title);
            tab.on('hover:enter', function () {
                self.category = cat;
                self.searchMode = false;
                self.query = '';
                self.search.val('');
                self.page = 1;
                self.items = [];
                self.updateTabs();
                self.load();
            });
            self.tabs.append(tab);
        });
        this.grid = $('<div class="dmax__grid"></div>');
        this.status = $('<div class="dmax__loading">Загрузка каталога…</div>');
        this.body.append(this.head, this.tabs, this.status, this.grid);
        this.scroll.append(this.body);
        this.activity.wrapper.append(this.scroll.render());
        this.search.on('keydown', function (event) {
            if (event.key === 'Enter') {
                var q = String(self.search.val() || '').trim();
                if (q) self.searchFor(q);
            }
        });
        this.search.on('blur', function () {});
        this.updateTabs();
        Lampa.Controller.add('content', {
            toggle: function () { Lampa.Controller.collectionSet(this.body); },
            up: function () { Lampa.Controller.toggle('menu'); },
            down: function () { Lampa.Controller.collectionSet(this.more || this.cards); },
            back: function () { Lampa.Activity.backward(); }
        });
        Lampa.Controller.toggle('content');
    };

    Catalog.prototype.updateTabs = function () {
        var self = this;
        this.tabs.children().each(function (index) {
            $(this).toggleClass('active', categories[index].id === self.category.id);
        });
    };

    Catalog.prototype.load = function () {
        var self = this;
        if (this.loading) return;
        this.loading = true;
        this.status.text('Загрузка каталога…').show();
        Lampa.Api.list(params(this.category, this.page), function (data) {
            var results = (data && data.results ? data.results : []).filter(isKorean);
            self.items = self.page === 1 ? results : self.items.concat(results);
            self.loading = false;
            self.draw();
        }, function () {
            self.loading = false;
            self.status.text('Не удалось загрузить каталог. Проверь подключение к интернету и попробуй ещё раз.');
        });
    };

    Catalog.prototype.searchFor = function (query) {
        var self = this;
        this.searchMode = true;
        this.query = query;
        this.loading = true;
        this.grid.empty();
        this.status.text('Поиск…').show();
        Lampa.Api.search({ query: query, source: 'tmdb' }, function (data) {
            var results = (data && data.results ? data.results : []).filter(function (item) {
                return item.media_type === 'tv' && isKorean(item);
            });
            self.items = results;
            self.loading = false;
            self.draw();
        }, function () {
            self.loading = false;
            self.status.text('Ошибка поиска. Попробуй ещё раз.');
        });
    };

    Catalog.prototype.draw = function () {
        var self = this;
        this.grid.empty();
        this.status.hide();
        this.cards = [];
        if (!this.items.length) {
            this.status.text('Ничего не найдено.').show();
            return;
        }
        this.items.forEach(function (item) {
            var title = item.name || item.original_name || 'Без названия';
            var year = (item.first_air_date || '').slice(0, 4);
            var rating = item.vote_average ? '★ ' + Number(item.vote_average).toFixed(1) : '';
            var card = $('<div class="dmax__card selector"></div>');
            var poster = $('<img class="dmax__poster">');
            var src = image(item.poster_path);
            if (src) poster.attr('src', src);
            poster.attr('alt', title);
            var name = $('<div class="dmax__name"></div>').text(title);
            var meta = $('<div class="dmax__meta"></div>').text([year, rating].filter(Boolean).join(' · '));
            card.append(poster, name, meta);
            card.on('hover:enter', function () {
                item.source = 'tmdb';
                item.url = 'tv';
                item.type = 'tv';
                Lampa.Router.call('full', item);
            });
            self.grid.append(card);
            self.cards.push(card[0]);
        });
        if (!this.searchMode) {
            this.more = $('<div class="dmax__more selector">Загрузить ещё</div>');
            this.more.on('hover:enter', function () {
                if (!self.loading) {
                    self.page += 1;
                    self.more.remove();
                    self.load();
                }
            });
            this.body.append(this.more);
        }
        this.scroll.update(this.body);
        Lampa.Controller.collectionSet(this.cards);
    };

    Catalog.prototype.destroy = function () {
        this.scroll.destroy();
        this.body.remove();
    };

    Lampa.Component.add(COMPONENT, Catalog);

    function addMenu() {
        if (!window.appready || $('.dmax-menu').length) return;
        var menu = $('.menu .menu__list').eq(0);
        if (!menu.length) return;
        var item = $('<li class="menu__item selector dmax-menu"><div class="menu__ico"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 3h16v18H4zM7 6v12h10V6z"/></svg></div><div class="menu__text">DORAMA MAX</div></li>');
        item.on('hover:enter', function () {
            Lampa.Activity.push({
                title: 'DORAMA MAX',
                component: COMPONENT
            });
        });
        menu.append(item);
    }

    if (window.appready) addMenu();
    else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') addMenu();
        });
    }
})();
