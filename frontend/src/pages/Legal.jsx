export function Privacy() {
  return <section className="page-hero"><div className="container-shell" style={{ maxWidth: 900 }}><div className="eyebrow">Юридична інформація</div><h1 className="display-md" style={{ margin: '20px 0' }}>Політика конфіденційності</h1><div className="rich-text"><p>Цей сайт збирає лише дані, які користувач добровільно залишає у формі зв’язку: ім’я, контакт і текст повідомлення.</p><p>Дані використовуються виключно для відповіді на звернення, уточнення деталей проєкту та подальшої комунікації. Вони не продаються та не передаються рекламним компаніям.</p><p>У локальній версії дані зберігаються у базі SQLite. Перед публічним запуском політику потрібно адаптувати під фактичний хостинг, аналітичні сервіси та законодавчі вимоги.</p></div></div></section>
}

export function Terms() {
  return <section className="page-hero"><div className="container-shell" style={{ maxWidth: 900 }}><div className="eyebrow">Юридична інформація</div><h1 className="display-md" style={{ margin: '20px 0' }}>Умови використання</h1><div className="rich-text"><p>Інформація про строки та вартість на сайті має орієнтовний характер. Остаточний обсяг робіт, ціна, етапи, порядок оплати та підтримка погоджуються окремо для кожного проєкту.</p><p>Матеріали портфоліо демонструють виконані або власні проєкти. Непідтверджені показники повинні бути позначені як орієнтири й не вважаються гарантованими результатами.</p><p>Перед публічним запуском цей текст варто перевірити та доповнити відповідно до фактичної моделі співпраці.</p></div></div></section>
}

export function NotFound() {
  return <section className="page-hero"><div className="container-shell"><div className="eyebrow">404</div><h1 className="display-lg" style={{ margin: '20px 0' }}>Такої сторінки немає.</h1><a className="btn btn-dark" href="/">Повернутися на головну</a></div></section>
}
