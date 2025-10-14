declare module 'react-native-crypto-js' {
  interface CryptoJS {
    AES: {
      encrypt(text: string, key: string, options?: any): any;
      decrypt(encrypted: any, key: string, options?: any): any;
    };
    enc: {
      Hex: {
        parse(text: string): any;
      };
      Utf8: {
        stringify(obj: any): string;
      };
    };
    mode: {
      GCM: any;
    };
    pad: {
      NoPadding: any;
    };
    SHA256(text: string): any;
  }

  const CryptoJS: CryptoJS;
  export default CryptoJS;
}
