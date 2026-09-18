import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NoteFolder",
      default: null,
      index: true,
    },
    introduction: { type: String, default: "", maxlength: 500000 },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "noteFolders" },
);
export default mongoose.model("NoteFolder", schema);
