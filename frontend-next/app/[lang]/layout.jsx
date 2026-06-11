import { notFound } from "next/navigation";
import { LANG_META, isValidLang, LANGUAGES } from "@/lib/i18n";

// Per-language layout. Sets <html lang="…" dir="…"> via inline elements
// since the root layout already opened <html>. Next.js handles this by
// re-rendering the entire tree when the [lang] segment changes.

export function generateStaticParams() {
  return LANGUAGES.map((lang) => ({ lang }));
}

export default async function LangLayout({ children, params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const meta = LANG_META[lang];

  return (
    <div lang={meta.htmlLang} dir={meta.dir} data-lang={lang}>
      {children}
    </div>
  );
}
