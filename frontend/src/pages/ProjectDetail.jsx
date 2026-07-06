import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Code2,
  Database,
  Gauge,
  LayoutDashboard,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import api, { unwrap } from '../lib/api'
import { fallbackProjects } from '../data/fallbackData'
import ProjectMedia from '../components/ProjectMedia'
import SEO, { breadcrumbSchema } from '../components/SEO'
import '../styles/secondary-base.css'
import '../styles/projects.css'
import '../styles/secondary-responsive.css'

const babylandSteps = [
  ['01', 'Аналіз і структура', 'Зібрав потреби закладу, визначив ключові сторінки та сценарій подання заявки.'],
  ['02', 'Візуальна система', 'Створив теплий сучасний стиль, який однаково добре працює на телефоні й комп’ютері.'],
  ['03', 'Full-stack розробка', 'Реалізував публічну частину, backend, базу даних, форми та кастомну панель керування.'],
  ['04', 'Тестування й запуск', 'Перевірив адаптивність, основні сценарії та запустив продукт на робочому домені.'],
]

function BabylandDetail({ project }) {
  const tech = project.technologies?.length ? project.technologies : ['Python', 'Django', 'React', 'Tailwind CSS']
  return (
    <div className="babyland-detail modern-page">
      <section className="babyland-detail-hero">
        <div className="container-shell">
          <Link to="/projects" className="detail-back"><ArrowLeft size={16} /> Усі роботи</Link>
          <div className="babyland-detail-heading">
            <div>
              <div className="modern-kicker"><span>Комерційний кейс</span><i /> Запущений продукт</div>
              <h1>BABY<br/><em>LAND</em></h1>
            </div>
            <div className="babyland-detail-intro">
              <span>Приватний дитячий садок · Рівне</span>
              <p>{project.summary}</p>
              <div>
                {project.live_url && <a className="modern-button is-primary" href={project.live_url} target="_blank" rel="noreferrer">Відкрити сайт <ArrowUpRight size={18} /></a>}
                <a className="modern-button is-secondary" href="#case-story">Дивитися кейс <ArrowRight size={18} /></a>
              </div>
            </div>
          </div>
          <div className="babyland-detail-stage"><ProjectMedia project={project} /></div>
          <div className="babyland-detail-metrics">
            {(project.metrics || []).map((metric) => <article key={`${metric.value}-${metric.label}`}><strong>{metric.value}</strong><span>{metric.label}</span></article>)}
            <article><strong>Full-stack</strong><span>одна відповідальність за весь продукт</span></article>
          </div>
        </div>
      </section>

      <section className="modern-section babyland-story" id="case-story">
        <div className="container-shell babyland-story-grid">
          <div className="babyland-story-title"><span>01 · Задача</span><h2>Замість розрізнених повідомлень — єдина цифрова точка контакту.</h2></div>
          <div className="babyland-story-copy">
            <article><small>Було</small><h3>Заклад без власного сильного онлайн-представництва.</h3><p>{project.challenge}</p></article>
            <article className="is-green"><small>Стало</small><h3>Сайт, який презентує садочок і приймає звернення 24/7.</h3><p>{project.result_text}</p></article>
          </div>
        </div>
      </section>

      <section className="modern-section babyland-system-section">
        <div className="container-shell">
          <div className="modern-section-heading">
            <div><span>02 · Продукт</span><h2>Дві частини, які працюють як одна система.</h2></div>
            <p>Перемикайте вкладки у макеті: публічний сайт для батьків і захищена панель для команди закладу.</p>
          </div>
          <div className="babyland-system-showcase"><ProjectMedia project={project} /></div>
          <div className="babyland-system-cards">
            <article><i><MonitorSmartphone size={24} /></i><span>Публічна платформа</span><h3>Зрозуміла для батьків.</h3><p>Інформація про заклад, команду, групи, новини, відгуки та форма вступу з будь-якого пристрою.</p></article>
            <article><i><LayoutDashboard size={24} /></i><span>Кастомна адмінпанель</span><h3>Зручна для команди.</h3><p>Керування заявками, контентом, працівниками та основними блоками сайту без редагування коду.</p></article>
          </div>
        </div>
      </section>

      <section className="modern-section babyland-features-section">
        <div className="container-shell babyland-feature-layout">
          <div className="babyland-feature-sticky"><span>03 · Функціонал</span><h2>Не шаблонна сторінка, а повноцінний вебпродукт.</h2><p>Функції зібрані навколо реальних щоденних задач закладу та комунікації з батьками.</p></div>
          <div className="babyland-feature-grid">
            {(project.features || []).map((feature, index) => <article key={feature}><span>0{index + 1}</span><Check size={19} /><h3>{feature}</h3></article>)}
          </div>
        </div>
      </section>

      <section className="modern-section babyland-process-section">
        <div className="container-shell">
          <div className="modern-section-heading compact-heading"><div><span>04 · Реалізація</span><h2>Від першої структури до запуску за два тижні.</h2></div></div>
          <div className="babyland-process-list">
            {babylandSteps.map(([number, title, text]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div><i /></article>)}
          </div>
        </div>
      </section>

      <section className="modern-section babyland-tech-section">
        <div className="container-shell babyland-tech-grid">
          <div><span>05 · Технології</span><h2>Сучасний стек без зайвої складності.</h2><p>Технічні рішення підібрані так, щоб продукт був керованим, швидким і готовим до подальшого розвитку.</p></div>
          <div className="babyland-tech-list">
            {tech.map((item, index) => {
              const Icon = [Code2, Database, MonitorSmartphone, Sparkles][index % 4]
              return <article key={item}><Icon size={21} /><strong>{item}</strong><span>0{index + 1}</span></article>
            })}
            <article><ShieldCheck size={21} /><strong>Безпечна адмінчастина</strong><span>05</span></article>
            <article><Gauge size={21} /><strong>Адаптивність і швидкість</strong><span>06</span></article>
          </div>
        </div>
      </section>

      <section className="modern-section modern-cta-wrap">
        <div className="container-shell"><div className="modern-cta"><span>Потрібен подібний продукт?</span><h2>Створимо сайт, який не просто виглядає сучасно, а реально полегшує роботу бізнесу.</h2><Link className="modern-button is-lime" to="/contact">Обговорити проєкт <ArrowRight size={18} /></Link></div></div>
      </section>
    </div>
  )
}

function DefaultProjectDetail({ project }) {
  return (
    <div className="modern-page default-project-detail">
      <section className="modern-hero">
        <div className="container-shell">
          <Link to="/projects" className="detail-back"><ArrowLeft size={16} /> Усі роботи</Link>
          <div className="project-badges detail-badges"><span>{project.category}</span>{project.status === 'concept' && <span>У розробці</span>}</div>
          <h1>{project.title}</h1>
          <p>{project.summary}</p>
          {project.live_url && <a className="modern-button is-primary" href={project.live_url} target="_blank" rel="noreferrer">Відкрити сайт <ArrowUpRight size={18} /></a>}
        </div>
      </section>
      <section><div className="container-shell"><div className="default-project-cover"><ProjectMedia project={project} /></div><div className="babyland-detail-metrics">{(project.metrics || []).map((metric) => <article key={`${metric.value}-${metric.label}`}><strong>{metric.value}</strong><span>{metric.label}</span></article>)}</div></div></section>
      <section className="modern-section"><div className="container-shell default-project-story"><div><span>Задача й рішення</span><h2>Від проблеми до робочого продукту.</h2></div><div><h3>Проблема</h3><p>{project.challenge}</p><h3>Рішення</h3><p>{project.solution}</p><h3>Результат</h3><p>{project.result_text}</p></div></div></section>
      <section className="modern-section"><div className="container-shell default-feature-layout"><div><span>Функціонал</span><h2>Що реалізовано.</h2></div><div>{(project.features || []).map((feature) => <span key={feature}><CheckCircle2 size={16} /> {feature}</span>)}</div></div></section>
      <section className="modern-section modern-cta-wrap"><div className="container-shell"><div className="modern-cta"><span>Подібна задача</span><h2>{project.status === 'concept' ? 'Забронюйте пілотне впровадження цієї технології для своєї компанії.' : 'Потрібен сайт або система з подібним рівнем опрацювання?'}</h2><Link className="modern-button is-lime" to="/contact">Обговорити проєкт <ArrowRight size={18} /></Link></div></div></section>
    </div>
  )
}

export default function ProjectDetail() {
  const { slug } = useParams()
  const initial = fallbackProjects.find((project) => project.slug === slug)
  const [project, setProject] = useState(initial)

  useEffect(() => {
    api.get(`/projects/${slug}/`).then((response) => setProject(unwrap(response))).catch(() => {})
  }, [slug])

  if (!project) return <><SEO title="Проєкт не знайдено" description="Запитаний проєкт не знайдено." path={`/projects/${slug}`} noindex /><section className="page-hero"><div className="container-shell"><h1 className="display-md">Проєкт не знайдено.</h1><Link className="btn btn-dark" to="/projects">До робіт</Link></div></section></>

  const image = project.slug === 'baby-land' ? '/assets/baby-land-og.png' : (project.uploaded_cover_url || project.cover_image_url || '/assets/og-image.png')
  const schemas = [
    breadcrumbSchema([{ name: 'Головна', path: '/' }, { name: 'Роботи', path: '/projects' }, { name: project.title, path: `/projects/${project.slug}` }]),
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: project.title,
      description: project.summary,
      image,
      creator: { '@type': 'Person', name: 'Ковтунович Дмитро Валерійович' },
      about: project.category,
      url: project.live_url || undefined,
      keywords: (project.technologies || []).join(', '),
    },
  ]
  const content = project.slug === 'baby-land' || project.title === 'BABY LAND' ? <BabylandDetail project={project} /> : <DefaultProjectDetail project={project} />
  return <><SEO title={project.title} description={project.summary} path={`/projects/${project.slug}`} image={image} schema={schemas} />{content}</>
}
