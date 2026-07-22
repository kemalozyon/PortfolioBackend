import nodemailer from "nodemailer"
import dns from "node:dns/promises"

const SMTP_HOST = "smtp.gmail.com"

// Railway (and some other hosts) have no outbound IPv6 route, but Gmail's SMTP
// resolves to an IPv6 address first — which fails with "connect ENETUNREACH ...:465".
// Simply preferring IPv4 (setDefaultResultOrder) proved unreliable there, so instead
// we resolve the host to an IPv4 address ourselves and connect straight to that IP.
// The real hostname is kept as the TLS servername so the certificate still validates.
let transporter = null

async function getTransporter() {
    if (transporter) return transporter

    const { address } = await dns.lookup(SMTP_HOST, { family: 4 })

    transporter = nodemailer.createTransport({
        host: address,          // IPv4 literal — no IPv6 connection is ever attempted
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: { servername: SMTP_HOST },   // validate the cert against the real hostname
        // Fail fast instead of hanging ~2 minutes on an unreachable connection
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    })

    return transporter
}

// Sends a notification to myself when someone submits the contact form.
export const sendContactNotification = async ({ name, email, message }) => {
    const to = process.env.EMAIL_TO || process.env.EMAIL_USER

    const mailer = await getTransporter()

    await mailer.sendMail({
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
