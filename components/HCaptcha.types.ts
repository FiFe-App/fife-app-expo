export type HCaptchaHandle = {
  /** Triggers the (invisible) challenge and resolves with a single-use verification token. */
  execute: () => Promise<string>;
  /** Resets the widget so it can be executed again. Call after every verification attempt. */
  reset: () => void;
};

export type HCaptchaProps = {
  siteKey: string;
};
