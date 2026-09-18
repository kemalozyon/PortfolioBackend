const id = (value) => (value == null ? null : String(value));
export const folderMap = (folders) =>
  new Map(folders.map((folder) => [id(folder._id), folder]));

// Missing parents and cycles fail closed, including when checking image access.
export const isPublicFolder = (folderId, folders) => {
  const seen = new Set();
  let current = id(folderId);
  while (current) {
    if (seen.has(current)) return false;
    seen.add(current);
    const folder = folders.get(current);
    if (!folder || folder.visibility !== "public") return false;
    current = id(folder.parent);
  }
  return true;
};
export const isPublicNote = (note, folders) =>
  note.status === "public" && isPublicFolder(note.folder, folders);

export const validateParent = (parent, ownId, folders) => {
  const seen = new Set(ownId ? [id(ownId)] : []);
  let current = id(parent);
  while (current) {
    if (seen.has(current))
      throw new Error(
        "A folder cannot be moved inside itself or its descendants.",
      );
    seen.add(current);
    const folder = folders.get(current);
    if (!folder) throw new Error("Folder does not exist.");
    current = id(folder.parent);
  }
};
