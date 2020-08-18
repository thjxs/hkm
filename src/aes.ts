import { ModeOfOperation as aes } from 'aes-js';

const aesKey = new TextEncoder().encode('UKu52ePUBwetZ9wNX88o54dnfKRu0T1l');

const ecb = new aes.ecb(aesKey);

export function aesDecrypt(bytes: Uint8Array): Uint8Array {
  const data = ecb.decrypt(bytes);
  return data.subarray(0, -data[data.length - 1]);
}

export function aesEncrypt(bytes: Uint8Array): Uint8Array {
  const padValue = 16 - (bytes.length % 16);
  const padded = new Uint8Array(bytes.length + padValue);
  padded.fill(padValue);
  padded.set(bytes);
  return ecb.encrypt(padded);
}
