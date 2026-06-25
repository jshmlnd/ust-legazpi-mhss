const FormField = ({ label, name, type = 'text', value, onChange, error, placeholder, rows, required }) => {
  const base = 'w-full bg-transparent border text-sm outline-none transition-colors rounded-sm px-3 py-2.5';
  const normal = 'border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900';
  const errorStyle = 'border-red-400 text-red-700 focus:border-red-500';
  const inputClass = `${base} ${error ? errorStyle : normal}`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={name} className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
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
      {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
};

export default FormField;
