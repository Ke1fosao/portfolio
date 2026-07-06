import { ArrowUpRight, Mail, Send } from 'lucide-react'

export default function HomeFinalCta({ settings, telegram }) {
  return (
    <section className="s7-final">
      <div className="s7-shell">
        <div className="s7-final-card" data-s7-reveal>
          <div><span>Є задача або лише ідея?</span><h2>Опишіть її кількома реченнями — я запропоную зрозумілий наступний крок.</h2><p>Напишіть, який у вас бізнес і що потрібно покращити. Без довгого брифу на старті.</p></div>
          <div><a className="s7-final-telegram" href={telegram} target="_blank" rel="noreferrer"><span><i><Send size={22} /></i><b>Написати в Telegram</b><small>Найшвидший спосіб зв’язку</small></span><ArrowUpRight size={23} /></a><a className="s7-final-mail" href={`mailto:${settings.email}`}><Mail size={19} /><span>{settings.email}</span></a><small>Зазвичай відповідаю щодня з 10:00 до 22:00</small></div>
        </div>
      </div>
    </section>
  )
}
