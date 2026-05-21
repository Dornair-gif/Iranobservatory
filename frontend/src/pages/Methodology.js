import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { EditorialPage } from './EditorialPage';

const COPY = {
  fr: {
    label: "Observatoire — Méthodologie",
    title: "Méthodologie",
    subtitle:
      "Iran Observatory rend ses méthodes publiques. La rigueur d'une lecture stratégique tient autant à la qualité des sources qu'à la discipline du processus qui les traite.",
    seoTitle: "Méthodologie d'Iran Observatory",
    seoDescription:
      "Standards éditoriaux d'Iran Observatory : typologie des sources, processus de vérification, échelle de certitude, lignes rouges. Document public et opposable.",
    breadcrumbName: "Méthodologie",
    revised: "Dernière révision : mai 2026",
    body: () => (
      <>
        <p>
          Le présent document expose les standards éditoriaux de l'Observatoire. Il est en révision
          continue ; la date de dernière mise à jour figure en pied de page.
        </p>

        <h2>1. Typologie des sources</h2>
        <p>
          Trois familles de sources alimentent la production de l'Observatoire, avec un niveau de fiabilité
          distinct attribué à chacune.
        </p>
        <ul>
          <li>
            <strong>Sources primaires.</strong> Déclarations officielles datées et sourcées (agences IRNA,
            Tasnim, Fars, Mehr — toujours signalées comme médias d'État iraniens), transcriptions de
            discours vérifiées, documents fuités confirmés par recoupement, entretiens directs avec acteurs
            identifiés.
          </li>
          <li>
            <strong>OSINT vérifié.</strong> Géolocalisation par recoupement satellitaire (Sentinel, Planet
            Labs), vidéos vérifiées par métadonnées et recherche d'image inversée, données de tracking
            aérien et maritime (FlightRadar24, MarineTraffic), monitoring de chaînes Telegram et de comptes
            sociaux iraniens.
          </li>
          <li>
            <strong>Presse spécialisée et témoignages.</strong> Agences (Reuters, AP, AFP), médias
            persanophones et anglophones évalués au cas par cas (BBC Persian, IranWire, Radio Farda),
            recherche académique, témoignages d'acteurs intérieurs et diaspora — toujours signalés comme
            tels et, lorsque possible, confrontés à des sources primaires.
          </li>
        </ul>

        <h2>2. Processus de vérification</h2>
        <p>
          Aucune publication breaking ne sort sans : au minimum <strong>deux sources indépendantes</strong>{' '}
          pour un fait majeur, ou une source primaire vérifiable seule ; vérification de l'origine, de la
          date et de la géolocalisation de toute image ou vidéo associée ; mention explicite du niveau de
          certitude (voir échelle ci-dessous) ; validation éditoriale par la directrice ou un éditeur
          désigné.
        </p>
        <p>
          Pour les analyses signées, les sources sont hyperliées dans le corps du texte, les événements
          cités systématiquement datés, et les thèses concurrentes confrontées lorsqu'elles existent.
        </p>

        <h2>3. Échelle de certitude</h2>
        <p>
          Chaque publication breaking porte un indicateur de fiabilité visible. Cette échelle n'est pas un
          disclaimer : elle est constitutive de la méthode.
        </p>
        <ul>
          <li>
            <strong>Confirmé.</strong> Information recoupée par au moins deux sources indépendantes
            vérifiables.
          </li>
          <li>
            <strong>Rapporté.</strong> Information attestée par une source crédible, non encore recoupée.
            La publication sera mise à jour à mesure du recoupement.
          </li>
          <li>
            <strong>Hypothèse.</strong> Lecture proposée par l'Observatoire à partir d'éléments
            convergents mais incomplets. Sera révisée à mesure que les éléments se précisent ou se
            contredisent.
          </li>
        </ul>

        <h2>4. Ce que nous publions, ce que nous ne publions pas</h2>
        <p>
          L'Observatoire publie des événements vérifiés, des analyses structurelles, des données chiffrées
          sourcées, des cartographies d'acteurs, des signaux faibles datés. Il <strong>ne publie pas</strong>{' '}
          de rumeurs non recoupées, d'images dont la provenance ne peut être établie, de « scoops »
          d'origine partisane non corroborés par une source indépendante, ni de contenus qui pourraient
          compromettre la sécurité de témoins à l'intérieur de l'Iran.
        </p>
        <p>
          L'Observatoire ne publiera jamais de photographies de victimes non floutées, ne procédera à
          aucune identification d'individus iraniens sans leur consentement explicite, et ne diffusera
          aucun contenu glorifiant la violence ou appelant à la vengeance.
        </p>

        <h2>5. Sources interdites et sources attribuées</h2>
        <p>
          L'Observatoire <strong>n'utilise pas et ne cite pas</strong> les outlets affiliés à l'opposition
          iranienne en exil — MEK / Modjahedines du peuple, NCRI / CNRI / réseau Radjavi, Iran International
          (financé par Riyad). Ces sources sont écartées de l'ensemble du pipeline éditorial, y compris des
          générations automatisées.
        </p>
        <p>
          Lorsqu'un média d'État iranien (Tasnim, Fars, IRNA, Press TV, Mehr, ISNA, Tabnak) est cité pour
          documenter une annonce officielle du régime, il est <strong>toujours préfixé</strong> de la
          mention « selon les médias d'État iraniens » et son propos est traité comme la narration du
          régime, jamais comme un fait neutre.
        </p>

        <h2>6. Corrections publiques</h2>
        <p>
          Iran Observatory tient un registre public des corrections apportées à ses publications. Chaque
          correction est datée, motivée, et l'article concerné porte une mention permanente de la
          modification. Un observatoire qui ne corrige jamais publiquement n'est pas un observatoire.
        </p>

        <h2>7. Indépendance et financement</h2>
        <p>
          Iran Observatory est financé par : donations individuelles ; abonnements payants à la newsletter
          premium ; subventions de fondations indépendantes (liste publiée annuellement) ; briefings
          commandés par think tanks, institutions et entreprises, <strong>sans aucun droit de regard
          éditorial</strong>.
        </p>
        <p>
          L'Observatoire ne reçoit aucun financement étatique direct ni indirect, qu'il soit iranien,
          américain, israélien, saoudien, européen ou autre. La séparation éditoriale avec DORNA —
          organisation sœur dédiée à la transition démocratique — est stricte : l'Observatoire ne fait pas
          de plaidoyer, ne soutient aucune organisation d'opposition spécifique, ne se positionne dans
          aucune élection.
        </p>

        <h2>8. Limites assumées</h2>
        <p>
          L'Observatoire travaille sous trois contraintes qu'il assume et qu'il rend publiques.
        </p>
        <p>
          <strong>Première contrainte :</strong> l'accès au terrain iranien est restreint par le risque
          sécuritaire des sources intérieures ; certaines informations resteront non vérifiables tant que
          les conditions ne s'amélioreront pas. <strong>Deuxième contrainte :</strong> l'archive ouverte
          de l'État iranien est partielle et manipulable ; tout document officiel est traité avec un
          degré de scepticisme correspondant. <strong>Troisième contrainte :</strong> le temps long de
          l'analyse entre parfois en tension avec l'urgence des cycles médiatiques ; en cas d'arbitrage,
          l'Observatoire privilégie <em>la rigueur sur la vitesse</em>.
        </p>

        <p className="lede">
          La présente méthodologie est révisée annuellement, et à toute occasion où un événement éditorial
          justifie une mise à jour du processus.
        </p>
      </>
    ),
  },
  en: {
    label: "Observatory — Methodology",
    title: "Methodology",
    subtitle:
      "Iran Observatory makes its methods public. The rigor of strategic reading depends on the quality of sources and on the discipline of the process that handles them.",
    seoTitle: "Iran Observatory — Methodology",
    seoDescription:
      "Iran Observatory editorial standards: source typology, verification process, certainty scale, red lines. Public and accountable.",
    breadcrumbName: "Methodology",
    revised: "Last revision: May 2026",
    body: () => (
      <>
        <p>This document sets out the Observatory's editorial standards. It is under continuous revision; the date of the most recent update is shown at the foot of the page.</p>

        <h2>1. Source typology</h2>
        <p>Three families of sources feed the Observatory's production, each with its own reliability level.</p>
        <ul>
          <li><strong>Primary sources.</strong> Dated official statements (IRNA, Tasnim, Fars, Mehr — always labelled as Iranian state media), verified speech transcripts, leaked documents confirmed by cross-checking, direct interviews with identified actors.</li>
          <li><strong>Verified OSINT.</strong> Satellite cross-referenced geolocation (Sentinel, Planet Labs), videos verified via metadata and reverse image search, flight and maritime tracking (FlightRadar24, MarineTraffic), monitoring of Iranian Telegram channels and social accounts.</li>
          <li><strong>Specialist press &amp; testimony.</strong> Wires (Reuters, AP, AFP), Persian and English-language outlets evaluated case by case (BBC Persian, IranWire, Radio Farda), academic research, testimonies of internal and diaspora actors — always flagged as such and, where possible, cross-checked against primary sources.</li>
        </ul>

        <h2>2. Verification process</h2>
        <p>No breaking publication ships without: at minimum <strong>two independent sources</strong> for a major fact, or one verifiable primary source on its own; provenance, date and geolocation check on every associated image or video; explicit certainty level (see scale below); editorial sign-off by the director or a designated editor.</p>
        <p>In signed analyses, sources are hyperlinked in-text, cited events are systematically dated, and competing theses are confronted when they exist.</p>

        <h2>3. Certainty scale</h2>
        <p>Every breaking publication carries a visible reliability indicator. This scale is not a disclaimer — it is constitutive of the method.</p>
        <ul>
          <li><strong>Confirmed.</strong> Information cross-checked by at least two independent verifiable sources.</li>
          <li><strong>Reported.</strong> Information attested by a credible source, not yet cross-checked. Publication will be updated as triangulation progresses.</li>
          <li><strong>Hypothesis.</strong> Reading proposed by the Observatory from converging but incomplete elements. Will be revised as evidence sharpens or contradicts.</li>
        </ul>

        <h2>4. What we publish, what we do not</h2>
        <p>The Observatory publishes verified events, structural analyses, sourced quantitative data, actor mappings, dated weak signals. It <strong>does not publish</strong> unverified rumors, images of indeterminate provenance, partisan-origin "scoops" uncorroborated by an independent source, nor content that could compromise the security of witnesses inside Iran.</p>
        <p>The Observatory will never publish unblurred photographs of victims, will never identify Iranian individuals without explicit consent, and will not disseminate content glorifying violence or calling for revenge.</p>

        <h2>5. Banned sources and attributed sources</h2>
        <p>The Observatory <strong>does not use and does not cite</strong> outlets affiliated with the Iranian opposition in exile — MEK / Mojahedin-e Khalq, NCRI / Rajavi network, Iran International (Riyadh-funded). These sources are excluded from the entire editorial pipeline, including automated generations.</p>
        <p>When an Iranian state outlet (Tasnim, Fars, IRNA, Press TV, Mehr, ISNA, Tabnak) is cited to document an official regime announcement, it is <strong>always prefixed</strong> with "according to Iranian state media" and its claim is treated as the regime's narrative, never as a neutral fact.</p>

        <h2>6. Public corrections</h2>
        <p>Iran Observatory maintains a public registry of corrections. Each correction is dated, justified, and the affected article carries a permanent notice of the modification. An observatory that never corrects publicly is not an observatory.</p>

        <h2>7. Independence and funding</h2>
        <p>Iran Observatory is funded by: individual donations; paid premium newsletter subscriptions; grants from independent foundations (list published annually); briefings commissioned by think tanks, institutions and companies <strong>with no editorial veto whatsoever</strong>.</p>
        <p>The Observatory receives no state funding, direct or indirect — Iranian, American, Israeli, Saudi, European or other. Editorial separation from DORNA — the sister organisation dedicated to democratic transition — is strict: the Observatory does not advocate, does not endorse any specific opposition organisation, and takes no position in any election.</p>

        <h2>8. Acknowledged limits</h2>
        <p>The Observatory works under three constraints which it acknowledges and makes public.</p>
        <p><strong>First constraint:</strong> access to the Iranian field is limited by the security risk to internal sources; some information will remain unverifiable until conditions improve. <strong>Second constraint:</strong> the open archive of the Iranian state is partial and manipulable; every official document is handled with a matching degree of skepticism. <strong>Third constraint:</strong> the long time of analysis sometimes conflicts with the urgency of media cycles; in case of trade-off, the Observatory privileges <em>rigor over speed</em>.</p>

        <p className="lede">This methodology is reviewed annually, and whenever an editorial event warrants a process update.</p>
      </>
    ),
  },
  fa: {
    label: "رصدخانه — روش‌شناسی",
    title: "روش‌شناسی",
    subtitle:
      "رصدخانه ایران روش‌های خود را عمومی می‌کند. دقت قرائت استراتژیک، هم به کیفیت منابع و هم به انضباط فرایند پردازش آن‌ها وابسته است.",
    seoTitle: "روش‌شناسی رصدخانه ایران",
    seoDescription:
      "استانداردهای تحریری رصدخانه ایران: گونه‌شناسی منابع، فرایند راستی‌آزمایی، مقیاس قطعیت، خط‌قرمزها. سندی عمومی و قابل ارجاع.",
    breadcrumbName: "روش‌شناسی",
    revised: "آخرین بازنگری: مه ۲۰۲۶",
    body: () => (
      <>
        <p>این سند استانداردهای تحریری رصدخانه را بیان می‌کند. سند در بازنگری مستمر است؛ تاریخ آخرین به‌روزرسانی در پایان صفحه آمده است.</p>

        <h2>۱. گونه‌شناسی منابع</h2>
        <p>سه خانواده منبع تولید رصدخانه را تغذیه می‌کنند، هر یک با سطح اعتبار مشخص.</p>
        <ul>
          <li><strong>منابع اولیه.</strong> اعلامیه‌های رسمی تاریخ‌دار و مستند (خبرگزاری‌های ایرنا، تسنیم، فارس، مهر — همواره به‌عنوان رسانه دولتی ایران مشخص می‌شوند)، رونوشت‌های راستی‌آزمایی‌شده سخنرانی‌ها، اسناد افشاشده تأییدشده با تطبیق، مصاحبه مستقیم با کنشگران شناخته‌شده.</li>
          <li><strong>OSINT راستی‌آزمایی‌شده.</strong> مکان‌یابی با تطبیق ماهواره‌ای (Sentinel، Planet Labs)، ویدئوهای راستی‌آزمایی‌شده با ابرداده و جست‌وجوی معکوس تصویر، داده‌های ردیابی هوایی و دریایی (FlightRadar24، MarineTraffic)، رصد کانال‌های تلگرام و حساب‌های اجتماعی ایرانی.</li>
          <li><strong>رسانه‌های تخصصی و شهادت‌ها.</strong> خبرگزاری‌ها (رویترز، AP، AFP)، رسانه‌های فارسی‌زبان و انگلیسی‌زبان مورد‌به‌مورد ارزیابی‌شده (BBC فارسی، ایران‌وایر، رادیو فردا)، پژوهش‌های دانشگاهی، شهادت کنشگران داخل و دیاسپورا — همواره به‌عنوان شهادت مشخص می‌شوند و، در صورت امکان، با منابع اولیه مقایسه می‌شوند.</li>
        </ul>

        <h2>۲. فرایند راستی‌آزمایی</h2>
        <p>هیچ خبر فوری بدون این موارد منتشر نمی‌شود: حداقل <strong>دو منبع مستقل</strong> برای واقعیت مهم، یا یک منبع اولیه قابل راستی‌آزمایی به‌تنهایی؛ راستی‌آزمایی منشأ، تاریخ و مکان هر تصویر یا ویدئوی همراه؛ اعلام صریح سطح قطعیت (مقیاس زیر را ببینید)؛ تأیید تحریری توسط مدیر یا ویراستار تعیین‌شده.</p>

        <h2>۳. مقیاس قطعیت</h2>
        <p>هر انتشار خبر فوری شاخص اعتبار قابل مشاهده‌ای دارد. این مقیاس یک سلب مسئولیت نیست — جزء سازنده روش است.</p>
        <ul>
          <li><strong>تأیید شده.</strong> اطلاعات تطبیق‌داده‌شده با حداقل دو منبع مستقل قابل راستی‌آزمایی.</li>
          <li><strong>گزارش شده.</strong> اطلاعات گواهی‌شده توسط منبعی معتبر، هنوز تطبیق‌نیافته. به‌مرور با تطبیق به‌روز می‌شود.</li>
          <li><strong>فرضیه.</strong> قرائت پیشنهادی رصدخانه از عناصر همگرا اما ناقص. با شفاف‌شدن یا تناقض‌یافتن شواهد بازنگری می‌شود.</li>
        </ul>

        <h2>۴. آنچه منتشر می‌کنیم، آنچه منتشر نمی‌کنیم</h2>
        <p>رصدخانه رویدادهای راستی‌آزمایی‌شده، تحلیل‌های ساختاری، داده‌های مستند، نقشه‌های کنشگران و سیگنال‌های ضعیف تاریخ‌دار را منتشر می‌کند. شایعات تطبیق‌نشده، تصاویر با منشأ نامعلوم، «اسکوپ»‌های جناحی بدون تأیید مستقل و محتوای تهدیدکننده امنیت شاهدان داخل ایران را <strong>منتشر نمی‌کند</strong>.</p>

        <h2>۵. منابع ممنوع و منابع منتسب</h2>
        <p>رصدخانه از رسانه‌های وابسته به اپوزیسیون ایرانی در تبعید — MEK / مجاهدین خلق، NCRI / شبکه رجوی، ایران اینترنشنال (با تأمین مالی ریاض) — <strong>استفاده نمی‌کند و ارجاع نمی‌دهد</strong>.</p>
        <p>هرگاه رسانه‌ای دولتی ایرانی (تسنیم، فارس، ایرنا، پرس‌تی‌وی، مهر، ایسنا، تابناک) برای مستندسازی یک اعلامیه رسمی نظام نقل شود، <strong>همواره</strong> با عبارت «بنا به منابع حکومتی» پیشوند می‌گیرد و گفته آن به‌عنوان روایت نظام تلقی می‌شود، نه واقعیت بی‌طرف.</p>

        <h2>۶. اصلاحیه‌های عمومی</h2>
        <p>رصدخانه ایران ثبت عمومی اصلاحیه‌ها را نگه می‌دارد. هر اصلاحیه تاریخ‌دار و مستدل است و مقاله مربوطه نشان دائمی تغییر را به همراه دارد.</p>

        <h2>۷. استقلال و تأمین مالی</h2>
        <p>رصدخانه از کمک‌های فردی، اشتراک‌های پولی خبرنامه ویژه، کمک‌های بنیادهای مستقل (فهرست منتشر سالانه) و گزارش‌های سفارشی <strong>بدون هیچ‌گونه حق وتو تحریری</strong> تأمین مالی می‌شود.</p>

        <h2>۸. محدودیت‌های پذیرفته‌شده</h2>
        <p>رصدخانه سه محدودیت را می‌پذیرد و عمومی می‌کند: دسترسی محدود به میدان ایران به دلیل ریسک امنیتی منابع داخلی؛ ناقص و قابل‌دستکاری بودن بایگانی باز دولت ایران که هر سند رسمی را با شکاکیت متناسب رفتار می‌کند؛ تنش زمان طولانی تحلیل با فوریت چرخه رسانه‌ای — در صورت تعارض، رصدخانه <em>دقت را بر سرعت ترجیح می‌دهد</em>.</p>
      </>
    ),
  },
};

export default function Methodology() {
  const { language } = useLanguage();
  const c = COPY[language] || COPY.fr;

  const breadcrumbs = [
    { name: language === 'fa' ? 'خانه' : language === 'en' ? 'Home' : 'Accueil', path: '/' },
    { name: c.breadcrumbName, path: '/methodologie' },
  ];

  return (
    <EditorialPage
      label={c.label}
      title={c.title}
      subtitle={c.subtitle}
      seoTitle={c.seoTitle}
      seoDescription={c.seoDescription}
      canonicalPath="/methodologie"
      lastRevised={c.revised}
      breadcrumbs={breadcrumbs}
    >
      {c.body()}
    </EditorialPage>
  );
}
