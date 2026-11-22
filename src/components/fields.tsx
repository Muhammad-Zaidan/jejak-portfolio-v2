export function Field({ name, label, value, type = 'text', placeholder }: { name: string; label: string; value: string; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-1">
      <span className="note">{label}</span>
      <input name={name} defaultValue={value} type={type} placeholder={placeholder} className="field" />
    </label>
  )
}

export function Area({ name, label, value, placeholder, rows = 3 }: { name: string; label: string; value: string; placeholder?: string; rows?: number }) {
  return (
    <label className="grid gap-1">
      <span className="note">{label}</span>
      <textarea name={name} defaultValue={value} placeholder={placeholder} rows={rows} className="field" />
    </label>
  )
}

export function Select({ name, label, value, options }: { name: string; label: string; value: string; options: [string, string][] }) {
  return (
    <label className="grid gap-1">
      <span className="note">{label}</span>
      <select name={name} defaultValue={value} className="field">
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  )
}
