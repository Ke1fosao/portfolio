import { SlidersHorizontal } from 'lucide-react'
import AdminField from '../../../components/admin/AdminField'

export default function AboutFieldsCard({ title, description, fields, form, update, note }) {
  return <section className="about-admin-v3-form-card">
    <header><span><SlidersHorizontal size={17}/></span><div><strong>{title}</strong><p>{description}</p></div>{note && <aside>{note}</aside>}</header>
    <div className="about-admin-v3-form-grid">{fields.map((field) => <AdminField key={field[0]} spec={field} value={form[field[0]]} onChange={update}/>)}</div>
  </section>
}
