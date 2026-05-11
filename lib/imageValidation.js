const MAX_IMAGES = 8;
const MAX_IMAGE_URL_LENGTH = 2048;
const MAX_DATA_IMAGE_LENGTH = 8_000_000;

export function parseImageValues(rawImages) {
  if (!Array.isArray(rawImages)) {
    return [];
  }

  return rawImages
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_IMAGES);
}

function isAllowedImageUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isAllowedDataImage(value) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/.test(value);
}

export function validateImages(images, { allowDataUrls }) {
  for (const value of images) {
    if (value.startsWith("data:image/")) {
      if (!allowDataUrls) {
        return { error: "Image upload is disabled." };
      }
      if (value.length > MAX_DATA_IMAGE_LENGTH) {
        return { error: "One or more uploaded images are too large." };
      }
      if (!isAllowedDataImage(value)) {
        return { error: "Invalid uploaded image format." };
      }
      continue;
    }

    if (value.length > MAX_IMAGE_URL_LENGTH) {
      return { error: "Image URL is too long." };
    }
    if (!isAllowedImageUrl(value)) {
      return { error: "Only valid image URLs are allowed." };
    }
  }

  return { error: null };
}
