import { useEffect } from 'react'

export default function useAboutMotion(pageRef) {
  useEffect(() => {
    const root = pageRef.current
    if (!root) return undefined
    const revealItems = root.querySelectorAll('[data-about-reveal]')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' })
    revealItems.forEach((item) => observer.observe(item))

    const updateScroll = () => {
      const rect = root.getBoundingClientRect()
      const scrollable = Math.max(root.offsetHeight - window.innerHeight, 1)
      const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1)
      root.style.setProperty('--about-scroll', progress.toFixed(4))
      root.style.setProperty('--about-parallax', `${Math.min(window.scrollY * 0.035, 38)}px`)
    }
    updateScroll()
    window.addEventListener('scroll', updateScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updateScroll)
    }
  }, [pageRef])
}
