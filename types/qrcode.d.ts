declare module 'qrcode' {
  const QRCode: {
    toDataURL(text: string, options?: any): Promise<string>;
    toString?(text: string, options?: any): Promise<string>;
    toCanvas?(text: string, canvas: any, options?: any): Promise<void>;
  };

  export default QRCode;
}
