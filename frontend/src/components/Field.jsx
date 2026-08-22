import { useLanguage } from "../i18n/LanguageContext";

export default function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  multiline = false,
  placeholder,
  autoComplete,
  disabled,
}) {
  const { t } = useLanguage();
  const inputProps = {
    id,
    value,
    disabled,
    placeholder,
    autoComplete,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
    onChange: (e) => onChange(e.target.value),
  };

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea className={`field__textarea ${error ? "field__textarea--error" : ""}`} rows={4} {...inputProps} />
      ) : (
        <input className={`field__input ${error ? "field__input--error" : ""}`} type={type} {...inputProps} />
      )}
      {error && (
        <p className="field__error" id={`${id}-error`} role="alert">
          {t(error)}
        </p>
      )}
    </div>
  );
}
