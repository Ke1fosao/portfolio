import { useEffect, useState } from 'react'
import { ArrowUpRight, Cookie, Database, Eye, LockKeyhole, Mail, ShieldCheck, UserRoundCheck } from 'lucide-react'
import api, { unwrap } from '../lib/api'
import { fallbackSettings } from '../data/fallbackData'
import { useLanguage } from '../i18n/LanguageContext'
import { localizeSettings } from '../i18n/localizedData'
import '../styles/secondary-base.css'
import '../styles/legal.css'
import '../styles/secondary-responsive.css'

const sections = [
  ['scope', '1. Сфера дії'],
  ['controller', '2. Хто обробляє дані'],
  ['data', '3. Які дані збираються'],
  ['purposes', '4. Мета та підстави'],
  ['cookies', '5. Cookies та аналітика'],
  ['sharing', '6. Передача даних'],
  ['storage', '7. Строк зберігання'],
  ['rights', '8. Ваші права'],
  ['security', '9. Захист даних'],
  ['changes', '10. Зміни та контакти'],
]

const englishSections = [
  ['scope', '1. Scope'],
  ['controller', '2. Data controller'],
  ['data', '3. Data we collect'],
  ['purposes', '4. Purposes and legal bases'],
  ['cookies', '5. Cookies and analytics'],
  ['sharing', '6. Data sharing'],
  ['storage', '7. Retention'],
  ['rights', '8. Your rights'],
  ['security', '9. Data security'],
  ['changes', '10. Updates and contacts'],
]

function PrivacyEnglish({ settings }) {
  const telegramUrl = `https://t.me/${String(settings.telegram || '').replace('@', '')}`
  const phoneUrl = `tel:${String(settings.phone || '').replace(/\s/g, '')}`
  if (isEnglish) return <PrivacyEnglish settings={localizeSettings(settings, 'en')} />

  return (
    <div className="legal-page modern-page">
      <section className="legal-hero">
        <div className="container-shell legal-hero-grid">
          <div>
            <div className="modern-kicker"><span>Legal information</span><i /> Version dated July 6, 2026</div>
            <h1>Privacy <em>policy</em></h1>
            <p>This document explains which personal data may be processed on this website, why it is needed, and how you can exercise your rights.</p>
          </div>
          <div className="legal-hero-card"><ShieldCheck size={30} /><strong>Data minimisation</strong><p>The website requests only the information needed to respond to inquiries and provide the features selected by the user.</p></div>
        </div>
      </section>

      <section className="legal-summary-section">
        <div className="container-shell legal-summary-grid">
          <article><i><Database size={21} /></i><span>Core data</span><strong>Name, contact details, and message</strong></article>
          <article><i><Cookie size={21} /></i><span>Analytics</span><strong>Only after separate consent</strong></article>
          <article><i><UserRoundCheck size={21} /></i><span>Your control</span><strong>Access, correction, and deletion</strong></article>
          <article><i><LockKeyhole size={21} /></i><span>Security</span><strong>Organisational and technical safeguards</strong></article>
        </div>
      </section>

      <section className="modern-section legal-content-section">
        <div className="container-shell legal-layout">
          <aside className="legal-toc"><span>Contents</span><nav>{englishSections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav><div><Mail size={18} /><p>Privacy questions:</p><a href={`mailto:${settings.email}`}>{settings.email}</a></div></aside>

          <article className="legal-document">
            <div className="legal-notice"><Eye size={20} /><p><strong>Important.</strong> This policy applies to this portfolio website and its contact forms. If new services are connected, the document should be updated before the related processing begins.</p></div>

            <section id="scope"><span>01</span><h2>Scope and key terms</h2><p>This policy applies to visitors who browse the website, choose cookie settings, submit an inquiry, or contact the owner through the published contact details. “Personal data” means information that can identify a natural person directly or indirectly. “Processing” includes collection, storage, use, alteration, transfer, and deletion.</p></section>

            <section id="controller"><span>02</span><h2>Data controller</h2><p>The controller of data received directly through the website is <strong>{settings.full_name}</strong>, {settings.city}. Privacy requests may be sent to <a href={`mailto:${settings.email}`}>{settings.email}</a>, via Telegram at <a href={telegramUrl} target="_blank" rel="noreferrer">{settings.telegram}</a>, or by phone at <a href={phoneUrl}>{settings.phone}</a>.</p><p>Where the parties enter into a separate agreement for a specific project, their roles regarding personal data may also be defined in that agreement.</p></section>

            <section id="data"><span>03</span><h2>Data that may be collected</h2><h3>Information you provide</h3><ul><li>your name or preferred form of address;</li><li>your chosen communication method and the relevant Telegram username, phone number, or email address;</li><li>the message, project description, budget, deadlines, and any other information you voluntarily provide;</li><li>files and materials shared during further communication.</li></ul><h3>Technical information</h3><p>The server and hosting provider may automatically receive an IP address, request date and time, browser type, referrer, error logs, and other technical information required for security and reliable operation. Analytics data is collected only after your separate consent in the cookie banner.</p><p>Do not submit special categories of personal data, banking credentials, passwords, or identity documents through the form unless a protected channel has been agreed separately.</p></section>

            <section id="purposes"><span>04</span><h2>Purposes and legal bases</h2><p>Personal data may be used to:</p><ul><li>receive, register, and process an inquiry;</li><li>contact you through your chosen channel, clarify requirements, and prepare an offer;</li><li>take steps before entering into an agreement and fulfil agreed obligations;</li><li>protect the website against spam, abuse, and technical attacks;</li><li>comply with legal obligations;</li><li>improve the website using anonymised data or analytics you have authorised.</li></ul><p>Depending on the situation, processing may rely on your consent, the need to respond to a request and take pre-contractual steps, performance of an agreement, a legitimate interest in website security, or a legal obligation. Consent may be withdrawn without affecting processing that was lawful before withdrawal.</p></section>

            <section id="cookies"><span>05</span><h2>Cookies, local storage, and analytics</h2><p>The website uses technically necessary browser storage to remember your cookie choice and selected interface language. This information is not used to create an advertising profile.</p><p>Google Analytics or another analytics service is activated only after you select “Allow analytics” and only where the website owner has configured the corresponding identifier. If you decline, the analytics script is not loaded. You can change your choice using the “Cookies” control in the website footer.</p><p>An analytics provider may receive technical identifiers, device information, visited pages, and approximate location. IP anonymisation is enabled in the website configuration where supported. Actual retention periods are controlled by the provider’s settings.</p></section>

            <section id="sharing"><span>06</span><h2>Who may receive the data</h2><p>Personal data is not sold or disclosed to third-party advertisers. Access may be granted only where needed for website operation:</p><ul><li>to hosting, database, email, or backup providers;</li><li>to an analytics provider, only after consent;</li><li>to contractors who need the information for a specific project and are required to maintain confidentiality;</li><li>to public authorities only where legally required and within their powers.</li></ul><p>Where a service provider processes data outside Ukraine, available contractual, organisational, and technical safeguards are used. International online services may operate infrastructure in several countries.</p></section>

            <section id="storage"><span>07</span><h2>Retention and deletion</h2><p>Inquiries and related correspondence are kept for as long as reasonably necessary to respond, negotiate, perform agreed work, and protect legitimate interests. If no agreement is concluded, inquiry data is generally deleted or anonymised no later than three years after the last meaningful communication, unless a different period is required by law or justified by a documented need.</p><p>Contractual, payment, and accounting documents are retained for the periods required by law. Technical logs are kept for a limited period needed for security and diagnostics. When the applicable period ends, data is deleted, anonymised, or retained only where the law requires it.</p></section>

            <section id="rights"><span>08</span><h2>Your rights</h2><p>Subject to applicable law, you may:</p><ul><li>request information about the source, location, purpose, and methods of processing;</li><li>learn about access conditions and recipients of your data;</li><li>obtain access to your personal data and a copy of it;</li><li>request correction of inaccurate or outdated information;</li><li>object to processing or withdraw consent;</li><li>request deletion where data is processed unlawfully or is no longer needed;</li><li>submit a complaint to the Ukrainian Parliament Commissioner for Human Rights or a competent court.</li></ul><p>Identity verification may be required to prevent disclosure to an unauthorised person. Requests are handled within the period established by law and without undue delay.</p></section>

            <section id="security"><span>09</span><h2>Security, children, and external links</h2><p>Reasonable safeguards include access controls, software updates, backups, restricted administrator permissions, and other organisational and technical measures. No method of transmission or storage on the internet can guarantee absolute security.</p><p>The website is not intended for children to submit inquiries independently. A person who does not have sufficient legal capacity should use the website with the participation of a parent or legal representative.</p><p>The website may contain links to third-party services. Their owners are independently responsible for their privacy practices, so you should review the relevant policies before submitting information.</p></section>

            <section id="changes"><span>10</span><h2>Policy updates and contacts</h2><p>This policy may be updated when website functionality, connected providers, or legal requirements change. The current version is published on this page and applies from the stated revision date.</p><p>To exercise your rights or ask a privacy question, contact <a href={`mailto:${settings.email}`}>{settings.email}</a>, <a href={telegramUrl} target="_blank" rel="noreferrer">{settings.telegram}</a>, or <a href={phoneUrl}>{settings.phone}</a>. Please describe the request clearly and provide enough information to identify the relevant correspondence.</p><a className="legal-contact-link" href={`mailto:${settings.email}`}>Send a privacy request <ArrowUpRight size={17} /></a></section>
          </article>
        </div>
      </section>
    </div>
  )
}

export default function Privacy() {
  const { isEnglish } = useLanguage()
  const [settings, setSettings] = useState(fallbackSettings)

  useEffect(() => {
    api.get('/settings/').then((response) => {
      const data = unwrap(response)
      if (data?.full_name) setSettings(data)
    }).catch(() => {})
  }, [])

  return (
    <div className="legal-page modern-page">
      <section className="legal-hero">
        <div className="container-shell legal-hero-grid">
          <div>
            <div className="modern-kicker"><span>Юридична інформація</span><i /> Редакція від 6 липня 2026 року</div>
            <h1>Політика <em>конфіденційності</em></h1>
            <p>Цей документ пояснює, які персональні дані можуть оброблятися на сайті, навіщо вони потрібні та як користувач може реалізувати свої права.</p>
          </div>
          <div className="legal-hero-card"><ShieldCheck size={30} /><strong>Принцип мінімальності</strong><p>Сайт запитує лише дані, необхідні для відповіді на звернення та роботи обраних користувачем функцій.</p></div>
        </div>
      </section>

      <section className="legal-summary-section">
        <div className="container-shell legal-summary-grid">
          <article><i><Database size={21} /></i><span>Основні дані</span><strong>Ім’я, контакт і повідомлення</strong></article>
          <article><i><Cookie size={21} /></i><span>Аналітика</span><strong>Лише після окремої згоди</strong></article>
          <article><i><UserRoundCheck size={21} /></i><span>Ваш контроль</span><strong>Доступ, виправлення та видалення</strong></article>
          <article><i><LockKeyhole size={21} /></i><span>Безпека</span><strong>Організаційні й технічні заходи</strong></article>
        </div>
      </section>

      <section className="modern-section legal-content-section">
        <div className="container-shell legal-layout">
          <aside className="legal-toc"><span>Зміст</span><nav>{sections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav><div><Mail size={18} /><p>Питання щодо даних:</p><a href={`mailto:${settings.email}`}>{settings.email}</a></div></aside>

          <article className="legal-document">
            <div className="legal-notice"><Eye size={20} /><p><strong>Важливо.</strong> Політика застосовується до цього портфоліо та форм зв’язку. У разі підключення нових сервісів документ має бути оновлений до початку відповідної обробки.</p></div>

            <section id="scope"><span>01</span><h2>Сфера дії та основні поняття</h2><p>Політика поширюється на користувачів сайту, які переглядають сторінки, обирають налаштування cookies, надсилають заявку або зв’язуються через опубліковані контакти. «Персональні дані» — відомості, за якими фізичну особу можна прямо або опосередковано ідентифікувати. «Обробка» охоплює збирання, зберігання, використання, зміну, передавання та видалення даних.</p></section>

            <section id="controller"><span>02</span><h2>Володілець персональних даних</h2><p>Володільцем даних, отриманих безпосередньо через сайт, є <strong>{settings.full_name}</strong>, {settings.city}. З питань конфіденційності можна звернутися на <a href={`mailto:${settings.email}`}>{settings.email}</a>, у Telegram <a href={`https://t.me/${String(settings.telegram || '').replace('@', '')}`} target="_blank" rel="noreferrer">{settings.telegram}</a> або за телефоном <a href={`tel:${String(settings.phone || '').replace(/\s/g, '')}`}>{settings.phone}</a>.</p><p>Якщо для конкретного проєкту сторони укладають окремий договір, ролі сторін щодо персональних даних можуть додатково визначатися таким договором.</p></section>

            <section id="data"><span>03</span><h2>Які дані можуть збиратися</h2><h3>Дані, які ви надаєте самостійно</h3><ul><li>ім’я або інше зазначене вами звертання;</li><li>обраний спосіб зв’язку та відповідний контакт: Telegram, номер телефону або email;</li><li>текст повідомлення, опис задачі, бюджет, строки та інша інформація, яку ви добровільно вказали;</li><li>матеріали, які ви надсилаєте під час подальшого листування.</li></ul><h3>Технічні дані</h3><p>Сервер і хостинг-провайдер можуть автоматично отримувати IP-адресу, дату й час запиту, тип браузера, сторінку переходу, технічні журнали помилок та інші дані, необхідні для безпеки й стабільної роботи. Аналітичні дані збираються лише за умови вашої окремої згоди в банері cookies.</p><p>Не надсилайте через форму спеціальні категорії персональних даних, банківські реквізити, паролі або документи, якщо це не було окремо погоджено через захищений канал.</p></section>

            <section id="purposes"><span>04</span><h2>Мета та правові підстави обробки</h2><p>Дані можуть використовуватися для:</p><ul><li>отримання, реєстрації та опрацювання звернення;</li><li>зв’язку з вами обраним способом, уточнення вимог і підготовки пропозиції;</li><li>вжиття заходів до укладення договору та виконання погоджених домовленостей;</li><li>захисту сайту від спаму, зловживань і технічних атак;</li><li>виконання обов’язків, передбачених законодавством;</li><li>покращення сайту на основі знеособленої або дозволеної вами аналітики.</li></ul><p>Залежно від ситуації підставою є ваша добровільна згода, необхідність відповісти на запит і вжити переддоговірних заходів, виконання договору, законний інтерес у забезпеченні безпеки сайту або юридичний обов’язок. Згоду можна відкликати, однак це не впливає на законність обробки, виконаної до відкликання.</p></section>

            <section id="cookies"><span>05</span><h2>Cookies, локальне сховище та аналітика</h2><p>Сайт використовує технічно необхідне локальне сховище браузера для запам’ятовування вашого вибору щодо cookies. Ці дані не призначені для рекламного профілювання.</p><p>Google Analytics або інший аналітичний сервіс підключається лише після натискання «Дозволити аналітику» та лише якщо власник сайту налаштував відповідний ідентифікатор. При відмові аналітичний скрипт не завантажується. Змінити рішення можна через кнопку «Cookies» у нижній частині сайту.</p><p>Аналітичний провайдер може отримувати технічні ідентифікатори, інформацію про пристрій, відвідані сторінки та приблизне місцезнаходження. IP-анонімізація вмикається у конфігурації сайту. Фактичні строки зберігання визначаються налаштуваннями відповідного сервісу.</p></section>

            <section id="sharing"><span>06</span><h2>Кому можуть передаватися дані</h2><p>Дані не продаються та не передаються стороннім рекламодавцям. Доступ може надаватися лише в обсязі, необхідному для роботи:</p><ul><li>хостинг-провайдеру, провайдеру бази даних, email або резервного копіювання;</li><li>аналітичному сервісу — виключно після згоди;</li><li>залученим підрядникам, яким дані потрібні для виконання конкретного проєкту та які зобов’язані зберігати конфіденційність;</li><li>державним органам — лише на законній підставі та в межах їхніх повноважень.</li></ul><p>Якщо сервіс-провайдер обробляє дані за межами України, застосовуються доступні договірні, організаційні та технічні гарантії. Користувач враховує, що міжнародні онлайн-сервіси можуть використовувати інфраструктуру в різних країнах.</p></section>

            <section id="storage"><span>07</span><h2>Строки зберігання та видалення</h2><p>Заявки й пов’язане листування зберігаються стільки, скільки потрібно для відповіді, переговорів, виконання домовленостей і захисту законних інтересів. Якщо договір не укладено, дані звернення зазвичай видаляються або анонімізуються не пізніше трьох років після останньої змістовної комунікації, якщо коротший чи довший строк не випливає із закону або обґрунтованої потреби.</p><p>Договірні, платіжні та бухгалтерські документи зберігаються протягом строків, установлених законодавством. Технічні журнали зберігаються обмежений строк, потрібний для безпеки та діагностики. Після завершення строку дані видаляються, анонімізуються або зберігаються лише там, де цього вимагає закон.</p></section>

            <section id="rights"><span>08</span><h2>Права користувача</h2><p>У межах законодавства ви можете:</p><ul><li>дізнатися про джерела, місцезнаходження, мету та способи обробки своїх даних;</li><li>отримати інформацію про умови доступу до них і третіх осіб, яким вони передаються;</li><li>отримати доступ до власних даних та їх копію;</li><li>вимагати виправлення неточних або застарілих відомостей;</li><li>заперечити проти обробки або відкликати згоду;</li><li>вимагати видалення чи знищення даних, якщо вони обробляються незаконно або більше не потрібні;</li><li>звернутися зі скаргою до Уповноваженого Верховної Ради України з прав людини або до суду.</li></ul><p>Для виконання запиту може знадобитися підтвердження особи, щоб дані не були розкриті сторонній людині. Відповідь надається у строк, установлений законом, або без невиправданої затримки.</p></section>

            <section id="security"><span>09</span><h2>Безпека, діти та зовнішні посилання</h2><p>Для захисту даних застосовуються контроль доступу, оновлення програмного забезпечення, резервне копіювання, обмеження прав адміністраторів та інші розумні заходи. Водночас жоден спосіб передавання або зберігання в інтернеті не гарантує абсолютної безпеки.</p><p>Сайт не призначений для самостійного подання заявок малолітніми особами. Особи, які не мають достатнього обсягу цивільної дієздатності, повинні користуватися формою за участю батьків або законних представників.</p><p>Посилання на Telegram, Instagram, GitHub, LinkedIn та інші зовнішні сервіси ведуть на ресурси третіх осіб. Їхня обробка даних регулюється власними політиками цих сервісів.</p></section>

            <section id="changes"><span>10</span><h2>Оновлення політики та контакти</h2><p>Цю Політику підготовлено з урахуванням законодавства України про захист персональних даних, електронну комерцію та недоторканність приватного життя. Політика може змінюватися через оновлення сайту, підключення нових сервісів або зміни законодавства. Актуальна редакція публікується на цій сторінці із зазначенням дати. Істотні зміни, якщо це доцільно й технічно можливо, можуть додатково повідомлятися на сайті.</p><p>Щоб реалізувати свої права або поставити запитання, напишіть на <a href={`mailto:${settings.email}`}>{settings.email}</a>. У зверненні вкажіть, як вас ідентифікувати, суть запиту та бажаний спосіб отримання відповіді.</p><a className="legal-contact-link" href={`mailto:${settings.email}`}>Звернутися щодо персональних даних <ArrowUpRight size={17} /></a></section>
          </article>
        </div>
      </section>
    </div>
  )
}
