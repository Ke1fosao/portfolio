import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, CheckCircle2, Code2, Lightbulb, Rocket, Route } from 'lucide-react'

const steps = [
  { number: '01', icon: Lightbulb, title: 'Розбираємо задачу', text: 'Визначаємо, хто ваш клієнт, яку дію він має зробити та що зараз заважає бізнесу.', output: ['Ціль', 'Аудиторія', 'Пріоритети'] },
  { number: '02', icon: Route, title: 'Проєктую сценарій', text: 'Створюю структуру сторінок, прототип, логіку заявок і майбутньої адмінпанелі.', output: ['Структура', 'Прототип', 'Сценарії'] },
  { number: '03', icon: Code2, title: 'Розробляю продукт', text: 'Збираю інтерфейс, backend, базу даних, інтеграції та показую проміжні версії.', output: ['Frontend', 'Backend', 'Демоверсії'] },
  { number: '04', icon: Rocket, title: 'Запускаю й підтримую', text: 'Тестую, підключаю домен та аналітику, навчаю користуватися системою й залишаюся на зв’язку.', output: ['Запуск', 'Навчання', 'Підтримка'] },
]

export default function HomeProcess({ telegram }) {
  const [active, setActive] = useState(0)
  const refs = useRef([])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(Number(entry.target.dataset.step || 0))
      })
    }, { threshold: 0.58, rootMargin: '-18% 0px -30% 0px' })
    refs.current.forEach((item) => item && observer.observe(item))
    return () => observer.disconnect()
  }, [])

  const current = steps[active]
  const Icon = current.icon

  return (
    <section className="s7-process" id="process">
      <div className="s7-shell s7-process-layout">
        <aside className="s7-process-sticky" data-s7-reveal>
          <span className="s7-index">04 / Як проходить робота</span>
          <h2>Ви завжди розумієте, що вже зроблено й що відбувається далі.</h2>
          <p>Проєкт рухається короткими зрозумілими етапами. На кожному є результат, який можна побачити й погодити.</p>
          <div className="s7-process-preview" key={current.number}>
            <header><span><Icon size={23} /></span><small>Активний етап {current.number}</small></header>
            <strong>{current.title}</strong><p>{current.text}</p>
            <div>{current.output.map((item) => <span key={item}><CheckCircle2 size={17} />{item}</span>)}</div>
            <footer><i style={{ width: `${(active + 1) * 25}%` }} /><small>{active + 1} з 4</small></footer>
          </div>
          <a className="s7-btn s7-btn-light" href={telegram} target="_blank" rel="noreferrer"><span>Обговорити задачу</span><ArrowUpRight size={18} /></a>
        </aside>

        <div className="s7-process-steps">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            return (
              <article key={step.number} ref={(node) => { refs.current[index] = node }} data-step={index} className={active === index ? 'is-active' : ''}>
                <header><span>{step.number}</span><StepIcon size={25} /></header>
                <small>Етап {index + 1}</small><h3>{step.title}</h3><p>{step.text}</p>
                <div>{step.output.map((item) => <span key={item}>{item}</span>)}</div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
