import nodemailer from "nodemailer"

// A single reusable transporter. Uses a standard SMTP service (Gmail by default).
// Set EMAIL_SERVICE to override (e.g. "outlook", "yahoo") or leave it for Gmail.
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

// Sends a notification to myself when someone submits the contact form.
export const sendContactNotification = async ({ name, email, message }) => {
    const to = process.env.EMAIL_TO || process.env.EMAIL_USER

    await transporter.sendMail({
        from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
        to,
        replyTo: email, // so hitting "Reply" answers the visitor directly
        subject: `New contact message from ${name}`,
        text: `From: ${name} <${email}>\n\n${message}`,
        html: `
            <h2>New message from your portfolio</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
        `
    })
}
