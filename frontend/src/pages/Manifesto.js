import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { EditorialPage } from './EditorialPage';

const COPY = {
  fr: {
    label: "Observatoire — Manifeste",
    title: "Pourquoi Iran Observatory existe",
    subtitle:
      "Il n'existe pas, en français, de lecture stratégique de l'Iran qui ne soit ni partisane, ni officielle, ni inféodée. C'est ce constat — et lui seul — qui a fait naître Iran Observatory.",
    seoTitle: "Manifeste d'Iran Observatory — Maneli Mirkhan",
    seoDescription:
      "Manifeste fondateur d'Iran Observatory, signé par Maneli Mirkhan. Une lecture stratégique de l'Iran, indépendante, exigeante, non partisane, pour les décideurs européens.",
    breadcrumbName: "Manifeste",
    signature: (
      <>
        <p className="font-serif italic text-zinc-600">— Maneli Mirkhan</p>
        <p className="text-sm text-zinc-500">Fondatrice, Iran Observatory · Mai 2026</p>
      </>
    ),
    body: () => (
      <>
        <p className="lede">
          Quand on cherche aujourd'hui à comprendre ce qui se joue à Téhéran, le débat francophone offre
          des options pauvres. La presse généraliste produit des sommaires accélérés, dépendants des
          dépêches anglo-saxonnes, et incapables de distinguer une rumeur d'un signal.
        </p>
        <p>
          Les voix engagées — Iran International financée par Riyad, les organisations satellites du
          Conseil national de la résistance, les associations alignées sur la diplomatie de Washington,
          les voix monarchistes nostalgiques — produisent un récit qui sert leur cause avant de servir la
          lecture. Entre les deux, un vide.
        </p>
        <p><strong>Ce vide a un coût.</strong></p>
        <p>
          Les chancelleries européennes parlent de l'Iran sans expertise propre. Les rédactions confondent
          factions, ne distinguent pas IRGC et MOIS, citent le Guide à propos de décisions dont il n'a pas
          eu connaissance, traitent un communiqué d'opposition comme une dépêche officielle. Les fondations
          qui financent les droits humains en Iran ne savent pas vers qui se tourner pour un décryptage
          qui ne soit ni un plaidoyer, ni un commentaire de plateau. Les Iraniens de la diaspora se
          résignent à lire en anglais des analyses qu'aucun de leurs interlocuteurs européens ne lira
          jamais.
        </p>
        <blockquote>Iran Observatory existe pour combler ce vide.</blockquote>

        <h2>Notre engagement est triple</h2>
        <p>
          <strong>Le premier est analytique.</strong> Décrypter la République islamique comme une
          architecture, pas comme une scène. Lire le régime à travers ses doctrines, ses factions, ses
          leviers rentiers, son économie de la répression. Distinguer ce qui relève de la tactique de ce
          qui relève du structurel. Refuser le confort des grilles morales pour adopter celui, plus
          exigeant, des grilles politologiques.
        </p>
        <p>
          <strong>Le deuxième est éthique.</strong> Ne servir aucune cause, sauf celle de la rigueur. Iran
          Observatory ne soutient pas une faction de l'opposition. Ne plaide pas. Ne s'aligne sur aucune
          diplomatie. Cette discipline est protégée par la séparation stricte avec DORNA, mon autre
          organisation, qui assume le plaidoyer pour la transition démocratique. <em>L'Observatoire
          décrypte. DORNA propose.</em> Une seule personne dirige les deux. Aucune n'absorbe l'autre.
        </p>
        <p>
          <strong>Le troisième est civique.</strong> Penser pour des décideurs européens qui ne pensent
          plus assez par eux-mêmes sur l'Iran. Les chancelleries de Paris, Bruxelles, Berlin, Rome doivent
          disposer d'une intelligence stratégique indépendante de Washington et de Tel-Aviv. Ce n'est pas
          un luxe. C'est la condition d'une politique européenne. Iran Observatory existe pour outiller
          cette autonomie.
        </p>

        <h2>Nos lignes rouges sont publiques</h2>
        <p>
          Iran Observatory ne publiera jamais une rumeur invérifiée pour gagner cinq minutes sur ses
          concurrents. Ne désignera jamais un chef de l'opposition iranienne — c'est aux Iraniens d'en
          décider, pas à un observatoire occidental. N'acceptera jamais un financement avec droit de
          regard éditorial, quel qu'en soit le montant. Ne participera à aucune entreprise de glorification
          de la violence, ni à aucun appel à la vengeance. Ne traitera jamais le peuple iranien comme un
          objet, mais toujours comme un sujet historique. Ne sacrifiera jamais la lecture à long terme
          aux exigences de l'engagement court.
        </p>

        <h2>Pourquoi maintenant</h2>
        <p>
          À ceux qui me demandent pourquoi un tel observatoire mérite d'exister à un moment où
          l'attention médiatique sur l'Iran s'effrite, je réponds que c'est précisément maintenant qu'il
          faut le construire. Pas pendant les crises. <strong>Pendant les silences.</strong> C'est dans
          les périodes d'attention faible que se préparent les lectures qui éclaireront les crises
          suivantes. Ceux qui n'auront pas pris le temps de comprendre l'architecture du régime en 2026
          ne sauront pas lire son effondrement, sa résilience, ou sa mutation lorsque ces moments
          viendront.
        </p>

        <h2>Une ouverture</h2>
        <p>
          Iran Observatory est ouvert. À ses lecteurs, dont les abonnements et les donations garantissent
          l'indépendance. À ses fellows, chercheurs et journalistes invités à contribuer dans un cadre
          éditorial commun. À ses partenaires institutionnels, fondations et think tanks, qui commandent
          ou diffusent ses travaux. À ses interlocuteurs, chancelleries et rédactions, qui peuvent en
          faire usage.
        </p>
        <blockquote>
          Une seule chose ne nous est pas négociable : la rigueur. Tout le reste se construit avec ceux
          qui veulent bien.
        </blockquote>
      </>
    ),
  },
  en: {
    label: "Observatory — Manifesto",
    title: "Why Iran Observatory exists",
    subtitle:
      "There is no strategic reading of Iran in French that is neither partisan, official, nor subservient. That fact — and that fact alone — gave birth to Iran Observatory.",
    seoTitle: "Iran Observatory Manifesto — by Maneli Mirkhan",
    seoDescription:
      "Founding manifesto of Iran Observatory, signed by Maneli Mirkhan. A strategic, independent, non-partisan reading of Iran for European decision-makers.",
    breadcrumbName: "Manifesto",
    signature: (
      <>
        <p className="font-serif italic text-zinc-600">— Maneli Mirkhan</p>
        <p className="text-sm text-zinc-500">Founder, Iran Observatory · May 2026</p>
      </>
    ),
    body: () => (
      <>
        <p className="lede">
          When one tries to understand what is at play in Tehran today, the French-language debate offers
          poor options. Mainstream press produces accelerated summaries, dependent on Anglo-Saxon wire
          services, unable to distinguish a rumor from a signal.
        </p>
        <p>
          Engaged voices — Iran International funded by Riyadh, organisations satellites of the NCRI,
          associations aligned with Washington's diplomacy, nostalgic monarchist voices — produce a
          narrative that serves their cause before serving the reading. Between the two, a void.
        </p>
        <p><strong>This void has a cost.</strong></p>
        <p>
          European chancelleries speak of Iran without expertise of their own. Newsrooms confuse factions,
          fail to distinguish IRGC and MOIS, cite the Supreme Leader for decisions he was unaware of, and
          treat an opposition statement as an official dispatch. Foundations funding human rights in Iran
          do not know whom to turn to for an analysis that is neither advocacy nor TV punditry. Iranians
          in the diaspora resign themselves to reading in English analyses that none of their European
          interlocutors will ever read.
        </p>
        <blockquote>Iran Observatory exists to fill this void.</blockquote>

        <h2>Our commitment is threefold</h2>
        <p>
          <strong>The first is analytical.</strong> To decode the Islamic Republic as an architecture, not
          as a stage. To read the regime through its doctrines, its factions, its rentier levers, its
          economy of repression. To distinguish tactical from structural. To refuse the comfort of moral
          grids for the more demanding work of political-science grids.
        </p>
        <p>
          <strong>The second is ethical.</strong> To serve no cause but that of rigor. Iran Observatory
          does not support any opposition faction. Does not advocate. Does not align with any diplomacy.
          This discipline is protected by strict separation from DORNA, my other organisation, which does
          advocate for democratic transition. <em>The Observatory decodes. DORNA proposes.</em> One person
          runs both. Neither absorbs the other.
        </p>
        <p>
          <strong>The third is civic.</strong> To think for European decision-makers who no longer think
          enough for themselves on Iran. The chancelleries of Paris, Brussels, Berlin, Rome must dispose
          of strategic intelligence independent of Washington and Tel Aviv. This is not a luxury. It is
          the condition of a European policy. Iran Observatory exists to equip that autonomy.
        </p>

        <h2>Our red lines are public</h2>
        <p>
          Iran Observatory will never publish an unverified rumor to gain five minutes on its competitors.
          Will never anoint an Iranian opposition leader — that is for Iranians to decide, not for a
          Western observatory. Will never accept funding with editorial veto, at any amount. Will never
          take part in glorifying violence or calling for revenge. Will never treat the Iranian people as
          object, always as historical subject. Will never sacrifice long-term reading to the demands of
          short-term engagement.
        </p>

        <h2>Why now</h2>
        <p>
          To those who ask me why such an observatory deserves to exist at a moment when media attention
          on Iran is fraying, I answer: precisely now is when it must be built. Not during crises.
          <strong> During the silences.</strong> It is in periods of low attention that the readings are
          prepared which will illuminate the crises to come. Those who have not taken the time to
          understand the architecture of the regime in 2026 will not know how to read its collapse, its
          resilience, or its mutation when those moments arrive.
        </p>

        <h2>An opening</h2>
        <p>
          Iran Observatory is open. To its readers, whose subscriptions and donations guarantee
          independence. To its fellows, researchers and journalists invited to contribute within a shared
          editorial framework. To its institutional partners, foundations and think tanks, who commission
          or distribute its work. To its interlocutors, chancelleries and newsrooms, who may use it.
        </p>
        <blockquote>
          Only one thing is non-negotiable: rigor. Everything else is built with those who want to.
        </blockquote>
      </>
    ),
  },
  fa: {
    label: "رصدخانه — بیانیه",
    title: "چرا رصدخانه ایران وجود دارد",
    subtitle:
      "در زبان فرانسوی، قرائت استراتژیکی از ایران که نه جناحی، نه رسمی و نه وابسته باشد، وجود ندارد. همین واقعیت — و فقط همین — رصدخانه ایران را به وجود آورده است.",
    seoTitle: "بیانیه رصدخانه ایران — مانلی میرخان",
    seoDescription:
      "بیانیه بنیان‌گذار رصدخانه ایران، با امضای مانلی میرخان. قرائتی استراتژیک، مستقل و غیرجناحی از ایران برای تصمیم‌گیران اروپایی.",
    breadcrumbName: "بیانیه",
    signature: (
      <>
        <p className="font-serif italic text-zinc-600">— مانلی میرخان</p>
        <p className="text-sm text-zinc-500">بنیان‌گذار، رصدخانه ایران · مه ۲۰۲۶</p>
      </>
    ),
    body: () => (
      <>
        <p className="lede">
          امروز هرکس بخواهد بفهمد در تهران چه می‌گذرد، بحث فرانسوی‌زبان گزینه‌های فقیری ارائه می‌دهد.
          رسانه‌های عمومی خلاصه‌های شتاب‌زده‌ای تولید می‌کنند که به منابع انگلوساکسون وابسته‌اند و توان
          تمایز شایعه از سیگنال ندارند.
        </p>
        <p>
          صداهای جانبدار — ایران اینترنشنال با تأمین مالی ریاض، سازمان‌های اقماری شورای ملی مقاومت،
          انجمن‌های همسو با دیپلماسی واشینگتن، صداهای نوستالژیک سلطنت‌طلب — روایتی تولید می‌کنند که پیش
          از خدمت به فهم، به آرمان خود خدمت می‌کند. میان این دو، یک خلأ.
        </p>
        <p><strong>این خلأ هزینه دارد.</strong></p>
        <p>
          سفارت‌خانه‌های اروپایی بدون تخصص ویژه خود از ایران سخن می‌گویند. اتاق‌های خبر جناح‌ها را خلط می‌کنند،
          سپاه و وزارت اطلاعات را از هم نمی‌شناسند، رهبر را برای تصمیم‌هایی نقل می‌کنند که از آن‌ها اطلاع
          نداشته است، و بیانیه یک گروه اپوزیسیون را همچون مخابره رسمی تلقی می‌کنند.
        </p>
        <blockquote>رصدخانه ایران برای پر کردن این خلأ وجود دارد.</blockquote>

        <h2>تعهد ما سه‌گانه است</h2>
        <p>
          <strong>اول، تحلیلی.</strong> رمزگشایی جمهوری اسلامی به‌مثابه یک معماری، نه یک صحنه. خواندن نظام
          از دل دکترین‌ها، جناح‌ها، اهرم‌های رانتی و اقتصاد سرکوب. تمایز تاکتیک از ساختار.
        </p>
        <p>
          <strong>دوم، اخلاقی.</strong> خدمت به هیچ آرمانی جز دقت. رصدخانه ایران از هیچ جناح اپوزیسیونی
          حمایت نمی‌کند. حمایت‌گری نمی‌کند. با هیچ دیپلماسی هم‌سو نیست. این انضباط با تفکیک سختگیرانه از
          دورنا — سازمان دیگر من که حمایت‌گری گذار دموکراتیک را به عهده دارد — حفظ می‌شود.
          <em> رصدخانه رمزگشایی می‌کند. دورنا پیشنهاد می‌دهد.</em>
        </p>
        <p>
          <strong>سوم، شهروندی.</strong> فکر کردن برای تصمیم‌گیران اروپایی که دیگر به‌اندازه کافی خودشان درباره
          ایران فکر نمی‌کنند. سفارت‌خانه‌های پاریس، بروکسل، برلین و رم باید از یک هوش استراتژیک مستقل از
          واشینگتن و تل‌آویو برخوردار باشند.
        </p>

        <h2>خط‌قرمزهای ما عمومی است</h2>
        <p>
          رصدخانه ایران هرگز شایعه راستی‌آزمایی‌نشده‌ای را برای پنج دقیقه سبقت بر رقبا منتشر نخواهد کرد.
          هرگز رهبری اپوزیسیون ایران را برنخواهد گزید — این انتخاب با ایرانیان است، نه با یک رصدخانه غربی.
          هرگز تأمین مالی با حق وتوی تحریری را نخواهد پذیرفت. در هیچ بزرگ‌نمایی خشونت یا فراخوان انتقام
          شرکت نخواهد کرد. ملت ایران را هرگز همچون شیء نخواهد دید، بلکه همواره همچون سوژه تاریخی.
        </p>

        <h2>چرا حالا</h2>
        <p>
          به کسانی که می‌پرسند چرا چنین رصدخانه‌ای در زمانی که توجه رسانه‌ای به ایران فرسوده شده شایسته
          وجود است، پاسخ می‌دهم: دقیقاً همین حالا باید آن را ساخت. نه در بحران‌ها. <strong>در سکوت‌ها.</strong>
        </p>

        <h2>یک گشایش</h2>
        <p>
          رصدخانه ایران گشوده است. بر روی خوانندگانش که اشتراک و کمک‌هایشان استقلال را تضمین می‌کند. بر
          فلوهایش، پژوهشگران و روزنامه‌نگاران مدعو در چارچوبی تحریری مشترک. بر شرکای نهادی‌اش، بنیادها و
          اندیشکده‌ها. بر مخاطبانش، سفارت‌خانه‌ها و اتاق‌های خبر.
        </p>
        <blockquote>تنها یک چیز با ما مذاکره‌پذیر نیست: دقت. باقی همه چیز با کسانی ساخته می‌شود که می‌خواهند.</blockquote>
      </>
    ),
  },
};

export default function Manifesto() {
  const { language } = useLanguage();
  const c = COPY[language] || COPY.fr;

  const breadcrumbs = [
    { name: language === 'fa' ? 'خانه' : language === 'en' ? 'Home' : 'Accueil', path: '/' },
    { name: c.breadcrumbName, path: '/manifeste' },
  ];

  // Person + OpinionNewsArticle JSON-LD for the founder's signed manifesto.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OpinionNewsArticle',
    headline: c.title,
    description: c.seoDescription,
    inLanguage: language,
    url: 'https://iranobservatory.org/manifeste',
    datePublished: '2026-05-01',
    author: {
      '@type': 'Person',
      name: 'Maneli Mirkhan',
      jobTitle: 'Founder, Iran Observatory',
      affiliation: {
        '@type': 'Organization',
        name: 'Iran Observatory',
        url: 'https://iranobservatory.org',
      },
    },
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
      subtitle={c.subtitle}
      seoTitle={c.seoTitle}
      seoDescription={c.seoDescription}
      canonicalPath="/manifeste"
      signature={c.signature}
      breadcrumbs={breadcrumbs}
      extraJsonLd={jsonLd}
    >
      {c.body()}
    </EditorialPage>
  );
}
