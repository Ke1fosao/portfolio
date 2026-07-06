import { ArrowRight, CheckCircle2, Code2, FileCheck2, FolderInput, Headphones, RefreshCw, ShieldCheck, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import '../styles/secondary-base.css'
import '../styles/legal.css'
import '../styles/secondary-responsive.css'

const terms = [
  { Icon: FileCheck2, number: '01', title: 'Початок роботи', text: 'Спочатку уточнюємо задачу, цілі, обсяг функціоналу, матеріали та бажані строки. Після цього я формую короткий план, оцінку і перелік того, що входить у роботу.' },
  { Icon: WalletCards, number: '02', title: 'Передоплата', text: 'Стандартно робота починається після передоплати 30–50%. Для невеликих задач може застосовуватися повна оплата або поділ на короткі етапи — це фіксується до старту.' },
  { Icon: RefreshCw, number: '03', title: 'Правки', text: 'До погодженого обсягу входять два раунди правок по дизайну та логіці. Нові функції або зміна затвердженої концепції оцінюються окремо до виконання.' },
  { Icon: Code2, number: '04', title: 'Передача проєкту', text: 'Після фінальної перевірки передаю код, доступи, інструкцію з запуску та коротке пояснення адмінпанелі. За потреби допомагаю з доменом, хостингом і розгортанням.' },
  { Icon: Headphones, number: '05', title: 'Підтримка', text: 'Після запуску надаю погоджений гарантійний період для виправлення помилок у реалізованому функціоналі. Подальший розвиток і контентна підтримка оформлюються окремо.' },
  { Icon: FolderInput, number: '06', title: 'Що надає клієнт', text: 'До старту або відповідного етапу потрібні логотип, тексти, фото, реквізити, доступи до домену чи сервісів і одна відповідальна людина для погоджень. Якщо матеріалів немає, їх підготовка оцінюється окремо.' },
  { Icon: ShieldCheck, number: '07', title: 'Права на код і дизайн', text: 'Після повної оплати клієнт отримує право використовувати створений для нього результат. Сторонні бібліотеки залишаються під власними ліцензіями, а право показати кейс у портфоліо узгоджується окремо.' },
]

export default function WorkTerms() {
  return (
    <div className="modern-page work-terms-page">
      <section className="modern-section direct-start-section">
        <div className="container-shell">
          <div className="modern-section-heading">
            <div><span>Прозорий процес</span><h1>Умови роботи без прихованих пунктів.</h1></div>
            <p>Тут зібрані базові правила співпраці: від першого обговорення й передоплати до передачі готового проєкту, підтримки та прав на результат.</p>
          </div>
          <div className="work-terms-grid">
            {terms.map(({ Icon, number, title, text }) => (
              <article key={number}><div><span>{number}</span><Icon size={22} /></div><h2>{title}</h2><p>{text}</p></article>
            ))}
          </div>
          <div className="work-terms-note"><CheckCircle2 size={24} /><div><strong>Фінальні домовленості фіксуються письмово.</strong><p>Точна ціна, строки, етапи, кількість правок і формат передачі залежать від конкретного проєкту та узгоджуються до внесення передоплати.</p></div></div>
        </div>
      </section>
      <section className="modern-section modern-cta-wrap"><div className="container-shell"><div className="modern-cta"><span>Наступний крок</span><h2>Опишіть задачу — я запропоную реалістичний формат старту.</h2><Link className="modern-button is-lime" to="/contact">Перейти до контактів <ArrowRight size={18} /></Link></div></div></section>
    </div>
  )
}
