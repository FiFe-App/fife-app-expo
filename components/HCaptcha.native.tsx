import ConfirmHcaptcha from "@hcaptcha/react-native-hcaptcha";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { HCaptchaHandle, HCaptchaProps } from "./HCaptcha.types";

const HCaptchaField = forwardRef<HCaptchaHandle, HCaptchaProps>(({ siteKey }, ref) => {
  const captchaRef = useRef<ConfirmHcaptcha>(null);
  const pending = useRef<{ resolve: (token: string) => void; reject: (err: Error) => void } | null>(null);

  useImperativeHandle(ref, () => ({
    execute: () =>
      new Promise<string>((resolve, reject) => {
        pending.current = { resolve, reject };
        captchaRef.current?.show();
      }),
    reset: () => captchaRef.current?.hide(),
  }));

  return (
    <ConfirmHcaptcha
      ref={captchaRef}
      siteKey={siteKey}
      size="invisible"
      languageCode="hu"
      hasBackdrop={false}
      onMessage={(event) => {
        const data = event.nativeEvent.data;
        // The "open" event (challenge popup shown) is reported with success:true too,
        // so only real tokens (long strings) count as a completed verification.
        if (event.success && data && data.length > 35) {
          event.markUsed?.();
          pending.current?.resolve(data);
          pending.current = null;
        } else if (data === "challenge-closed") {
          pending.current?.reject(new Error("captcha-closed"));
          pending.current = null;
        } else if (data && data !== "open") {
          pending.current?.reject(new Error(String(data)));
          pending.current = null;
        }
      }}
    />
  );
});

HCaptchaField.displayName = "HCaptchaField";

export default HCaptchaField;
