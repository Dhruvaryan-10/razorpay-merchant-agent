/**
 * Formatting for a merchant in India: en-IN digit grouping (₹3,84,210),
 * compact lakh/crore forms for tight spaces, and dates read the way people
 * talk about recent orders ("Today, 14:12", "Yesterday", "6 Oct").
 */

const moneyFormatters = new Map<string, Intl.NumberFormat>();

function moneyFormatter(currency: string, fractionDigits: number) {
  const key = `${currency}:${fractionDigits}`;
  let formatter = moneyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    moneyFormatters.set(key, formatter);
  }
  return formatter;
}

/** ₹48,210 — paise shown only when the amount has them. */
export function formatMoney(amount: number | null | undefined, currency = 'INR') {
  const value = Number.isFinite(amount) ? (amount as number) : 0;
  const hasPaise = Math.round(value * 100) % 100 !== 0;
  return moneyFormatter(currency, hasPaise ? 2 : 0).format(value);
}

/** ₹4.8L, ₹1.2Cr, ₹48.2K: for chart labels and other tight spaces. */
export function formatMoneyCompact(amount: number, currency = 'INR') {
  const symbol = currency === 'INR' ? '₹' : '';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '−' : '';
  const trim = (n: number) => n.toFixed(n >= 10 ? 0 : 1).replace(/\.0$/, '');
  if (!symbol) return formatMoney(amount, currency);
  if (abs >= 1e7) return `${sign}${symbol}${trim(abs / 1e7)}Cr`;
  if (abs >= 1e5) return `${sign}${symbol}${trim(abs / 1e5)}L`;
  if (abs >= 1e3) return `${sign}${symbol}${trim(abs / 1e3)}K`;
  return `${sign}${symbol}${Math.round(abs)}`;
}

const numberFormatter = new Intl.NumberFormat('en-IN');

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function plural(count: number, one: string, many = `${one}s`) {
  return `${formatNumber(count)} ${count === 1 ? one : many}`;
}

/** Percentage change, or null when there is no base to compare against. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export function formatPercent(value: number, digits = 1) {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toFixed(digits)}%`;
}

function parse(date: string | null | undefined): Date | null {
  if (!date) return null;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const timeFormatter = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
const dayMonthFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const fullDateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const weekdayFormatter = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
const shortWeekdayFormatter = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

export function formatTime(date: string | null | undefined) {
  const d = parse(date);
  return d ? timeFormatter.format(d) : '';
}

/** "Today, 14:12" · "Yesterday, 09:05" · "6 Oct" · "6 Oct 2025" for older years. */
export function formatWhen(date: string | null | undefined, now = new Date()) {
  const d = parse(date);
  if (!d) return '—';
  const days = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / 86_400_000);
  if (days === 0) return `Today, ${timeFormatter.format(d)}`;
  if (days === 1) return `Yesterday, ${timeFormatter.format(d)}`;
  if (d.getFullYear() === now.getFullYear()) return dayMonthFormatter.format(d);
  return fullDateFormatter.format(d);
}

export function formatDate(date: string | null | undefined) {
  const d = parse(date);
  return d ? fullDateFormatter.format(d) : '—';
}

export function formatDayMonth(date: string | null | undefined) {
  const d = parse(date);
  return d ? dayMonthFormatter.format(d) : '—';
}

export function formatDateTime(date: string | null | undefined) {
  const d = parse(date);
  return d ? `${fullDateFormatter.format(d)}, ${timeFormatter.format(d)}` : '—';
}

/** "Thursday, 8 October" for page headers. */
export function formatToday(now = new Date()) {
  return weekdayFormatter.format(now);
}

export function formatShortDay(date: string | null | undefined) {
  const d = parse(date);
  return d ? shortWeekdayFormatter.format(d) : '—';
}

/** "3 days", "5 hours", "12 min": how long something has been waiting. */
export function formatAge(date: string | null | undefined, now = new Date()) {
  const d = parse(date);
  if (!d) return '';
  const minutes = Math.max(0, Math.round((now.getTime() - d.getTime()) / 60_000));
  if (minutes < 60) return plural(minutes, 'min', 'min');
  const hours = Math.round(minutes / 60);
  if (hours < 48) return plural(hours, 'hour');
  return plural(Math.round(hours / 24), 'day');
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '·'
  );
}

/** r•••@example.com: emails in tables are masked so screen sharing is safe. */
export function maskEmail(email: string) {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  return `${user.slice(0, 1)}•••@${domain}`;
}

/** WooCommerce returns HTML descriptions; show them as plain text. */
export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
