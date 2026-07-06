import AboutAdminLayout from './AboutAdminLayout'
import AboutFieldsCard from './AboutFieldsCard'
import AboutSectionPreview from './AboutSectionPreview'
import useAboutAdmin from './useAboutAdmin'
import { fieldsBySection } from './aboutSections'
export default function AboutStoryAdmin(){ const fields=fieldsBySection.story; const editor=useAboutAdmin(fields); return <AboutAdminLayout sectionKey="story" title="Коротка історія" description="Головна думка, характер і ключові цифри без ручного JSON." onSave={editor.save} onCancel={editor.reset} dirty={editor.dirty} saving={editor.saving}><div className="about-admin-v3-editor-grid"><AboutFieldsCard title="Історія та факти" description="Сформулюй короткий маніфест і додай цифри через зручний конструктор." fields={fields} form={editor.form} update={editor.update} note="У кожного факту є значення та коротке пояснення."/><aside className="about-admin-v3-side-stack"><AboutSectionPreview sectionKey="story" form={editor.form} settings={editor.settings} babyland={editor.babyland} telegram={editor.telegram}/></aside></div></AboutAdminLayout> }
