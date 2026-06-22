// Editorial copy — ported verbatim from the React SPA (About / Methodology /
// Manifesto). Kept as a separate module so the page files stay small and the
// trilingual content is reviewable in one place.

import Link from "next/link";

export const ABOUT = {
  fr: {
    label: "Observatoire — À propos",
    title: "À propos",
    seoTitle: "À propos d'Iran Observatory · Decrypt & Intel",
    seoDescription:
      "Plateforme indépendante d'analyse stratégique sur l'Iran : veille vérifiée, décryptages structurels, anticipations longues. Pour les chancelleries, rédactions et fondations européennes.",
    breadcrumbName: "À propos",
    body: ({ lang }) => (
      <>
        <p className="lede">
          Iran Observatory · Decrypt &amp; Intel est une plateforme indépendante d'analyse et de veille
          stratégique sur l'Iran. Sa vocation : fournir aux chancelleries, aux rédactions, aux chercheurs
          et aux décideurs européens une lecture exigeante de la République islamique — de son régime,
          de sa société, de ses interactions régionales — que la presse généraliste ne produit pas et
          que les think tanks anglo-saxons traduisent rarement en français.
        </p>
        <p>
          L'Observatoire publie en français et en anglais. Trois niveaux de production structurent sa
          ligne éditoriale.
        </p>
        <ul>
          <li><strong>Veille.</strong> Événements vérifiés et décryptages flash sous quelques heures, sourcés et datés.</li>
          <li><strong>Décryptage.</strong> Analyses structurelles signées, déclinées en posts longs, carrousels, entretiens, infographies.</li>
          <li><strong>Anticipation.</strong> Notes longues mensuelles, scénarios prospectifs, briefings privés pour partenaires institutionnels.</li>
        </ul>

        <h2>Fondation et direction</h2>
        <p>
          Iran Observatory a été fondé par <strong>Maneli Mirkhan</strong>, stratège franco-iranienne,
          conseillère sur l'Iran et la politique européenne, fondatrice également de <strong>DORNA</strong>.
          L'Observatoire s'appuie sur un réseau de contributeurs experts — chercheurs, journalistes
          diaspora, anciens fonctionnaires, économistes des sanctions, juristes des droits humains —
          réunis dans un programme de fellowship éditorial.
        </p>

        <h2>Indépendance</h2>
        <p>
          Iran Observatory est strictement indépendant. Aucun État, parti, organisation d'opposition ou
          entreprise ne dirige sa ligne éditoriale. Ses sources de financement sont publiées et auditables.
          Son rapport à DORNA, organisation sœur dédiée à la transition démocratique iranienne, est défini
          par une séparation éditoriale stricte : <em>l'Observatoire décrypte, DORNA propose</em>.
        </p>

        <h2>Méthode</h2>
        <p>
          La méthodologie de l'Observatoire — sources, processus de vérification, échelle de certitude,
          lignes rouges — est publiée et opposable. Voir la page{" "}
          <Link href={`/${lang}/methodologie`}>Méthodologie</Link>.
        </p>

        <h2>Affiliations</h2>
        <p>
          Iran Observatory est une recherche affiliée à <strong>DORNA</strong> (
          <a href="https://dorna.eu" target="_blank" rel="noopener noreferrer">dorna.eu</a>),
          plateforme de plaidoyer pour la transition démocratique iranienne fondée par
          <a href="https://manelimirkhan.com" target="_blank" rel="noopener noreferrer"> Maneli Mirkhan</a>.
          Bien que la direction soit commune, la ligne éditoriale est strictement séparée.
        </p>

        <h2>Contact</h2>
        <p>
          <a href="mailto:contact@iranobservatory.org">contact@iranobservatory.org</a>
        </p>
        <p>
          Réseaux : X (FR <a href="https://x.com/ObservatoireIR" target="_blank" rel="noopener noreferrer">@ObservatoireIR</a> ·
          EN <a href="https://x.com/IrObservatory" target="_blank" rel="noopener noreferrer">@IrObservatory</a>),
          Instagram (<a href="https://instagram.com/iranobservatory" target="_blank" rel="noopener noreferrer">@iranobservatory</a>),
          LinkedIn, Substack.
        </p>
      </>
    ),
  },
  en: {
    label: "Observatory — About",
    title: "About",
    seoTitle: "About Iran Observatory · Decrypt & Intel",
    seoDescription:
      "An independent strategic intelligence platform on Iran: verified monitoring, structural analysis, long-horizon forecasting. Built for European chancelleries, newsrooms and foundations.",
    breadcrumbName: "About",
    body: ({ lang }) => (
      <>
        <p className="lede">
          Iran Observatory · Decrypt &amp; Intel is an independent platform of strategic analysis and
          intelligence on Iran. Its mission: to provide chancelleries, newsrooms, researchers and
          European decision-makers with a demanding reading of the Islamic Republic — its regime, its
          society, its regional interactions — that mainstream press does not produce and that
          Anglo-Saxon think tanks rarely translate into French.
        </p>
        <p>The Observatory publishes in French and English across three editorial tiers.</p>
        <ul>
          <li><strong>Monitoring.</strong> Verified events and flash decoding within hours, sourced and dated.</li>
          <li><strong>Analysis.</strong> Signed structural pieces, long posts, carousels, interviews, infographics.</li>
          <li><strong>Foresight.</strong> Monthly long-form notes, prospective scenarios, private briefings for institutional partners.</li>
        </ul>

        <h2>Founder &amp; direction</h2>
        <p>
          Iran Observatory was founded by <strong>Maneli Mirkhan</strong>, Franco-Iranian strategist,
          advisor on Iran and European policy, and founder of <strong>DORNA</strong>. The Observatory is
          supported by a network of expert contributors — researchers, diaspora journalists, former civil
          servants, sanctions economists, human-rights jurists — gathered in an editorial fellowship.
        </p>

        <h2>Independence</h2>
        <p>
          Iran Observatory is strictly independent. No state, party, opposition organisation or company
          directs its editorial line. Its funding sources are published and auditable. Its relationship
          to DORNA, sister organisation dedicated to Iran's democratic transition, is defined by strict
          editorial separation: <em>the Observatory decodes, DORNA proposes</em>.
        </p>

        <h2>Method</h2>
        <p>
          The Observatory's methodology — sources, verification process, certainty scale, red lines — is
          published and accountable. See the <Link href={`/${lang}/methodologie`}>Methodology</Link> page.
        </p>

        <h2>Affiliations</h2>
        <p>
          Iran Observatory is research affiliated with <strong>DORNA</strong> (
          <a href="https://dorna.eu" target="_blank" rel="noopener noreferrer">dorna.eu</a>), the
          democratic-transition advocacy platform founded by{" "}
          <a href="https://manelimirkhan.com" target="_blank" rel="noopener noreferrer">Maneli Mirkhan</a>.
          Leadership is shared; editorial lines are strictly separated.
        </p>

        <h2>Contact</h2>
        <p>
          <a href="mailto:contact@iranobservatory.org">contact@iranobservatory.org</a>
        </p>
        <p>
          Social: X (FR <a href="https://x.com/ObservatoireIR" target="_blank" rel="noopener noreferrer">@ObservatoireIR</a> ·
          EN <a href="https://x.com/IrObservatory" target="_blank" rel="noopener noreferrer">@IrObservatory</a>),
          Instagram (<a href="https://instagram.com/iranobservatory" target="_blank" rel="noopener noreferrer">@iranobservatory</a>),
          LinkedIn, Substack.
        </p>
      </>
    ),
  },
  fa: {
    label: "رصدخانه — درباره ما",
    title: "درباره ما",
    seoTitle: "درباره رصدخانه ایران",
    seoDescription:
      "پلتفرم مستقل تحلیل و رصد استراتژیک ایران: رصد راستی‌آزمایی‌شده، تحلیل ساختاری و چشم‌انداز بلندمدت برای سفارت‌خانه‌ها، رسانه‌ها و بنیادهای اروپایی.",
    breadcrumbName: "درباره ما",
    body: ({ lang }) => (
      <>
        <p className="lede">
          رصدخانه ایران یک پلتفرم مستقل تحلیل و رصد استراتژیک درباره ایران است. هدف آن ارائه قرائتی
          دقیق از جمهوری اسلامی — نظام، جامعه و تعاملات منطقه‌ای — به سفارت‌خانه‌ها، اتاق‌های خبر،
          پژوهشگران و تصمیم‌گیران اروپایی است.
        </p>
        <p>رصدخانه به دو زبان فرانسوی و انگلیسی منتشر می‌شود و سه سطح تولید دارد.</p>
        <ul>
          <li><strong>رصد.</strong> رویدادهای راستی‌آزمایی‌شده و رمزگشایی سریع در عرض چند ساعت، مستند و تاریخ‌دار.</li>
          <li><strong>تحلیل.</strong> تحلیل‌های ساختاری امضاء شده، در قالب پست‌های بلند، کاروسل، مصاحبه و اینفوگرافی.</li>
          <li><strong>پیش‌بینی.</strong> یادداشت‌های بلند ماهانه، سناریوهای آینده‌نگرانه، گزارش‌های خصوصی برای شرکای نهادی.</li>
        </ul>

        <h2>بنیان‌گذار و مدیریت</h2>
        <p>
          رصدخانه ایران توسط <strong>مانلی میرخان</strong>، استراتژیست فرانسوی-ایرانی و بنیان‌گذار
          <strong> دورنا</strong> تأسیس شده است.
        </p>

        <h2>استقلال</h2>
        <p>
          رصدخانه ایران کاملاً مستقل است. هیچ دولت، حزب، سازمان اپوزیسیون یا شرکتی خط مشی تحریری آن را
          هدایت نمی‌کند. <em>رصدخانه رمزگشایی می‌کند، دورنا پیشنهاد می‌دهد</em>.
        </p>

        <h2>روش</h2>
        <p>
          روش‌شناسی رصدخانه منتشر و قابل ارجاع است. صفحه{" "}
          <Link href={`/${lang}/methodologie`}>روش‌شناسی</Link> را ببینید.
        </p>

        <h2>تماس</h2>
        <p>
          <a href="mailto:contact@iranobservatory.org">contact@iranobservatory.org</a>
        </p>
      </>
    ),
  },
};
