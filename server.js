import express from "express"
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import blogRoute from "./routes/blogRoutes.js"
import projectRoute from "./routes/projectRoutes.js"
import authRoute from "./routes/authRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js"
import contactRoute from "./routes/contactRoutes.js"
import cors from "cors"

// read the dotenv file
dotenv.config()

const app = express()

//In order to parse coming json files
app.use(express.json())
app.use(cors({
    origin: [
        "https://portfolio-frontend-two-lake.vercel.app"
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

app.use("/api/blogs", blogRoute)
app.use("/api/projects", projectRoute)
app.use("/api/auth", authRoute)
app.use("/api/upload", uploadRoutes)
app.use("/api/contact", contactRoute)

app.get("/", (req, res) => {
    res.send("Kemal Ozyon Personal web site")
})

export default app
