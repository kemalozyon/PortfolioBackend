import Project from '../models/Project.js'

export const getProjects = async (req, res) => {
    try{
        const projects = await Project.find().sort({createdAt: -1})
        res.status(200).json(projects)
    }catch(error){
        res.status(500).json({message: "Server Error! Unable to fetch products!"})
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
