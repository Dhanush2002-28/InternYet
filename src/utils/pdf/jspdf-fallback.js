// Offline fallback for the "jspdf" package.
// Vite aliases "jspdf" to this module automatically when node_modules/jspdf
// is not installed (see vite.config.js). It implements the same API surface
// the portal uses and renders documents as a printable A4 preview: the
// browser print dialog opens so you can choose "Save as PDF".
// Once jspdf is installed (npm install on an internet PC), this module is
// bypassed automatically and native PDF downloads are restored.

const A4_PORTRAIT = { width: 595.28, height: 841.89 };
const A4_LANDSCAPE = { width: 841.89, height: 595.28 };

let measureContext = null;

function getMeasureContext() {
  if (typeof document === "undefined") return null;
  if (!measureContext) {
    const canvas = document.createElement("canvas");
    measureContext = canvas.getContext("2d");
  }
  return measureContext;
}

function fontCss(family, style, size) {
  const familyCss =
    family === "times"
      ? "Times New Roman, serif"
      : family === "courier"
        ? "Courier New, monospace"
        : "Helvetica, Arial, sans-serif";
  const styleCss = [style === "bold" ? "bold" : "", style === "italic" ? "italic" : ""]
    .filter(Boolean)
    .join(" ");
  return `${styleCss ? styleCss + " " : ""}${size}pt ${familyCss}`;
}

function css(value) {
  return String(value).replace(/</g, "&lt;").replace(/&/g, "&amp;");
}

function rgb([r, g, b]) {
  return `rgb(${r}, ${g}, ${b})`;
}

export class jsPDF {
  constructor(options = {}) {
    this.pageSize = options.orientation === "landscape" ? A4_LANDSCAPE : A4_PORTRAIT;
    this.fontFamily = "helvetica";
    this.fontStyle = "normal";
    this.fontSize = 12;
    this.textColor = [0, 0, 0];
    this.drawColor = [0, 0, 0];
    this.fillColor = [0, 0, 0];
    this.lineWidth = 1;
    this.ops = [];
  }

  get internal() {
    const pageSize = this.pageSize;
    return {
      pageSize: {
        getWidth: () => pageSize.width,
        getHeight: () => pageSize.height
      }
    };
  }

  setFont(family, style) {
    this.fontFamily = family || this.fontFamily;
    if (style) this.fontStyle = style;
    return this;
  }

  setFontSize(size) {
    this.fontSize = size;
    return this;
  }

  setTextColor(r, g, b) {
    this.textColor = [r, g, b];
    return this;
  }

  setDrawColor(r, g, b) {
    this.drawColor = [r, g, b];
    return this;
  }

  setFillColor(r, g, b) {
    this.fillColor = [r, g, b];
    return this;
  }

  setLineWidth(width) {
    this.lineWidth = width;
    return this;
  }

  text(content, x, y, options = {}) {
    this.ops.push({
      kind: "text",
      content,
      x,
      y,
      options,
      family: this.fontFamily,
      style: this.fontStyle,
      size: this.fontSize,
      color: this.textColor
    });
    return this;
  }

  line(x1, y1, x2, y2) {
    this.ops.push({ kind: "line", x1, y1, x2, y2, color: this.drawColor, width: this.lineWidth });
    return this;
  }

  rect(x, y, w, h) {
    this.ops.push({ kind: "rect", x, y, w, h, color: this.drawColor, width: this.lineWidth });
    return this;
  }

  circle(cx, cy, r, style) {
    this.ops.push({ kind: "circle", cx, cy, r, filled: style === "F", color: this.fillColor });
    return this;
  }

  splitTextToSize(text, maxWidth) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";
    const ctx = getMeasureContext();
    const measure = (value) => {
      if (ctx) {
        ctx.font = fontCss(this.fontFamily, this.fontStyle, this.fontSize);
        return ctx.measureText(value).width;
      }
      return value.length * this.fontSize * 0.5;
    };
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (!current || measure(candidate) <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  }

  toHtml(filename) {
    const { width, height } = this.pageSize;
    const landscape = width > height;
    const opsHtml = this.ops.map(renderOp).join("\n");
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${css(filename || "Document")}</title>
<style>
  @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 0; }
  html, body { margin: 0; padding: 0; background: #6b7280; }
  .toolbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 10;
    background: #171a20; color: #fff; font: 13px/1.5 Arial, sans-serif;
    padding: 10px 16px; display: flex; gap: 14px; align-items: center;
  }
  .toolbar button {
    border: 0; background: #1a56db; color: #fff; font-weight: 600;
    padding: 7px 14px; border-radius: 8px; cursor: pointer;
  }
  .page {
    position: relative; width: ${width}pt; height: ${height}pt;
    background: #fff; margin: 20px auto 60px; box-shadow: 0 4px 24px rgba(0,0,0,.4);
    overflow: hidden;
  }
  .op-text { position: absolute; white-space: pre; }
  .op-line { position: absolute; transform-origin: 0 50%; }
  .op-rect { position: absolute; box-sizing: border-box; }
  .op-circle { position: absolute; border-radius: 50%; }
  @media print {
    html, body { background: #fff; }
    .toolbar { display: none; }
    .page { margin: 0; box-shadow: none; }
  }
</style>
</head>
<body>
<div class="toolbar">
  <strong>Offline PDF preview</strong>
  <span>jspdf is not installed on this PC. Use the print dialog and choose <b>Save as PDF</b> to download this document.</span>
  <button onclick="window.print()">Print / Save as PDF</button>
</div>
<div class="page">
${opsHtml}
</div>
</body>
</html>`;
  }

  save(filename) {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return this.toHtml(filename);
    }
    const win = window.open("", "_blank", "width=1000,height=1100");
    if (!win) {
      alert(
        "Pop-ups are blocked for this site. Allow pop-ups and try again to open the offline PDF preview."
      );
      return;
    }
    win.document.open();
    win.document.write(this.toHtml(filename));
    win.document.close();
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        // Printing is a manual step in some browsers; the toolbar button stays available.
      }
    }, 400);
  }
}

function renderOp(op) {
  if (op.kind === "text") return renderText(op);
  if (op.kind === "line") return renderLine(op);
  if (op.kind === "rect") return renderRect(op);
  if (op.kind === "circle") return renderCircle(op);
  return "";
}

function textTransform(align) {
  if (align === "center") return "translate(-50%, -100%)";
  if (align === "right") return "translate(-100%, -100%)";
  return "translate(0, -100%)";
}

function renderText(op) {
  const lines = Array.isArray(op.content) ? op.content : [op.content];
  const lineHeight = op.size * 1.2;
  const align = op.options.align || "left";
  const charSpace = op.options.charSpace ? `letter-spacing: ${op.options.charSpace}pt;` : "";
  const base =
    `font: ${fontCss(op.family, op.style, op.size)}; color: ${rgb(op.color)}; ${charSpace}`;
  return lines
    .map((line, index) => {
      const top = op.y + index * lineHeight;
      return `<div class="op-text" style="left: ${op.x}pt; top: ${top}pt; transform: ${textTransform(align)}; ${base}">${css(line)}</div>`;
    })
    .join("\n");
}

function renderLine(op) {
  const length = Math.hypot(op.x2 - op.x1, op.y2 - op.y1);
  const angle = (Math.atan2(op.y2 - op.y1, op.x2 - op.x1) * 180) / Math.PI;
  return `<div class="op-line" style="left: ${op.x1}pt; top: ${op.y1 - op.width / 2}pt; width: ${length}pt; height: ${op.width}pt; background: ${rgb(op.color)}; transform: rotate(${angle}deg);"></div>`;
}

function renderRect(op) {
  return `<div class="op-rect" style="left: ${op.x}pt; top: ${op.y}pt; width: ${op.w}pt; height: ${op.h}pt; border: ${op.width}pt solid ${rgb(op.color)};"></div>`;
}

function renderCircle(op) {
  const style = op.filled
    ? `background: ${rgb(op.color)}`
    : `border: 1pt solid ${rgb(op.color)}`;
  return `<div class="op-circle" style="left: ${op.cx - op.r}pt; top: ${op.cy - op.r}pt; width: ${op.r * 2}pt; height: ${op.r * 2}pt; ${style}"></div>`;
}

export default jsPDF;