import { useRef } from 'react'
import AboutHero from './about/sections/AboutHero'
import AboutStory from './about/sections/AboutStory'
import AboutJourney from './about/sections/AboutJourney'
import AboutProject from './about/sections/AboutProject'
import AboutAI from './about/sections/AboutAI'
import AboutPrinciples from './about/sections/AboutPrinciples'
import AboutEducation from './about/sections/AboutEducation'
import AboutFinal from './about/sections/AboutFinal'
import useAboutData from './about/hooks/useAboutData'
import useAboutMotion from './about/hooks/useAboutMotion'

export default function About() {
  const pageRef = useRef(null)
  const { settings, about, babyland, telegram } = useAboutData()
  useAboutMotion(pageRef)
  return <div className="about-story" ref={pageRef}>
    <div className="about-scroll-progress" aria-hidden="true"><span /></div>
    <AboutHero settings={settings} about={about} />
    <AboutStory settings={settings} about={about} />
    <AboutJourney about={about} />
    <AboutProject about={about} babyland={babyland} />
    <AboutAI about={about} />
    <AboutPrinciples about={about} />
    <AboutEducation about={about} />
    <AboutFinal about={about} telegram={telegram} />
  </div>
}
