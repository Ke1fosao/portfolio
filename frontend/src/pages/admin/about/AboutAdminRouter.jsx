import AboutOverviewAdmin from './AboutOverviewAdmin'
import AboutHeroAdmin from './AboutHeroAdmin'
import AboutStoryAdmin from './AboutStoryAdmin'
import AboutJourneyAdmin from './AboutJourneyAdmin'
import AboutProjectAdmin from './AboutProjectAdmin'
import AboutAIAdmin from './AboutAIAdmin'
import AboutEducationAdmin from './AboutEducationAdmin'
import AboutDocumentsAdmin from './AboutDocumentsAdmin'
import AboutFinalAdmin from './AboutFinalAdmin'

const pages = { overview: AboutOverviewAdmin, hero: AboutHeroAdmin, story: AboutStoryAdmin, journey: AboutJourneyAdmin, project: AboutProjectAdmin, ai: AboutAIAdmin, education: AboutEducationAdmin, documents: AboutDocumentsAdmin, final: AboutFinalAdmin }
export default function AboutAdminRouter({ subsection = 'hero' }) { const Page = pages[subsection] || AboutHeroAdmin; return <Page/> }
