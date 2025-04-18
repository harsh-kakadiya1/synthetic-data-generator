const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/synthetic-data-generator', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Contact Form Schema
const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    subject: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Routes
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Save to database
        const contact = new Contact({
            name,
            email,
            subject,
            message
        });
        await contact.save();

        // Send email notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'harshkakadiya128@gmail.com', // Your email
            subject: `New Contact Form Submission: ${subject}`,
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong> ${message}</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Admin route to view submissions
app.get('/api/contact/submissions', async (req, res) => {
    try {
        const submissions = await Contact.find().sort({ createdAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 