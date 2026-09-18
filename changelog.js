/* ============================================================
   Changelog & Release History renderer
   Shared by /changelog.html (en) and /zh/changelog.html (zh-CN).
   Locale is derived from <html lang>.
   ============================================================ */
(function () {
  'use strict';

  var R2_BASE = 'https://download.mpe.run';
  var CHANGELOG_URL = R2_BASE + '/changelog.json';
  var MAC_NOTICE_KEY = 'mpe.changelog.macNotice.dismissed';

  var LANG = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';

  /* ---- Locale strings ---- */
  var STRINGS = {
    en: {
      locale: 'en-US',
      latest: 'Latest',
      prerelease: 'Pre-release',
      download: 'Download',
      current: 'Your OS',
      showDetails: 'Show details',
      hideDetails: 'Hide details',
      breaking: 'Breaking',
      macHint: 'Unsigned build — first launch needs a one-time approval.',
      learnMore: 'Guide',
      loading: 'Loading release history…',
      loadError: 'Could not load release history',
      loadErrorBody: 'The release server could not be reached.',
      retry: 'Retry',
      noReleases: 'No releases have been published yet.',
      copy: 'Copy',
      copied: 'Copied',
      sections: {},
      platforms: {
        windows: { name: 'Windows', meta: '.exe installer · x64' },
        macos: { name: 'macOS', meta: '.dmg · Universal (Intel + Apple silicon)' },
        linux_appimage: { name: 'Linux · AppImage', meta: 'Portable · x86_64' },
        linux_deb: { name: 'Linux · DEB', meta: '.deb package · amd64' },
        linux: { name: 'Linux · CLI', meta: '.tar.gz · x86_64' }
      }
    },
    zh: {
      locale: 'zh-CN',
      latest: '最新',
      prerelease: '预览版',
      download: '下载',
      current: '当前系统',
      showDetails: '展开说明',
      hideDetails: '收起说明',
      breaking: '破坏性变更',
      macHint: '未签名构建 — 首次打开需手动放行。',
      learnMore: '查看指南',
      loading: '正在加载发布历史…',
      loadError: '无法加载发布历史',
      loadErrorBody: '暂时无法连接发布服务器，请稍后重试。',
      retry: '重试',
      noReleases: '暂无已发布的版本。',
      copy: '复制',
      copied: '已复制',
      sections: {
        added: '新增',
        changed: '变更',
        fixed: '修复',
        removed: '移除',
        deprecated: '废弃',
        security: '安全',
        performance: '性能',
        docs: '文档'
      },
      platforms: {
        windows: { name: 'Windows', meta: '.exe 安装包 · x64' },
        macos: { name: 'macOS', meta: '.dmg · 通用版（Intel + Apple 芯片）' },
        linux_appimage: { name: 'Linux · AppImage', meta: '免安装 · x86_64' },
        linux_deb: { name: 'Linux · DEB', meta: '.deb 软件包 · amd64' },
        linux: { name: 'Linux · CLI', meta: '.tar.gz · x86_64' }
      }
    }
  };

  var S = STRINGS[LANG];

  /* ---- Platform metadata ---- */
  var PLATFORM_ORDER = ['windows', 'macos', 'linux_appimage', 'linux_deb', 'linux'];
  var PLATFORM_GROUP = {
    windows: 'windows',
    macos: 'macos',
    linux_appimage: 'linux',
    linux_deb: 'linux',
    linux: 'linux'
  };

  var ICONS = {
    windows: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M3 5.6 10.4 4.5v6.9H3zM12 4.3 21 3v8.4h-9zM3 12.6h7.4v6.9L3 18.4zM12 12.6h9V21l-9-1.2z"/></svg>',
    macos: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M17.05 12.54c-.02-2.4 1.96-3.55 2.05-3.61-1.12-1.63-2.86-1.86-3.48-1.88-1.48-.15-2.89.87-3.64.87-.75 0-1.91-.85-3.14-.83-1.61.02-3.1.94-3.93 2.38-1.68 2.91-.43 7.22 1.2 9.58.8 1.16 1.75 2.46 3 2.41 1.2-.05 1.66-.78 3.11-.78 1.45 0 1.86.78 3.13.75 1.29-.02 2.11-1.18 2.9-2.34.91-1.34 1.28-2.64 1.3-2.71-.03-.01-2.49-.96-2.52-3.83zM14.7 5.6c.66-.8 1.11-1.92.99-3.03-.95.04-2.11.63-2.8 1.43-.61.71-1.15 1.85-1.01 2.94 1.07.08 2.16-.54 2.82-1.34z"/></svg>',
    linux_appimage: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>',
    linux_deb: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>',
    linux: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
    package: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>'
  };

  var CHEVRON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';

  /* ---- Note section classification ---- */
  var SECTION_KINDS = {
    added: 'added',
    new: 'added',
    changed: 'changed',
    fixed: 'fixed',
    fixes: 'fixed',
    removed: 'removed',
    deprecated: 'deprecated',
    security: 'security',
    performance: 'performance',
    perf: 'performance',
    docs: 'docs',
    documentation: 'docs'
  };

  /* ---- Helpers ---- */
  function esc(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function inline(text) {
    var out = esc(text);
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return out;
  }

  function kindOf(title) {
    var key = String(title).toLowerCase().replace(/[^a-z]/g, '');
    return SECTION_KINDS[key] || 'plain';
  }

  function sectionLabel(section) {
    if (S.sections && S.sections[section.kind]) return S.sections[section.kind];
    return section.title || S.latest;
  }

  function formatDate(raw, locale) {
    if (!raw) return '';
    var d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    try {
      return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (err) {
      return d.toISOString().slice(0, 10);
    }
  }

  function detectGroup() {
    var ua = navigator.userAgent || '';
    if (/Macintosh|Mac OS X/i.test(ua)) return 'macos';
    if (/Windows|Win32|Win64/i.test(ua)) return 'windows';
    if (/Linux|X11|CrOS/i.test(ua)) return 'linux';
    return '';
  }

  function legacyCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        // Clipboard API can be denied by permission policy — fall back to the legacy path.
        if (!legacyCopy(text)) throw new Error('copy-unavailable');
      });
    }
    return legacyCopy(text) ? Promise.resolve() : Promise.reject(new Error('copy-unavailable'));
  }

  /* ---- Notes parsing (Keep a Changelog markdown subset) ---- */
  function parseNotes(markdown) {
    var lines = String(markdown === null || markdown === undefined ? '' : markdown)
      .replace(/\r\n?/g, '\n')
      .split('\n');
    var sections = [];
    var current = null;
    var paragraph = [];

    function openSection(title) {
      current = { title: title, kind: kindOf(title), items: [], paras: [] };
      sections.push(current);
    }

    function flushParagraph() {
      if (!paragraph.length) return;
      var text = paragraph.join(' ').replace(/\s+/g, ' ').trim();
      paragraph = [];
      if (!text) return;
      if (!current) openSection('');
      current.paras.push(text);
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var heading = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
      if (heading) {
        flushParagraph();
        openSection(heading[1]);
        continue;
      }
      var bullet = /^(\s*)([-*+]|\d{1,3}[.)])\s+(.*)$/.exec(line);
      if (bullet) {
        flushParagraph();
        if (!current) openSection('');
        current.items.push({
          text: bullet[3].trim(),
          ordered: /^\d/.test(bullet[2]),
          nested: bullet[1].length >= 2
        });
        continue;
      }
      if (!line.trim()) {
        flushParagraph();
        continue;
      }
      paragraph.push(line.trim());
    }
    flushParagraph();

    return sections.filter(function (section) {
      return Boolean(section.title) || section.items.length > 0 || section.paras.length > 0;
    });
  }

  function renderItem(item) {
    var text = item.text;
    var chip = '';
    var breaking = /^\*\*breaking(?:\s+change)?\*\*\s*:?\s*/i.exec(text);
    if (breaking) {
      chip = '<span class="chip-breaking">' + esc(S.breaking) + '</span>';
      text = text.slice(breaking[0].length);
    }
    return '<li' + (item.nested ? ' class="is-nested"' : '') + '>' + chip + inline(text) + '</li>';
  }

  function renderNotes(sections) {
    var html = '';
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i];
      html += '<section class="notes-section" data-kind="' + esc(section.kind) + '">';
      if (section.title) {
        html += '<h3 class="notes-title"><span class="notes-title-text">' + esc(sectionLabel(section)) + '</span>' +
          (section.items.length ? '<span class="notes-count">' + section.items.length + '</span>' : '') +
          '</h3>';
      }
      var index = 0;
      while (index < section.items.length) {
        var ordered = section.items[index].ordered;
        var run = [];
        while (index < section.items.length && section.items[index].ordered === ordered) {
          run.push(section.items[index]);
          index++;
        }
        html += ordered ? '<ol class="notes-list">' : '<ul class="notes-list">';
        for (var j = 0; j < run.length; j++) html += renderItem(run[j]);
        html += ordered ? '</ol>' : '</ul>';
      }
      for (var p = 0; p < section.paras.length; p++) {
        html += '<p class="notes-para">' + inline(section.paras[p]) + '</p>';
      }
      html += '</section>';
    }
    return html;
  }

  /* ---- Download buttons ---- */
  function orderedDownloadKeys(downloads) {
    var keys = [];
    for (var i = 0; i < PLATFORM_ORDER.length; i++) {
      if (downloads[PLATFORM_ORDER[i]]) keys.push(PLATFORM_ORDER[i]);
    }
    Object.keys(downloads).forEach(function (key) {
      if (keys.indexOf(key) === -1 && downloads[key]) keys.push(key);
    });
    return keys;
  }

  function renderDownloads(downloads, currentGroup, showMacHint) {
    var keys = orderedDownloadKeys(downloads);
    if (!keys.length) return '';

    var marked = false;
    var items = '';
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var info = (S.platforms && S.platforms[key]) || { name: key.replace(/_/g, ' '), meta: '' };
      var isCurrent = !marked && currentGroup && PLATFORM_GROUP[key] === currentGroup;
      if (isCurrent) marked = true;
      items += '<a class="dl-item' + (isCurrent ? ' is-current' : '') + '" href="' + esc(downloads[key]) + '" download>' +
        '<span class="dl-icon">' + (ICONS[key] || ICONS.package) + '</span>' +
        '<span class="dl-text">' +
          '<span class="dl-name">' + esc(info.name) + '</span>' +
          (info.meta ? '<span class="dl-meta">' + esc(info.meta) + '</span>' : '') +
        '</span>' +
        (isCurrent ? '<span class="dl-current-tag">' + esc(S.current) + '</span>' : '') +
        '</a>';
    }

    return '<div class="release-downloads">' +
      '<div class="dl-head">' +
        '<span class="dl-label">' + esc(S.download) + '</span>' +
        (showMacHint && downloads.macos
          ? '<span class="dl-note">' + esc(S.macHint) + ' <a href="docs.html#macos-unnotarized">' + esc(S.learnMore) + '</a></span>'
          : '') +
      '</div>' +
      '<div class="dl-group">' + items + '</div>' +
    '</div>';
  }

  /* ---- Release card ---- */
  function hasRealNotes(notes) {
    var text = String(notes === null || notes === undefined ? '' : notes).trim();
    if (!text) return false;
    // Placeholder emitted by the release pipeline when CHANGELOG.md had no section for the version.
    return !/^Release\s+v?\S+$/i.test(text);
  }

  function renderRelease(release, index, currentGroup) {
    var tag = release.tag || release.version || '';
    var display = tag || 'v?.?.?';
    var sections = hasRealNotes(release.notes) ? parseNotes(release.notes) : [];
    var isLatest = index === 0;
    var anchor = 'rel-' + String(display).replace(/[^A-Za-z0-9]+/g, '-').toLowerCase();
    var dateText = formatDate(release.date, S.locale);
    var dateAttr = release.date && !isNaN(new Date(release.date).getTime())
      ? new Date(release.date).toISOString().slice(0, 10)
      : '';

    var head = '<div class="release-head">' +
      '<div class="release-heading">' +
        '<h2 class="release-version">' + esc(display) + '</h2>' +
        (isLatest ? '<span class="release-badge badge-latest">' + esc(S.latest) + '</span>' : '') +
        (release.prerelease ? '<span class="release-badge badge-prerelease">' + esc(S.prerelease) + '</span>' : '') +
      '</div>' +
      (dateText ? '<time class="release-date" datetime="' + esc(dateAttr) + '">' + esc(dateText) + '</time>' : '') +
    '</div>';

    var card;
    if (sections.length) {
      var chips = sections.map(function (section) {
        return '<span class="notes-chip" data-kind="' + esc(section.kind) + '"><span class="chip-dot"></span>' +
          esc(sectionLabel(section)) +
          (section.items.length ? '<span class="chip-count">' + section.items.length + '</span>' : '') +
          '</span>';
      }).join('');

      card = '<details class="release-details"' + (isLatest ? ' open' : '') + '>' +
        '<summary class="release-summary">' +
          head +
          '<div class="release-summary-meta">' +
            '<span class="notes-chips">' + chips + '</span>' +
            '<span class="release-toggle">' +
              '<span class="toggle-open">' + esc(S.hideDetails) + '</span>' +
              '<span class="toggle-shut">' + esc(S.showDetails) + '</span>' +
              CHEVRON +
            '</span>' +
          '</div>' +
        '</summary>' +
        '<div class="release-body">' + renderNotes(sections) + '</div>' +
      '</details>';
    } else {
      card = '<div class="release-summary is-static">' + head + '</div>';
    }

    return '<article class="release-entry' + (isLatest ? ' is-latest' : '') + '" id="' + anchor + '">' +
      '<span class="release-node" aria-hidden="true"></span>' +
      '<div class="release-card">' + card + renderDownloads(release.downloads || {}, currentGroup, isLatest) + '</div>' +
    '</article>';
  }

  /* ---- macOS first-run notice ---- */
  function setupMacNotice() {
    var notice = document.getElementById('mac-notice');
    if (!notice) return;

    var dismissed = false;
    try { dismissed = window.localStorage.getItem(MAC_NOTICE_KEY) === '1'; } catch (err) { dismissed = false; }
    if (!dismissed) notice.hidden = false;

    var dismiss = document.getElementById('mac-dismiss');
    if (dismiss) {
      dismiss.addEventListener('click', function () {
        notice.hidden = true;
        try { window.localStorage.setItem(MAC_NOTICE_KEY, '1'); } catch (err) { /* private mode */ }
      });
    }

    var copy = document.getElementById('mac-copy');
    var cmd = document.getElementById('mac-cmd');
    if (!copy || !cmd) return;
    copy.textContent = S.copy;
    copy.addEventListener('click', function () {
      copyText(cmd.textContent.trim()).then(function () {
        copy.textContent = S.copied;
        copy.classList.add('is-copied');
        window.setTimeout(function () {
          copy.textContent = S.copy;
          copy.classList.remove('is-copied');
        }, 1600);
      }, function () { /* clipboard blocked — the command stays selectable */ });
    });
  }

  /* ---- Deduplicate repeated builds of the same version ---- */
  function dedupe(releases) {
    var seen = Object.create(null);
    var out = [];
    for (var i = 0; i < releases.length; i++) {
      var release = releases[i] || {};
      var key = release.tag || release.version;
      if (!key) continue;
      if (seen[key]) continue;
      seen[key] = true;
      out.push(release);
    }
    return out;
  }

  /* ---- Page bootstrap ---- */
  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function showStatus(statusEl, html, isError) {
    statusEl.className = 'download-status' + (isError ? ' error' : '');
    statusEl.innerHTML = html;
    statusEl.hidden = false;
  }

  function loadingMarkup() {
    return '<div class="spinner"></div><p>' + esc(S.loading) + '</p>';
  }

  function renderPage(releases, listEl, statusEl) {
    var unique = dedupe(releases);
    if (!unique.length) {
      showStatus(statusEl, '<h2>' + esc(S.noReleases) + '</h2>', false);
      return;
    }

    var currentGroup = detectGroup();
    var html = '';
    for (var i = 0; i < unique.length; i++) {
      html += renderRelease(unique[i], i, currentGroup);
    }
    listEl.innerHTML = html;
    listEl.hidden = false;
    statusEl.hidden = true;

    var first = unique[0];
    setText('stat-latest', first.tag || first.version || '—');
    setText('stat-updated', formatDate(first.date, S.locale) || '—');
    setText('stat-count', String(unique.length));
    var stats = document.getElementById('cl-stats');
    if (stats) stats.hidden = false;
  }

  function load(listEl, statusEl) {
    showStatus(statusEl, loadingMarkup(), false);
    fetch(CHANGELOG_URL)
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (releases) {
        renderPage(Array.isArray(releases) ? releases : [], listEl, statusEl);
      })
      .catch(function () {
        listEl.hidden = true;
        showStatus(
          statusEl,
          '<h2>' + esc(S.loadError) + '</h2><p>' + esc(S.loadErrorBody) + '</p>' +
            '<button type="button" class="btn btn-secondary btn-sm" id="cl-retry">' + esc(S.retry) + '</button>',
          true
        );
        var retry = document.getElementById('cl-retry');
        if (retry) {
          retry.addEventListener('click', function () {
            load(listEl, statusEl);
          });
        }
      });
  }

  function init() {
    var listEl = document.getElementById('release-list');
    var statusEl = document.getElementById('cl-status');
    if (!listEl || !statusEl) return;
    setupMacNotice();
    load(listEl, statusEl);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
