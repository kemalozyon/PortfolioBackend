import User from "../models/User.js"
import jwt from "jsonwebtoken"

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "30d"})
}

// /api/auth/login
export const loginAdmin = async (req , res ) => {
    const {email, password} = req.body

    const user = await User.findOne({email})

    if(user && await (user.matchPassword(password))){
        res.json({
            _id: user._id,
            email: user.email,
            token: generateToken(user._id)
        })
    }else{
        res.status(401).json({message: "Invalid email or password"})
    }


}

// there will be only one user and it is admin after I created this endpoint I have deleted it
// export const registerAdmin = async (req, res) => {
//     const {email, password} = req.body
//     const userExists = await User.findOne({email})
//     if(userExists){ return res.status(400).json({message: "This user is already registered"})}

//     const user = await User.create({email, password})
//     if(user){
//         res.status(201).json({_id: user._id, email: user.email, token: generateToken(user._id)})
//     }else{
//         res.status(400).json({message: "Invalid user input"})
//     }
// }