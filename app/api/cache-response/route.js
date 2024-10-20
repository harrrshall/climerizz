import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;

// MongoDB connection management
let clientPromise = null;

async function getMongoClient() {
    if (!clientPromise) {
        clientPromise = MongoClient.connect(mongoUri, {
            maxPoolSize: 10,
        });
    }
    return clientPromise;
}

async function setCachedResponse(fileHash, response) {
    try {
        const client = await getMongoClient();
        const db = client.db('gemini_cache');
        const collection = db.collection('responses');

        await collection.updateOne(
            { fileHash },
            {
                $set: {
                    response,
                    timestamp: new Date(),
                    lastAccessed: new Date()
                }
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('Error setting cached response:', error);
        throw error;
    }
}

export async function POST(req) {
    try {
        const { fileHash, response } = await req.json();
        
        if (!fileHash || !response) {
            return new Response(
                JSON.stringify({ error: 'Missing fileHash or response' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        await setCachedResponse(fileHash, response);

        return new Response(
            JSON.stringify({ success: true, message: 'Response cached successfully' }),
            { 
                status: 200, 
                headers: { 'Content-Type': 'application/json' } 
            }
        );
    } catch (error) {
        console.error('Error in cache-response:', error);
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                details: error.message
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
