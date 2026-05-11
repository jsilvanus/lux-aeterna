const TRUTHY_VALUES = new Set(["1", "true", "yes", "on"]);

function parseFlag(value) {
  return TRUTHY_VALUES.has(String(value ?? "").trim().toLowerCase());
}

export function imagesEnabled() {
  return true;
}

export function imageUploadEnabled() {
  return parseFlag(process.env.ENABLE_IMAGE_UPLOAD ?? process.env.NEXT_PUBLIC_ENABLE_IMAGE_UPLOAD);
}

export function getPublicFeatureFlags() {
  return {
    imagesEnabled: imagesEnabled(),
    imageUploadEnabled: imageUploadEnabled(),
  };
}
