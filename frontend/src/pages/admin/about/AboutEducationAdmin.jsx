import AboutAdminLayout from './AboutAdminLayout'
import AboutFieldsCard from './AboutFieldsCard'
import AboutSectionPreview from './AboutSectionPreview'
import useAboutAdmin from './useAboutAdmin'
import { fieldsBySection } from './aboutSections'
export default function AboutEducationAdmin(){ const fields=fieldsBySection.education; const editor=useAboutAdmin(fields); return <AboutAdminLayout sectionKey="education" title="Освіта й диплом" description="Компактно редагуй навчальний заклад, диплом і пояснення результату." onSave={editor.save} onCancel={editor.reset} dirty={editor.dirty} saving={editor.saving}><div className="about-admin-v3-editor-grid"><AboutFieldsCard title="Освітній блок" description="Покажи фундамент і результат навчання без формального резюме." fields={fields} form={editor.form} update={editor.update}/><aside className="about-admin-v3-side-stack"><AboutSectionPreview sectionKey="education" form={editor.form} settings={editor.settings} babyland={editor.babyland} telegram={editor.telegram}/></aside></div></AboutAdminLayout> }
