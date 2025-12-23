import i18n from "@/i18n";

function elapsedTime(date: string | number) {
  if (!date) return null;

  let key: keyof typeof unitKeys = "seconds";

  let elapsed = Date.now() - new Date(date).getTime();

  if (isNaN(elapsed)) return null;
  elapsed /= 1000;
  if (elapsed >= 60) {
    elapsed /= 60;
    key = "minutes";
    if (elapsed >= 60) {
      elapsed /= 60;
      key = "hours";
      if (elapsed >= 24) {
        elapsed /= 24;
        key = "days";
        if (elapsed >= 7) {
          elapsed /= 7;
          key = "weeks";
          if (elapsed >= 4) {
            elapsed /= 4;
            key = "months";
            if (elapsed >= 12) {
              elapsed /= 12;
              key = "years";
            }
          }
        }
      }
    }
  }

  const n = Math.floor(elapsed);
  const unit = i18n.t(`elapsed.${key}`);
  return `${n} ${unit}`;
}

const unitKeys = {
  seconds: true,
  minutes: true,
  hours: true,
  days: true,
  weeks: true,
  months: true,
  years: true,
};

export default elapsedTime;
