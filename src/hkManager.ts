import { aesDecrypt, aesEncrypt } from './aes';
import * as Base64 from './base64';

const cSharpHeader = [
  0,
  1,
  0,
  0,
  0,
  255,
  255,
  255,
  255,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  6,
  1,
  0,
  0,
  0,
];

function stb(string): Uint8Array {
  return new TextEncoder().encode(string);
}

function bts(bytes): string {
  return new TextDecoder().decode(bytes);
}

function lengthPrefixed(len) {
  let length = Math.min(0x7fffffff, len);
  const bytes = [];
  for (let i = 0; i < 4; i += 1) {
    if (length >> 7 !== 0) {
      bytes.push((length & 0x7f) | 0x80);
      length >>= 7;
    } else {
      bytes.push(length & 0x7f);
      length >>= 7;
      break;
    }
  }
  if (length !== 0) {
    bytes.push(length);
  }
  return bytes;
}

function addHeader(bytes) {
  const lengthData = lengthPrefixed(bytes.length);
  const newBytes = new Uint8Array(
    bytes.length + cSharpHeader.length + lengthData.length + 1
  );
  newBytes.set(cSharpHeader);
  newBytes.subarray(cSharpHeader.length).set(lengthData);
  newBytes.subarray(cSharpHeader.length + lengthData.length).set(bytes);
  newBytes
    .subarray(cSharpHeader.length + lengthData.length + bytes.length)
    .set([11]);
  return newBytes;
}

function removeHeader(bytes) {
  bytes = bytes.subarray(cSharpHeader.length, bytes.length - 1);

  let count = 0;
  for (let i = 0; i < 5; i += 1) {
    count += 1;
    if ((bytes[i] & 0x80) === 0) {
      break;
    }
  }
  bytes = bytes.subarray(count);
  return bytes;
}

export function decode(bytes: Uint8Array): string {
  bytes = bytes.slice();
  bytes = removeHeader(bytes);
  bytes = Base64.decode(bytes);
  bytes = aesDecrypt(bytes);
  return bts(bytes);
}

export function encode(json: string): Uint8Array {
  let bytes = stb(json);
  bytes = aesEncrypt(bytes);
  bytes = Base64.encode(bytes);
  return addHeader(bytes);
}

export function hash(string: any): number {
  return string.split('').reduce((i, a) => (i << 5) - a + a.charCodeAt(0), 0);
}
type content = ArrayBuffer | ArrayBufferView | Blob | string;
export function download(
  content: content,
  filename: string,
  mime: string,
  bom: string
): void {
  const blobData = typeof bom !== 'undefined' ? [bom, content] : [content];
  const blob = new Blob(blobData, { type: mime || 'application/octet-stream' });
  if (typeof window.navigator.msSaveBlob !== 'undefined') {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    const blobURL = window.URL.createObjectURL(blob);
    const aLink = document.createElement('a');
    aLink.style.display = 'none';
    aLink.href = blobURL;
    aLink.setAttribute('download', filename);

    // Safari
    if (typeof aLink.download === 'undefined') {
      aLink.setAttribute('target', '_blank');
    }

    document.body.appendChild(aLink);
    aLink.click();
    document.body.removeChild(aLink);
    window.URL.revokeObjectURL(blobURL);
  }
}
