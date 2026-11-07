/*
 * @name DORAMA MAX
 * @author SanFlauerXX
 * @version 1.3.0
 * @description Каталог южнокорейских сериалов для Lampa.
 * Каталог и метаданные TMDB; не является видеоплеером или источником видео.
 */
(function () {
    'use strict';

    if (window.dorama_max_130_ready) return;
    window.dorama_max_130_ready = true;

    var PLUGIN_NAME = 'DORAMA MAX';
    var SETTINGS_COMPONENT = 'dorama_max';
    var SETTINGS_BUTTON = 'dorama_max_open_catalog';
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
        from.setFullYear(from.getFullYear() - 1);

        var korea = {
            with_original_language: 'ko',
            with_origin_country: 'KR'
        };

        return [
            {
                title: 'Новинки',
                sort_by: 'first_air_date.desc',
                filter: Object.assign({}, korea, {
                    'first_air_date.gte': dateString(from),
                    'first_air_date.lte': dateString(today)
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
                    with_genres: '18',
                    with_keywords: '10873'
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
                    with_genres: '10759'
                })
            },
            {
                title: 'Романтика',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea, {
                    with_genres: '18',
                    with_keywords: '9840'
                })
            },
            {
                title: 'Триллеры и детективы',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea, {
                    with_genres: '9648'
                })
            },
            {
                title: 'Мистика и фантастика',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea, {
                    with_genres: '10765'
                })
            },
            {
                title: 'Лучшие дорамы',
                sort_by: 'vote_average.desc',
                filter: Object.assign({}, korea, {
                    'vote_count.gte': '100'
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
            url: 'discover/tv',
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
            title: 'Поиск корейского сериала',
            value: '',
            free: true
        }, function (query) {
            query = String(query || '').trim();
            if (!query) {
                Lampa.Controller.toggle(returnController);
                return;
            }

            Lampa.Activity.push({
                url: 'search/tv',
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
        items.push({ title: 'Поиск корейских сериалов', search: true });

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
                description: 'Новинки, популярные и жанры корейских дорам'
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
        if (!window.Lampa || !Lampa.Activity || !Lampa.Select) return;
        try {
            registerSettings();
            registerMenu();
            console.log('[DORAMA MAX] plugin initialized');
            if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show(PLUGIN_NAME + ' подключён');
        } catch (error) {
            console.error('[DORAMA MAX] initialization error', error);
            if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show('DORAMA MAX: ошибка запуска');
        }
    }

    if (window.appready) init();
    else if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') init();
        });
    }
})();
