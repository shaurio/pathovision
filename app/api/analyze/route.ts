export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    console.log("API HIT");

    const formData = await req.formData();
    const image = formData.get("image") as File | null;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Convert image to base64
    const arrayBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(arrayBuffer).toString("base64");

    const promptText = `
You are a biomedical microscopy assistant.

Analyze the image and respond in EXACTLY this format:

Likely Organism:
<one short paragraph>

Key Visual Features:
- bullet point
- bullet point
- bullet point

Confidence:
<number between 0 and 100>%

Uncertainty Notes: (image quality, ambiguous features, etc.)
<one short sentence, or "None">
`;


    const response = await client.responses.create({
  model: "gpt-4.1-mini",
  input: [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: promptText,
        },
        {
          type: "input_image",
          image_url: `data:image/png;base64,${imageBase64}`,
        },
      ],
    },
  ],
});




    const outputText =
      response.output_text ||
      "No analysis text returned.";

    return NextResponse.json({ result: outputText });
  } catch (error) {
    console.error("ANALYSIS ERROR:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
