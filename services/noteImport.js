import path from "node:path";
import yauzl from "yauzl";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import { readNotebook } from "./notebookImport.js";

export const MAX_UPLOAD = 4 * 1024 * 1024;
const MAX_EXPANDED = 12 * 1024 * 1024;
const safePath = (name) => {
  if (
    name.includes("\\") ||
    name.includes("\0") ||
    name.startsWith("/") ||
    name.split("/").includes("..")
  ) {
    throw new Error("Unsafe archive path.");
  }
  return path.posix.normalize(name);
};
export const readImport = async (file) => {
  if (/\.ipynb$/i.test(file.originalname)) return readNotebook(file);
  if (/\.md$/i.test(file.originalname))
    return {
      name: path.basename(file.originalname),
      markdown: file.buffer.toString("utf8"),
      files: new Map(),
    };
  if (!/\.zip$/i.test(file.originalname))
    throw new Error(
      "Upload a .md, .ipynb, or ZIP containing one Markdown file and its images.",
    );
  const files = await new Promise((resolve, reject) => {
    yauzl.fromBuffer(
      file.buffer,
      { lazyEntries: true, validateEntrySizes: true, strictFileNames: true },
      (error, zip) => {
        if (error) return reject(new Error("Invalid ZIP archive."));
        const files = new Map();
        let size = 0,
          entries = 0;
        const fail = (error) => {
          zip.close();
          reject(error);
        };
        zip.on("error", fail);
        zip.on("end", () => resolve(files));
        zip.on("entry", (entry) => {
          let name;
          try {
            name = safePath(entry.fileName);
            if (
              ++entries > 200 ||
              (size += entry.uncompressedSize) > MAX_EXPANDED
            )
              throw new Error(
                "ZIP exceeds 200 entries or 12 MB expanded size.",
              );
            if (((entry.externalFileAttributes >>> 16) & 0xf000) === 0xa000)
              throw new Error("Symlinks are not allowed.");
            if (
              name.endsWith("/") ||
              name.startsWith("__MACOSX/") ||
              path.posix.basename(name).startsWith(".")
            )
              return zip.readEntry();
            if (files.has(name)) throw new Error("Duplicate archive path.");
          } catch (error) {
            return fail(error);
          }
          zip.openReadStream(entry, (error, stream) => {
            if (error) return fail(error);
            const chunks = [];
            let bytes = 0;
            stream.on("data", (chunk) => {
              bytes += chunk.length;
              if (bytes > entry.uncompressedSize || bytes > MAX_EXPANDED) {
                stream.destroy(new Error("Expanded ZIP is too large."));
                return;
              }
              chunks.push(chunk);
            });
            stream.on("error", fail);
            stream.on("end", () => {
              files.set(name, Buffer.concat(chunks));
              zip.readEntry();
            });
          });
        });
        zip.readEntry();
      },
    );
  });
  const markdownFiles = [...files.keys()].filter((name) => /\.md$/i.test(name));
  if (markdownFiles.length !== 1)
    throw new Error("ZIP must contain exactly one .md file.");
  const name = markdownFiles[0];
  return { name, markdown: files.get(name).toString("utf8"), files };
};

// Use Markdown positions to preserve notebook formulas and original formatting.
export const importImages = async ({ name, markdown, files }, upload) => {
  const tree = unified().use(remarkParse).parse(markdown);
  const references = new Map();
  visit(tree, "definition", (node) => references.set(node.identifier, node));
  const nodes = new Set();
  visit(tree, (node) => {
    if (node.type === "image") nodes.add(node);
    if (node.type === "imageReference") {
      const definition = references.get(node.identifier);
      if (definition) nodes.add(definition);
    }
  });
  const replacements = [],
    uploaded = new Map();
  for (const node of nodes) {
    const url = node.url;
    if (
      /^https?:\/\//i.test(url) ||
      /^\/api\/notes\/assets\/[a-f0-9]{24}\/[0-9]+$/i.test(url)
    )
      continue;
    if (/^[a-z]+:/i.test(url) || url.startsWith("//"))
      throw new Error("Only HTTP(S) or bundled image files are supported.");
    let imagePath;
    try {
      imagePath = safePath(
        path.posix.join(
          path.posix.dirname(name),
          safePath(decodeURIComponent(url)),
        ),
      );
    } catch {
      throw new Error(`Invalid image path: ${url}`);
    }
    const buffer = files.get(imagePath);
    if (!buffer)
      throw new Error(
        `Missing image: ${url}. Include images with the .md file in a ZIP.`,
      );
    if (!/\.(png|jpe?g|webp|gif)$/i.test(imagePath))
      throw new Error("Bundled images must be PNG, JPEG, WebP or GIF.");
    if (!uploaded.has(imagePath)) uploaded.set(imagePath, await upload(buffer));
    const start = node.position.start.offset,
      end = node.position.end.offset;
    const original = markdown.slice(start, end);
    const offset = original.indexOf(
      url,
      node.type === "image"
        ? original.indexOf("](") + 2
        : original.indexOf("]:") + 2,
    );
    if (offset < 0) throw new Error("Unsupported image URL formatting.");
    replacements.push({
      start: start + offset,
      end: start + offset + url.length,
      value: uploaded.get(imagePath),
    });
  }
  for (const replacement of replacements.sort((a, b) => b.start - a.start))
    markdown =
      markdown.slice(0, replacement.start) +
      replacement.value +
      markdown.slice(replacement.end);
  return markdown;
};
