import express from "express"
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import blogRoute from "./routes/blogRoutes.js"
import projectRoute from "./routes/projectRoutes.js"
import authRoute from "./routes/authRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js"
import cors from "cors"

// read the dotenv file
dotenv.config()

// connect to the database
connectDB()

const app = express()

//In order to parse coming json files
app.use(express.json())
app.use(cors({
    origin: [
        "https://portfolio-frontend-two-lake.vercel.app/"
    ],
    credentials: true
}))

app.use("/api/blogs", blogRoute)
app.use("/api/projects", projectRoute)
app.use("/api/auth", authRoute)
app.use("/api/upload", uploadRoutes)

app.get("/", (req, res) => {
    res.send("Personal web site")
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
})
