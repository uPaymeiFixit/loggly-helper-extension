// Apply Loggly-specific formatting to object values
const wrapValue = (value) => {
  let type = "str";
  if (typeof value === "number" || typeof value === "boolean") type = "num";
  return `<span lg-term-highlight-node-value="::node" lg-view-code-marker="::node" uib-tooltip="Add to Search" tooltip-placement="top" tooltip-trigger="focus" tooltip-append-to-body="false" tooltip-enable="isRowTooltipOpen" class="node-value node-hover lg-pretty-json"><span class="json-${type}">${value}</span></span>`;
};
// Apply color to keys of an object
const wrapKey = (key) => `<span style="color:#AAAAAA;">${key}</span>`;

// Create an observer to detect changes to the DOM (unfolding, new logs, etc)
const observer = new MutationObserver(scanAndFormat);
const startObserver = () =>
  observer.observe(document.getElementsByName("events")[0], { attributes: true, childList: true, subtree: true });
startObserver();

// Loggly gets a lot of updates, only listen when we click - I think we've solved this problem
// document.body.addEventListener("click", startObserver, true);

/**
 * Loop through all raw logs and indexed string values and attempt to format them
 */
function scanAndFormat(mutatedElements) {
  // Pause the observer while we update the DOM so we don't trigger it
  observer.disconnect();

  // Format `raw message` contents
  document.querySelectorAll("div[lg-lazy-show='rawMessageExpanded']").forEach(formatElement);

  // Format all other string values
  document.querySelectorAll(".json-str").forEach(formatElement);

  // Resume the observer
  startObserver();
}

/**
 * Given a single element, attempt to parse it and update the DOM if successful
 */
function formatElement(element) {
  /**
   * Sometimes when you search for something like "\"level\":\"verbose\"", the
   * logs will contain empty highlight tags, and &quot; characters. We will
   * filter them out here.
   */
  const element_html = element.innerHTML
    .replaceAll('<span class="highlight"></span>', "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"');

  if (element_html !== element.innerHTML) {
    element.innerHTML = element_html;
  }

  // Remove double quotes from highlight tag
  const safe_element = element.innerHTML.replaceAll('<span class="highlight">', "<span class='highlight'>");

  // Non-objects will throw when parsed, so use a try/catch
  try {
    const p = deepParse(safe_element);
    // It's possible the object was already parsed, no need to update the DOM
    if (p === safe_element) return colorize(element);

    element.innerHTML = formatObject(p);
  } catch (error) {}
  colorize(element);
}

/**
 * Apply limited ANSI coloring to text that supports it
 */
function colorize(element) {
  element.innerHTML = element.innerHTML
    .replaceAll("[30m", "<span style='color:black;'>")
    .replaceAll("[31m", "<span style='color:red;'>")
    .replaceAll("[32m", "<span style='color:green;'>")
    .replaceAll("[33m", "<span style='color:yellow;'>")
    .replaceAll("[34m", "<span style='color:blue;'>")
    .replaceAll("[35m", "<span style='color:purple;'>")
    .replaceAll("[36m", "<span style='color:cyan;'>")
    .replaceAll("[37m", "<span style='color:white;'>")

    .replaceAll("[22m", "</span>")
    .replaceAll("[39m", "</span>")
    .replaceAll("[2m", "<span style='color:gray;'>"); // dim
}

/**
 * Apply color, new lines, and spacing to a parsed object
 */
function formatObject(obj, depth = 0) {
  let o = "";
  if (typeof obj === "object") {
    for (const key in obj) {
      o += `\n${"  ".repeat(depth)}${wrapKey(key)}: ${formatObject(obj[key], depth + 1)}`;
    }
    return o;
  }
  return wrapValue(obj);
}

/**
 * Recursively parse an object whose values may also be stringified json
 */
function deepParse(obj) {
  try {
    return JSON.parse(obj, (key, value) => deepParse(value));
  } catch (error) {}
  return obj;
}
