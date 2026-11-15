/*
 * @name DORAMA MAX
 * @author SanFlauerXX
 * @version 1.7.3
 * @description Каталог южнокорейских дорам и фильмов для Lampa.
 * Каталог и метаданные TMDB; не является видеоплеером или источником видео.
 */
(function () {
    'use strict';

    if (window.dorama_max_173_ready) return;

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
        // Берём достаточно широкий период, чтобы категория не оказывалась пустой
        // при задержках обновления каталога TMDB.
        from.setFullYear(from.getFullYear() - 3);

        var korea = {
            with_original_language: 'ko',
            with_origin_country: 'KR'
        };

        return [
            {
                title: 'Новинки',
                media_type: 'tv',
                sort_by: 'first_air_date.desc',
                filter: Object.assign({}, korea, {
                    'first_air_date.gte': dateString(from),
                    'first_air_date.lte': dateString(today),
                    include_null_first_air_dates: false
                })
            },
            {
                title: 'Популярные',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea)
            },
            {
                title: 'Школьные драки и противостояния',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea, {
                    with_genres: '18,28'
                })
            },
            {
                title: 'Буллинг и школьная травля',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea, {
                    with_genres: '18,53'
                })
            },
            {
                title: 'Подростковые банды и криминал',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea, {
                    with_genres: '18,80'
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
            },
            // Единая категория южнокорейских полнометражных фильмов
            {
                title: 'Фильмы',
                media_type: 'movie',
                sort_by: 'popularity.desc',
                filter: Object.assign({}, korea)
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
            url: 'discover/' + (category.media_type || 'tv'),
            title: PLUGIN_NAME + ' — ' + category.title,
            component: 'category_full',
            source: 'tmdb',
            page: 1,
            sort_by: category.sort_by,
            filter: category.filter
        });
    }

    function openSearch(mediaType) {
        var returnController = currentController();
        Lampa.Input.edit({
            title: mediaType === 'movie' ? 'Поиск корейского фильма' : 'Поиск корейского сериала',
            value: '',
            free: true
        }, function (query) {
            query = String(query || '').trim();
            if (!query) {
                Lampa.Controller.toggle(returnController);
                return;
            }

            Lampa.Activity.push({
                url: 'search/' + (mediaType || 'tv'),
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

        items.push({
            title: 'Поиск корейских сериалов',
            search: true,
            media_type: 'tv'
        });

        Lampa.Select.show({
            title: PLUGIN_NAME,
            items: items,
            onSelect: function (item) {
                Lampa.Select.close();
                if (item.search) openSearch(item.media_type);
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
                description: 'Корейские сериалы и полнометражные фильмы по жанрам'
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
        // Не отмечаем плагин запущенным, пока Lampa действительно не готова.
        // Иначе ранняя загрузка скрипта навсегда блокирует повторную инициализацию.
        if (!window.Lampa || !Lampa.Activity || !Lampa.Select) return false;
        if (window.dorama_max_173_ready) return true;

        var initialized = false;
        try {
            registerSettings();
            initialized = true;
        } catch (settingsError) {
            console.error('[DORAMA MAX] settings registration error', settingsError);
        }
        try {
            registerMenu();
            initialized = true;
        } catch (menuError) {
            console.error('[DORAMA MAX] menu registration error', menuError);
        }

        if (initialized) {
            window.dorama_max_173_ready = true;
            console.log('[DORAMA MAX] plugin initialized');
            if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show(PLUGIN_NAME + ' подключён');
            return true;
        }
        return false;
    }

    // Проверяем готовность сразу и подписываемся на событие ready независимо
    // от текущего appready: это покрывает оба порядка загрузки плагинов и Lampa.
    if (window.appready) init();
    if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') init();
        });
    }
})();
