import mongoose from "mongoose"

const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI)

        console.log("Successfully connected to mongodb: ", conn.connection.host)
    }catch(error){
        console.log("Cannot connect to the mongodb: ", error.message)
        process.exit(1)
    }
}

export default connectDB;