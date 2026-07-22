import Project from '../models/Project.js'
import mongoose from 'mongoose'

export const getProjects = async (req, res) => {
    try{
        const projects = await Project.find().sort({createdAt: -1})
        res.status(200).json(projects)
    }catch(error){
        res.status(500).json({message: "Server Error! Unable to fetch products!"})
    }
}

export const getProjectById = async(req, res) => {
    try{
        const id = req.params.id
        const project = await Project.findById(id)
        if(!project) {
            return res.status(404).json({message: "It is not found"})
        }
        res.status(200).json(project)
    }catch(error){

    }
}

export const postProject = async (req, res) => {
    try {
        const {
            title,
            description,
            markdownContent,
            technologies,
            githubLink,
            liveDemoLink,
            coverImageUrl,
            isFeatured
        } = req.body
        const newProject = await Project.create({
            title,
            description,
            markdownContent,
            technologies,
            githubLink,
            liveDemoLink,
            coverImageUrl,
            isFeatured
        })

        res.status(201).json(newProject)
    } catch (error) { 
        res.status(400).json({message: error.message})
    }
}


// PUT /api/projects/:id
export const updateProject = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid project ID" })
        }

        const {
            title,
            description,
            markdownContent,
            technologies,
            githubLink,
            liveDemoLink,
            coverImageUrl,
            isFeatured
        } = req.body

        const updatedData = {
            title,
            description,
            markdownContent,
            technologies,
            githubLink,
            liveDemoLink,
            coverImageUrl,
            isFeatured
        }

        // Remove undefined fields to avoid overwriting existing data
        Object.keys(updatedData).forEach(
            (key) => updatedData[key] === undefined && delete updatedData[key]
        )

        const updatedProject = await Project.findByIdAndUpdate(
            id,
            { $set: updatedData },
            { returnDocument: 'after', runValidators: true }
        )

        if (!updatedProject) {
            return res.status(404).json({ success: false, message: "Project not found" })
        }

        res.status(200).json({ success: true, data: updatedProject })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}


export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid project ID" })
        }

        const deletedProject = await Project.findByIdAndDelete(id)

        if (!deletedProject) {
            return res.status(404).json({ success: false, message: "Project not found" })
        }

        res.status(200).json({ success: true, message: "Project deleted successfully" })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}