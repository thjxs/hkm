import { ModeOfOperation as aes } from 'aes-js';
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
const aesKey = stb('UKu52ePUBwetZ9wNX88o54dnfKRu0T1l');
const ecb = new aes.ecb(aesKey);

function stb(string) {
  return new TextEncoder().encode(string);
}

function bts(bytes) {
  return new TextDecoder().decode(bytes);
}

function aesDecrypt(bytes) {
  let data = ecb.decrypt(bytes);
  data = data.subarray(0, -data[data.length - 1]);
  return data;
}

function aesEncrypt(bytes) {
  let padValue = 16 - (bytes.length % 16);
  let padded = new Uint8Array(bytes.length + padValue);
  padded.fill(padValue);
  padded.set(bytes);
  return ecb.encrypt(padded);
}

function lengthPrefixed(len) {
  let length = Math.min(0x7fffffff, len);
  let bytes = [];
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
  let lengthData = lengthPrefixed(bytes.length);
  let newBytes = new Uint8Array(
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

export function decode(bytes) {
  bytes = bytes.slice();
  bytes = removeHeader(bytes);
  bytes = Base64.decode(bytes);
  bytes = aesDecrypt(bytes);
  return bts(bytes);
}

export function encode(json) {
  let bytes = stb(json);
  bytes = aesEncrypt(bytes);
  bytes = Base64.encode(bytes);
  return addHeader(bytes);
}

export function hash(string) {
  return string.split('').reduce((i, a) => (i << 5) - a + a.charCodeAt(0), 0);
}

export function download(content, filename, mime, bom) {
  var blobData = typeof bom !== 'undefined' ? [bom, content] : [content];
  var blob = new Blob(blobData, { type: mime || 'application/octet-stream' });
  if (typeof window.navigator.msSaveBlob !== 'undefined') {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    var blobURL = window.URL.createObjectURL(blob);
    var aLink = document.createElement('a');
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
