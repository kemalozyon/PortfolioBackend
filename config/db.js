import mongoose from "mongoose"

// Module state survives across requests handled by the same warm function.
let connectionPromise = null

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose
    }

    if (!connectionPromise) {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is required")
        }

        connectionPromise = mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        }).finally(() => {
            // Allow retries after failure or a later disconnection.
            connectionPromise = null
        })
    }

    return connectionPromise
}

export default connectDB
