// About — trilingual editorial copy. Verbatim from the validated source
// (IranObservatory_CorePages_FR_EN_FA, Feb 2026).

import Link from "next/link";

export const ABOUT = {
  fr: {
    label: "Observatoire — À propos",
    title: "À propos",
    seoTitle: "À propos d'Iran Observatory · Decrypt & Intel",
    seoDescription:
      "Plateforme indépendante d'analyse et de veille stratégique sur l'Iran. Pour les chancelleries, les rédactions, les chercheurs et les décideurs européens.",
    breadcrumbName: "À propos",
    body: ({ lang }) => (
      <>
        <p className="lede">
          Iran Observatory · Decrypt &amp; Intel est une plateforme indépendante d'analyse et de veille
          stratégique sur l'Iran. Sa vocation : fournir aux chancelleries, aux rédactions, aux chercheurs
          et aux décideurs européens une lecture exigeante de la République islamique, de son régime, de
          sa société et de ses interactions régionales, que la presse généraliste ne produit pas et que
          les think tanks anglo-saxons traduisent rarement en français.
        </p>
        <p>
          Iran Observatory publie en français, en anglais et en persan, sous deux formats complémentaires.
        </p>
        <ul>
          <li>
            <strong>Intel, la veille.</strong> Événements vérifiés et décryptages flash en quelques
            heures, sourcés et datés. C'est la matière d'Iran Monitor.
          </li>
          <li>
            <strong>Decrypt, l'analyse.</strong> Décryptages structurels signés et notes d'anticipation :
            études longues, scénarios prospectifs, briefings privés pour partenaires institutionnels.
          </li>
        </ul>

        <h2>Fondation et direction</h2>
        <p>
          Iran Observatory est dirigé par une équipe éditoriale indépendante composée de chercheurs,
          journalistes de la diaspora, anciens fonctionnaires, économistes des sanctions et juristes des
          droits humains. Le projet s'appuie sur un programme de fellowship éditorial.
        </p>

        <h2>Indépendance</h2>
        <p>
          Iran Observatory est strictement indépendant. Aucun État, parti, organisation d'opposition ou
          entreprise ne dirige sa ligne éditoriale. Ses sources de financement sont publiées et
          auditables. Son rapport à DORNA, organisation sœur dédiée à la transition démocratique
          iranienne, est défini par une séparation éditoriale stricte :{" "}
          <em>l'Observatoire décrypte, DORNA propose</em>.
        </p>

        <h2>Méthode</h2>
        <p>
          La méthodologie de l'Observatoire — sources, processus de vérification, échelle de certitude,
          lignes rouges — est publiée et opposable. Voir la page{" "}
          <Link href={`/${lang}/methodologie`}>Méthodologie</Link>.
        </p>

        <h2>Affiliation</h2>
        <p>
          Iran Observatory est une recherche affiliée à <strong>DORNA</strong> (
          <a href="https://dornairan.com" target="_blank" rel="noopener noreferrer">
            dornairan.com
          </a>
          ), plateforme de plaidoyer pour la transition démocratique iranienne. Les deux organisations
          partagent des valeurs communes ; la ligne éditoriale d'Iran Observatory en demeure strictement
          séparée.
        </p>

        <h2>Contact</h2>
        <p>
          <a href="mailto:contact@iranobservatory.org">contact@iranobservatory.org</a>
        </p>
        <p>
          Réseaux : X (FR{" "}
          <a href="https://x.com/ObservatoireIR" target="_blank" rel="noopener noreferrer">
            @ObservatoireIR
          </a>{" "}
          · EN{" "}
          <a href="https://x.com/IrObservatory" target="_blank" rel="noopener noreferrer">
            @IrObservatory
          </a>
          ), Instagram (
          <a href="https://instagram.com/iranobservatory" target="_blank" rel="noopener noreferrer">
            @iranobservatory
          </a>
          ), LinkedIn, Substack.
        </p>
      </>
    ),
  },
  en: {
    label: "Observatory — About",
    title: "About",
    seoTitle: "About Iran Observatory · Decrypt & Intel",
    seoDescription:
      "An independent platform for strategic analysis and monitoring of Iran — built for decision-makers, newsrooms, researchers and foundations across Europe, North America, the Gulf and the multilateral institutions.",
    breadcrumbName: "About",
    body: ({ lang }) => (
      <>
        <p className="lede">
          Iran Observatory · Decrypt &amp; Intel is an independent platform for strategic analysis and
          monitoring of Iran. Its purpose is to give decision-makers, newsrooms, researchers and
          foundations — across Europe, North America, the Gulf and the multilateral institutions — a
          demanding reading of the Islamic Republic, its regime, its society and its regional conduct,
          that general coverage does not produce and that specialist institutions rarely deliver in real
          time.
        </p>
        <p>
          Iran Observatory publishes in English, French and Persian, in two complementary formats.
        </p>
        <ul>
          <li>
            <strong>Intel, the monitoring line.</strong> Verified events and flash decryptions within
            hours, sourced and dated. This is what feeds Iran Monitor.
          </li>
          <li>
            <strong>Decrypt, the analytical line.</strong> Signed structural analysis and forward-looking
            notes: long studies, scenarios, and private briefings for institutional partners.
          </li>
        </ul>

        <h2>Foundation and direction</h2>
        <p>
          Iran Observatory is led by an independent editorial team of researchers, diaspora journalists,
          former officials, sanctions economists and human rights lawyers, supported by an editorial
          fellowship program.
        </p>

        <h2>Independence</h2>
        <p>
          Iran Observatory is strictly independent. No state, party, opposition organization or company
          directs its editorial line. Its funding sources are published and auditable. Its relationship
          to DORNA, the sister organization devoted to Iran's democratic transition, is governed by a
          strict editorial separation: <em>the Observatory decrypts, DORNA proposes</em>.
        </p>

        <h2>Method</h2>
        <p>
          The Observatory's methodology — sources, verification process, certainty scale, red lines — is
          published and accountable. See the <Link href={`/${lang}/methodologie`}>Methodology</Link> page.
        </p>

        <h2>Affiliation</h2>
        <p>
          Iran Observatory is research affiliated with <strong>DORNA</strong> (
          <a href="https://dornairan.com" target="_blank" rel="noopener noreferrer">
            dornairan.com
          </a>
          ), a platform of advocacy for Iran's democratic transition. The two share common values; the
          editorial line of Iran Observatory remains strictly separate.
        </p>

        <h2>Contact</h2>
        <p>
          <a href="mailto:contact@iranobservatory.org">contact@iranobservatory.org</a>
        </p>
        <p>
          Social: X (FR{" "}
          <a href="https://x.com/ObservatoireIR" target="_blank" rel="noopener noreferrer">
            @ObservatoireIR
          </a>{" "}
          · EN{" "}
          <a href="https://x.com/IrObservatory" target="_blank" rel="noopener noreferrer">
            @IrObservatory
          </a>
          ), Instagram (
          <a href="https://instagram.com/iranobservatory" target="_blank" rel="noopener noreferrer">
            @iranobservatory
          </a>
          ), LinkedIn, Substack.
        </p>
      </>
    ),
  },
  fa: {
    label: "رصدخانه — درباره ما",
    title: "درباره‌ی ما",
    seoTitle: "درباره رصدخانه ایران",
    seoDescription:
      "Iran Observatory · Decrypt & Intel سکویی مستقل برای تحلیل و رصدِ راهبردیِ ایران، برای ایرانیان و تصمیم‌گیرانِ جهانی.",
    breadcrumbName: "درباره‌ی ما",
    body: ({ lang }) => (
      <>
        <p className="lede">
          Iran Observatory · Decrypt &amp; Intel سکویی مستقل برای تحلیل و رصدِ راهبردیِ ایران است.
          رسالتِ آن، در اختیار گذاشتنِ خوانشی دقیق از جمهوری اسلامی، از نظام، جامعه و رفتارِ منطقه‌ای
          آن، برای ایرانیان، پژوهشگران، رسانه‌ها و تصمیم‌گیران است؛ خوانشی که پوششِ عمومی تولید
          نمی‌کند.
        </p>
        <p>
          Iran Observatory به فارسی، انگلیسی و فرانسه منتشر می‌کند، در دو قالبِ مکمل.
        </p>
        <ul>
          <li>
            <strong>Intel، رصد.</strong> رویدادهای راستی‌آزمایی‌شده و رمزگشایی‌های فوری در عرضِ چند
            ساعت، مستند و تاریخ‌دار. این همان چیزی است که Iran Monitor را تغذیه می‌کند.
          </li>
          <li>
            <strong>Decrypt، تحلیل.</strong> تحلیل‌های ساختاریِ امضادار و یادداشت‌های آینده‌نگر:
            مطالعاتِ بلند، سناریوها و بریفینگ‌های خصوصی برای شرکای نهادی.
          </li>
        </ul>

        <h2>بنیان و مدیریت</h2>
        <p>
          Iran Observatory توسط یک هیئتِ تحریریه‌ی مستقل متشکل از پژوهشگران، روزنامه‌نگارانِ دیاسپورا،
          کارشناسانِ تحریم و حقوق‌دانانِ حقوقِ بشر اداره می‌شود، و از یک برنامه‌ی فِلوشیپِ تحریری
          پشتیبانی می‌گیرد.
        </p>

        <h2>استقلال</h2>
        <p>
          Iran Observatory به‌شدت مستقل است. هیچ دولت، حزب، سازمانِ اپوزیسیون یا شرکتی خطِ تحریری آن را
          هدایت نمی‌کند. منابعِ مالیِ آن منتشر و قابلِ حسابرسی است. رابطه‌ی آن با DORNA، سازمانِ
          خواهرخوانده که به گذارِ دموکراتیکِ ایران اختصاص دارد، با جداییِ تحریریِ سخت‌گیرانه تعریف
          می‌شود: <em>آبزرواتوری رمزگشایی می‌کند، DORNA پیشنهاد می‌دهد</em>.
        </p>

        <h2>روش</h2>
        <p>
          روش‌شناسیِ آبزرواتوری منتشر و قابلِ ارجاع است. صفحه‌ی{" "}
          <Link href={`/${lang}/methodologie`}>روش‌شناسی</Link> را ببینید.
        </p>

        <h2>وابستگی</h2>
        <p>
          Iran Observatory پژوهشی وابسته به <strong>DORNA</strong> (
          <a href="https://dornairan.com" target="_blank" rel="noopener noreferrer">
            dornairan.com
          </a>
          ) است، سکوی کنشگری برای گذارِ دموکراتیکِ ایران. دو سازمان ارزش‌های مشترکی دارند؛ اما خطِ
          تحریریِ Iran Observatory کاملاً جداست.
        </p>

        <h2>تماس</h2>
        <p>
          <a href="mailto:contact@iranobservatory.org">contact@iranobservatory.org</a>
        </p>
      </>
    ),
  },
};
