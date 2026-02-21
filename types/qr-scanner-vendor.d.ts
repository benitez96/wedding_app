/**
 * Type declaration for QR Scanner library loaded from public/vendor
 * This allows TypeScript to recognize the dynamic import from /public
 */

declare module "/vendor/qr-scanner/qr-scanner.min.js" {
  const QrScanner: any;
  export default QrScanner;
}

// Wildcard module declaration for any vendor imports
declare module "/vendor/*" {
  const content: any;
  export default content;
}
