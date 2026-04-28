import Blog from "../models/Blog.js"
import slugify from "slugify"

// POST
export const createBlog = async (req, res) => {
    try {

        const { title, markdownContent, coverImageURL, tags, isPublished } = req.body

        const newBlog = await Blog.create({
            title,
            slug: slugify(title, {lower: true, strict: true}),
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


// PUT /api/blogs/:id

export const updateBlog = async (req, res) => {
    try{
        const id = req.params.id
        const {title, markdownContent, coverImageURL, tags, isPublished} = req.body

        const updatedData = {
            title, 
            markdownContent,
            coverImageURL,
            tags,
            isPublished
        };

        if(title){
            updatedData.slug = slugify(title, {lower: true, strict: true})
        }   

        Object.keys(updatedData).forEach((key) => {
            return updatedData[key] === undefined && delete updatedData[key]
        })

        const updatedBlog = await Blog.findByIdAndUpdate(
            id,
            {$set: updatedData},
            {new: true, runValidators: true}
        )
        if(!updatedBlog){
            return res.status(404).json({success: false, message: "Blog not found"})
        }

        res.status(200).json({success: true, data: updatedBlog})
    }catch(error){
        res.status(500).json({success: false, message: error.message})
    }

}



export const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params

        const deletedBlog = await Blog.findByIdAndDelete(id)

        if (!deletedBlog) {
            return res.status(404).json({ success: false, message: "Blog not found" })
        }

        res.status(200).json({ success: true, message: "Blog deleted successfully" })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}