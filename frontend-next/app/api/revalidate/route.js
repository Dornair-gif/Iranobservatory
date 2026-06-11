import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// On-demand revalidation endpoint.
// Called by the Emergent backend whenever admin publishes/edits an article.
//
// Usage (from backend):
//   POST https://iranobservatory.org/api/revalidate?secret=XXX&path=/fr/article/foo
//   POST https://iranobservatory.org/api/revalidate?secret=XXX&tag=articles
//
// IMPORTANT: set REVALIDATE_SECRET in Vercel env vars AND on the Emergent
// backend. They must match exactly. Generate with: openssl rand -hex 32

export async function POST(request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const path = url.searchParams.get("path");
  const tag = url.searchParams.get("tag");

  if (!process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Server REVALIDATE_SECRET not set" }, { status: 500 });
  }
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  try {
    if (path) {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path });
    }
    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({ revalidated: true, tag });
    }
    // No specific target → blanket revalidate of the most common entry points
    revalidatePath("/", "layout");
    return NextResponse.json({ revalidated: true, scope: "layout" });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST with ?secret=XXX&path=/foo" });
}
