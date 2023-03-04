javascript: (() => {
  const wrapValue = (value) => {
    let type = "str";
    if (typeof value === "number" || typeof value === "boolean") type = "num";
    return `<span lg-term-highlight-node-value="::node" lg-view-code-marker="::node" uib-tooltip="Add to Search" tooltip-placement="top" tooltip-trigger="focus" tooltip-append-to-body="false" tooltip-enable="isRowTooltipOpen" class="node-value node-hover lg-pretty-json"><span class="json-${type}">${value}</span></span>`;
  };
  const wrapKey = (key) => `<span style="color:#AAAAAA;">${key}</span>`;

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

  function deepParse(obj) {
    try {
      return JSON.parse(obj, (key, value) => deepParse(value));
    } catch (error) {}
    return obj;
  }

  document.querySelectorAll("div[lg-lazy-show='rawMessageExpanded']").forEach((element) => {
    const p = deepParse(element.innerHTML.replaceAll('<span class="highlight">', "<span class='highlight'>"));

    element.innerHTML = formatObject(p);
  });

  document.getElementsByClassName("json-str").forEach((element) => {
    const safe_element = element.innerHTML.replaceAll('<span class="highlight">', "<span class='highlight'>");

    try {
      const p = deepParse(safe_element);
      if (p === safe_element) return;

      element.innerHTML = formatObject(p);
    } catch (error) {}
  });
})();
