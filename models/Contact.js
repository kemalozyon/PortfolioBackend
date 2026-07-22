import mongoose from "mongoose";


const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please tell me your name"],
        trim: true,
        maxLength: [100, "Name cannot be more than 100 characters"]
    },
    email: {
        type: String,
        required: [true, "An email is required so I can reply"],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
    },
    message: {
        type: String,
        required: [true, "Message cannot be empty"],
        trim: true,
        maxLength: [2000, "Message cannot be more than 2000 characters"]
    },
    // Marks whether I have already read this message from the admin side
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })


export default mongoose.model("Contact", contactSchema)
