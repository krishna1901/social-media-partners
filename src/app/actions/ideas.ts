"use server";

// Mock database for ideas
let ideasStore = [
  { id: "1", title: "5 tips for productivity", content_type: "text", status: "new" },
  { id: "2", title: "Why Next.js is great", content_type: "video", status: "in_progress" }
];

export async function getIdeas() {
  return ideasStore;
}

export async function createIdea(formData: FormData) {
  const title = formData.get("title") as string;
  const content_type = formData.get("content_type") as string;
  
  ideasStore.push({
    id: Math.random().toString(36).substring(7),
    title,
    content_type,
    status: "new"
  });
}

export async function deleteIdea(id: string) {
  ideasStore = ideasStore.filter(i => i.id !== id);
}

export async function updateIdeaStatus(id: string, status: string) {
  const idea = ideasStore.find(i => i.id === id);
  if (idea) idea.status = status;
}
