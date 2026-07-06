import {
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  FileText,
  LayoutDashboard,
  MessageCircleMore,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  UsersRound,
} from 'lucide-react'

function BrowserBar({ label }) {
  return <div className="svc6-browser-bar"><span/><span/><span/><b>{label}</b></div>
}

function WebsiteScreen() {
  return <div className="svc6-demo-window svc6-screen-website">
    <BrowserBar label="BUSINESS-WEBSITE.LOCAL" />
    <div className="svc6-website-nav"><b>YOUR BUSINESS</b><div><span>Послуги</span><span>Про нас</span><span>Контакти</span></div><button>Залишити заявку</button></div>
    <div className="svc6-website-hero">
      <div><small>САЙТ, ЯКИЙ ВЕДЕ ДО ДІЇ</small><h4>Клієнт розуміє вашу цінність за перші секунди.</h4><p>Сильна структура, довіра, зрозумілі послуги й один головний наступний крок.</p><button>Обговорити задачу <ChevronRight size={14}/></button></div>
      <div className="svc6-website-orbit"><i/><i/><i/><strong>+ заявка</strong><span>24/7</span></div>
    </div>
    <div className="svc6-website-mini"><article><Search/><span><b>Знайшли</b><small>через пошук або рекламу</small></span></article><article><MessageCircleMore/><span><b>Зрозуміли</b><small>що саме ви пропонуєте</small></span></article><article><Send/><span><b>Звернулися</b><small>через форму або Telegram</small></span></article></div>
  </div>
}

function AiScreen() {
  return <div className="svc6-demo-window svc6-screen-ai">
    <BrowserBar label="AI-MANAGER / LIVE DEMO" />
    <div className="svc6-ai-shell">
      <aside><b>AI</b><span className="is-active"><MessageCircleMore/> Діалоги</span><span><FileText/> База знань</span><span><UsersRound/> Ліди</span><span><Sparkles/> Сценарії</span></aside>
      <main>
        <header><div><small>AI-МЕНЕДЖЕР</small><b>Первинна консультація</b></div><em>ONLINE</em></header>
        <div className="svc6-ai-messages"><p className="is-client">Скільки коштує сайт із заявками?</p><p className="is-bot">Для першої версії можна почати з бізнес-сайту від 5 000 грн. Потрібна лише форма чи ще адмінпанель?</p><p className="is-client">Хочу сам змінювати послуги й ціни.</p><p className="is-bot">Тоді додамо панель керування. Я зафіксував задачу й можу передати її Дмитру для точного розрахунку.</p></div>
        <div className="svc6-ai-status"><Bot/><span><b>Лід кваліфіковано</b><small>Контакт і задача збережені в системі</small></span><Check/></div>
      </main>
    </div>
  </div>
}

function SystemScreen() {
  return <div className="svc6-demo-window svc6-screen-system">
    <BrowserBar label="COMPANY-OPERATING-SYSTEM" />
    <div className="svc6-system-shell">
      <aside><b>DK.</b><span className="is-active"><LayoutDashboard/> Огляд</span><span><UsersRound/> Клієнти</span><span><FileText/> Задачі</span><span><Bell/> Події</span></aside>
      <main><header><div><small>СИСТЕМА ПРАЦЮЄ</small><h4>Операційний центр</h4></div><button><CalendarDays/> Сьогодні</button></header>
        <div className="svc6-system-stats"><article><small>Нові заявки</small><strong>07</strong><em>+2 сьогодні</em></article><article><small>У роботі</small><strong>12</strong><em>4 пріоритетні</em></article><article><small>Автоматизовано</small><strong>64%</strong><em>повторюваних дій</em></article></div>
        <div className="svc6-system-board"><section><b>Нові</b><p><CircleUserRound/> Сайт для закладу <span>10:40</span></p><p><CircleUserRound/> AI для Telegram <span>11:15</span></p></section><section><b>У роботі</b><p><Check/> Прототип погоджено</p><p><Check/> Контент отримано</p></section></div>
      </main>
    </div>
  </div>
}

function ShopScreen() {
  return <div className="svc6-demo-window svc6-screen-shop">
    <BrowserBar label="ONLINE-STORE / CHECKOUT" />
    <div className="svc6-shop-nav"><b>STORE.</b><Search/><ShoppingBag/><span>2</span></div>
    <div className="svc6-shop-grid">
      <article className="is-main"><div className="svc6-product-art"><i/><i/><i/></div><small>НОВА КОЛЕКЦІЯ</small><h4>Товар, який хочеться роздивитися.</h4><p>Фото, варіанти, характеристики й зрозуміла покупка.</p></article>
      <article className="svc6-cart"><header><b>Ваше замовлення</b><span>2 товари</span></header><p><i/> Основний товар <b>1 490 ₴</b></p><p><i/> Додаткова опція <b>390 ₴</b></p><div><span>Разом</span><strong>1 880 ₴</strong></div><button>Перейти до оплати <ChevronRight size={14}/></button></article>
    </div>
  </div>
}

export default function ServiceVisual({ type }) {
  if (type === 'ai') return <AiScreen />
  if (type === 'system') return <SystemScreen />
  if (type === 'shop') return <ShopScreen />
  return <WebsiteScreen />
}
