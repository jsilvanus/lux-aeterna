import { imageUploadEnabled } from "@/lib/featureFlags";
import { ensureAdminRequest } from "@/lib/adminApi";
import { getSiteSettings, updateSiteSettings } from "@/lib/db";
import { parseImageValues, validateImages } from "@/lib/imageValidation";

const MAX_TITLE_LINKS = 20;
const MAX_TITLE_LENGTH = 120;
const MAX_URL_LENGTH = 2048;

function parseTitleLinks(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, MAX_TITLE_LINKS)
    .map((item) => ({
      title: String(item?.title ?? "").trim().slice(0, MAX_TITLE_LENGTH),
      url: String(item?.url ?? "").trim().slice(0, MAX_URL_LENGTH),
      active: Boolean(item?.active),
    }))
    .filter((item) => item.title && item.url);
}

function titleLinksValid(links) {
  for (const item of links) {
    try {
      const parsed = new URL(item.url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return false;
      }
    } catch {
      return false;
    }
  }
  return true;
}

export async function GET(request) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const data = await getSiteSettings();
  return Response.json(data);
}

export async function PUT(request) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const mainImages = parseImageValues(body.mainImages);
  const imageValidation = validateImages(mainImages, { allowDataUrls: imageUploadEnabled() });
  if (imageValidation.error) {
    const status = imageValidation.error === "Image upload is disabled." ? 403 : 400;
    return Response.json({ error: imageValidation.error }, { status });
  }

  const titleLinks = parseTitleLinks(body.titleLinks);
  if (!titleLinksValid(titleLinks)) {
    return Response.json({ error: "One or more links are invalid." }, { status: 400 });
  }

  const updated = await updateSiteSettings({ mainImages, titleLinks });
  return Response.json(updated);
}
