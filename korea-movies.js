/*
 * @name KOREA MOVIES
 * @author SanFlauerXX
 * @version 1.0.0
 * @description Каталог южнокорейских полнометражных фильмов для Lampa.
 * Только каталог и метаданные TMDB; не видеоплеер и не источник видео.
 */
(function () {
    'use strict';

    var READY_FLAG = 'korea_movies_100_ready';
    if (window[READY_FLAG]) return;

    var PLUGIN_NAME = 'KOREA MOVIES';
    var SETTINGS_COMPONENT = 'korea_movies';
    var SETTINGS_BUTTON = 'korea_movies_open_catalog';
    var MENU_ICON = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M4 3h16v18H4zM7 6v12h10V6z"/></svg>';

    function dateString(date) {
        var year = date.getFullYear();
        var month = ('0' + (date.getMonth() + 1)).slice(-2);
        var day = ('0' + date.getDate()).slice(-2);
        return year + '-' + month + '-' + day;
    }

    function categories() {
        var today = new Date();
        var from = new Date();
        from.setFullYear(from.getFullYear() - 3);

        var korea = {
            with_original_language: 'ko',
            with_origin_country: 'KR'
        };

        return [
            {
                title: 'Новинки',
                sort_by: 'release_date.desc',
                filter: Object.assign({}, korea, {
                    'release_date.gte': dateString(from),
                    'release_date.lte': dateString(today),
                    include_adult: false
                })
            },
            {
                title: 'Популярные',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea)
            },
            {
                title: 'Школьные банды и драки',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea, {
                    with_genres: '18,28'
                })
            },
            {
                title: 'Криминал',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea, {
                    with_genres: '80'
                })
            },
            {
                title: 'Месть',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea, {
                    with_keywords: '9748'
                })
            },
            {
                title: 'Экшен',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea, {
                    with_genres: '28'
                })
            },
            {
                title: 'Романтика',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea, {
                    with_genres: '10749'
                })
            },
            {
                title: 'Триллеры и детективы',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea, {
                    with_genres: '53,9648'
                })
            },
            {
                title: 'Ужасы',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea, {
                    with_genres: '27'
                })
            },
            {
                title: 'Мистика и фантастика',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea, {
                    with_genres: '14,878'
                })
            },
            {
                title: 'Комедии',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea, {
                    with_genres: '35'
                })
            },
            {
                title: 'Лучшие корейские фильмы',
                sort_by: 'vote_average.desc',
                filter: Object.assign({}, korea, {
                    'vote_count.gte': '50'
                })
            }
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
            url: 'discover/movie',
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

        Lampa.Input.edit({
            title: 'Поиск южнокорейского фильма',
            value: '',
            free: true
        }, function (query) {
            query = String(query || '').trim();
            if (!query) {
                Lampa.Controller.toggle(returnController);
                return;
            }

            Lampa.Activity.push({
                url: 'search/movie',
                title: PLUGIN_NAME + ' — ' + query,
                component: 'category_full',
                source: 'tmdb',
                page: 1,
                query: encodeURIComponent(query),
                filter: {
                    with_original_language: 'ko',
                    with_origin_country: 'KR'
                }
            });
        });
    }

    function openCatalog() {
        var returnController = currentController();
        var items = categories();
        items.push({ title: 'Поиск корейских фильмов', search: true });

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
            param: {
                name: SETTINGS_BUTTON,
                type: 'button'
            },
            field: {
                name: 'Открыть каталог',
                description: 'Только южнокорейские полнометражные фильмы'
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
            console.error('[KOREA MOVIES] settings registration error', settingsError);
        }
        try {
            registerMenu();
            initialized = true;
        } catch (menuError) {
            console.error('[KOREA MOVIES] menu registration error', menuError);
        }

        if (initialized) {
            window[READY_FLAG] = true;
            console.log('[KOREA MOVIES] plugin initialized');
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
