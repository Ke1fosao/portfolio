import AboutAdminLayout from './AboutAdminLayout'
import AboutFieldsCard from './AboutFieldsCard'
import AboutSectionPreview from './AboutSectionPreview'
import useAboutAdmin from './useAboutAdmin'
import { fieldsBySection } from './aboutSections'
export default function AboutFinalAdmin(){ const fields=fieldsBySection.final; const editor=useAboutAdmin(fields); return <AboutAdminLayout sectionKey="final" title="Фінальний заклик" description="Редагуй останній екран і одразу дивись, як він мотивує написати тобі." onSave={editor.save} onCancel={editor.reset} dirty={editor.dirty} saving={editor.saving}><div className="about-admin-v3-editor-grid"><AboutFieldsCard title="Фінальний CTA" description="Підсумуй професійний рівень і запроси людину до конкретної дії." fields={fields} form={editor.form} update={editor.update}/><aside className="about-admin-v3-side-stack"><AboutSectionPreview sectionKey="final" form={editor.form} settings={editor.settings} babyland={editor.babyland} telegram={editor.telegram}/></aside></div></AboutAdminLayout> }
