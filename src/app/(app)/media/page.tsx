import { listMedia } from "@/lib/db/media";
import { listPosts } from "@/lib/db/posts";
import { MediaView } from "./_view";

export default async function MediaLibraryPage() {
  const [assets, posts] = await Promise.all([listMedia(), listPosts()]);
  return <MediaView assets={assets} posts={posts} />;
}
