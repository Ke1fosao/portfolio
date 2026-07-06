import AboutAdminLayout from './AboutAdminLayout'
import AboutFieldsCard from './AboutFieldsCard'
import AboutSectionPreview from './AboutSectionPreview'
import useAboutAdmin from './useAboutAdmin'
import { fieldsBySection } from './aboutSections'
import ImageCropUploader from '../../../components/admin/ImageCropUploader'

export default function AboutHeroAdmin() {
  const fields = fieldsBySection.hero
  const editor = useAboutAdmin(fields)
  return <AboutAdminLayout sectionKey="hero" title="Перший екран" description="Редагуй вступ, який людина бачить одразу після відкриття сторінки." onSave={editor.save} onCancel={editor.reset} dirty={editor.dirty} saving={editor.saving}>
    <div className="about-admin-v3-editor-grid">
      <AboutFieldsCard title="Текст першого екрана" description="Хто ти, що створюєш і чим можеш бути корисний." fields={fields} form={editor.form} update={editor.update} note="Заголовок найкраще читається у 2–4 рядки."/>
      <aside className="about-admin-v3-side-stack"><AboutSectionPreview sectionKey="hero" form={editor.form} settings={editor.settings} babyland={editor.babyland} telegram={editor.telegram}/><ImageCropUploader title="Портрет 4:5" hint="Перетягни фото, зміни масштаб і кадрування." currentUrl={editor.form.hero_photo_url} originalUrl={editor.form.hero_photo_original_url} cropSettings={editor.form.hero_photo_crop} uploadUrl="/about-page/upload/" removeUrl="/about-page/remove_file/" field="hero_photo" aspect={4/5} onUploaded={editor.applySavedData}/></aside>
    </div>
  </AboutAdminLayout>
}
