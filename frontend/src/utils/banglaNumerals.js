const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Renders a number using Bangla numerals when language === "bn", else plain digits. */
export function formatNumber(value, language) {
  const str = String(value);
  if (language !== "bn") return str;
  return str.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}
