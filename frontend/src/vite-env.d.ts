/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_MOCK_API: string | boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css";
declare module "@fontsource/*";

declare namespace React.JSX {
  interface IntrinsicElements {
    "model-viewer": any;
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": any;
  }
}
