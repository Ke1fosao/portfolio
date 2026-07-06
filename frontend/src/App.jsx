import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Analytics from './components/Analytics'

const Home = lazy(() => import('./pages/Home'))
const Projects = lazy(() => import('./pages/Projects'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const Services = lazy(() => import('./pages/Services'))
const About = lazy(() => import('./pages/About'))
const Pricing = lazy(() => import('./pages/Pricing'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogDetail = lazy(() => import('./pages/BlogDetail'))
const Contact = lazy(() => import('./pages/Contact'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const WorkTerms = lazy(() => import('./pages/WorkTerms'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageLoader() {
  return <div className="page-loader" role="status" aria-label="Завантаження сторінки"><i /><span>Завантаження</span></div>
}

function PublicRoutes() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/projects" element={<Projects/>}/>
          <Route path="/projects/:slug" element={<ProjectDetail/>}/>
          <Route path="/services" element={<Services/>}/>
          <Route path="/about" element={<About/>}/>
          <Route path="/pricing" element={<Pricing/>}/>
          <Route path="/blog" element={<Blog/>}/>
          <Route path="/blog/:slug" element={<BlogDetail/>}/>
          <Route path="/contact" element={<Contact/>}/>
          <Route path="/privacy" element={<Privacy/>}/>
          <Route path="/terms" element={<Terms/>}/>
          <Route path="/work-terms" element={<WorkTerms/>}/>
          <Route path="*" element={<NotFound/>}/>
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default function App() {
  const location = useLocation()
  if (location.pathname === '/admin/login') return <><Analytics/><Suspense fallback={<PageLoader />}><AdminLogin /></Suspense></>
  if (location.pathname.startsWith('/admin')) return <><Analytics/><Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense></>
  return <><Analytics/><PublicRoutes /></>
}
