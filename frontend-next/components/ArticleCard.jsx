import Link from "next/link";
import { format } from "date-fns";
import { normalizeImageUrl } from "@/lib/imageUrl";
import { T } from "@/lib/i18n";

// Plain server component card — used by the home + listing pages.
// `lang` is needed both for routing and for picking the right title/summary.
export function ArticleCard({ article, lang }) {
  const t = T[lang] || T.fr;
  const title = article[`title_${lang}`] || article.title_en || article.title_fr;
  const summary = article[`summary_${lang}`] || article.summary_en || article.summary_fr;
  const date = article.published_at || article.created_at;
  const img = normalizeImageUrl(article.image_url);

  return (
    <Link
      href={`/${lang}/article/${article.slug || article.id}`}
      className="block bg-white border border-zinc-200 hover:shadow-lg transition-shadow group overflow-hidden"
    >
      {img && (
        <div className="w-full aspect-[16/9] overflow-hidden bg-zinc-100">
          {/* Plain <img> on purpose: GridFS images are dynamic and not always
              ideally sized; Next/Image would loop on revalidation. */}
          <img
            src={img}
            alt={title || ""}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-5">
        {date && (
          <p className="text-xs text-zinc-400 font-mono mb-2">
            {format(new Date(date), "dd MMM yyyy")}
          </p>
        )}
        <h3 className="font-heading font-bold text-lg mb-2 group-hover:text-[#1E3A5F] line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-zinc-600 line-clamp-3">{summary}</p>
        <p className="mt-3 text-xs font-mono uppercase tracking-wider text-[#3DB883]">
          {t.readMore} →
        </p>
      </div>
    </Link>
  );
}
