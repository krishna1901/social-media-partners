import { listPosts, getPostCounts } from "@/lib/db/posts";
import { PostsView } from "./_view";

export default async function PostsPage() {
  const [posts, counts] = await Promise.all([listPosts(), getPostCounts()]);
  return <PostsView posts={posts} counts={counts} />;
}
