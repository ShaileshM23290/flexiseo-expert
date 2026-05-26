const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseDate(value: Date | string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Fixed UTC formatting — avoids server/client locale hydration mismatches. */
export function formatAdminDate(value: Date | string) {
  const d = parseDate(value);
  if (!d) return "—";

  let hours = d.getUTCHours();
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}, ${hours}:${minutes} ${ampm} UTC`;
}

export function formatAdminDateShort(value: Date | string) {
  const d = parseDate(value);
  if (!d) return "—";

  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
