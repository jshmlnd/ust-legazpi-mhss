const FormField = ({ label, name, type = 'text', value, onChange, error, placeholder, rows, required }) => {
  const base = 'w-full bg-transparent border text-sm outline-none transition-colors rounded-lg px-3 py-2.5';
  const normal = 'border-line text-ink placeholder:text-ink-muted focus:border-brand-600';
  const errorStyle = 'border-danger text-danger-ink focus:border-danger';
  const inputClass = `${base} ${error ? errorStyle : normal}`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={name} className="block text-xs font-medium text-ink">
          {label}{required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows || 3}
          className={inputClass}
        />
      ) : type === 'select' ? (
        <select id={name} name={name} value={value} onChange={onChange} className={inputClass}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {onChange.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
      {error && <p className="text-xs text-danger mt-0.5">{error}</p>}
    </div>
  );
};

export default FormField;
