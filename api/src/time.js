// Time zone helpers. Becca runs in UTC on the server but talks in the person's time.
export function offsetFor(tz, date = new Date()) {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
    .formatToParts(date).find((p) => p.type === 'timeZoneName')?.value || 'GMT';
  const m = part.match(/GMT([+-]\d{2}):?(\d{2})?/);
  return m ? `${m[1]}:${m[2] || '00'}` : '+00:00';
}
export function localNowText(tz) {
  const d = new Date();
  const text = new Intl.DateTimeFormat('en-GB', { timeZone: tz, dateStyle: 'full', timeStyle: 'short' }).format(d);
  return `${text} (${tz}, UTC${offsetFor(tz, d)})`;
}
export function dayBounds(tz) {
  const d = new Date();
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(d).map((p) => [p.type, p.value]));
  const off = offsetFor(tz, d);
  const start = new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00${off}`);
  return { from: start.toISOString(), to: new Date(start.getTime() + 86400000).toISOString() };
}
export const when = (iso, tz) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso));
