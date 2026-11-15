/*
 * @name ANIME MAX
 * @author SanFlauerXX
 * @version 1.0.0
 * @description Каталог аниме для Lampa: сериалы, фильмы, онгоинги, жанры и поиск.
 * Каталог использует TMDB. Наличие русской озвучки/субтитров зависит от подключённых видеопровайдеров Lampa.
 */
(function () {
    'use strict';

    var READY_FLAG = 'anime_max_100_ready';
    if (window[READY_FLAG]) return;

    var PLUGIN_NAME = 'ANIME MAX';
    var SETTINGS_COMPONENT = 'anime_max';
    var MENU_ICON = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M4 3h16v18H4zM7 6v12h10V6zM9 8l6 4-6 4z"/></svg>';

    function dateString(date) {
        var year = date.getFullYear();
        var month = ('0' + (date.getMonth() + 1)).slice(-2);
        var day = ('0' + date.getDate()).slice(-2);
        return year + '-' + month + '-' + day;
    }

    function dateRange(monthsBack, monthsForward) {
        var now = new Date();
        var from = new Date(now);
        var to = new Date(now);
        from.setMonth(from.getMonth() - monthsBack);
        to.setMonth(to.getMonth() + monthsForward);
        return {
            'first_air_date.gte': dateString(from),
            'first_air_date.lte': dateString(to)
        };
    }

    function animeFilter(language) {
        return {
            with_genres: '16',
            with_original_language: language || 'ja',
            include_adult: false
        };
    }

    function categories() {
        var recent = dateRange(12, 1);
        var allJa = animeFilter('ja');
        var allZh = animeFilter('zh');
        var allKo = animeFilter('ko');

        return [
            { title: 'Все аниме-сериалы', type: 'tv', sort_by: 'popularity.desc', filter: animeFilter('ja') },
            { title: 'Популярные аниме', type: 'tv', sort_by: 'popularity.desc', filter: allJa },
            { title: 'Лучшие аниме', type: 'tv', sort_by: 'vote_average.desc', filter: Object.assign({}, allJa, { 'vote_count.gte': '30' }) },
            { title: 'Онгоинги', type: 'tv', sort_by: 'popularity.desc', filter: Object.assign({}, allJa, recent, { with_status: '0' }) },
            { title: 'Новые аниме', type: 'tv', sort_by: 'first_air_date.desc', filter: Object.assign({}, allJa, recent) },
            { title: 'Приключения', type: 'tv', sort_by: 'popularity.desc', filter: Object.assign({}, allJa, { with_genres: '16,10759' }) },
            { title: 'Экшен и фантастика', type: 'tv', sort_by: 'popularity.desc', filter: Object.assign({}, allJa, { with_genres: '16,10765' }) },
            { title: 'Романтика и комедия', type: 'tv', sort_by: 'popularity.desc', filter: Object.assign({}, allJa, { with_genres: '16,10749,35' }) },
            { title: 'Драма', type: 'tv', sort_by: 'popularity.desc', filter: Object.assign({}, allJa, { with_genres: '16,18' }) },
            { title: 'Ужасы и мистика', type: 'tv', sort_by: 'popularity.desc', filter: Object.assign({}, allJa, { with_genres: '16,9648' }) },
            { title: 'Китайское аниме (дунхуа)', type: 'tv', sort_by: 'popularity.desc', filter: allZh },
            { title: 'Корейская анимация', type: 'tv', sort_by: 'popularity.desc', filter: allKo },
            { title: 'Полнометражные аниме', type: 'movie', sort_by: 'popularity.desc', filter: animeFilter('ja') },
            { title: 'Новые аниме-фильмы', type: 'movie', sort_by: 'primary_release_date.desc', filter: Object.assign({}, animeFilter('ja'), {
                'primary_release_date.gte': dateString(new Date(new Date().getFullYear() - 2, 0, 1))
            }) },
            { title: 'Поиск аниме', search: true }
        ];
    }

    function currentController() {
        try {
            var active = Lampa.Controller.enabled();
            return active && active.name ? active.name : 'content';
        } catch (error) {
            return 'content';
        }
    }

    function openCategory(category) {
        Lampa.Activity.push({
            url: category.type === 'movie' ? 'discover/movie' : 'discover/tv',
            title: PLUGIN_NAME + ' — ' + category.title,
            component: 'category_full',
            source: 'tmdb',
            page: 1,
            sort_by: category.sort_by,
            filter: category.filter
        });
    }

    function openSearch() {
        var returnController = currentController();

        Lampa.Select.show({
            title: 'Что искать?',
            items: [
                { title: 'Аниме-сериалы', type: 'tv' },
                { title: 'Полнометражные аниме', type: 'movie' }
            ],
            onSelect: function (kind) {
                Lampa.Select.close();
                Lampa.Input.edit({
                    title: 'Поиск аниме',
                    value: '',
                    free: true
                }, function (query) {
                    query = String(query || '').trim();
                    if (!query) {
                        Lampa.Controller.toggle(returnController);
                        return;
                    }
                    Lampa.Activity.push({
                        url: kind.type === 'movie' ? 'search/movie' : 'search/tv',
                        title: PLUGIN_NAME + ' — ' + query,
                        component: 'category_full',
                        source: 'tmdb',
                        page: 1,
                        query: encodeURIComponent(query)
                    });
                });
            },
            onBack: function () {
                Lampa.Controller.toggle(returnController);
            }
        });
    }

    function openCatalog() {
        var returnController = currentController();
        var items = categories();

        Lampa.Select.show({
            title: PLUGIN_NAME,
            items: items,
            onSelect: function (item) {
                Lampa.Select.close();
                if (item.search) openSearch();
                else openCategory(item);
            },
            onBack: function () {
                Lampa.Controller.toggle(returnController);
            }
        });
    }

    function registerSettings() {
        if (!Lampa.SettingsApi) return;

        Lampa.SettingsApi.addComponent({
            component: SETTINGS_COMPONENT,
            name: PLUGIN_NAME,
            icon: MENU_ICON
        });

        Lampa.SettingsApi.addParam({
            component: SETTINGS_COMPONENT,
            param: { name: 'anime_max_open_catalog', type: 'button' },
            field: {
                name: 'Открыть каталог',
                description: 'Аниме-сериалы, онгоинги, полнометражные фильмы и поиск'
            },
            onChange: openCatalog
        });
    }

    function registerMenu() {
        if (Lampa.Menu && typeof Lampa.Menu.addButton === 'function') {
            Lampa.Menu.addButton(MENU_ICON, PLUGIN_NAME, openCatalog);
        } else {
            var menu = $('.menu .menu__list').eq(0);
            if (!menu.length) return;
            var button = $('<li class="menu__item selector"><div class="menu__ico">' + MENU_ICON + '</div><div class="menu__text"></div></li>');
            button.find('.menu__text').text(PLUGIN_NAME);
            button.on('hover:enter', openCatalog);
            menu.append(button);
        }
    }

    function init() {
        if (!window.Lampa || !Lampa.Activity || !Lampa.Select) return false;
        if (window[READY_FLAG]) return true;

        var initialized = false;
        try {
            registerSettings();
            initialized = true;
        } catch (settingsError) {
            console.error('[ANIME MAX] settings registration error', settingsError);
        }
        try {
            registerMenu();
            initialized = true;
        } catch (menuError) {
            console.error('[ANIME MAX] menu registration error', menuError);
        }

        if (initialized) {
            window[READY_FLAG] = true;
            console.log('[ANIME MAX] plugin initialized');
            if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show(PLUGIN_NAME + ' подключён');
            return true;
        }
        return false;
    }

    if (window.appready) init();
    if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') init();
        });
    }
})();
