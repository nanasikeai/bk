const TZ = "Asia/Shanghai";

function getShanghaiYmd(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getShanghaiYm(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  if (!year || !month) {
    throw new Error("Failed to parse Shanghai date");
  }
  return { year, month };
}

export function getShanghaiDayStart(date = new Date()) {
  const ymd = getShanghaiYmd(date);
  return new Date(`${ymd}T00:00:00+08:00`);
}

export function getShanghaiMonthStart(date = new Date()) {
  const { year, month } = getShanghaiYm(date);
  return new Date(`${year}-${month}-01T00:00:00+08:00`);
}

export function getShanghaiWeekStart(date = new Date()) {
  const dayStart = getShanghaiDayStart(date);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(date);

  const daysFromMonday: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };

  const offset = daysFromMonday[weekday] ?? 0;
  return new Date(dayStart.getTime() - offset * 24 * 60 * 60 * 1000);
}
