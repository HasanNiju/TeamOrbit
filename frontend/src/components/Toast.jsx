import { useEffect } from "react";

export default function Toast({ message, variant = "success", onDismiss, duration = 3000 }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div className={`toast toast--${variant}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
