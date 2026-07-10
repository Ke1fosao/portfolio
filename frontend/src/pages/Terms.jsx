import { useEffect, useState } from 'react'
import { AlertCircle, ArrowUpRight, CheckCircle2, FileCheck2, Handshake, Scale, ShieldCheck } from 'lucide-react'
import api, { unwrap } from '../lib/api'
import { fallbackSettings } from '../data/fallbackData'
import { useLanguage } from '../i18n/LanguageContext'
import { localizeSettings } from '../i18n/localizedData'
import '../styles/secondary-base.css'
import '../styles/legal.css'
import '../styles/secondary-responsive.css'

const sections = [
  ['general', '1. Загальні положення'],
  ['offer', '2. Статус інформації'],
  ['order', '3. Порядок замовлення'],
  ['price', '4. Вартість та оплата'],
  ['delivery', '5. Строки й приймання'],
  ['client', '6. Обов’язки замовника'],
  ['ip', '7. Авторські права'],
  ['portfolio', '8. Портфоліо'],
  ['services', '9. Сторонні сервіси'],
  ['liability', '10. Відповідальність'],
  ['cancel', '11. Відмова та повернення'],
  ['disputes', '12. Спори та зміни'],
]

const englishSections = [
  ['general', '1. General provisions'],
  ['offer', '2. Status of information'],
  ['order', '3. Ordering process'],
  ['price', '4. Pricing and payment'],
  ['delivery', '5. Timing and acceptance'],
  ['client', '6. Client responsibilities'],
  ['ip', '7. Intellectual property'],
  ['portfolio', '8. Portfolio use'],
  ['services', '9. Third-party services'],
  ['liability', '10. Liability'],
  ['cancel', '11. Cancellation and refunds'],
  ['disputes', '12. Disputes and updates'],
]

function TermsEnglish({ settings }) {
  const telegramUrl = `https://t.me/${String(settings.telegram || '').replace('@', '')}`
  const phoneUrl = `tel:${String(settings.phone || '').replace(/\s/g, '')}`
  if (isEnglish) return <TermsEnglish settings={localizeSettings(settings, 'en')} />

  return (
    <div className="legal-page modern-page">
      <section className="legal-hero terms-hero">
        <div className="container-shell legal-hero-grid">
          <div><div className="modern-kicker"><span>Legal information</span><i /> Version dated July 6, 2026</div><h1>Website <em>terms of use</em></h1><p>Rules for using the portfolio, submitting inquiries, and discussing digital product development services.</p></div>
          <div className="legal-hero-card"><Scale size={30} /><strong>Clear agreements</strong><p>The exact scope, price, timeline, and rights are documented in an individual offer, correspondence, or agreement.</p></div>
        </div>
      </section>

      <section className="legal-summary-section">
        <div className="container-shell legal-summary-grid">
          <article><i><Handshake size={21} /></i><span>Cooperation</span><strong>Individual scope for every project</strong></article>
          <article><i><FileCheck2 size={21} /></i><span>Confirmation</span><strong>Written offer or agreement</strong></article>
          <article><i><CheckCircle2 size={21} /></i><span>Acceptance</span><strong>Stage-by-stage review and approval</strong></article>
          <article><i><ShieldCheck size={21} /></i><span>Protection</span><strong>Mandatory legal rights remain in force</strong></article>
        </div>
      </section>

      <section className="modern-section legal-content-section">
        <div className="container-shell legal-layout">
          <aside className="legal-toc"><span>Contents</span><nav>{englishSections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav><div><AlertCircle size={18} /><p>Questions about the terms:</p><a href={`mailto:${settings.email}`}>{settings.email}</a></div></aside>

          <article className="legal-document">
            <div className="legal-notice"><AlertCircle size={20} /><p><strong>Important.</strong> Prices, timelines, and service descriptions on this website are indicative. The individual agreement with a client takes priority.</p></div>

            <section id="general"><span>01</span><h2>General provisions</h2><p>These terms govern use of the portfolio website and the initial exchange of information regarding website, web system, automation, and related development services. The website owner and potential service provider is <strong>{settings.full_name}</strong>, {settings.city}.</p><p>By browsing the website or submitting an inquiry, you confirm that you have read these terms. Submitting a form does not automatically create a contract or oblige either party to begin work.</p></section>

            <section id="offer"><span>02</span><h2>Status of website information</h2><p>Project examples, service packages, estimated prices, timelines, descriptions, and performance indicators are provided for general information. They are not a public offer unless a specific statement clearly says otherwise.</p><p>A binding commitment arises only after the parties agree on the essential terms in writing, including the task, scope, price, payment schedule, timeline, acceptance procedure, support, and intellectual property rights.</p></section>

            <section id="order"><span>03</span><h2>How a project is ordered</h2><p>Cooperation usually begins with an inquiry through the website, Telegram, email, or phone. The provider may request a brief, examples, source materials, access requirements, and information about the client’s goals.</p><p>After clarification, the client receives an estimate, offer, work plan, or draft agreement. Work begins after written approval and, where agreed, receipt of an advance payment and required materials.</p><p>The provider may decline a project that is unlawful, misleading, technically unsafe, beyond available capacity, or incompatible with professional standards.</p></section>

            <section id="price"><span>04</span><h2>Pricing, payment, and additional work</h2><p>The final price depends on the approved scope, complexity, number of pages and roles, integrations, content volume, design requirements, and delivery conditions. Taxes, provider fees, paid licences, domains, hosting, advertising budgets, and third-party subscriptions are included only where expressly stated.</p><p>Payment may be divided into stages. An advance reserves production time and covers the agreed initial stage. Additional requests outside the approved scope are estimated separately and may affect both price and timeline.</p><p>Invoices and payment instructions are provided through the communication channel agreed by the parties. The client is responsible for using correct payment details and paying any bank or payment-system fees unless agreed otherwise.</p></section>

            <section id="delivery"><span>05</span><h2>Timing, review, and acceptance</h2><p>Timelines are calculated after the task, materials, and start date are confirmed. They may change when the client delays feedback, changes requirements, fails to provide materials or access, or when third-party services cause delays outside the provider’s reasonable control.</p><p>Intermediate and final results may be delivered through a test website, repository, archive, design preview, video demonstration, or another agreed format. The client should review each stage and provide one consolidated list of comments within the agreed period.</p><p>A stage may be considered accepted after written approval, publication, active use, or expiry of the review period without substantiated comments, where this procedure was agreed in advance and does not limit mandatory consumer rights.</p></section>

            <section id="client"><span>06</span><h2>Client responsibilities</h2><p>The client must provide accurate information, materials, access credentials, decisions, and feedback on time. The client confirms that supplied texts, trademarks, photographs, videos, databases, and other materials may lawfully be used for the project.</p><p>The client is responsible for the legality and accuracy of their business content, offers, prices, personal-data notices, and information provided to end users. Regulated activities may require separate legal review, licences, or mandatory consumer disclosures.</p></section>

            <section id="ip"><span>07</span><h2>Copyright and rights to the result</h2><p>Rights to source code, design, text, graphics, and other deliverables are determined by the individual agreement. Unless expressly agreed otherwise, the economic rights to the specially created final deliverable transfer within the agreed scope after full payment. Before full payment, unpaid materials may be used only for review and approval.</p><p>Third-party libraries, open-source code, content-management systems, fonts, photographs, icons, and services remain subject to their respective licences. Reusable tools, general modules, methods, and know-how that do not contain the client’s confidential information may be used in other work unless the parties agree otherwise.</p></section>

            <section id="portfolio"><span>08</span><h2>Project publication in the portfolio</h2><p>The use of a client’s name, logo, screenshots, link, and general project description is agreed with the client. Confidential information, private metrics, credentials, and internal data are not published without permission.</p><p>An express non-disclosure or no-publication agreement takes priority. Demonstration concepts and products under development may be clearly labelled as such on the website.</p></section>

            <section id="services"><span>09</span><h2>Hosting, domains, and third-party services</h2><p>A project may depend on hosting, domain registrars, payment providers, email, Telegram, Google, AI providers, and other third parties. Their pricing, rules, availability, and policies may change independently of the developer.</p><p>Unless agreed otherwise, the client owns the primary service accounts and pays recurring third-party charges. The provider is not responsible for outages, blocks, API changes, or loss of access caused outside reasonable control, but may assist with diagnostics under a separate support arrangement.</p></section>

            <section id="liability"><span>10</span><h2>Warranties, security, and limitation of liability</h2><p>The provider will perform agreed work in good faith and with professional care. No website can guarantee a specific income, number of leads, search ranking, or uninterrupted operation of third-party infrastructure unless such a guarantee is expressly included in an agreement.</p><p>The client should replace temporary passwords, keep content current, and follow security recommendations. After any included warranty or support period, updates, backups, and monitoring are the client’s responsibility unless covered by a separate service.</p><p>Nothing in these terms excludes liability where exclusion is prohibited by law or removes mandatory consumer protections. In the absence of wilful misconduct or gross negligence, liability is determined by the individual agreement and proven direct losses.</p></section>

            <section id="cancel"><span>11</span><h2>Scope changes, termination, and refunds</h2><p>Either party may initiate termination in accordance with the individual agreement. The final calculation covers completed work, reserved production time, and approved expenses already incurred. Work that has not been performed is not charged unless the agreement or applicable law provides otherwise.</p><p>An advance may be fully or partly non-refundable to the extent it covers completed work, purchased licences, transaction fees, and reserved resources, provided this was clearly agreed in advance. Mandatory rules on distance contracts, cancellation, and refunds apply to consumers where relevant.</p></section>

            <section id="disputes"><span>12</span><h2>Personal data, disputes, and changes</h2><p>Personal data processing is governed by the <a href="/privacy">Privacy Policy</a>. The parties should first attempt to resolve disagreements through negotiation and a written exchange of positions. Unresolved disputes are handled under the laws of Ukraine by a competent authority or court.</p><p>Mandatory provisions of Ukrainian civil law, e-commerce law, personal-data law, copyright law, and consumer-protection law apply depending on the parties’ status and the nature of the service.</p><p>These terms may be updated. A new version applies to future website use and new inquiries from the moment of publication, but it does not amend an existing agreement without the parties’ consent unless the law provides otherwise.</p><p>Contacts: <a href={`mailto:${settings.email}`}>{settings.email}</a>, <a href={telegramUrl} target="_blank" rel="noreferrer">{settings.telegram}</a>, <a href={phoneUrl}>{settings.phone}</a>.</p><a className="legal-contact-link" href={`mailto:${settings.email}`}>Ask a question about the terms <ArrowUpRight size={17} /></a></section>
          </article>
        </div>
      </section>
    </div>
  )
}

export default function Terms() {
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
      <section className="legal-hero terms-hero">
        <div className="container-shell legal-hero-grid">
          <div><div className="modern-kicker"><span>Юридична інформація</span><i /> Редакція від 6 липня 2026 року</div><h1>Умови <em>використання сайту</em></h1><p>Правила користування портфоліо, надсилання звернень і базові умови обговорення послуг із розробки цифрових продуктів.</p></div>
          <div className="legal-hero-card"><Scale size={30} /><strong>Прозорі домовленості</strong><p>Точний обсяг, ціна, строки та права фіксуються в індивідуальній пропозиції, листуванні або договорі.</p></div>
        </div>
      </section>

      <section className="legal-summary-section">
        <div className="container-shell legal-summary-grid terms-summary">
          <article><i><FileCheck2 size={21} /></i><span>Інформація на сайті</span><strong>Не є безумовною публічною офертою</strong></article>
          <article><i><Handshake size={21} /></i><span>Початок роботи</span><strong>Після погодження істотних умов</strong></article>
          <article><i><ShieldCheck size={21} /></i><span>Права клієнта</span><strong>Обов’язкові норми закону зберігаються</strong></article>
          <article><i><CheckCircle2 size={21} /></i><span>Результат</span><strong>Приймання за погодженими критеріями</strong></article>
        </div>
      </section>

      <section className="modern-section legal-content-section">
        <div className="container-shell legal-layout">
          <aside className="legal-toc"><span>Зміст</span><nav>{sections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav><div><AlertCircle size={18} /><p>Потрібне уточнення?</p><a href={`mailto:${settings.email}`}>{settings.email}</a></div></aside>

          <article className="legal-document">
            <div className="legal-notice"><AlertCircle size={20} /><p><strong>Зверніть увагу.</strong> Ці умови регулюють користування сайтом і первинну комунікацію. Для конкретного проєкту пріоритет мають індивідуальна комерційна пропозиція, технічне завдання, рахунок, листування та/або договір.</p></div>

            <section id="general"><span>01</span><h2>Загальні положення</h2><p>Сайт належить і адмініструється <strong>{settings.full_name}</strong>, {settings.city} (далі — «Власник» або «Виконавець»). Користувачем є будь-яка особа, яка переглядає сайт, використовує форму зв’язку або переходить до зовнішніх каналів комунікації.</p><p>Користуючись сайтом, ви підтверджуєте, що ознайомилися з цими Умовами та Політикою конфіденційності. Якщо ви не погоджуєтеся з ними, припиніть використання функцій, що передбачають передавання даних.</p></section>

            <section id="offer"><span>02</span><h2>Статус інформації та відсутність автоматичного замовлення</h2><p>Описи послуг, приклади робіт, строки й ціни «від» мають інформаційний та орієнтовний характер. Вони не створюють обов’язку виконати будь-який проєкт за зазначеною ціною чи в зазначений строк і не є безумовною публічною офертою, якщо на відповідній сторінці прямо не вказано інше.</p><p>Надсилання форми означає запит на зв’язок, а не автоматичне укладення договору та не гарантує прийняття замовлення. Договірні відносини виникають після погодження предмета, обсягу, ціни, строків та інших істотних умов у формі, допустимій законодавством.</p></section>

            <section id="order"><span>03</span><h2>Порядок обговорення та оформлення замовлення</h2><ol><li>Користувач надсилає звернення через форму, email, Telegram або інший опублікований канал.</li><li>Виконавець уточнює задачу, функціонал, матеріали, бюджет, строки та технічні обмеження.</li><li>Сторони погоджують комерційну пропозицію, технічне завдання, етапи, кількість і порядок правок, умови підтримки та приймання.</li><li>За потреби укладається окремий письмовий або електронний договір та виставляється рахунок.</li><li>Робота починається після виконання погоджених стартових умов, зокрема отримання передоплати й необхідних матеріалів.</li></ol><p>Електронне листування, підтвердження в месенджері, оплата рахунку або інша погоджена дія можуть використовуватися як доказ прийняття конкретних умов у межах законодавства. Для складних або тривалих проєктів рекомендується окремий договір.</p></section>

            <section id="price"><span>04</span><h2>Вартість, податки та порядок оплати</h2><p>Фінальна вартість залежить від структури, кількості сторінок, дизайну, ролей, інтеграцій, контенту, строків і рівня невизначеності. Валюта, податки, комісії платіжних сервісів та банківські витрати визначаються у пропозиції або рахунку.</p><p>Оплата може бути одноразовою або поетапною. Якщо інше не погоджено, передоплата резервує час і покриває стартові роботи. Платежі за домен, хостинг, сторонні API, ліцензії, шрифти, платні шаблони, сервіси email, AI або SMS не входять до вартості розробки, якщо це прямо не зазначено.</p><p>Виконавець надає реквізити та інформацію про свій правовий/податковий статус у документах, що оформлюються для конкретної співпраці. Обов’язкові відомості про продавця або виконавця, які вимагає закон для конкретної моделі продажу, мають бути надані до укладення відповідного договору.</p></section>

            <section id="delivery"><span>05</span><h2>Строки, комунікація та приймання результату</h2><p>Строки обчислюються з моменту отримання передоплати, матеріалів і погоджень, необхідних для старту. Затримка відповідей, контенту, доступів або рішень з боку замовника пропорційно переносить графік. Строк може бути переглянутий, якщо змінюється обсяг робіт або виникають обставини, які сторони не могли розумно передбачити.</p><p>Результат передається способом, визначеним у домовленостях: посилання на тестову версію, репозиторій, архів, розгортання на хостингу або доступ до адмінпанелі. Замовник перевіряє результат у погоджений строк і надсилає єдиний структурований перелік зауважень. Якщо порядок приймання не встановлено, сторони погоджують його до фінального платежу.</p><p>Виправлення помилок, через які реалізована функція не відповідає погодженому завданню, відрізняється від нового функціоналу або зміни раніше затвердженого рішення. Нові вимоги оцінюються окремо.</p></section>

            <section id="client"><span>06</span><h2>Обов’язки і гарантії замовника</h2><p>Замовник зобов’язується своєчасно надавати правдиву інформацію, контент, доступи та рішення; перевіряти проміжні результати; не передавати паролі через незахищені канали без потреби; а також використовувати продукт законно.</p><p>Замовник гарантує, що має права на передані тексти, фото, відео, логотипи, бази даних, шрифти та інші матеріали, або отримав необхідні дозволи. Замовник відповідає за достовірність інформації про власні товари, послуги, ціни, гарантії, ліцензії та обов’язкові повідомлення для споживачів.</p></section>

            <section id="ip"><span>07</span><h2>Авторські права та право використання результату</h2><p>Права на вихідний код, дизайн, тексти, графіку та інші результати визначаються індивідуальними домовленостями. Якщо інше прямо не погоджено, виключні майнові права на спеціально створений фінальний результат переходять у погодженому обсязі після повної оплати. До цього моменту замовник не має права використовувати неоплачені матеріали поза перевіркою та погодженням.</p><p>Права на сторонні бібліотеки, відкритий код, CMS, шрифти, фотографії, іконки та сервіси залишаються у відповідних правовласників і регулюються їхніми ліцензіями. Інструменти, універсальні модулі, підходи та напрацювання, які не містять конфіденційних даних замовника і не створені виключно для нього, можуть повторно використовуватися Виконавцем, якщо інше не встановлено договором.</p></section>

            <section id="portfolio"><span>08</span><h2>Публікація проєкту в портфоліо</h2><p>Можливість показувати назву, логотип, скриншоти, посилання та загальний опис виконаної роботи погоджується з замовником. Конфіденційні дані, закриті показники, доступи та внутрішня інформація без дозволу не публікуються.</p><p>Якщо сторони прямо домовилися про режим нерозголошення або заборону публікації, така домовленість має пріоритет. Демонстраційні макети й концепти на сайті можуть бути позначені як власні або такі, що перебувають у розробці.</p></section>

            <section id="services"><span>09</span><h2>Хостинг, домен і сторонні сервіси</h2><p>Робота сайту може залежати від хостингу, доменного реєстратора, платіжних систем, email, Telegram, Google, AI-провайдерів та інших третіх осіб. Їхні тарифи, правила, доступність і політики можуть змінюватися незалежно від Виконавця.</p><p>Якщо інше не погоджено, замовник самостійно є власником основних облікових записів і сплачує регулярні послуги. Виконавець не відповідає за збої, блокування, зміни API або втрату доступу з причин, що перебувають поза його розумним контролем, але може допомогти з діагностикою в межах окремої підтримки.</p></section>

            <section id="liability"><span>10</span><h2>Гарантії, безпека та обмеження відповідальності</h2><p>Виконавець зобов’язується виконувати погоджені роботи добросовісно та з професійною обачністю. Жоден сайт не може гарантувати конкретний дохід, кількість заявок, позиції в пошуку або безперервну роботу сторонньої інфраструктури, якщо така гарантія прямо не закріплена окремо.</p><p>Замовник зобов’язаний своєчасно змінити передані тимчасові паролі, підтримувати актуальність контенту та виконувати рекомендації з безпеки. Після завершення гарантійного або підтримувального періоду оновлення, резервні копії та моніторинг виконуються замовником або в межах окремої послуги.</p><p>Обмеження відповідальності не застосовуються там, де вони заборонені законом, зокрема не можуть скасовувати обов’язкові права споживача. За відсутності умислу або грубої необережності відповідальність сторін визначається договором і фактично доведеними прямими збитками.</p></section>

            <section id="cancel"><span>11</span><h2>Зміна обсягу, припинення роботи та повернення коштів</h2><p>Кожна сторона може ініціювати припинення співпраці в порядку, встановленому індивідуальними домовленостями. У такому разі проводиться розрахунок за фактично виконані роботи, зарезервований час і вже понесені погоджені витрати. Нестворена частина робіт не оплачується, якщо інше не випливає з договору або закону.</p><p>Передоплата може бути повністю або частково неповоротною в частині вже виконаних робіт, придбаних ліцензій, комісій та зарезервованого ресурсу, якщо це було заздалегідь чітко погоджено. Для споживачів застосовуються обов’язкові правила щодо дистанційних договорів, відмови від послуг і повернення коштів у тій мірі, у якій вони поширюються на конкретну ситуацію.</p></section>

            <section id="disputes"><span>12</span><h2>Персональні дані, вирішення спорів та зміни умов</h2><p>Обробка персональних даних регулюється <a href="/privacy">Політикою конфіденційності</a>. Сторони прагнуть вирішувати розбіжності шляхом переговорів і письмового обміну позиціями. Якщо домовитися не вдалося, спір вирішується відповідно до законодавства України компетентним органом або судом.</p><p>До відносин застосовуються імперативні норми Цивільного кодексу України, законодавства про електронну комерцію, захист персональних даних, авторське право та захист прав споживачів — залежно від статусу сторін і характеру конкретної послуги.</p><p>Умови можуть оновлюватися. Нова редакція діє з моменту публікації для подальшого використання сайту й нових звернень, але не змінює вже погоджений договір без згоди сторін, якщо інше не передбачено законом.</p><p>Контакти: <a href={`mailto:${settings.email}`}>{settings.email}</a>, <a href={`https://t.me/${String(settings.telegram || '').replace('@', '')}`} target="_blank" rel="noreferrer">{settings.telegram}</a>, <a href={`tel:${String(settings.phone || '').replace(/\s/g, '')}`}>{settings.phone}</a>.</p><a className="legal-contact-link" href={`mailto:${settings.email}`}>Поставити запитання щодо умов <ArrowUpRight size={17} /></a></section>
          </article>
        </div>
      </section>
    </div>
  )
}
