import mongoose from "mongoose";

const projectSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, "A project must have a title"],
        trim: true,
        maxLength: [100, "Title cannot be more than 100 characters"]
    },
    description: {
        type: String,
        required: [true, "Please provide a short description"],
        maxLength: [300, "Keep the summary brief (under 300 characters)"]
    },
    markdownContent: {
        //Optianal If you want a full case study for this project
        type: String,
        default: ""
    },
    technologies: {
        type: [String],
        required: true
    },
    githubLink: {
        type: String,
        trim: true,
        default: ""
    },
    liveDemoLink: {
        type: String,
        trim: true,
        default: ""
    },
    coverImageUrl: {
        type: String,
        default: "default-project-cover.jpg"
    },
    isFeatured: {
        // Set this to true to pin your best projects to the top of your site!
        type: Boolean,
        default: false
    }
}, {timestamps: true})

export default mongoose.model("Project", projectSchema)