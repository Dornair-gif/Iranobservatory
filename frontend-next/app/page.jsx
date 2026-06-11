import { redirect } from "next/navigation";
import { DEFAULT_LANG } from "@/lib/i18n";

// Root entry point — bounce to default language. Vercel Edge handles this
// instantly. We intentionally do NOT auto-detect Accept-Language because
// each language has its own canonical URL space and we want stable indexing.
export default function RootPage() {
  redirect(`/${DEFAULT_LANG}`);
}
