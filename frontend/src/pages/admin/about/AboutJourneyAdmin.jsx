import AboutAdminLayout from './AboutAdminLayout'
import AboutFieldsCard from './AboutFieldsCard'
import AboutSectionPreview from './AboutSectionPreview'
import useAboutAdmin from './useAboutAdmin'
import { fieldsBySection } from './aboutSections'
export default function AboutJourneyAdmin(){ const fields=fieldsBySection.journey; const editor=useAboutAdmin(fields); return <AboutAdminLayout sectionKey="journey" title="Шлях у професію" description="Будуй хронологію етапами: додавай, дублюй, переміщуй і видаляй." onSave={editor.save} onCancel={editor.reset} dirty={editor.dirty} saving={editor.saving}><div className="about-admin-v3-editor-grid is-wide-editor"><AboutFieldsCard title="Хронологія розвитку" description="Кожен етап має номер, коротку мітку, заголовок, опис і результат." fields={fields} form={editor.form} update={editor.update} note="Один етап — одна помітна зміна у професійному рівні."/><aside className="about-admin-v3-side-stack"><AboutSectionPreview sectionKey="journey" form={editor.form} settings={editor.settings} babyland={editor.babyland} telegram={editor.telegram}/></aside></div></AboutAdminLayout> }
