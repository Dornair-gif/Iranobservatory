import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { EditorialPage } from './EditorialPage';

const COPY = {
  fr: {
    label: "Observatoire — À propos",
    title: "À propos",
    seoTitle: "À propos d'Iran Observatory",
    seoDescription:
      "Plateforme indépendante d'analyse stratégique sur l'Iran : veille vérifiée, décryptages structurels, anticipations longues. Pour les chancelleries, rédactions et fondations européennes.",
    breadcrumbName: "À propos",
    body: () => (
      <>
        <p className="lede">
          Iran Observatory est une plateforme indépendante d'analyse et de veille stratégique sur l'Iran. Sa
          vocation : fournir aux chancelleries, aux rédactions, aux chercheurs et aux décideurs européens
          une lecture exigeante de la République islamique — de son régime, de sa société, de ses
          interactions régionales — que la presse généraliste ne produit pas et que les think tanks
          anglo-saxons traduisent rarement en français.
        </p>
        <p>
          L'Observatoire publie en français et en anglais. Trois niveaux de production structurent sa ligne
          éditoriale.
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
          par une séparation éditoriale stricte : <em>l'Observatoire décrypte, DORNA propose</em>. Cette
          discipline est non négociable.
        </p>

        <h2>Méthode</h2>
        <p>
          La méthodologie de l'Observatoire — sources, processus de vérification, échelle de certitude,
          lignes rouges — est publiée et opposable. Voir la page{' '}
          <Link to="/methodologie" className="underline decoration-[#3DB883] decoration-2 underline-offset-4 hover:text-[#1E3A5F]">Méthodologie</Link>.
        </p>

        <h2>Pour aller plus loin</h2>
        <ul>
          <li><Link to="/manifeste" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">Manifeste</Link> — pourquoi cet observatoire existe, signé par sa fondatrice.</li>
          <li><Link to="/methodologie" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">Méthodologie</Link> — nos sources, notre vérification, nos lignes rouges.</li>
          <li><strong>Newsletter</strong> — abonnement gratuit, parutions hebdomadaires.</li>
          <li><strong>Fellowship</strong> — candidatures de contributeurs experts.</li>
          <li><strong>Partenariats institutionnels</strong> — fondations, think tanks, briefings commandés.</li>
        </ul>

        <h2>Contact</h2>
        <ul>
          <li>Rédaction : <a href="mailto:contact@iranobservatory.org" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">contact@iranobservatory.org</a></li>
          <li>Presse : <a href="mailto:presse@iranobservatory.org" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">presse@iranobservatory.org</a></li>
          <li>Partenariats et fondations : <a href="mailto:partenariats@iranobservatory.org" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">partenariats@iranobservatory.org</a></li>
          <li>Réseaux : X (FR @ObservatoireIR · EN @IrObservatory), Instagram (@iranobservatory), LinkedIn, Substack.</li>
        </ul>
      </>
    ),
  },
  en: {
    label: "Observatory — About",
    title: "About",
    seoTitle: "About Iran Observatory",
    seoDescription:
      "An independent strategic intelligence platform on Iran: verified monitoring, structural analysis, long-horizon forecasting. Built for European chancelleries, newsrooms and foundations.",
    breadcrumbName: "About",
    body: () => (
      <>
        <p className="lede">
          Iran Observatory is an independent platform of strategic analysis and intelligence on Iran. Its
          mission: to provide chancelleries, newsrooms, researchers and European decision-makers with a
          demanding reading of the Islamic Republic — its regime, its society, its regional interactions —
          that mainstream press does not produce and that Anglo-Saxon think tanks rarely translate into
          French.
        </p>
        <p>The Observatory publishes in French and English across three editorial tiers.</p>
        <ul>
          <li><strong>Monitoring.</strong> Verified events and flash decoding within hours, sourced and dated.</li>
          <li><strong>Analysis.</strong> Signed structural pieces, long posts, carousels, interviews, infographics.</li>
          <li><strong>Foresight.</strong> Monthly long-form notes, prospective scenarios, private briefings for institutional partners.</li>
        </ul>

        <h2>Founder &amp; direction</h2>
        <p>
          Iran Observatory was founded by <strong>Maneli Mirkhan</strong>, Franco-Iranian strategist, advisor
          on Iran and European policy, and founder of <strong>DORNA</strong>. The Observatory is supported
          by a network of expert contributors — researchers, diaspora journalists, former civil servants,
          sanctions economists, human-rights jurists — gathered in an editorial fellowship programme.
        </p>

        <h2>Independence</h2>
        <p>
          Iran Observatory is strictly independent. No state, party, opposition organisation or company
          directs its editorial line. Its funding sources are published and auditable. Its relationship to
          DORNA, sister organisation dedicated to Iran's democratic transition, is defined by strict editorial
          separation: <em>the Observatory decodes, DORNA proposes</em>. This discipline is non-negotiable.
        </p>

        <h2>Method</h2>
        <p>
          The Observatory's methodology — sources, verification process, certainty scale, red lines — is
          published and accountable. See the{' '}
          <Link to="/methodologie" className="underline decoration-[#3DB883] decoration-2 underline-offset-4 hover:text-[#1E3A5F]">Methodology</Link> page.
        </p>

        <h2>Read further</h2>
        <ul>
          <li><Link to="/manifeste" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">Manifesto</Link> — why this observatory exists, signed by its founder.</li>
          <li><Link to="/methodologie" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">Methodology</Link> — our sources, verification and red lines.</li>
          <li><strong>Newsletter</strong> — free subscription, weekly publication.</li>
          <li><strong>Fellowship</strong> — applications from expert contributors.</li>
          <li><strong>Institutional partnerships</strong> — foundations, think tanks, commissioned briefings.</li>
        </ul>

        <h2>Contact</h2>
        <ul>
          <li>Editorial: <a href="mailto:contact@iranobservatory.org" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">contact@iranobservatory.org</a></li>
          <li>Press: <a href="mailto:press@iranobservatory.org" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">press@iranobservatory.org</a></li>
          <li>Partnerships &amp; foundations: <a href="mailto:partnerships@iranobservatory.org" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">partnerships@iranobservatory.org</a></li>
          <li>Social: X (FR @ObservatoireIR · EN @IrObservatory), Instagram (@iranobservatory), LinkedIn, Substack.</li>
        </ul>
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
    body: () => (
      <>
        <p className="lede">
          رصدخانه ایران یک پلتفرم مستقل تحلیل و رصد استراتژیک درباره ایران است. هدف آن ارائه قرائتی دقیق
          از جمهوری اسلامی — نظام، جامعه و تعاملات منطقه‌ای — به سفارت‌خانه‌ها، اتاق‌های خبر، پژوهشگران و
          تصمیم‌گیران اروپایی است؛ قرائتی که در رسانه‌های عمومی تولید نمی‌شود و اندیشکده‌های انگلوساکسون
          به‌ندرت آن را به فرانسوی ترجمه می‌کنند.
        </p>
        <p>رصدخانه به دو زبان فرانسوی و انگلیسی منتشر می‌شود و سه سطح تولید دارد.</p>
        <ul>
          <li><strong>رصد.</strong> رویدادهای راستی‌آزمایی‌شده و رمزگشایی سریع در عرض چند ساعت، مستند و تاریخ‌دار.</li>
          <li><strong>تحلیل.</strong> تحلیل‌های ساختاری امضاء شده، در قالب پست‌های بلند، کاروسل، مصاحبه و اینفوگرافی.</li>
          <li><strong>پیش‌بینی.</strong> یادداشت‌های بلند ماهانه، سناریوهای آینده‌نگرانه، گزارش‌های خصوصی برای شرکای نهادی.</li>
        </ul>

        <h2>بنیان‌گذار و مدیریت</h2>
        <p>
          رصدخانه ایران توسط <strong>مانلی میرخان</strong>، استراتژیست فرانسوی-ایرانی، مشاور ایران و سیاست
          اروپا و بنیان‌گذار <strong>دورنا</strong> تأسیس شده است. رصدخانه از شبکه‌ای از مشارکت‌کنندگان
          متخصص — پژوهشگران، روزنامه‌نگاران دیاسپورا، کارمندان سابق دولتی، اقتصاددانان تحریم و حقوقدانان
          حقوق بشر — در قالب برنامه فلوشیپ تحریری بهره می‌برد.
        </p>

        <h2>استقلال</h2>
        <p>
          رصدخانه ایران کاملاً مستقل است. هیچ دولت، حزب، سازمان اپوزیسیون یا شرکتی خط مشی تحریری آن را
          هدایت نمی‌کند. منابع تأمین مالی آن منتشر و قابل بررسی است. رابطه آن با دورنا — سازمان خواهر متعهد
          به گذار دموکراتیک ایران — با یک تفکیک تحریری سختگیرانه تعریف می‌شود:
          <em> رصدخانه رمزگشایی می‌کند، دورنا پیشنهاد می‌دهد</em>. این انضباط غیرقابل مذاکره است.
        </p>

        <h2>روش</h2>
        <p>
          روش‌شناسی رصدخانه — منابع، فرایند راستی‌آزمایی، مقیاس قطعیت، خط‌قرمزها — منتشر و قابل ارجاع است.
          صفحه <Link to="/methodologie" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">روش‌شناسی</Link> را ببینید.
        </p>

        <h2>برای ادامه</h2>
        <ul>
          <li><Link to="/manifeste" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">بیانیه</Link> — چرا این رصدخانه وجود دارد، با امضای بنیان‌گذار.</li>
          <li><Link to="/methodologie" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">روش‌شناسی</Link> — منابع، راستی‌آزمایی و خط‌قرمزها.</li>
          <li><strong>خبرنامه</strong> — اشتراک رایگان، انتشار هفتگی.</li>
          <li><strong>فلوشیپ</strong> — درخواست همکاری متخصصان.</li>
          <li><strong>مشارکت‌های نهادی</strong> — بنیادها، اندیشکده‌ها، گزارش‌های سفارشی.</li>
        </ul>

        <h2>تماس</h2>
        <ul>
          <li>تحریریه: <a href="mailto:contact@iranobservatory.org" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">contact@iranobservatory.org</a></li>
          <li>روابط رسانه: <a href="mailto:press@iranobservatory.org" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">press@iranobservatory.org</a></li>
          <li>مشارکت‌ها: <a href="mailto:partnerships@iranobservatory.org" className="underline decoration-[#3DB883] decoration-2 underline-offset-4">partnerships@iranobservatory.org</a></li>
        </ul>
      </>
    ),
  },
};

export default function About() {
  const { language } = useLanguage();
  const c = COPY[language] || COPY.fr;

  const breadcrumbs = [
    { name: language === 'fa' ? 'خانه' : language === 'en' ? 'Home' : 'Accueil', path: '/' },
    { name: c.breadcrumbName, path: '/a-propos' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: c.seoTitle,
    description: c.seoDescription,
    inLanguage: language,
    url: 'https://iranobservatory.org/a-propos',
    publisher: {
      '@type': 'Organization',
      name: 'Iran Observatory',
      url: 'https://iranobservatory.org',
    },
  };

  return (
    <EditorialPage
      label={c.label}
      title={c.title}
      seoTitle={c.seoTitle}
      seoDescription={c.seoDescription}
      canonicalPath="/a-propos"
      breadcrumbs={breadcrumbs}
      extraJsonLd={jsonLd}
    >
      {c.body()}
    </EditorialPage>
  );
}
