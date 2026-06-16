"use server";

export async function generateContent(toolId: string, prompt: string) {
  // Mock AI generation
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {
    content: `Here is the generated ${toolId} for: "${prompt}"\n\n1. This is a great point to make.\n2. Keep it engaging and concise.\n3. Add a call to action at the end!\n\n#content #ai`
  };
}
