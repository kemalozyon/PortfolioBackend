import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NoteFolder",
      default: null,
      index: true,
    },
    markdownContent: { type: String, default: "", maxlength: 1000000 },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "public", "private"],
      default: "draft",
      index: true,
    },
    order: { type: Number, default: 0 },
    assets: [{ publicId: String, format: String }],
  },
  { timestamps: true },
);
export default mongoose.model("Note", schema);
