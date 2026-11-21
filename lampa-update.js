/*
 * @name LAMPA UPDATE
 * @author SanFlauerXX
 * @version 1.0.0
 * @description Проверка новых официальных версий приложения LAMPA.
 */
(function () {
    'use strict';

    var READY_FLAG = 'lampa_update_checker_ready';
    if (window[READY_FLAG]) return;

    var PLUGIN_NAME = 'LAMPA UPDATE';
    var COMPONENT = 'lampa_update_checker';
    var RELEASE_API = 'https://api.github.com/repos/lampa-app/LAMPA/releases/latest';
    var RELEASE_PAGE = 'https://github.com/lampa-app/LAMPA/releases/latest';
    var APK_URL = 'https://github.com/lampa-app/LAMPA/releases/latest/download/app-lite-release.apk';
    var CHECK_TIME_KEY = 'lampa_update_checker_last_check';
    var VERSION_OVERRIDE_KEY = 'lampa_update_checker_current_version';
    var CHECK_INTERVAL = 12 * 60 * 60 * 1000;

    var ICON = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2"/></svg>';

    function cleanVersion(value) {
        if (!value) return '';
        var match = String(value).match(/v?(\d+(?:\.\d+){1,3})/i);
        return match ? match[1] : '';
    }

    function currentVersion() {
        var stored = '';
        try {
            stored = Lampa.Storage && Lampa.Storage.get(VERSION_OVERRIDE_KEY);
        } catch (e) {}

        if (cleanVersion(stored)) return cleanVersion(stored);

        var candidates = [];
        try {
            if (Lampa.Manifest) {
                candidates.push(Lampa.Manifest.app_version);
                candidates.push(Lampa.Manifest.version);
            }
            if (Lampa.Config && Lampa.Config.get) candidates.push(Lampa.Config.get('app_version'));
            if (Lampa.Storage && Lampa.Storage.get) candidates.push(Lampa.Storage.get('app_version'));
            candidates.push(window.app_version);
            candidates.push(window.appVersion);
        } catch (e) {}

        for (var i = 0; i < candidates.length; i++) {
            var version = cleanVersion(candidates[i]);
            if (version) return version;
        }
        return '';
    }

    function compareVersions(a, b) {
        var aa = cleanVersion(a).split('.').map(Number);
        var bb = cleanVersion(b).split('.').map(Number);
        if (!aa[0] || !bb[0]) return 0;
        for (var i = 0; i < 4; i++) {
            var x = aa[i] || 0;
            var y = bb[i] || 0;
            if (x > y) return 1;
            if (x < y) return -1;
        }
        return 0;
    }

    function parseResponse(response) {
        if (typeof response === 'string') {
            try { response = JSON.parse(response); } catch (e) { return null; }
        }
        return response && response.tag_name ? response : null;
    }

    function openLink(url) {
        try {
            if (Lampa.Utils && typeof Lampa.Utils.openLink === 'function') {
                Lampa.Utils.openLink(url);
                return;
            }
        } catch (e) {}
        try { window.open(url, '_blank'); } catch (e) {}
    }

    function showRelease(release, silent) {
        var latest = cleanVersion(release.tag_name);
        var installed = currentVersion();
        var relation = installed ? compareVersions(latest, installed) : null;
        var message;

        if (!latest) {
            message = 'Не удалось прочитать номер последней версии.';
        } else if (!installed) {
            message = 'Последняя версия: ' + latest + '\nТекущую версию автоматически определить не удалось. Укажи её в настройках плагина для сравнения.';
        } else if (relation > 0) {
            message = 'Доступно обновление LAMPA!\nУстановлена: ' + installed + '\nПоследняя: ' + latest;
        } else if (relation < 0) {
            message = 'Установленная версия новее найденного релиза.\nУстановлена: ' + installed + '\nНа GitHub: ' + latest;
        } else {
            message = 'У тебя установлена последняя версия LAMPA: ' + installed;
        }

        if (release.name && release.name !== release.tag_name) message += '\n' + release.name;
        if (release.published_at) message += '\nДата релиза: ' + release.published_at.slice(0, 10);
        if (release.body) {
            var notes = String(release.body).replace(/\r/g, '').trim();
            if (notes.length > 500) notes = notes.slice(0, 500) + '…';
            if (notes) message += '\n\nИзменения:\n' + notes;
        }

        if (Lampa.Modal && Lampa.Modal.open) {
            var html = $('<div class="about" style="padding:1em;line-height:1.5;white-space:pre-wrap;"></div>').text(message);
            Lampa.Modal.open({
                title: PLUGIN_NAME,
                html: html,
                size: 'medium',
                buttons: [
                    {
                        name: 'Страница релиза',
                        onSelect: function () {
                            Lampa.Modal.close();
                            openLink(release.html_url || RELEASE_PAGE);
                        }
                    },
                    {
                        name: 'Скачать APK',
                        onSelect: function () {
                            Lampa.Modal.close();
                            openLink(APK_URL);
                        }
                    }
                ],
                onBack: function () {
                    Lampa.Modal.close();
                    Lampa.Controller.toggle('content');
                }
            });
        } else if (Lampa.Noty && Lampa.Noty.show) {
            Lampa.Noty.show(message);
        }

        if (silent && relation > 0 && Lampa.Noty && Lampa.Noty.show) {
            Lampa.Noty.show('Доступна новая версия LAMPA: ' + latest);
        }
    }

    function checkUpdates(silent) {
        if (Lampa.Noty && Lampa.Noty.show && !silent) Lampa.Noty.show('Проверяем обновления LAMPA…');

        var request = new Lampa.Reguest();
        request.timeout(15000);
        request.silent(RELEASE_API, function (response) {
            var release = parseResponse(response);
            if (!release) {
                if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show('Не удалось получить информацию о версии LAMPA.');
                return;
            }
            try { Lampa.Storage.set(CHECK_TIME_KEY, Date.now()); } catch (e) {}
            showRelease(release, silent);
        }, function () {
            if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show('Проверка не удалась. Проверь подключение к интернету.');
        }, false, {
            dataType: 'json',
            headers: { 'Accept': 'application/vnd.github+json' }
        });
    }

    function automaticCheck() {
        var last = 0;
        try { last = Number(Lampa.Storage.get(CHECK_TIME_KEY)) || 0; } catch (e) {}
        if (Date.now() - last < CHECK_INTERVAL) return;
        checkUpdates(true);
    }

    function registerSettings() {
        if (!Lampa.SettingsApi) return;

        Lampa.SettingsApi.addComponent({
            component: COMPONENT,
            name: PLUGIN_NAME,
            icon: ICON
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: { name: VERSION_OVERRIDE_KEY, type: 'input', values: '', default: '' },
            field: {
                name: 'Текущая версия LAMPA',
                description: 'Заполни вручную, если плагин не смог определить её автоматически. Например: 1.13.6'
            }
        });

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: { name: 'lampa_update_checker_manual', type: 'button' },
            field: {
                name: 'Проверить обновления сейчас',
                description: 'Проверка последнего официального релиза LAMPA на GitHub'
            },
            onChange: function () { checkUpdates(false); }
        });
    }

    function registerMenu() {
        if (Lampa.Menu && typeof Lampa.Menu.addButton === 'function') {
            Lampa.Menu.addButton(ICON, PLUGIN_NAME, function () { checkUpdates(false); });
        }
    }

    function init() {
        if (!window.Lampa || !Lampa.Reguest || !Lampa.Activity) return false;
        if (window[READY_FLAG]) return true;

        try { registerSettings(); } catch (e) { console.error('[LAMPA UPDATE] settings', e); }
        try { registerMenu(); } catch (e) { console.error('[LAMPA UPDATE] menu', e); }

        window[READY_FLAG] = true;
        console.log('[LAMPA UPDATE] plugin initialized');
        setTimeout(automaticCheck, 5000);
        return true;
    }

    if (window.appready) init();
    if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') init();
        });
    }
})();
