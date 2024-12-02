import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// Ensure GOOGLE_API_KEY is set in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const app = express();

app.use(cors());
app.use(express.json());

app.post("/template", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra. dont add any comments or multiline comments in the code\n"
    );

    const answer = result.response.text().trim().toLowerCase();

    if (answer === "react") {
      res.json({
        prompts: [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n.dont add any comments or multiline comments in the code\n`,
        ],
        uiPrompts: [reactBasePrompt],
      });
      return;
    }

    if (answer === "node") {
      res.json({
        prompts: [
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n.dont add any comments or multiline comments in the code\n`,
        ],
        uiPrompts: [nodeBasePrompt],
      });
      return;
    }

    res.status(403).json({ message: "Cannot determine project type" });
  } catch (error) {
    console.error("Error in /template endpoint:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const messages = req.body.messages;

    // Convert messages to a single prompt string for Gemini
    const combinedPrompt = messages
      .map(
        (msg: { role: string; content: string }) =>
          `${msg.role === "user" ? "User: " : "Assistant: "}${msg.content}`
      )
      .join("\n\n");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `${getSystemPrompt()}\n\n${combinedPrompt}`
    );

    res.json({
      response: result.response.text(),
    });
  } catch (error) {
    console.error("Error in /chat endpoint:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.json({
    message: "Server is Working",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
