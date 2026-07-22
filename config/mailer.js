import { Resend } from "resend"

// Railway blocks outbound SMTP, so instead of Gmail/Nodemailer we send email over
// HTTPS (port 443) via Resend's API — which is never blocked. Requires RESEND_API_KEY.
//
// The client is created lazily: `new Resend()` throws if the key is missing, and this
// module is imported at server startup, so constructing it eagerly would crash the
// whole server when the key isn't set. Lazy construction keeps a missing key a
// best-effort email failure instead of a fatal boot error.
let resend = null
const getResend = () => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not set")
    }
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY)
    }
    return resend
}

// The "from" address must be on a domain verified in Resend. For quick testing,
// Resend allows "onboarding@resend.dev" (delivers only to the address you signed up
// with). Once kemalozyon.com is verified, set EMAIL_FROM to e.g.
// "Portfolio Contact <contact@kemalozyon.com>".
const FROM = process.env.EMAIL_FROM || "Portfolio Contact <onboarding@resend.dev>"

// Sends a notification to myself when someone submits the contact form.
export const sendContactNotification = async ({ name, email, message }) => {
    const to = process.env.EMAIL_TO || process.env.EMAIL_USER

    const { data, error } = await getResend().emails.send({
        from: FROM,
        to,
        replyTo: email, // hitting "Reply" answers the visitor directly
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

    // The Resend SDK returns API errors in the response body instead of throwing,
    // so surface them as a thrown error for the controller's .catch() to log.
    if (error) {
        throw new Error(error.message || "Resend failed to send email")
    }

    return data
}
