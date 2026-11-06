/*
 * @name DORAMA MAX
 * @author SanFlauerXX
 * @version 1.2.1
 * @description Каталог южнокорейских сериалов.
 * Только каталог TMDB, без видеоплееров и торрентов.
 */
(function () {
    'use strict';

    if (window.dorama_max_plugin_loaded) return;
    window.dorama_max_plugin_loaded = true;

    var ENTRY_ID = 'dorama_max_entry';
    var pluginName = 'DORAMA MAX';

    function dateString(date) {
        var y = date.getFullYear();
        var m = ('0' + (date.getMonth() + 1)).slice(-2);
        var d = ('0' + date.getDate()).slice(-2);
        return y + '-' + m + '-' + d;
    }

    function getCategories() {
        var today = new Date();
        var past = new Date();
        past.setFullYear(past.getFullYear() - 1);

        return [
            {
                title: 'Новинки',
                sort_by: 'first_air_date.desc',
                filter: {
                    with_original_language: 'ko',
                    with_origin_country: 'KR',
                    'first_air_date.gte': dateString(past),
                    'first_air_date.lte': dateString(today)
                }
            },
            {
                title: 'Популярные',
                sort_by: 'popularity.desc',
                filter: {
                    with_original_language: 'ko',
                    with_origin_country: 'KR'
                }
            },
            {
                title: 'Школьные банды и драки',
                sort_by: 'popularity.desc',
                filter: {
                    with_original_language: 'ko',
                    with_origin_country: 'KR',
                    with_genres: '18',
                    with_keywords: '10873'
                }
            },
            {
                title: 'Криминал',
                sort_by: 'popularity.desc',
                filter: {
                    with_original_language: 'ko',
                    with_origin_country: 'KR',
                    with_genres: '80'
                }
            },
            {
                title: 'Месть',
                sort_by: 'popularity.desc',
                filter: {
                    with_original_language: 'ko',
                    with_origin_country: 'KR',
                    with_keywords: '9748'
                }
            },
            {
                title: 'Экшен',
                sort_by: 'popularity.desc',
                filter: {
                    with_original_language: 'ko',
                    with_origin_country: 'KR',
                    with_genres: '10759'
                }
            },
            {
                title: 'Романтика',
                sort_by: 'popularity.desc',
                filter: {
                    with_original_language: 'ko',
                    with_origin_country: 'KR',
                    with_genres: '10749'
                }
            },
            {
                title: 'Триллеры и детективы',
                sort_by: 'popularity.desc',
                filter: {
                    with_original_language: 'ko',
                    with_origin_country: 'KR',
                    with_genres: '9648'
                }
            },
            {
                title: 'Мистика и фантастика',
                sort_by: 'popularity.desc',
                filter: {
                    with_original_language: 'ko',
                    with_origin_country: 'KR',
                    with_genres: '10765'
                }
            },
            {
                title: 'Лучшие дорамы',
                sort_by: 'vote_average.desc',
                filter: {
                    with_original_language: 'ko',
                    with_origin_country: 'KR',
                    'vote_count.gte': '100'
                }
            }
        ];
    }

    function openCategory(category) {
        Lampa.Activity.push({
            url: 'discover/tv',
            title: pluginName + ' — ' + category.title,
            component: 'category_full',
            source: 'tmdb',
            card_type: true,
            page: 1,
            sort_by: category.sort_by,
            filter: category.filter
        });
    }

    function openSearch() {
        var controller = Lampa.Controller.enabled().name;

        Lampa.Input.edit({
            title: 'Поиск корейской дорамы',
            value: '',
            free: true
        }, function (query) {
            query = String(query || '').trim();

            if (!query) {
                Lampa.Controller.toggle(controller);
                return;
            }

            Lampa.Activity.push({
                url: 'search/tv',
                title: pluginName + ' — ' + query,
                component: 'category_full',
                source: 'tmdb',
                card_type: true,
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
        var controller = Lampa.Controller.enabled().name;
        var categories = getCategories();

        var items = categories.map(function (category) {
            return {
                title: category.title,
                category: category
            };
        });

        items.push({
            title: 'Поиск корейской дорамы',
            search: true
        });

        Lampa.Select.show({
            title: pluginName,
            items: items,
            onBack: function () {
                Lampa.Controller.toggle(controller);
            },
            onSelect: function (item) {
                if (item.search) {
                    openSearch();
                } else if (item.category) {
                    openCategory(item.category);
                }
            }
        });
    }

    function addSettingsEntry() {
        if (!Lampa.Settings || !Lampa.Settings.main) return;

        var settings = Lampa.Settings.main();
        var render = settings.render();

        if (render.find('[data-component="' + ENTRY_ID + '"]').length) return;

        var more = render.find('[data-component="more"]').first();
        if (!more.length) return;

        var field = $(
            '<div class="settings-param selector" data-component="' + ENTRY_ID + '">' +
                '<div class="settings-param__name">' + pluginName + '</div>' +
                '<div class="settings-param__descr">Каталог южнокорейских сериалов</div>' +
            '</div>'
        );

        more.after(field);
        settings.update();
    }

    function startPlugin() {
        if (window.dorama_max_initialized) return;
        window.dorama_max_initialized = true;

        if (!window.Lampa || !Lampa.Settings ||
            !Lampa.Select || !Lampa.Activity) return;

        addSettingsEntry();

        Lampa.Settings.listener.follow('open', function (event) {
            if (event.name !== 'main') return;

            var field = event.body.find(
                '[data-component="' + ENTRY_ID + '"]'
            );

            if (field.length && !field.data('dmax-bound')) {
                field.data('dmax-bound', true);
                field.on('hover:enter', openCatalog);
            }
        });

        if (Lampa.Noty && Lampa.Noty.show) {
            Lampa.Noty.show(pluginName + ' подключён');
        }
    }

    if (window.appready) {
        startPlugin();
    } else if (window.Lampa &&
               Lampa.Listener &&
               Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') startPlugin();
        });
    }
})();
