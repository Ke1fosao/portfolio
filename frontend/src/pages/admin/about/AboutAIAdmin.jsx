import AboutAdminLayout from './AboutAdminLayout'
import AboutFieldsCard from './AboutFieldsCard'
import AboutSectionPreview from './AboutSectionPreview'
import useAboutAdmin from './useAboutAdmin'
import { fieldsBySection } from './aboutSections'
export default function AboutAIAdmin(){ const fields=fieldsBySection.ai; const editor=useAboutAdmin(fields); return <AboutAdminLayout sectionKey="ai" title="AI та принципи" description="Керуй AI-напрямами й принципами через конструктори, а не JSON." onSave={editor.save} onCancel={editor.reset} dirty={editor.dirty} saving={editor.saving}><div className="about-admin-v3-editor-grid is-wide-editor"><AboutFieldsCard title="AI-напрям і підхід" description="Опиши конкретні автоматизації та принципи, за якими створюєш продукти." fields={fields} form={editor.form} update={editor.update} note="Пиши конкретно: що виконує система та де економиться час."/><aside className="about-admin-v3-side-stack"><AboutSectionPreview sectionKey="ai" form={editor.form} settings={editor.settings} babyland={editor.babyland} telegram={editor.telegram}/></aside></div></AboutAdminLayout> }
