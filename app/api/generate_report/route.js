import { GoogleGenerativeAI } from "@google/generative-ai";
import { VERRA } from './verra.js';
import { GOLD_STANDARD_DOCUMENT } from './gold_standard.js';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const apiKey = process.env.GOOGLE_API_KEY;
const mongoUri = process.env.MONGODB_URI;
const genAI = new GoogleGenerativeAI(apiKey);




const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "You are a world-renowned expert in carbon credit evaluation and carbon removal verification. Your task is to assess the quality of carbon credit projects using the provided safeguard criteria.\n",
  generationConfig: {
    temperature: 0.7,
    topP: 0.4,
    topK: 40,
    maxOutputTokens: 4096,
    responseMimeType: "application/json",
  }
});



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

// Generate hash for file content
async function generateFileHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check for cached response
async function getCachedResponse(fileHash) {
  try {
    const client = await getMongoClient();
    const db = client.db('gemini_cache');
    const collection = db.collection('responses');

    const cachedItem = await collection.findOne({
      fileHash,
      timestamp: {
        $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hour cache
      }
    });

    if (cachedItem) {
      await collection.updateOne(
        { fileHash },
        { $set: { lastAccessed: new Date() } }
      );
    }

    return cachedItem?.response || null;
  } catch (error) {
    console.error('Error getting cached response:', error);
    return null;
  }
}

// File processing function
async function processFileUpload(file) {
  const fileContent = await file.arrayBuffer();
  const base64Data = Buffer.from(fileContent).toString('base64');
  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type
    }
  };
}

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('files');
  const standard = formData.get('standard');

  if (!file || !standard) {
    return new Response(
      JSON.stringify({ error: !file ? 'No file uploaded' : 'Standard not selected' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let DOCUMENT = standard === 'Verra' ? VERRA : (standard === 'Gold_Standard' ? GOLD_STANDARD_DOCUMENT : null);
  if (!DOCUMENT) {
    return new Response(
      JSON.stringify({ error: 'Invalid standard selected' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Generate file hash for cache key
    const fileHash = await generateFileHash(file);

    // Check cache
    const cachedResponse = await getCachedResponse(fileHash);
    if (cachedResponse) {
      return new Response(cachedResponse, {
        headers: {
          'Content-Type': 'application/json',
          'X-File-Hash': fileHash,
          'X-Cache-Hit': 'true'
        }
      });
    }

    // Process file if no cache hit
    const processedFile = await processFileUpload(file);

    const prompt = `Using the provided rules in the ${DOCUMENT} file, the project will be evaluated based on the following criteria:
              
        1. *No Net Harm*
            - *Assessment*: Identify potential impacts and propose mitigation strategies.
            - *Documentation*: Ensure proper documentation of mitigation strategies.
            - *Monitoring*: Evaluate the effectiveness of mitigation strategies over time.
            - *Evidence Required*: Impact assessments, mitigation plans, and monitoring reports.
        
        2. *Stakeholder Engagement and Consent*
            - *Stakeholder Involvement*: Ensure stakeholder involvement throughout the project lifecycle.
            - *Consent*: Obtain Free, Prior, and Informed Consent (FPIC) from affected groups.
            - *Ongoing Dialogue*: Maintain continuous stakeholder engagement mechanisms.
            - *Evidence Required*: Consultation records, FPIC documentation, and grievance mechanisms.
        
        3. *Human Rights and Social Equity*
            - *Compliance*: Ensure adherence to human rights standards.
            - *Support for Vulnerable Populations*: Provide adequate support to vulnerable groups.
            - *Labor Conditions*: Monitor and maintain fair labor conditions.
            - *Evidence Required*: Human rights policies, equity programs, and labor agreements.
        
        4. *Livelihood Impacts*
            - *Access Effects*: Analyze the project's impact on land and resource access.
            - *Community Impact*: Assess community benefits and disruptions.
            - *Co-benefits*: Identify additional community benefits.
            - *Evidence Required*: Impact assessments, benefit-sharing agreements, and monitoring data.
        
        5. *Environmental Health*
            - *Protection Measures*: Implement environmental protection measures.
            - *Pollution Management*: Address pollution and manage waste effectively.
            - *Ecosystem Preservation*: Ensure local ecosystem preservation.
            - *Evidence Required*: Environmental management plans and monitoring data.
        
        6. *Gender and Social Inclusion*
            - *Inclusive Decision-Making*: Ensure decision-making includes all social groups.
            - *Gender-Sensitive Policies*: Implement gender-sensitive policies.
            - *Non-discrimination*: Establish measures to prevent discrimination.
            - *Evidence Required*: Gender action plans and inclusion policies.
        
        7. *Sustainable Development Alignment*
            - *SDG Contributions*: Ensure alignment with Sustainable Development Goals (SDGs).
            - *Poverty Reduction*: Assess the project's impact on poverty reduction.
            - *Additional Benefits*: Evaluate additional development benefits.
            - *Evidence Required*: SDG alignment documentation and development impact data.
        
        For each criterion:
        
        1. *Analyze Provided Evidence*: Evaluate the quality and comprehensiveness of the provided documentation.
        2. *Calculate Percentage Score*: Score the project based on criterion adherence (e.g., percentage of goals met).
        3. *Provide Detailed Justification*: Offer a detailed explanation for the assigned score.
        4. *List Specific Findings*: Highlight key findings related to the criterion.
        
        * NOTE: OUTPUT SHOULD BE STRICTLY IN THIS FORMAT:
        
        No_Net_Harm: {
          "Analysis": {
            "The project has submitted an Environmental Impact Assessment (EIA) report, identifying potential negative impacts of construction activities on local water sources and air quality. A mitigation plan details pollution control through water management and air filtration systems. However, the plan lacks a clear implementation timeline, and no independent monitoring reports have been submitted."
          },
          "Percentage": "70%",
          "Justification": {
            "The project has conducted a thorough impact identification process, highlighting risks to local water bodies and air quality. Mitigation strategies, such as water filtration systems and pollution control measures, are well documented. However, the absence of ongoing effectiveness monitoring and independent verification weakens the proposed strategies' credibility. The lack of clarity around implementation timing raises concerns about whether mitigation measures will be enacted promptly and effectively."
          },
          "List_Specific_Findings": {
            "Positive": "Detailed mitigation strategies for air and water pollution.",
            "Negative": [
              "No monitoring reports or independent verification of mitigation efforts.",
              "No specific timeline for implementing mitigation strategies."
            ]
          }
        }
          
        
        AND SO ON, FOR:
        
        Stakeholder_Engagement_and_Consent:
        Human_Rights_and_Social_Equity:
        Impact_on_Livelihoods:
        Environmental_Health:
        Gender_and_Social_Inclusion:
        Sustainable_Development_Contributions:
        
        DO NOT REPLY WITH ANYTHING ELSE BESIDES THIS, here is my document`

    // Initialize chat session with Gemini

    // Get response
    const result = await model.generateContent(prompt, processedFile);

    // Extract the text content from the result
    let responseText = result.response.text();
    console.log(responseText);


    // Attempt to parse the response text as JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (error) {
      // If parsing fails, try adding a closing brace and parse again
      if (error instanceof SyntaxError) {
        console.warn("Initial JSON parsing failed. Attempting to add closing brace.");
        try {
          responseText += "}";
          parsedResponse = JSON.parse(responseText);
          console.log("JSON parsing successful after adding closing brace.");
        } catch (secondError) {
          console.error("JSON parsing failed even after adding closing brace:", secondError);
          throw new Error("Unable to parse response as JSON");
        }
      } else {
        console.error("Unexpected error during JSON parsing:", error);
        throw error;
      }
    }


    // Return the parsed response along with the fileHash
    return new Response(JSON.stringify(parsedResponse), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-File-Hash': fileHash,
        'X-Cache-Hit': 'false'
      },
    });

  } catch (error) {
    console.error('Error in generate_report:', error);
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
