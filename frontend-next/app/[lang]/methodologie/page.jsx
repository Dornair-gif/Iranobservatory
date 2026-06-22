import { isValidLang, LANG_META, LANGUAGES } from "@/lib/i18n";
import { METHODOLOGY } from "@/lib/editorial/methodology";
import { EditorialPage } from "@/components/EditorialPage";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return LANGUAGES.map((lang) => ({ lang }));
}

export const dynamic = "force-static";

export async function generateMetadata({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  const c = METHODOLOGY[lang] || METHODOLOGY.fr;
  return {
    title: c.seoTitle,
    description: c.seoDescription,
    alternates: {
      canonical: `https://iranobservatory.org/${lang}/methodologie`,
      languages: Object.fromEntries(
        LANGUAGES.map((l) => [LANG_META[l].htmlLang, `https://iranobservatory.org/${l}/methodologie`])
      ),
    },
    openGraph: {
      title: c.seoTitle,
      description: c.seoDescription,
      url: `https://iranobservatory.org/${lang}/methodologie`,
      type: "article",
      locale: LANG_META[lang].htmlLang,
    },
  };
}

export default async function MethodologyPage({ params }) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const c = METHODOLOGY[lang] || METHODOLOGY.fr;

  const breadcrumbs = [
    { name: lang === "fa" ? "خانه" : lang === "en" ? "Home" : "Accueil", path: `/${lang}` },
    { name: c.breadcrumbName, path: `/${lang}/methodologie` },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.seoTitle,
    description: c.seoDescription,
    inLanguage: LANG_META[lang].htmlLang,
    url: `https://iranobservatory.org/${lang}/methodologie`,
    publisher: {
      "@type": "Organization",
      name: "Iran Observatory · Decrypt & Intel",
      url: "https://iranobservatory.org",
    },
  };

  return (
    <EditorialPage
      lang={lang}
      label={c.label}
      title={c.title}
      subtitle={c.subtitle}
      lastRevised={c.revised}
      breadcrumbs={breadcrumbs}
      jsonLd={jsonLd}
    >
      {c.body()}
    </EditorialPage>
  );
}
