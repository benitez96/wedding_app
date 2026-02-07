/**
 * BarcodeDetector API types
 * https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API
 *
 * Soportado en:
 * - Chrome/Edge 83+ (Android, Windows, macOS)
 * - NO soportado en Safari/Firefox (requiere polyfill)
 */

interface BarcodeDetectorOptions {
  formats?: BarcodeFormat[];
}

type BarcodeFormat =
  | "aztec"
  | "code_128"
  | "code_39"
  | "code_93"
  | "codabar"
  | "data_matrix"
  | "ean_13"
  | "ean_8"
  | "itf"
  | "pdf417"
  | "qr_code"
  | "upc_a"
  | "upc_e";

interface DetectedBarcode {
  boundingBox: DOMRectReadOnly;
  cornerPoints: ReadonlyArray<{ x: number; y: number }>;
  format: BarcodeFormat;
  rawValue: string;
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);

  static getSupportedFormats(): Promise<BarcodeFormat[]>;

  detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

interface Window {
  BarcodeDetector?: typeof BarcodeDetector;
}
