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
      onMessage={(event) => {
        const data = event.nativeEvent.data;
        if (event.success && data) {
          pending.current?.resolve(data);
          event.markUsed?.();
        } else if (data === "challenge-closed") {
          pending.current?.reject(new Error("captcha-closed"));
        } else if (data) {
          pending.current?.reject(new Error(String(data)));
        }
        pending.current = null;
        event.reset?.();
      }}
    />
  );
});

HCaptchaField.displayName = "HCaptchaField";

export default HCaptchaField;
