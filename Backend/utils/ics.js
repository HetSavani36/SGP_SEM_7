// Minimal RFC-5545 invite so interviews work even if Google isn't connected.
const fmt = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s = "") => String(s).replace(/([,;\\])/g, "\\$1").replace(/\r?\n/g, "\\n");

export function buildIcs({ uid, title, description, location, startsAt, endsAt, organizerEmail }) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CampusHire//Interview//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}@campushire`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(startsAt)}`,
    `DTEND:${fmt(endsAt)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(description)}`,
    location ? `LOCATION:${esc(location)}` : "",
    organizerEmail ? `ORGANIZER:mailto:${organizerEmail}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
