export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function appUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  try {
    const url = new URL(raw);
    // A trailing dot on the hostname (e.g. "example.netlify.app.") is valid DNS
    // but breaks the TLS certificate match, causing ERR_SSL_PROTOCOL_ERROR.
    url.hostname = url.hostname.replace(/\.+$/, "");
    return url.origin;
  } catch {
    return raw.replace(/[./]+$/, "");
  }
}
