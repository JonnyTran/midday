export function getAppUrl() {
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    return "https://midday.ts.jonnytran.engineer";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "https://midday.ts.jonnytran.engineer";
}

export function getEmailUrl() {
  if (process.env.NODE_ENV === "development") {
    return "https://midday.ts.jonnytran.engineer";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "https://midday.ts.jonnytran.engineer";
}

export function getWebsiteUrl() {
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    return "https://midday.ts.jonnytran.engineer";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "https://midday.ts.jonnytran.engineer";
}

export function getCdnUrl() {
  return "https://cdn.midday.ai";
}
