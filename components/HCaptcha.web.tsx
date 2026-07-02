import HCaptcha from "@hcaptcha/react-hcaptcha";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { HCaptchaHandle, HCaptchaProps } from "./HCaptcha.types";

const HCaptchaField = forwardRef<HCaptchaHandle, HCaptchaProps>(({ siteKey }, ref) => {
  const captchaRef = useRef<HCaptcha>(null);
  const pending = useRef<{ resolve: (token: string) => void; reject: (err: Error) => void } | null>(null);

  useImperativeHandle(ref, () => ({
    execute: () =>
      new Promise<string>((resolve, reject) => {
        pending.current = { resolve, reject };
        captchaRef.current?.execute();
      }),
    reset: () => captchaRef.current?.resetCaptcha(),
  }));

  return (
    <HCaptcha
      ref={captchaRef}
      sitekey={siteKey}
      size="invisible"
      languageOverride="hu"
      onVerify={(token) => {
        pending.current?.resolve(token);
        pending.current = null;
      }}
      onExpire={() => {
        pending.current?.reject(new Error("captcha-expired"));
        pending.current = null;
      }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError={(err: any) => {
        pending.current?.reject(new Error(String(err)));
        pending.current = null;
      }}
    />
  );
});

HCaptchaField.displayName = "HCaptchaField";

export default HCaptchaField;
