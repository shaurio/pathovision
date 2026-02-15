import { NextResponse } from "next/server";
import OpenAI from "openai";

console.log("API KEY PRESENT:", !!process.env.OPENAI_API_KEY);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



export async function POST(req: Request) {
    console.log("API HIT");
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const arrayBuffer = await image.arrayBuffer();
    const imageBlob = new Blob([arrayBuffer]);

    // Build prompt as text
    const promptText = `
You are a biomedical microscopy assistant.
Analyze the attached image and describe:
1. Likely organism or structure,
2. Key visual features used in interpretation,
3. A confidence estimate,
4. If uncertain, say so clearly.
`;

    const response: any = await client.responses.create({
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
        image_url: "https://example.com/my-image.png", // or Base64 string
        detail: "This is a sample image for analysis",
      },
    ], 
  },
],

});

    const outputText = response.output_text ?? "No output returned";

    return NextResponse.json({ result: outputText });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
