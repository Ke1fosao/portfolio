import {
  fallbackAboutPage,
  fallbackFaqs,
  fallbackPosts,
  fallbackPricing,
  fallbackProjects,
  fallbackServices,
  fallbackSettings,
} from '../data/fallbackData'

export const englishSettings = {
  ...fallbackSettings,
  full_name: 'Dmytro Kovtunovych',
  city: 'Rivne, Ukraine',
  availability: 'Available for new projects',
  hero_title: 'I build digital products that automate business processes and help attract more customers.',
  hero_subtitle: 'I design and develop modern websites, web systems, and AI integrations — from concept and design to launch, admin tools, and ongoing support.',
  about_short: 'Independent full-stack developer from Rivne. I combine strong design, thoughtful business logic, and AI-powered automation.',
  about_full: 'I am Dmytro Kovtunovych, a full-stack developer from Rivne. For four years I have been studying software development and building web products where design works together with logic. My core stack is Python, Django, React, and Tailwind CSS. I handle the entire process independently: analysis, structure, interface, backend, admin panel, integrations, and launch.',
  working_hours: 'Daily, 10:00–22:00',
}

export const englishServices = [
  { ...fallbackServices[0], title: 'Business websites', summary: 'A presentation website, landing page, or multi-page corporate website.', description: 'A fast responsive website with a clear structure, forms, SEO setup, and an admin panel.', duration: 'from 7–14 days', complexity: 'Standard', features: ['Brand-focused design', 'Responsive layout', 'Lead forms', 'Admin panel', 'Basic SEO'] },
  { ...fallbackServices[1], title: 'AI automation', summary: 'AI integration into a website, admin panel, or business workflow.', description: 'AI assistants, content generation and moderation, lead processing, and internal tools.', duration: 'from 2–4 weeks', complexity: 'Advanced', features: ['AI chatbot', 'Content generation', 'Moderation', 'Automation', 'Telegram'] },
  { ...fallbackServices[2], title: 'Web systems and dashboards', summary: 'CRM systems, client portals, internal services, and custom dashboards.', description: 'Systems with roles, authentication, databases, analytics, and complex business logic.', duration: 'from 3–8 weeks', complexity: 'High', features: ['Roles', 'Analytics', 'Dashboards', 'Custom admin', 'API'] },
  { ...fallbackServices[3], title: 'Online stores', summary: 'Catalog, cart, payments, orders, and product management.', description: 'A more complex product involving payments, security, inventory, orders, and testing.', duration: 'from 4–10 weeks', complexity: 'High', features: ['Catalog', 'Cart', 'Payments', 'Orders', 'Admin panel'] },
]

export const englishProjects = [
  {
    ...fallbackProjects[0], category: 'Websites', client: 'Private kindergarten in Rivne',
    summary: 'A complete website with enrollment requests, content, reviews, team profiles, and a management system.',
    challenge: 'The kindergarten had no dedicated website or single place for applications, content, and team presentation.',
    solution: 'In two weeks I created the design, frontend, backend, database, forms, and a custom admin panel.',
    result_text: 'The website now works as a 24/7 digital platform for parents and the kindergarten team.', duration: '2 weeks',
    features: ['Online application', 'Admin panel', 'News', 'Photo gallery', 'AI moderation', 'AI chatbot in development'],
    metrics: [{ value: '2 weeks', label: 'from idea to launch', verified: true }, { value: '90+', label: 'quality score', verified: true }, { value: '24/7', label: 'application intake', verified: true }],
  },
  {
    ...fallbackProjects[1], category: 'AI systems', client: 'Independent product development',
    summary: 'A management system for an AI sales assistant that works through Telegram, knows services and prices, and guides clients toward a lead.',
    challenge: 'Businesses lose inquiries because of slow responses and manual communication.',
    solution: 'Knowledge base, sales scenarios, conversation history, lead statuses, and local dashboard management.',
    result_text: 'Active development. A pilot implementation can be reserved for a specific company.', duration: 'Active development',
    features: ['Telegram', 'Knowledge base', 'Sales scenarios', 'History', 'Leads', 'Price settings'],
    metrics: [{ value: '24/7', label: 'initial communication', verified: true }, { value: '1 dashboard', label: 'for system management', verified: true }, { value: 'Pilot', label: 'early access', verified: true }],
  },
]

export const englishPricing = [
  { ...fallbackPricing[0], title: 'Starter', tagline: 'For a professional first online presence.', duration: '7–14 days', features: ['Up to 5 core sections', 'Responsive design', 'Contact form', 'Basic SEO'] },
  { ...fallbackPricing[1], title: 'Business', tagline: 'For a company that needs leads, content, and management tools.', duration: '2–4 weeks', features: ['Multi-page website', 'Custom admin panel', 'Forms and database', 'Analytics'] },
  { ...fallbackPricing[2], title: 'System / AI', tagline: 'For complex logic, dashboards, integrations, and AI.', duration: 'from 4 weeks', features: ['Architecture', 'Roles', 'API', 'AI features', 'Support'] },
]

export const englishFaqs = [
  { ...fallbackFaqs[0], question: 'How much does a website cost?', answer: 'A simple website usually starts at approximately UAH 5,000. The exact price depends on structure, functionality, and integrations.' },
  { ...fallbackFaqs[1], question: 'How long does development take?', answer: 'A small website can be launched in 1–2 weeks. Complex systems and online stores require more time.' },
  { ...fallbackFaqs[2], question: 'Will I be able to update the content myself?', answer: 'Yes. A custom admin panel can be included for this purpose.' },
  { ...fallbackFaqs[3], question: 'Do you provide support after launch?', answer: 'Yes. I maintain the website, add features, and gradually introduce AI automation.' },
]

export const englishPosts = [
  {
    ...fallbackPosts[0], title: 'How a website can reduce manual work for a small business', category: 'Automation',
    excerpt: 'Five processes worth automating first: inquiries, replies, bookings, content, and internal statuses.',
    content: `A website is more than a page with information. A well-designed product can automatically collect inquiries, book clients, answer common questions, create tasks for the team, and keep the full history in one place.

## Start with the process that takes the most time

You do not need to automate everything at once. First, find a repetitive action: manually copying leads, sending the same replies, or constantly checking available time slots.

## Leads should enter a system

A form should do more than send an email. It is more useful when an inquiry is saved in a database, receives a status and an owner, and creates a reminder for the next contact.

## Automation does not replace service

Its purpose is to remove routine work so a person can respond faster and with better quality. The best result comes from combining automated scenarios with human control.

## What to add next

Once lead collection is stable, you can add Telegram notifications, draft generation, source analytics, and a client portal.`,
  },
  {
    ...fallbackPosts[1], title: 'A simple website or a complete system: what does a business actually need?', category: 'Web development',
    excerpt: 'A simple way to choose the right project scale without paying for features nobody will use.',
    content: `The most expensive early mistake is choosing a website format only because a competitor uses it. First, define what action a visitor should take and what happens after the inquiry.

## When a simple website is enough

If there are only a few services, the content changes rarely, and the main goal is to build trust and receive a contact, a compact website may be enough.

## When a web system is needed

Client portals, roles, complex statuses, catalogs, payments, and internal analytics require a backend, a database, and thoughtful architecture.

## How to avoid overloading the first release

Split functionality into what is required for launch and what can be added after demand is validated. This helps the business receive value sooner and avoid spending money on assumptions.`,
  },
  {
    ...fallbackPosts[2], title: 'AI sales assistants for business: real value versus a polished demo', category: 'AI',
    excerpt: 'Which tasks should be delegated to AI, where human control is required, and how to test value before a complex integration.',
    content: `An AI sales assistant is useful not because it can maintain a conversation, but because it knows services, prices, restrictions, and passes structured information to the real team.

## A strong scenario starts with a knowledge base

Without current information, AI may answer confidently but incorrectly. Services, rules, common objections, and permission limits should therefore be editable in a management panel.

## What can be automated safely

Initial qualification, answers to common questions, contact collection, service selection, and a short summary for the manager.

## Where a person is required

Final pricing agreements, unusual guarantees, legally significant decisions, and conflict situations should be passed to a responsible team member.

## Start with a pilot

A small Telegram or website scenario lets you evaluate lead quality and actual time savings before a large implementation.`,
  },
]

export const englishAboutPage = {
  ...fallbackAboutPage,
  hero_kicker: 'My story · Full-stack developer',
  hero_title: 'Four years ago it was only a goal. Today I build products for real businesses.',
  hero_text: 'I am Dmytro, 18 years old. I independently build modern websites, web systems, and AI integrations — from the first idea to launch and further growth.',
  hero_photo_alt: 'Portrait of Dmytro Kovtunovych',
  story_title: 'I did not become a developer overnight. I became one step by step.',
  story_text: 'My path started with the goal of becoming a programmer and a few small applications. Four years of study turned separate skills into the ability to build complete digital products.',
  story_support_text: 'My main principle is simple: a product should not only look good, but solve a specific task — generate leads, structure data, save time, or automate routine work.',
  journey_heading: 'From the first line of code to a product used by a real business.',
  journey_intro: 'Not a perfect straight line, but a sequence of difficult tasks, mistakes, decisions, and visible progress.',
  journey: [
    { index: '01', label: 'The goal', title: 'At first there was only the desire to create.', text: 'I entered college with a simple but serious goal — to become a software developer.', meta: 'First code · first interfaces · first difficult tasks' },
    { index: '02', label: 'Four years of study', title: 'From separate technologies to complete products.', text: 'Over four years I progressed from basic layouts and algorithms to frontend, backend, databases, APIs, and administration.', meta: 'Python · Django · React · databases · Git' },
    { index: '03', label: 'Graduation project', title: 'My studies ended with an excellent final defense.', text: 'The graduation project tested task analysis, architecture, design, programming, and presentation of the final result.', meta: 'Rivne Professional College of NULES of Ukraine' },
    { index: '04', label: 'First product', title: 'BABY LAND is no longer a study project, but a launched business website.', text: 'In two weeks I independently built a complete website for a private kindergarten.', meta: '2 weeks · 90+ quality score · babyland.com.ua' },
    { index: '05', label: 'Next level', title: 'Now I combine web development with AI automation.', text: 'I integrate AI into management panels and develop an AI sales assistant for client communication.', meta: 'AI · automation · Telegram · internal systems' },
  ],
  stats: [
    { value: '18', label: 'years old and already building full-cycle products' },
    { value: '4', label: 'years of study and practice' },
    { value: '2 weeks', label: 'from idea to BABY LAND launch' },
    { value: '90+', label: 'quality score of the launched website' },
  ],
  babyland_title: 'Graduation completed my studies. BABY LAND started my professional work.',
  babyland_text: 'I designed and implemented the entire system myself: interface, backend, database, forms, news, team, reviews, and a custom admin panel.',
  project_facts: [{ value: '02', label: 'weeks to launch' }, { value: '24/7', label: 'online application intake' }, { value: 'AI', label: 'tools inside the admin panel' }],
  ai_title: 'I am not stopping at standard web development.',
  ai_text: 'The next goal is systems that do not simply display information, but perform part of the business work themselves.',
  ai_items: [
    { title: 'Content', text: 'Draft news generation and assistance for administrators.', icon: 'content' },
    { title: 'Moderation', text: 'Content checks before publication.', icon: 'moderation' },
    { title: 'AI sales assistant', text: 'Initial communication and sales support.', icon: 'manager' },
    { title: 'Analytics', text: 'Structuring leads and next actions.', icon: 'analytics' },
    { title: 'Telegram', text: 'Integration with bots and notifications.', icon: 'telegram' },
  ],
  principles_title: 'Design attracts attention. A system preserves value.',
  principles: [
    { number: '01', title: 'I think in products', text: 'I start not with the color of a button, but with the goal and business value.', icon: 'layers' },
    { number: '02', title: 'I build the whole system', text: 'Frontend, backend, database, API, roles, forms, and the admin panel work together.', icon: 'code' },
    { number: '03', title: 'I use AI practically', text: 'I integrate AI where it genuinely saves time and reduces manual work.', icon: 'ai' },
  ],
  education_title: 'An excellent diploma is not the finish line, but proof of a strong foundation.',
  education_text: 'Four years of study gave me a foundation, while professional development continues every day.',
  college_name: 'Rivne Professional College of NULES of Ukraine',
  diploma_title: 'Defended with an excellent grade',
  diploma_description: 'The diploma file can be uploaded from the admin panel.',
  final_kicker: 'I am currently available for new projects',
  final_title: 'I am 18. I already build products. And this is only the beginning.',
  final_text: 'Need a modern website, a thoughtful web system, or process automation? Tell me about the task.',
}

const bySlug = (source, english) => Object.fromEntries(english.map((item) => [item.slug, item]))
const serviceMap = bySlug(fallbackServices, englishServices)
const projectMap = bySlug(fallbackProjects, englishProjects)
const postMap = bySlug(fallbackPosts, englishPosts)
const pricingMap = Object.fromEntries(englishPricing.map((item) => [item.id, item]))
const faqMap = Object.fromEntries(englishFaqs.map((item) => [item.id, item]))

export function localizeSettings(value, language) {
  if (language !== 'en') return value
  return { ...value, ...englishSettings, id: value?.id ?? englishSettings.id, email: value?.email || englishSettings.email, phone: value?.phone || englishSettings.phone, telegram: value?.telegram || englishSettings.telegram, socials: value?.socials, github: value?.github || englishSettings.github, linkedin: value?.linkedin || englishSettings.linkedin, instagram: value?.instagram || englishSettings.instagram, facebook: value?.facebook || englishSettings.facebook, logo_text: value?.logo_text || englishSettings.logo_text, currency_rates: value?.currency_rates || englishSettings.currency_rates }
}

export function localizeServices(items, language) {
  if (language !== 'en') return items
  return (items || []).map((item) => ({ ...item, ...(serviceMap[item.slug] || {}) }))
}

export function localizeProjects(items, language) {
  if (language !== 'en') return items
  return (items || []).map((item) => ({ ...item, ...(projectMap[item.slug] || {}) }))
}

export function localizeProject(item, language) {
  if (language !== 'en' || !item) return item
  return { ...item, ...(projectMap[item.slug] || {}) }
}

export function localizePricing(items, language) {
  if (language !== 'en') return items
  return (items || []).map((item) => ({ ...item, ...(pricingMap[item.id] || {}) }))
}

export function localizeFaqs(items, language) {
  if (language !== 'en') return items
  return (items || []).map((item) => ({ ...item, ...(faqMap[item.id] || {}) }))
}

export function localizePosts(items, language) {
  if (language !== 'en') return items
  return (items || []).map((item) => ({ ...item, ...(postMap[item.slug] || {}) }))
}

export function localizePost(item, language) {
  if (language !== 'en' || !item) return item
  return { ...item, ...(postMap[item.slug] || {}) }
}

export function localizeAbout(value, language) {
  if (language !== 'en') return value
  return { ...value, ...englishAboutPage, id: value?.id ?? englishAboutPage.id, hero_photo_url: value?.hero_photo_url || '', hero_photo_original_url: value?.hero_photo_original_url || '', hero_photo_crop: value?.hero_photo_crop || {}, diploma_file_url: value?.diploma_file_url || '', resume_file_url: value?.resume_file_url || '' }
}
