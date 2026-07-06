import { useState } from 'react'
import { ChevronDown, MessageCircleQuestion } from 'lucide-react'

export default function HomeFaq({ faqs, telegram }) {
  const [open, setOpen] = useState(faqs[0]?.id || null)

  return (
    <section className="s7-faq">
      <div className="s7-shell s7-faq-layout">
        <aside data-s7-reveal><span className="s7-index">06 / Часті питання</span><h2>Усе важливе до початку роботи.</h2><p>Короткі відповіді без технічного жаргону. Деталі конкретного проєкту можна швидко обговорити в Telegram.</p><a href={telegram} target="_blank" rel="noreferrer"><MessageCircleQuestion size={20} /> Поставити своє питання</a></aside>
        <div className="s7-faq-list" data-s7-reveal>
          {faqs.slice(0, 6).map((item, index) => {
            const isOpen = open === item.id
            return (
              <article key={item.id} className={isOpen ? 'is-open' : ''}>
                <button type="button" onClick={() => setOpen(isOpen ? null : item.id)} aria-expanded={isOpen}>
                  <span>{String(index + 1).padStart(2, '0')}</span><strong>{item.question}</strong><i><ChevronDown size={20} /></i>
                </button>
                <div className="s7-faq-answer"><div><p>{item.answer}</p></div></div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
