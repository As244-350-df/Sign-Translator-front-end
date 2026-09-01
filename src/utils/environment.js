function isInsideIframe() {
  try {
    if (typeof window === "undefined") return false;
    return window.self !== window.top;
  } catch {
    return true;
  }
}
function getSafeCurrentUrl() {
  try {
    if (typeof window !== "undefined" && window.location?.href) {
      return window.location.href;
    }
  } catch {
  }
  return "#";
}
export {
  getSafeCurrentUrl,
  isInsideIframe
};
