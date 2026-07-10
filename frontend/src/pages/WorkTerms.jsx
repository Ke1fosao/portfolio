import { ArrowRight, CheckCircle2, Code2, FileCheck2, FolderInput, Headphones, RefreshCw, ShieldCheck, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import '../styles/secondary-base.css'
import '../styles/legal.css'
import '../styles/secondary-responsive.css'

const DATA = {
  uk: { kicker:'Прозорий процес', title:'Умови роботи без прихованих пунктів.', intro:'Тут зібрані базові правила співпраці: від першого обговорення й передоплати до передачі готового проєкту, підтримки та прав на результат.', terms:[
    [FileCheck2,'01','Початок роботи','Спочатку уточнюємо задачу, цілі, обсяг функціоналу, матеріали та бажані строки. Після цього я формую короткий план, оцінку і перелік того, що входить у роботу.'],
    [WalletCards,'02','Передоплата','Стандартно робота починається після передоплати 30–50%. Для невеликих задач може застосовуватися повна оплата або поділ на короткі етапи — це фіксується до старту.'],
    [RefreshCw,'03','Правки','До погодженого обсягу входять два раунди правок по дизайну та логіці. Нові функції або зміна затвердженої концепції оцінюються окремо до виконання.'],
    [Code2,'04','Передача проєкту','Після фінальної перевірки передаю код, доступи, інструкцію з запуску та коротке пояснення адмінпанелі. За потреби допомагаю з доменом, хостингом і розгортанням.'],
    [Headphones,'05','Підтримка','Після запуску надаю погоджений гарантійний період для виправлення помилок у реалізованому функціоналі. Подальший розвиток і контентна підтримка оформлюються окремо.'],
    [FolderInput,'06','Що надає клієнт','До старту або відповідного етапу потрібні логотип, тексти, фото, реквізити, доступи до домену чи сервісів і одна відповідальна людина для погоджень. Якщо матеріалів немає, їх підготовка оцінюється окремо.'],
    [ShieldCheck,'07','Права на код і дизайн','Після повної оплати клієнт отримує право використовувати створений для нього результат. Сторонні бібліотеки залишаються під власними ліцензіями, а право показати кейс у портфоліо узгоджується окремо.'],
  ], noteTitle:'Фінальні домовленості фіксуються письмово.', note:'Точна ціна, строки, етапи, кількість правок і формат передачі залежать від конкретного проєкту та узгоджуються до внесення передоплати.', next:'Наступний крок', cta:'Опишіть задачу — я запропоную реалістичний формат старту.', action:'Перейти до контактів' },
  en: { kicker:'Transparent process', title:'Working terms without hidden clauses.', intro:'These are the basic collaboration rules: from the first discussion and deposit to project delivery, support, and rights to the finished result.', terms:[
    [FileCheck2,'01','Project start','We first clarify the task, goals, scope, materials, and preferred timeline. I then prepare a short plan, estimate, and list of included work.'],
    [WalletCards,'02','Deposit','Work usually begins after a 30–50% deposit. Small tasks may use full payment or short milestones, agreed before the start.'],
    [RefreshCw,'03','Revisions','The agreed scope includes two rounds of design and logic revisions. New features or changes to the approved concept are estimated separately before implementation.'],
    [Code2,'04','Project delivery','After final testing I provide the code, access details, launch instructions, and a short explanation of the admin panel. I can also help with the domain, hosting, and deployment.'],
    [Headphones,'05','Support','After launch I provide an agreed warranty period for correcting defects in the implemented functionality. Further development and content support are arranged separately.'],
    [FolderInput,'06','What the client provides','Before the relevant stage, the project needs a logo, text, photos, company details, access to the domain or services, and one responsible person for approvals. Preparing missing materials is estimated separately.'],
    [ShieldCheck,'07','Rights to code and design','After full payment the client receives the right to use the result created for the project. Third-party libraries remain under their own licenses, and portfolio publication is agreed separately.'],
  ], noteTitle:'Final agreements are recorded in writing.', note:'The exact price, timeline, stages, number of revisions, and delivery format depend on the specific project and are agreed before the deposit.', next:'Next step', cta:'Describe the task and I will suggest a realistic way to start.', action:'Go to contact page' },
}

export default function WorkTerms() { const { language } = useLanguage(); const c = DATA[language]; return <div className="modern-page work-terms-page"><section className="modern-section direct-start-section"><div className="container-shell"><div className="modern-section-heading"><div><span>{c.kicker}</span><h1>{c.title}</h1></div><p>{c.intro}</p></div><div className="work-terms-grid">{c.terms.map(([Icon,number,title,text]) => <article key={number}><div><span>{number}</span><Icon size={22} /></div><h2>{title}</h2><p>{text}</p></article>)}</div><div className="work-terms-note"><CheckCircle2 size={24} /><div><strong>{c.noteTitle}</strong><p>{c.note}</p></div></div></div></section><section className="modern-section modern-cta-wrap"><div className="container-shell"><div className="modern-cta"><span>{c.next}</span><h2>{c.cta}</h2><Link className="modern-button is-lime" to="/contact">{c.action} <ArrowRight size={18} /></Link></div></div></section></div> }
