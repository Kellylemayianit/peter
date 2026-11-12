const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

export const fmtDay = (d) => dayFmt.format(d).replace(',', '');           // "Thu 12 Nov"
export const fmtTime = (d) => timeFmt.format(d);                           // "17:30"
export const fmtKickoff = (d) => `${fmtDay(d)}, ${fmtTime(d)}`;
export const hoursUntil = (d) => Math.max(0, Math.round((d - Date.now()) / 36e5));

// Next occurrence of a weekday (0=Sun..6=Sat) at hh:mm local time.
export function nextWeekday(weekday, hh, mm = 0) {
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7));
  if (d < new Date()) d.setDate(d.getDate() + 7);
  return d;
}
