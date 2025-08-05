// Load environment variables from .env file
import 'dotenv/config';

import express from 'express';
import cors from 'cors';

import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
const port = process.env.PORT || 3000; 

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable parsing of JSON request bodies

// Basic test route
app.get('/', (req, res) => {
    res.send('Grease Monkey AI Backend is running!');
});

// AI Troubleshooting Endpoint
app.post('/api/troubleshoot', async (req, res) => {
    const { vehicle, problem } = req.body; 
    console.log(`Received request for ${vehicle.year} ${vehicle.make} ${vehicle.model}: ${problem}`);

    if (!problem || !vehicle || !vehicle.make || !vehicle.model || !vehicle.year) {
        return res.status(400).json({ error: 'Missing vehicle details or problem description.' });
    }

    try {
        // --- AI MODEL INTERACTION LOGIC ---
        let aiDiagnosis = '';
        let aiSteps = [];
        let aiParts = [];

        const model = genAI.getGenerativeModel({ model: "gemini-pro"});
        const prompt = `You are an expert automotive mechanic and a helpful assistant for an auto parts website.
        The user's vehicle is a ${vehicle.year} ${vehicle.make} ${vehicle.model}.
        The user describes the problem as: "${problem}".

        Based on this information:
        1. Provide a concise diagnosis.
        2. List step-by-step troubleshooting and repair instructions.
        3. Finally, list the specific parts required for the repair in a simple, comma-separated list like "part name 1, part name 2, part name 3". Do NOT include any other text after the parts list. If no specific parts are needed, simply output "N/A".

        Example output:
        Diagnosis: Your vehicle might have a worn serpentine belt.
        Steps:
        1. Visually inspect the serpentine belt for cracks, fraying, or missing ribs.
        2. Check the tensioner pulley for proper function.
        3. Listen for squealing noises, especially during startup or when turning.
        Parts: Serpentine Belt, Serpentine Belt Tensioner
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Attempt to parse the AI's response
        const diagnosisMatch = text.match(/Diagnosis: (.+)/);
        const stepsMatch = text.match(/Steps:\n([\s\S]+?)(?=\nParts:)/);
        const partsMatch = text.match(/Parts: (.+)/);

        aiDiagnosis = diagnosisMatch ? diagnosisMatch[1].trim() : "Could not determine diagnosis.";
        if (stepsMatch) {
            aiSteps = stepsMatch[1].split('\n').map(s => s.trim()).filter(s => s.length > 0 && s.match(/^\d+\./)); // Filter for numbered steps
        } else {
            aiSteps = ["Could not determine steps."];
        }
        aiParts = partsMatch ? partsMatch[1].split(',').map(p => p.trim()).filter(p => p !== 'N/A') : [];

        if (aiParts.length === 0 && partsMatch && partsMatch[1].trim() === 'N/A') {
            aiParts = ['N/A']; // Explicitly show N/A if AI returned it
        }

        res.json({
            diagnosis: aiDiagnosis,
            steps: aiSteps,
            parts: aiParts,
            fullResponse: text // For debugging, you might send the full AI text
        });

    } catch (aiError) {
        console.error('Error calling AI service:', aiError);
        res.status(500).json({ error: 'Failed to get AI diagnosis. Please check backend logs.', details: aiError.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Grease Monkey AI Backend listening at http://localhost:${port}`);
});