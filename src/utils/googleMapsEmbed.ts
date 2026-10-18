// The "Embed a map" snippet from Google Maps is a full <iframe ...> tag. Admins may paste the
// whole tag, part of it, or only the link: keep just the Google Maps embed URL.
const MAP_EMBED_URL = /https:\/\/www\.google\.com\/maps\/embed[^\s"'<>]*/i;

export const extractMapEmbedUrl = (value: string): string =>
  value.replace(/&amp;/g, "&").match(MAP_EMBED_URL)?.[0] ?? "";
