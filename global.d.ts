declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

interface Window {
  grecaptcha?: {
    ready: (callback: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
  };
}

