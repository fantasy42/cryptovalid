// Web-standard globals available in browsers, workers, Edge, and Node.js >= 16.
// Declared locally so the library project stays free of DOM and Node type packages.
declare function atob(data: string): string;

declare class TextEncoder {
  readonly encoding: string;
  encode(input?: string): Uint8Array;
}
