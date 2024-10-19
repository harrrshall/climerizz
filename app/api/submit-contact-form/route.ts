import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';

// Load environment variables
const MONGODB_URI = process.env.MONGODB_URI!;
const EMAIL_USER = process.env.EMAIL_USER!;
const EMAIL_PASS = process.env.EMAIL_PASS!;
const TO_EMAIL = process.env.TO_EMAIL!;

if (!MONGODB_URI || !EMAIL_USER || !EMAIL_PASS || !TO_EMAIL) {
  throw new Error('Missing environment variables');
}

// MongoDB connection
let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = await MongoClient.connect(MONGODB_URI);
  cachedClient = client;
  return client;
}

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    // Validate input
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await connectToDatabase();
    const db = client.db('contact_form_db');
    const collection = db.collection('submissions');

    // Save submission to database
    const _result = await collection.insertOne({
      name,
      email,
      message,
      submittedAt: new Date(),
    });

    // Log the result to the console
    console.log('Inserted document ID:', _result.insertedId);

    // Send email notification
    await transporter.sendMail({
      from: EMAIL_USER,
      to: TO_EMAIL,
      subject: 'New Contact Form Submission',
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    return NextResponse.json({ message: 'Submission received and email sent' }, { status: 200 });
  } catch (error) {
    console.error('Error processing submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}