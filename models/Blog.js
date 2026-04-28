import mongoose from "mongoose";


const blogSchema = new mongoose.Schema({
    title:{
        type: String,
        required: [true, "A blog post must have a title"],
        trim: true,
        maxLength : [100, "Title cannot be more than 100 characters"]
    },
    // It is crutial for SEO 
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
        // slug is the url friendly version of the title
        // My first Post! -> my-first-post
    },
    markdownContent: {
        type: String,
        required: [true, "Content cannot be empty"]
    },
    tags: {
        type: [String], // An string array of set ["React", "Tutorial", "WebDev"]
        default: []
    },
    isPublished: {
        type: Boolean, //It allows us to use it while it is draft
        default: false
    }
}, {timestamps: true}) // created at and updated at will be added in this way


export default mongoose.model("Blog", blogSchema)