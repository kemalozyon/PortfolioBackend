import express from "express"
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import blogRoute from "./routes/blogRoutes.js"
import projectRoute from "./routes/projectRoutes.js"
import authRoute from "./routes/authRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js"
import contactRoute from "./routes/contactRoutes.js"
import cors from "cors"
import noteRoute from "./routes/noteRoutes.js"

// read the dotenv file
dotenv.config()

const app = express()

//In order to parse coming json files
app.use(express.json({ limit: "2mb" }))
app.use(cors({
    origin: [
        "https://portfolio-frontend-two-lake.vercel.app",
        "https://www.kemalozyon.com",
        "https://kemalozyon.com"
    ],
    credentials: true
}))

// Reuse the connection and wait for it before any API handler queries MongoDB.
app.use("/api", async (req, res, next) => {
    try {
        await connectDB()
        next()
    } catch {
        console.error("MongoDB connection failed")
        res.status(503).json({ message: "Database temporarily unavailable" })
    }
})

app.use("/api/notes", noteRoute)
app.use("/api/blogs", blogRoute)
app.use("/api/projects", projectRoute)
app.use("/api/auth", authRoute)
app.use("/api/upload", uploadRoutes)
app.use("/api/contact", contactRoute)

app.get("/", (req, res) => {
    res.send("Kemal Ozyon Personal web site")
})

// Give bounded notebook/image imports enough time on Vercel.
export const maxDuration = 60

export default app
