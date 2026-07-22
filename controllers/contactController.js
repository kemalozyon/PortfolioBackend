import Contact from "../models/Contact.js"
import { sendContactNotification } from "../config/mailer.js"

// POST /api/contact  (public)
export const createContact = async (req, res) => {
    try {
        const { name, email, message } = req.body

        // Save the message first so nothing is lost even if the email fails
        await Contact.create({ name, email, message })

        // Reply immediately — the message is safely stored. The notification email
        // is best-effort and sent in the background, so the visitor never waits on it.
        res.status(201).json({ success: true, message: "Thanks! Your message has been sent." })

        sendContactNotification({ name, email, message }).catch((mailError) => {
            console.error("Contact email failed to send:", mailError.message)
        })

    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}

// GET /api/contact  (protected — admin only)
export const getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 })
        res.status(200).json(contacts)
    } catch (error) {
        res.status(500).json({ message: "Server Error! Messages cannot be retrieved!" })
    }
}

// DELETE /api/contact/:id  (protected — admin only)
export const deleteContact = async (req, res) => {
    try {
        const deleted = await Contact.findByIdAndDelete(req.params.id)

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Message not found" })
        }

        res.status(200).json({ success: true, message: "Message deleted successfully" })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}
