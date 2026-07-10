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
import { useLanguage } from '../i18n/LanguageContext'
import { localizeProject } from '../i18n/localizedData'
import '../styles/secondary-base.css'
import '../styles/projects.css'
import '../styles/secondary-responsive.css'

const copy = {
  uk: {
    allWorks: 'Усі роботи', commercialCase: 'Комерційний кейс', launchedProduct: 'Запущений продукт',
    kindergarten: 'Приватний дитячий садок · Рівне', openSite: 'Відкрити сайт', viewCase: 'Дивитися кейс',
    ownership: 'одна відповідальність за весь продукт', taskLabel: '01 · Задача',
    taskTitle: 'Замість розрізнених повідомлень — єдина цифрова точка контакту.', before: 'Було',
    beforeTitle: 'Заклад без власного сильного онлайн-представництва.', after: 'Стало',
    afterTitle: 'Сайт, який презентує садочок і приймає звернення 24/7.', productLabel: '02 · Продукт',
    productTitle: 'Дві частини, які працюють як одна система.',
    productText: 'Перемикайте вкладки у макеті: публічний сайт для батьків і захищена панель для команди закладу.',
    publicPlatform: 'Публічна платформа', clearParents: 'Зрозуміла для батьків.',
    publicText: 'Інформація про заклад, команду, групи, новини, відгуки та форма вступу з будь-якого пристрою.',
    customAdmin: 'Кастомна адмінпанель', easyTeam: 'Зручна для команди.',
    adminText: 'Керування заявками, контентом, працівниками та основними блоками сайту без редагування коду.',
    featuresLabel: '03 · Функціонал', featuresTitle: 'Не шаблонна сторінка, а повноцінний вебпродукт.',
    featuresText: 'Функції зібрані навколо реальних щоденних задач закладу та комунікації з батьками.',
    implementationLabel: '04 · Реалізація', implementationTitle: 'Від першої структури до запуску за два тижні.',
    technologyLabel: '05 · Технології', technologyTitle: 'Сучасний стек без зайвої складності.',
    technologyText: 'Технічні рішення підібрані так, щоб продукт був керованим, швидким і готовим до подальшого розвитку.',
    secureAdmin: 'Безпечна адмінчастина', responsiveSpeed: 'Адаптивність і швидкість',
    similarProduct: 'Потрібен подібний продукт?',
    ctaTitle: 'Створимо сайт, який не просто виглядає сучасно, а реально полегшує роботу бізнесу.',
    discuss: 'Обговорити проєкт', inDevelopment: 'У розробці', taskSolution: 'Задача й рішення',
    problemToProduct: 'Від проблеми до робочого продукту.', problem: 'Проблема', solution: 'Рішення', result: 'Результат',
    functionality: 'Функціонал', implemented: 'Що реалізовано.', similarTask: 'Подібна задача',
    conceptCta: 'Забронюйте пілотне впровадження цієї технології для своєї компанії.',
    standardCta: 'Потрібен сайт або система з подібним рівнем опрацювання?',
    notFoundTitle: 'Проєкт не знайдено', notFoundDescription: 'Запитаний проєкт не знайдено.', notFoundHeading: 'Проєкт не знайдено.',
    backToWorks: 'До робіт', home: 'Головна', works: 'Роботи', creator: 'Ковтунович Дмитро Валерійович',
    steps: [
      ['01', 'Аналіз і структура', 'Зібрав потреби закладу, визначив ключові сторінки та сценарій подання заявки.'],
      ['02', 'Візуальна система', 'Створив теплий сучасний стиль, який однаково добре працює на телефоні й комп’ютері.'],
      ['03', 'Full-stack розробка', 'Реалізував публічну частину, backend, базу даних, форми та кастомну панель керування.'],
      ['04', 'Тестування й запуск', 'Перевірив адаптивність, основні сценарії та запустив продукт на робочому домені.'],
    ],
  },
  en: {
    allWorks: 'All projects', commercialCase: 'Commercial case study', launchedProduct: 'Launched product',
    kindergarten: 'Private kindergarten · Rivne', openSite: 'Open website', viewCase: 'View case study',
    ownership: 'one team responsible for the entire product', taskLabel: '01 · Challenge',
    taskTitle: 'From scattered messages to one clear digital point of contact.', before: 'Before',
    beforeTitle: 'A business without a strong digital presence of its own.', after: 'After',
    afterTitle: 'A website that presents the kindergarten and accepts inquiries 24/7.', productLabel: '02 · Product',
    productTitle: 'Two parts working as one connected system.',
    productText: 'Switch between the public website for parents and the protected management panel for the kindergarten team.',
    publicPlatform: 'Public platform', clearParents: 'Clear for parents.',
    publicText: 'Information about the kindergarten, team, groups, news, reviews, and an enrollment form on every device.',
    customAdmin: 'Custom admin panel', easyTeam: 'Convenient for the team.',
    adminText: 'Manage inquiries, content, staff, and key website sections without editing code.',
    featuresLabel: '03 · Features', featuresTitle: 'Not a template page, but a complete web product.',
    featuresText: 'Every feature is built around the kindergarten’s daily work and communication with parents.',
    implementationLabel: '04 · Delivery', implementationTitle: 'From the first structure to launch in two weeks.',
    technologyLabel: '05 · Technology', technologyTitle: 'A modern stack without unnecessary complexity.',
    technologyText: 'The technology was selected to keep the product manageable, fast, and ready for further growth.',
    secureAdmin: 'Secure admin area', responsiveSpeed: 'Responsive and fast',
    similarProduct: 'Need a similar product?',
    ctaTitle: 'Let’s build a website that looks modern and genuinely makes business operations easier.',
    discuss: 'Discuss your project', inDevelopment: 'In development', taskSolution: 'Challenge and solution',
    problemToProduct: 'From a business problem to a working product.', problem: 'Problem', solution: 'Solution', result: 'Result',
    functionality: 'Features', implemented: 'What was delivered.', similarTask: 'Have a similar challenge?',
    conceptCta: 'Reserve a pilot implementation of this technology for your company.',
    standardCta: 'Need a website or system with a similar level of detail?',
    notFoundTitle: 'Project not found', notFoundDescription: 'The requested project could not be found.', notFoundHeading: 'Project not found.',
    backToWorks: 'Back to projects', home: 'Home', works: 'Projects', creator: 'Dmytro Kovtunovych',
    steps: [
      ['01', 'Analysis and structure', 'I collected the kindergarten’s requirements and defined the key pages and application journey.'],
      ['02', 'Visual system', 'I created a warm modern visual language that works equally well on mobile and desktop.'],
      ['03', 'Full-stack development', 'I built the public website, backend, database, forms, and a custom management panel.'],
      ['04', 'Testing and launch', 'I tested responsive behavior and core scenarios, then launched the product on its live domain.'],
    ],
  },
}

function BabylandDetail({ project, c }) {
  const tech = project.technologies?.length ? project.technologies : ['Python', 'Django', 'React', 'Tailwind CSS']
  return (
    <div className="babyland-detail modern-page">
      <section className="babyland-detail-hero">
        <div className="container-shell">
          <Link to="/projects" className="detail-back"><ArrowLeft size={16} /> {c.allWorks}</Link>
          <div className="babyland-detail-heading">
            <div>
              <div className="modern-kicker"><span>{c.commercialCase}</span><i /> {c.launchedProduct}</div>
              <h1>BABY<br/><em>LAND</em></h1>
            </div>
            <div className="babyland-detail-intro">
              <span>{c.kindergarten}</span>
              <p>{project.summary}</p>
              <div>
                {project.live_url && <a className="modern-button is-primary" href={project.live_url} target="_blank" rel="noreferrer">{c.openSite} <ArrowUpRight size={18} /></a>}
                <a className="modern-button is-secondary" href="#case-story">{c.viewCase} <ArrowRight size={18} /></a>
              </div>
            </div>
          </div>
          <div className="babyland-detail-stage"><ProjectMedia project={project} /></div>
          <div className="babyland-detail-metrics">
            {(project.metrics || []).map((metric) => <article key={`${metric.value}-${metric.label}`}><strong>{metric.value}</strong><span>{metric.label}</span></article>)}
            <article><strong>Full-stack</strong><span>{c.ownership}</span></article>
          </div>
        </div>
      </section>

      <section className="modern-section babyland-story" id="case-story">
        <div className="container-shell babyland-story-grid">
          <div className="babyland-story-title"><span>{c.taskLabel}</span><h2>{c.taskTitle}</h2></div>
          <div className="babyland-story-copy">
            <article><small>{c.before}</small><h3>{c.beforeTitle}</h3><p>{project.challenge}</p></article>
            <article className="is-green"><small>{c.after}</small><h3>{c.afterTitle}</h3><p>{project.result_text}</p></article>
          </div>
        </div>
      </section>

      <section className="modern-section babyland-system-section">
        <div className="container-shell">
          <div className="modern-section-heading">
            <div><span>{c.productLabel}</span><h2>{c.productTitle}</h2></div>
            <p>{c.productText}</p>
          </div>
          <div className="babyland-system-showcase"><ProjectMedia project={project} /></div>
          <div className="babyland-system-cards">
            <article><i><MonitorSmartphone size={24} /></i><span>{c.publicPlatform}</span><h3>{c.clearParents}</h3><p>{c.publicText}</p></article>
            <article><i><LayoutDashboard size={24} /></i><span>{c.customAdmin}</span><h3>{c.easyTeam}</h3><p>{c.adminText}</p></article>
          </div>
        </div>
      </section>

      <section className="modern-section babyland-features-section">
        <div className="container-shell babyland-feature-layout">
          <div className="babyland-feature-sticky"><span>{c.featuresLabel}</span><h2>{c.featuresTitle}</h2><p>{c.featuresText}</p></div>
          <div className="babyland-feature-grid">
            {(project.features || []).map((feature, index) => <article key={feature}><span>0{index + 1}</span><Check size={19} /><h3>{feature}</h3></article>)}
          </div>
        </div>
      </section>

      <section className="modern-section babyland-process-section">
        <div className="container-shell">
          <div className="modern-section-heading compact-heading"><div><span>{c.implementationLabel}</span><h2>{c.implementationTitle}</h2></div></div>
          <div className="babyland-process-list">
            {c.steps.map(([number, title, text]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div><i /></article>)}
          </div>
        </div>
      </section>

      <section className="modern-section babyland-tech-section">
        <div className="container-shell babyland-tech-grid">
          <div><span>{c.technologyLabel}</span><h2>{c.technologyTitle}</h2><p>{c.technologyText}</p></div>
          <div className="babyland-tech-list">
            {tech.map((item, index) => {
              const Icon = [Code2, Database, MonitorSmartphone, Sparkles][index % 4]
              return <article key={item}><Icon size={21} /><strong>{item}</strong><span>0{index + 1}</span></article>
            })}
            <article><ShieldCheck size={21} /><strong>{c.secureAdmin}</strong><span>05</span></article>
            <article><Gauge size={21} /><strong>{c.responsiveSpeed}</strong><span>06</span></article>
          </div>
        </div>
      </section>

      <section className="modern-section modern-cta-wrap">
        <div className="container-shell"><div className="modern-cta"><span>{c.similarProduct}</span><h2>{c.ctaTitle}</h2><Link className="modern-button is-lime" to="/contact">{c.discuss} <ArrowRight size={18} /></Link></div></div>
      </section>
    </div>
  )
}

function DefaultProjectDetail({ project, c }) {
  return (
    <div className="modern-page default-project-detail">
      <section className="modern-hero">
        <div className="container-shell">
          <Link to="/projects" className="detail-back"><ArrowLeft size={16} /> {c.allWorks}</Link>
          <div className="project-badges detail-badges"><span>{project.category}</span>{project.status === 'concept' && <span>{c.inDevelopment}</span>}</div>
          <h1>{project.title}</h1>
          <p>{project.summary}</p>
          {project.live_url && <a className="modern-button is-primary" href={project.live_url} target="_blank" rel="noreferrer">{c.openSite} <ArrowUpRight size={18} /></a>}
        </div>
      </section>
      <section><div className="container-shell"><div className="default-project-cover"><ProjectMedia project={project} /></div><div className="babyland-detail-metrics">{(project.metrics || []).map((metric) => <article key={`${metric.value}-${metric.label}`}><strong>{metric.value}</strong><span>{metric.label}</span></article>)}</div></div></section>
      <section className="modern-section"><div className="container-shell default-project-story"><div><span>{c.taskSolution}</span><h2>{c.problemToProduct}</h2></div><div><h3>{c.problem}</h3><p>{project.challenge}</p><h3>{c.solution}</h3><p>{project.solution}</p><h3>{c.result}</h3><p>{project.result_text}</p></div></div></section>
      <section className="modern-section"><div className="container-shell default-feature-layout"><div><span>{c.functionality}</span><h2>{c.implemented}</h2></div><div>{(project.features || []).map((feature) => <span key={feature}><CheckCircle2 size={16} /> {feature}</span>)}</div></div></section>
      <section className="modern-section modern-cta-wrap"><div className="container-shell"><div className="modern-cta"><span>{c.similarTask}</span><h2>{project.status === 'concept' ? c.conceptCta : c.standardCta}</h2><Link className="modern-button is-lime" to="/contact">{c.discuss} <ArrowRight size={18} /></Link></div></div></section>
    </div>
  )
}

export default function ProjectDetail() {
  const { slug } = useParams()
  const { language } = useLanguage()
  const c = copy[language]
  const initial = fallbackProjects.find((item) => item.slug === slug)
  const [rawProject, setRawProject] = useState(initial)

  useEffect(() => {
    api.get(`/projects/${slug}/`).then((response) => setRawProject(unwrap(response))).catch(() => {})
  }, [slug])

  const project = localizeProject(rawProject, language)

  if (!project) return <><SEO title={c.notFoundTitle} description={c.notFoundDescription} path={`/projects/${slug}`} noindex /><section className="page-hero"><div className="container-shell"><h1 className="display-md">{c.notFoundHeading}</h1><Link className="btn btn-dark" to="/projects">{c.backToWorks}</Link></div></section></>

  const image = project.slug === 'baby-land' ? '/assets/baby-land-og.png' : (project.uploaded_cover_url || project.cover_image_url || '/assets/og-image.png')
  const schemas = [
    breadcrumbSchema([{ name: c.home, path: '/' }, { name: c.works, path: '/projects' }, { name: project.title, path: `/projects/${project.slug}` }]),
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: project.title,
      description: project.summary,
      image,
      creator: { '@type': 'Person', name: c.creator },
      about: project.category,
      url: project.live_url || undefined,
      keywords: (project.technologies || []).join(', '),
    },
  ]
  const content = project.slug === 'baby-land' || project.title === 'BABY LAND'
    ? <BabylandDetail project={project} c={c} />
    : <DefaultProjectDetail project={project} c={c} />
  return <><SEO title={project.title} description={project.summary} path={`/projects/${project.slug}`} image={image} schema={schemas} />{content}</>
}
