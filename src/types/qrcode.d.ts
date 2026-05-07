declare module "qrcode" {
  type QRCodeRenderOptions = {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  };

  const QRCode: {
    toDataURL(value: string, options?: QRCodeRenderOptions): Promise<string>;
  };

  export default QRCode;
}
