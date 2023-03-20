const wrapValue = (value) => {
  let type = "str";
  if (typeof value === "number" || typeof value === "boolean") type = "num";
  return `<span lg-term-highlight-node-value="::node" lg-view-code-marker="::node" uib-tooltip="Add to Search" tooltip-placement="top" tooltip-trigger="focus" tooltip-append-to-body="false" tooltip-enable="isRowTooltipOpen" class="node-value node-hover lg-pretty-json"><span class="json-${type}">${value}</span></span>`;
};
const wrapKey = (key) => `<span style="color:#AAAAAA;">${key}</span>`;

// Apply color, new lines, and spacing to a parsed object
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

// Recursively parse an object whose values may also be stringified json
function deepParse(obj) {
  try {
    return JSON.parse(obj, (key, value) => deepParse(value));
  } catch (error) {}
  return obj;
}

function scanAndFormat(e) {
  // Pause the observer while we update the DOM so we don't trigger it
  observer.disconnect();

  // console.log("FORMATTING", e);

  // Format `raw message` contents
  document.querySelectorAll("div[lg-lazy-show='rawMessageExpanded']").forEach((element) => {
    const p = deepParse(element.innerHTML.replaceAll('<span class="highlight">', "<span class='highlight'>"));
    element.innerHTML = formatObject(p);
  });

  // Format all other string values
  document.querySelectorAll(".json-str").forEach((element) => {
    const safe_element = element.innerHTML.replaceAll('<span class="highlight">', "<span class='highlight'>");

    try {
      const p = deepParse(safe_element);
      if (p === safe_element) return;

      element.innerHTML = formatObject(p);
    } catch (error) {}
  });

  // Resume the observer
  startObserver();
}

// Create an observer to detect changes to the DOM (unfolding, new logs, etc)
const observer = new MutationObserver(scanAndFormat);
const startObserver = () => observer.observe(document.body, { attributes: true, childList: true, subtree: true });

// Loggly gets a lot of updates, only listen when we click
document.body.addEventListener("click", startObserver, true);
