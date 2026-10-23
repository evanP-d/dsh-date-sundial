/**
 * Client half of the "Sundial" decoration.
 *
 * Draws a quiet date-progress strip below the composer: a tear-off calendar
 * tile, a live clock, and the elapsed fraction of today and of this year.
 * All visible text runs through the Client locale service; colors come from
 * the host theme tokens so light and dark themes both work.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-date-sundial',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'date-sundial';
    const DAY_MS = 24 * 60 * 60 * 1000;

    const DICTS = {
      en: {
        today: 'TODAY',
        year: 'YEAR',
        leftToday: 'Left today',
        daysLeft: 'days left this year',
        aria: 'Date timeline',
      },
      zh: {
        today: '今日',
        year: '今年',
        leftToday: '今日剩余',
        daysLeft: '天后今年结束',
        aria: '日期流逝',
      },
    };

    const pad = (value) => (value < 10 ? '0' : '') + value;
    const clamp = (value) => Math.min(1, Math.max(0, value));

    function intlPart(locale, options, date) {
      try {
        return new Intl.DateTimeFormat(locale, options).format(date);
      } catch (_) {
        return '';
      }
    }

    function useNow(step) {
      const [now, setNow] = React.useState(() => Date.now());
      React.useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), step);
        return () => clearInterval(timer);
      }, [step]);
      return now;
    }

    function useLocaleRevision(locale) {
      const [, bump] = React.useState(0);
      React.useEffect(() => {
        if (!locale || typeof locale.subscribe !== 'function') return undefined;
        return locale.subscribe(() => bump((value) => value + 1));
      }, [locale]);
    }

    const styles = {
      root: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '3px 2px',
        maxWidth: 340,
        color: 'var(--dsw-alias-label-secondary)',
        userSelect: 'none',
        cursor: 'default',
      },
      tile: {
        width: 38,
        height: 42,
        boxSizing: 'border-box',
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 9,
        background: 'var(--dsw-alias-bg-layer-1)',
      },
      tileMonth: {
        marginBottom: 3,
        fontSize: 8,
        lineHeight: 1,
        letterSpacing: '0.08em',
        color: 'var(--dsw-alias-label-secondary)',
      },
      tileDay: {
        fontSize: 16,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--dsw-alias-label-primary)',
      },
      body: {
        flex: 1,
        minWidth: 216,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      },
      head: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 10,
        lineHeight: 1.2,
      },
      date: {
        fontSize: 11,
        letterSpacing: '0.03em',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      },
      clock: {
        fontSize: 11.5,
        letterSpacing: '0.05em',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        color: 'var(--dsw-alias-label-primary)',
      },
      row: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        lineHeight: 1,
      },
      label: {
        minWidth: 30,
        fontSize: 9,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      },
      track: {
        position: 'relative',
        flex: 1,
        height: 3,
        borderRadius: 999,
        overflow: 'hidden',
        background: 'var(--dsw-alias-border-l1)',
      },
      fill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        borderRadius: 999,
        background: 'var(--dsw-alias-brand-primary)',
      },
      pct: {
        minWidth: 30,
        fontSize: 9,
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      },
    };

    function Sundial({ locale, translate }) {
      useLocaleRevision(locale);
      const now = useNow(1000);

      const snapshot = locale && typeof locale.getLocale === 'function' ? locale.getLocale() : undefined;
      const active = snapshot && snapshot.active ? snapshot.active : 'en';
      const t = translate || ((key) => DICTS.en[key] || key);

      const current = new Date(now);
      const year = current.getFullYear();
      const month = current.getMonth();
      const day = current.getDate();

      const dayStart = new Date(year, month, day).getTime();
      const dayEnd = new Date(year, month, day + 1).getTime();
      const yearStart = new Date(year, 0, 1).getTime();
      const yearEnd = new Date(year + 1, 0, 1).getTime();

      const dayFraction = clamp((now - dayStart) / (dayEnd - dayStart));
      const yearFraction = clamp((now - yearStart) / (yearEnd - yearStart));
      const dayPercent = (dayFraction * 100).toFixed(1);
      const yearPercent = (yearFraction * 100).toFixed(1);

      const leftToday = Math.max(0, dayEnd - now);
      const leftHours = Math.floor(leftToday / 3600000);
      const leftMinutes = Math.floor((leftToday % 3600000) / 60000);
      const leftDays = Math.max(0, Math.ceil((yearEnd - now) / DAY_MS));

      const dateText = year + '.' + pad(month + 1) + '.' + pad(day);
      const weekday = intlPart(active, { weekday: 'short' }, current);
      const monthLabel = intlPart(active, { month: 'short' }, current) || String(month + 1);
      const clock =
        pad(current.getHours()) + ':' + pad(current.getMinutes()) + ':' + pad(current.getSeconds());

      const ariaLabel =
        t('aria') + ' ' + dateText + (weekday ? ' ' + weekday : '') +
        ', ' + t('today') + ' ' + dayPercent + '%, ' + t('year') + ' ' + yearPercent + '%';
      const tooltip =
        t('leftToday') + ' ' + leftHours + ':' + pad(leftMinutes) +
        ' · ' + leftDays + ' ' + t('daysLeft');

      const progressRow = (key, label, fraction, percent) =>
        h('div', { key, style: styles.row }, [
          h('span', { key: 'label', style: styles.label }, label),
          h(
            'span',
            { key: 'track', style: styles.track },
            h('span', {
              style: Object.assign({}, styles.fill, { width: (fraction * 100).toFixed(3) + '%' }),
            }),
          ),
          h('span', { key: 'pct', style: styles.pct }, percent + '%'),
        ]);

      return h(
        'div',
        {
          role: 'img',
          'aria-label': ariaLabel,
          title: tooltip,
          style: styles.root,
        },
        [
          h('div', { key: 'tile', style: styles.tile, 'aria-hidden': true }, [
            h('span', { key: 'month', style: styles.tileMonth }, monthLabel.toUpperCase()),
            h('span', { key: 'day', style: styles.tileDay }, pad(day)),
          ]),
          h('div', { key: 'body', style: styles.body, 'aria-hidden': true }, [
            h('div', { key: 'head', style: styles.head }, [
              h('span', { key: 'date', style: styles.date }, dateText + (weekday ? ' · ' + weekday : '')),
              h('span', { key: 'clock', style: styles.clock }, clock),
            ]),
            progressRow('today', t('today'), dayFraction, dayPercent),
            progressRow('year', t('year'), yearFraction, yearPercent),
          ]),
        ],
      );
    }

    return {
      inject: ['slots', 'locale'],

      apply(ctx) {
        const locale = ctx.locale || ctx.get('locale');
        let translate;

        if (locale && typeof locale.register === 'function' && typeof locale.bind === 'function') {
          ctx.effect(() => {
            const disposers = [];
            let ids = ['en'];
            try {
              const snapshot = locale.getLocale();
              if (snapshot && Array.isArray(snapshot.locales) && snapshot.locales.length) {
                ids = snapshot.locales.map((definition) => definition.id);
              }
            } catch (_) {
              /* keep the English fallback */
            }
            for (const id of new Set(ids.concat('en'))) {
              try {
                disposers.push(locale.register(NS, id, /^zh/i.test(id) ? DICTS.zh : DICTS.en));
              } catch (error) {
                console.warn('[date-sundial] could not register locale ' + id, error);
              }
            }
            return () => {
              for (const dispose of disposers) dispose();
            };
          }, 'date-sundial:locale');

          try {
            translate = locale.bind(NS);
          } catch (_) {
            translate = undefined;
          }
        }

        ctx.slots.inject('conversation.composer.dock', () =>
          ctx.slots.register(
            {
              name: 'conversation.composer.dock',
              id: 'date-sundial',
              order: 2,
            },
            (props) => h(Sundial, { locale, translate }),
          ),
        );
      },
    };
  },
});
