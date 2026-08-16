export default function Button({ children, loading, variant = "primary", type = "button", ...rest }) {
  return (
    <button type={type} className={`btn btn--${variant}`} disabled={loading || rest.disabled} {...rest}>
      {loading && <span className="spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
