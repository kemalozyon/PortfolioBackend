import Blog from "../models/Blog.js"

// POST
export const createBlog = async (req, res) => {
    try {

        const { title, slug, markdownContent, coverImageURL, tags, isPublished } = req.body

        const newBlog = await Blog.create({
            title,
            slug,
            markdownContent,
            coverImageURL,
            tags,
            isPublished
        })

        // If it can come until this point it means it is successfull 
        res.status(201).json(newBlog)

    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export const getBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });

        res.status(200).json(blogs)

    } catch (error) {
        res.status(500).json({ message: "Server Error! Blogs cannot be retrieved!" })
    }
}




