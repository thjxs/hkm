const BASE64_ARRAY = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  .split('')
  .map((c) => c.charCodeAt(0));
const BASE64_ENCODE_TABLE = new Map(BASE64_ARRAY.map((ord, i) => [i, ord]));
const BASE64_DECODE_TABLE = new Map(BASE64_ARRAY.map((ord, i) => [ord, i]));

function base64EnTab(index: number) {
  return BASE64_ENCODE_TABLE.get(index) || 0;
}

function outputLength(length: number): number {
  return Math.ceil(Math.ceil((length * 4) / 3) / 4) * 4;
}

export function encode(buffer: Uint8Array): Uint8Array {
  const buf = new Uint8Array(buffer).slice();
  const output = new Uint8Array(outputLength(buf.length));
  const continuous = Math.floor(buf.length / 3) * 3;

  for (let i = 0; i < continuous; i += 3) {
    const k = (4 * i) / 3;
    output[k] = base64EnTab(buf[i] >> 2);
    output[k + 1] = base64EnTab(((buf[i] & 0x03) << 4) | (buf[i + 1] >> 4));
    output[k + 2] = base64EnTab(((buf[i + 1] & 0x0f) << 2) | (buf[i + 2] >> 6));
    output[k + 3] = base64EnTab(buf[i + 2] & 0x3f);
  }

  if (buf[continuous] != undefined) {
    const k = (4 * continuous) / 3;
    output[k] = base64EnTab(buf[continuous] >> 2);
    if (buf[continuous + 1] == undefined) {
      output[k + 1] = base64EnTab((buf[continuous] & 0x03) << 4);
      output[k + 2] = base64EnTab(64);
    } else {
      output[k + 1] = base64EnTab(
        ((buf[continuous] & 0x03) << 4) | (buf[continuous + 1] >> 4),
      );
      output[k + 2] = base64EnTab((buf[continuous + 1] & 0x0f) << 2);
    }
    output[k + 3] = base64EnTab(64);
  }

  return output;
}

export function decode(buf: Uint8Array): Uint8Array {
  const dec = buf.map((v) => BASE64_DECODE_TABLE.get(v) || 0);
  const edp = dec.indexOf(64);
  const buffer = dec.subarray(0, edp !== -1 ? edp : dec.length);
  const output = new Uint8Array((3 * buffer.length) / 4);
  const continuous = Math.floor(buffer.length / 4) * 4;
  for (let i = 0; i < continuous; i += 4) {
    const k = (3 * i) / 4;
    output[k] = (buffer[i] << 2) | (buffer[i + 1] >> 4);
    output[k + 1] = ((buffer[i + 1] & 0x0f) << 4) | (buffer[i + 2] >> 2);
    output[k + 2] = ((buffer[i + 2] & 0x03) << 6) | buffer[i + 3];
  }
  if (buffer[continuous] != undefined) {
    const k = (3 * continuous) / 4;
    output[k] = (buffer[continuous] << 2) | (buffer[continuous + 1] >> 4);
    if (buffer[continuous + 2] != undefined) {
      output[k + 1] =
        ((buffer[continuous + 1] & 0x0f) << 4) | (buffer[continuous + 2] >> 2);
    }
  }
  return output;
}
