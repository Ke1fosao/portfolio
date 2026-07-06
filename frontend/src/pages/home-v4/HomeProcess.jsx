import { ArrowUpRight } from 'lucide-react'

const steps = [
  ['01', 'Розбираємо задачу', 'Не починаю з кольорів. Спочатку з’ясовую, що має змінитися в бізнесі після запуску.'],
  ['02', 'Проєктую рішення', 'Структура, сценарії користувача, дані, ролі, сторінки та логіка керування.'],
  ['03', 'Показую прогрес', 'Клієнт бачить проміжний результат і розуміє, що відбувається на кожному етапі.'],
  ['04', 'Запускаю й підтримую', 'Тестування, домен, аналітика, навчання роботі з адмінпанеллю та подальший розвиток.'],
]

export default function HomeProcess({ telegram }) {
  return (
    <section className="sales3-process" id="process">
      <div className="sales3-shell">
        <div className="sales3-process-intro" data-sales-reveal>
          <span className="sales3-section-index">04 / Як проходить робота</span>
          <h2>Зрозумілий процес без зникнень, хаосу й сюрпризів у кінці.</h2>
          <a href={telegram} target="_blank" rel="noreferrer">Обговорити задачу <ArrowUpRight size={18} /></a>
        </div>
        <div className="sales3-process-list">
          {steps.map(([number, title, text]) => (
            <article key={number} data-sales-reveal>
              <span>{number}</span><h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
