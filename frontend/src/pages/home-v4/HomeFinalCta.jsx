import { ArrowUpRight, Mail, MessageCircle } from 'lucide-react'

export default function HomeFinalCta({ settings, telegram }) {
  return (
    <section className="sales3-final">
      <div className="sales3-shell sales3-final-inner" data-sales-reveal>
        <div>
          <span>Є задача або лише ідея?</span>
          <h2>Давайте перетворимо її на продукт, який буде корисним вашому бізнесу.</h2>
        </div>
        <div className="sales3-final-actions">
          <a className="sales3-contact-card sales3-contact-telegram" href={telegram} target="_blank" rel="noreferrer">
            <i><MessageCircle size={23} /></i>
            <span><small>Найшвидший спосіб зв’язку</small><strong>Написати в Telegram</strong></span>
            <ArrowUpRight size={20} />
          </a>
          <a className="sales3-contact-card sales3-contact-mail" href={`mailto:${settings.email}`}>
            <i><Mail size={23} /></i>
            <span><small>Для брифу та документів</small><strong>{settings.email}</strong></span>
            <ArrowUpRight size={20} />
          </a>
          <small className="sales3-final-note"><i /> Зазвичай відповідаю щодня з 10:00 до 22:00</small>
        </div>
      </div>
    </section>
  )
}
