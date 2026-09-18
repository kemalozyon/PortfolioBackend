import path from "node:path";
import sharp from "sharp";

const text = (value) => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.every((part) => typeof part === "string"))
    return value.join("");
  throw new Error("Invalid notebook text field.");
};
const block = (value, language = "text") => {
  const fence = "`".repeat(Math.max(3, ...[...value.matchAll(/`+/g)].map((match) => match[0].length + 1)));
  return `${fence}${language}\n${value}\n${fence}`;
};

// Convert saved cells only; never execute notebook code or load a kernel.
export const readNotebook = async (file) => {
  let notebook;
  try { notebook = JSON.parse(file.buffer.toString("utf8")); }
  catch { throw new Error("Invalid .ipynb JSON."); }
  if (notebook?.nbformat !== 4 || !Array.isArray(notebook.cells) || notebook.cells.length > 10000)
    throw new Error("Upload a version 4 notebook with at most 10000 cells.");
  const files = new Map(), parts = [];
  let bytes = 0;
  const language = notebook.metadata?.language_info?.name || "python";
  const codeLanguage = typeof language === "string" && /^[a-z0-9_+-]{1,40}$/i.test(language) ? language : "text";
  const image = async (bundle) => {
    const mime = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"].find((mime) => bundle?.[mime]);
    if (!mime) return null;
    let buffer;
    if (mime === "image/svg+xml") {
      const svg = text(bundle[mime]);
      // Graphviz's standard external DOCTYPE is harmless; entity declarations
      // and embedded resources are not needed for computation diagrams.
      if (Buffer.byteLength(svg) > 4 * 1024 * 1024 || /<!ENTITY|<\s*(?:script|foreignObject|image)\b|(?:href\s*=\s*["'](?!#))|@import|url\(/i.test(svg))
        throw new Error("Unsupported SVG resources in notebook output.");
      try {
        buffer = await sharp(Buffer.from(svg), { density: 144, limitInputPixels: 16000000 })
          .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
          .timeout({ seconds: 5 }).png().toBuffer();
      } catch { throw new Error("Unable to convert notebook SVG output to PNG."); }
    } else {
    const encoded = text(bundle[mime]).replace(/\s/g, "");
    if (!encoded || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4 !== 0)
      throw new Error("Invalid notebook image encoding.");
    buffer = Buffer.from(encoded, "base64");
    }
    bytes += buffer.length;
    if (bytes > 12 * 1024 * 1024 || files.size >= 200)
      throw new Error("Notebook images exceed 12 MB or 200 files.");
    const name = `notebook_images/image-${files.size}.${mime === "image/svg+xml" ? "png" : mime.split("/")[1]}`;
    files.set(name, buffer);
    return name;
  };
  for (const cell of notebook.cells) {
    if (!cell || !["markdown", "code", "raw"].includes(cell.cell_type))
      throw new Error("Unsupported notebook cell type.");
    let source = text(cell.source);
    if (cell.cell_type === "markdown") {
      for (const [name, bundle] of Object.entries(cell.attachments || {})) {
        const url = await image(bundle);
        if (!url) throw new Error("Notebook attachment image format is not supported.");
        source = source.split(`attachment:${encodeURIComponent(name)}`).join(url)
          .split(`attachment:${name}`).join(url);
      }
      parts.push(source);
    } else if (cell.cell_type === "raw") {
      parts.push(block(source));
    } else {
      parts.push(block(source, codeLanguage));
      if (!Array.isArray(cell.outputs)) throw new Error("Invalid notebook outputs.");
      for (const output of cell.outputs) {
        if (!output || typeof output !== "object") throw new Error("Invalid notebook output.");
        if (output.output_type === "stream") parts.push(block(text(output.text)));
        else if (output.output_type === "error")
          parts.push(block(`${text(output.ename || "Error")}: ${text(output.evalue || "")}`));
        else {
          const url = await image(output.data);
          if (url) parts.push(`![Notebook output](${url})`);
          else if (output.data?.["text/markdown"]) parts.push(text(output.data["text/markdown"]));
          else if (output.data?.["text/plain"]) parts.push(block(text(output.data["text/plain"])));
          else parts.push("*This interactive or HTML output is not supported in Markdown.*");
        }
      }
    }
  }
  const markdown = parts.join("\n\n");
  if (markdown.length > 1000000) throw new Error("Converted notebook exceeds the note content limit.");
  return { name: path.basename(file.originalname).replace(/\.ipynb$/i, ".md"), markdown, files };
};
