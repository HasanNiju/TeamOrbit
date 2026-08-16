import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { getSubmissionWindowState, formatDhakaDate } from "../utils/dhakaTime";
import { validateSubmission } from "../utils/validation";
import * as api from "../api/mockApi";
import Field from "../components/Field";
import Button from "../components/Button";
import Toast from "../components/Toast";

const EMPTY_REPORT_FIELDS = { name: "", designation: "", address: "", mobile: "", remarks: "" };

export default function Submission() {
  const { t, language } = useLanguage();
  const { session, refreshProfile } = useAuth();

  const [windowState, setWindowState] = useState(() => getSubmissionWindowState());
  const [values, setValues] = useState({ ...EMPTY_REPORT_FIELDS });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Re-check the window every 30s so the form locks/unlocks live at 8AM/8PM
  // without the employee needing to reload.
  useEffect(() => {
    const interval = setInterval(() => setWindowState(getSubmissionWindowState()), 30000);
    return () => clearInterval(interval);
  }, []);

  const dateLabel = useMemo(() => formatDhakaDate(language, new Date()), [language]);
  const isOpen = windowState === "open";

  function setField(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isOpen || submitting) return; // guards against double-clicks while pending

    const validationErrors = validateSubmission(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setToast(null);
    try {
      await api.submitReport(session.employeeId, {
        name: values.name,
        designation: values.designation,
        address: values.address,
        mobile: values.mobile,
        remarks: values.remarks,
      });
      setToast({ message: t("submission.success"), variant: "success" });
      setValues((v) => ({ ...v, ...EMPTY_REPORT_FIELDS }));
      refreshProfile(); // total submissions / rank changed
    } catch (err) {
      if (err.code === "SUBMISSION_CLOSED") {
        setWindowState(getSubmissionWindowState());
        setToast({ message: t("submission.errors.closed"), variant: "error" });
      } else if (err.message === "Failed to fetch" || err.name === "TypeError") {
        setToast({ message: t("submission.errors.network"), variant: "error" });
      } else {
        setToast({ message: t("submission.errors.generic"), variant: "error" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="submission-header">
        <h1 className="submission-header__greeting">{t("submission.greeting")}</h1>
        <p className="submission-header__date">{dateLabel}</p>
        <p className="submission-header__window">
          {t("submission.windowLabel")}: {t("submission.windowValue")}
        </p>
      </div>

      {windowState === "before" && (
        <div className="banner banner--warning" style={{ marginBottom: 18 }}>
          <strong>{t("submission.closedBefore")}</strong>
          <div>{t("submission.closedBeforeDetail")}</div>
        </div>
      )}
      {windowState === "after" && (
        <div className="banner banner--warning" style={{ marginBottom: 18 }}>
          <strong>{t("submission.closedAfter")}</strong>
          <div>{t("submission.closedAfterDetail")}</div>
        </div>
      )}

      <form className="card" onSubmit={handleSubmit} noValidate aria-disabled={!isOpen}>
        <fieldset disabled={!isOpen || submitting} style={{ border: "none", padding: 0, margin: 0 }}>
          <Field
            id="name"
            label={t("submission.fields.name")}
            value={values.name}
            onChange={(v) => setField("name", v)}
            error={errors.name}
            placeholder={t("submission.fields.namePlaceholder")}
          />
          <Field
            id="designation"
            label={t("submission.fields.designation")}
            value={values.designation}
            onChange={(v) => setField("designation", v)}
            error={errors.designation}
            placeholder={t("submission.fields.designationPlaceholder")}
          />
          <Field
            id="address"
            label={t("submission.fields.address")}
            value={values.address}
            onChange={(v) => setField("address", v)}
            error={errors.address}
            multiline
            placeholder={t("submission.fields.addressPlaceholder")}
          />
          <Field
            id="mobile"
            label={t("submission.fields.mobile")}
            value={values.mobile}
            onChange={(v) => setField("mobile", v)}
            error={errors.mobile}
            type="tel"
            placeholder={t("submission.fields.mobilePlaceholder")}
          />
          <Field
            id="remarks"
            label={t("submission.fields.remarks")}
            value={values.remarks}
            onChange={(v) => setField("remarks", v)}
            error={errors.remarks}
            multiline
            placeholder={t("submission.fields.remarksPlaceholder")}
          />

          <Button type="submit" loading={submitting} disabled={!isOpen}>
            {submitting ? t("submission.submitting") : t("submission.submit")}
          </Button>
        </fieldset>
      </form>

      <Toast message={toast?.message} variant={toast?.variant} onDismiss={() => setToast(null)} />
    </div>
  );
}
