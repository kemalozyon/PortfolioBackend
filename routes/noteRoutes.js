import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";
import Note from "../models/Note.js";
import NoteFolder from "../models/NoteFolder.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  folderMap,
  isPublicFolder,
  isPublicNote,
  validateParent,
} from "../services/noteVisibility.js";
import {
  MAX_UPLOAD,
  readImport,
  importImages,
} from "../services/noteImport.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD, files: 1, fields: 3, fieldSize: 1000 },
});
const wrap = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (error) {
    next(error);
  }
};
const bad = (message) => Object.assign(new Error(message), { status: 400 });
const objectId = (value) => {
  if (!mongoose.isObjectIdOrHexString(value))
    throw Object.assign(new Error("Not found."), { status: 404 });
  return value;
};
const parentId = (value) =>
  value === null || value === "" ? null : objectId(value);
const cleanNote = (note) => {
  const { assets, ...data } = note.toObject ? note.toObject() : note;
  void assets;
  return data;
};
const getFolders = async () => folderMap(await NoteFolder.find().lean());
const getNote = async (id, admin) => {
  const note = await Note.findById(objectId(id));
  if (!note || (!admin && !isPublicNote(note, await getFolders())))
    throw Object.assign(new Error("Not found."), { status: 404 });
  return note;
};

// Private responses never enter browser/CDN HTTP caches. Public endpoints ignore JWTs.
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
router.use("/admin", protect);

const tree = (admin) =>
  wrap(async (req, res) => {
    const folders = await NoteFolder.find().sort({ order: 1, name: 1 }).lean();
    const map = folderMap(folders);
    const search = String(req.query.q || "")
      .trim()
      .toLocaleLowerCase()
      .slice(0, 200);
    const notes = await Note.find()
      .select(search ? "-assets" : "-assets -markdownContent")
      .sort({ order: 1, title: 1 })
      .lean();
    const visible = notes.filter((note) => admin || isPublicNote(note, map));
    res.json({
      folders: folders.filter(
        (folder) => admin || isPublicFolder(folder._id, map),
      ),
      notes: visible
        .filter(
          (note) =>
            !search ||
            `${note.title}\n${note.tags.join(" ")}\n${note.markdownContent}`
              .toLocaleLowerCase()
              .includes(search),
        )
        .map(({ markdownContent, assets, ...note }) => {
          void markdownContent;
          void assets;
          return note;
        }),
    });
  });
router.get("/tree", tree(false));
router.get("/admin/tree", tree(true));
router.get(
  "/notes/:id",
  wrap(async (req, res) =>
    res.json(cleanNote(await getNote(req.params.id, false))),
  ),
);
router.get(
  "/admin/notes/:id",
  wrap(async (req, res) =>
    res.json(cleanNote(await getNote(req.params.id, true))),
  ),
);

const image = (admin) =>
  wrap(async (req, res) => {
    const note = await getNote(req.params.id, admin);
    if (!/^\d+$/.test(req.params.index))
      throw Object.assign(new Error("Not found."), { status: 404 });
    const asset = note.assets[Number(req.params.index)];
    if (!asset) throw Object.assign(new Error("Not found."), { status: 404 });
    const url = cloudinary.url(asset.publicId, {
      resource_type: "image",
      type: "authenticated",
      format: asset.format,
      secure: true,
      sign_url: true,
    });
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok)
      throw Object.assign(new Error("Image temporarily unavailable."), {
        status: 502,
      });
    res.set(
      "Content-Type",
      response.headers.get("content-type") || "image/png",
    );
    res.set("X-Content-Type-Options", "nosniff");
    const stream = Readable.fromWeb(response.body);
    res.on("close", () => stream.destroy());
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  });
router.get("/assets/:id/:index", image(false));
router.get("/admin/assets/:id/:index", image(true));

const folderFields = async (body, ownId) => {
  const data = {};
  for (const key of ["name", "introduction", "visibility", "order"])
    if (body[key] !== undefined) data[key] = body[key];
  if (body.parent !== undefined) {
    data.parent = parentId(body.parent);
    try {
      validateParent(data.parent, ownId, await getFolders());
    } catch (error) {
      throw bad(error.message);
    }
  }
  if (
    data.order !== undefined &&
    (typeof data.order !== "number" || !Number.isFinite(data.order))
  )
    throw bad("Order must be a finite number.");
  return data;
};
const noteFields = async (body) => {
  const data = {};
  for (const key of ["title", "markdownContent", "tags", "status", "order"])
    if (body[key] !== undefined) data[key] = body[key];
  if (body.folder !== undefined) {
    data.folder = parentId(body.folder);
    if (data.folder && !(await NoteFolder.exists({ _id: data.folder })))
      throw bad("Folder does not exist.");
  }
  if (
    data.order !== undefined &&
    (typeof data.order !== "number" || !Number.isFinite(data.order))
  )
    throw bad("Order must be a finite number.");
  return data;
};
router.post(
  "/admin/folders",
  wrap(async (req, res) =>
    res.status(201).json(await NoteFolder.create(await folderFields(req.body))),
  ),
);
router.put(
  "/admin/folders/:id",
  wrap(async (req, res) => {
    const id = objectId(req.params.id);
    const folder = await NoteFolder.findByIdAndUpdate(
      id,
      { $set: await folderFields(req.body, id) },
      { returnDocument: "after", runValidators: true },
    );
    if (!folder) return res.status(404).json({ message: "Folder not found." });
    res.json(folder);
  }),
);
router.delete(
  "/admin/folders/:id",
  wrap(async (req, res) => {
    const id = objectId(req.params.id);
    if (
      (await NoteFolder.exists({ parent: id })) ||
      (await Note.exists({ folder: id }))
    )
      throw bad(
        "Move the notes and subfolders first. Only empty folders can be deleted.",
      );
    if (!(await NoteFolder.findByIdAndDelete(id)))
      return res.status(404).json({ message: "Folder not found." });
    res.json({ success: true });
  }),
);
router.post(
  "/admin/notes",
  wrap(async (req, res) =>
    res
      .status(201)
      .json(cleanNote(await Note.create(await noteFields(req.body)))),
  ),
);
router.put(
  "/admin/notes/:id",
  wrap(async (req, res) => {
    const note = await Note.findByIdAndUpdate(
      objectId(req.params.id),
      { $set: await noteFields(req.body) },
      { returnDocument: "after", runValidators: true },
    );
    if (!note) return res.status(404).json({ message: "Note not found." });
    res.json(cleanNote(note));
  }),
);
const destroyAssets = (assets) =>
  Promise.all(
    assets.map((asset) =>
      cloudinary.uploader.destroy(asset.publicId, {
        resource_type: "image",
        type: "authenticated",
        invalidate: true,
        timeout: 5000,
      }),
    ),
  );
router.delete(
  "/admin/notes/:id",
  wrap(async (req, res) => {
    const note = await getNote(req.params.id, true);
    await destroyAssets(note.assets);
    await note.deleteOne();
    res.json({ success: true });
  }),
);
router.post(
  "/admin/import",
  upload.single("file"),
  wrap(async (req, res) => {
    if (!req.file) throw bad("Choose a .md, .ipynb or ZIP file.");
    const fields = await noteFields({ folder: req.body.folder || null });
    const note = new Note({
      ...fields,
      title:
        req.body.title || req.file.originalname.replace(/\.(md|zip)$/i, ""),
      status: "draft",
    });
    const deadline = Date.now() + 40000;
    try {
      const imported = await readImport(req.file);
      if (imported.markdown.length > 1000000)
        throw bad("Markdown must be at most 1,000,000 characters.");
      note.markdownContent = await importImages(
        imported,
        (buffer) =>
          new Promise((resolve, reject) => {
            const remaining = deadline - Date.now();
            if (remaining <= 0)
              return reject(
                bad("Import took too long. Try a smaller notebook ZIP."),
              );
            if (buffer.length > MAX_UPLOAD)
              return reject(bad("Each image must be under 4 MB."));
            cloudinary.uploader
              .upload_stream(
                {
                  folder: "personal_website/notes",
                  resource_type: "image",
                  type: "authenticated",
                  allowed_formats: ["png", "jpg", "jpeg", "gif", "webp"],
                  timeout: Math.min(15000, remaining),
                },
                (error, result) => {
                  if (error)
                    return reject(
                      new Error(
                        "Image upload failed. Check Cloudinary configuration.",
                      ),
                    );
                  const index = note.assets.length;
                  note.assets.push({
                    publicId: result.public_id,
                    format: result.format,
                  });
                  resolve(`/api/notes/assets/${note._id}/${index}`);
                },
              )
              .end(buffer);
          }),
      );
      await note.save();
      res.status(201).json(cleanNote(note));
    } catch (error) {
      await destroyAssets(note.assets).catch(() =>
        console.error("Note import asset cleanup failed"),
      );
      throw bad(error.message);
    }
  }),
);
router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError)
    return res
      .status(400)
      .json({ message: "Upload must contain one file, at most 4 MB." });
  const status =
    error.status ||
    (error.name === "ValidationError" || error.name === "CastError"
      ? 400
      : 500);
  if (status === 500) console.error("Notes API error:", error.name);
  res
    .status(status)
    .json({
      message:
        status === 500 ? "Notes temporarily unavailable." : error.message,
    });
});
export default router;
