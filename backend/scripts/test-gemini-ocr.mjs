import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY?.trim();
const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

if (!apiKey) {
  console.error("GEMINI_API_KEY missing");
  process.exit(1);
}

const prompt = `Extract repair order fields from this sample text and return JSON only:
Customer: John Doe, Phone: +49 170 1234567, Device: iPhone 14, Problem: cracked screen, Price: 120 EUR
Schema: {"customerName":null,"phoneNumber":null,"problemDescription":null,"estimatedPrice":null}`;

async function testModel(name) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: name,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log(`\n=== ${name} ===`);
    console.log("OK:", text?.slice(0, 300));
    return true;
  } catch (error) {
    console.log(`\n=== ${name} ===`);
    console.error("FAIL:", error?.message || error);
    return false;
  }
}

console.log("Testing GEMINI_MODEL from .env:", modelName);
await testModel(modelName);
if (modelName !== "gemini-2.5-flash") {
  await testModel("gemini-2.5-flash");
}
