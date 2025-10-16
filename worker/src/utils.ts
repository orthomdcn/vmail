// worker/src/utils.ts
/**
 * 将字符串转换为其十六进制表示形式。
 * @param str 输入字符串。
 * @returns 十六进制字符串。
 */
function stringToHex(str: string): string {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * 将十六进制字符串转换回常规字符串。
 * @param hex 十六进制字符串。
 * @returns 解码后的字符串。
 */
function hexToString(hex: string): string {
  let str = '';
  // 确保 hex 字符串的长度是偶数
  if (hex.length % 2 !== 0) {
      console.error("Invalid hex string length");
      return "";
  }
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.substr(i, 2), 16);
    if (isNaN(byte)) {
        console.error("Invalid hex character");
        return "";
    }
    str += String.fromCharCode(byte);
  }
  return str;
}


/**
 * 使用密钥对文本进行简单的 XOR 加密，并返回 Hex 编码的字符串。
 * @param text 要加密的文本。
 * @param secret 加密密钥。
 * @returns 加密后的 Hex 编码字符串。
 */
export function encrypt(text: string, secret: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    // 对每个字符的 ASCII 码与密钥中对应位置的字符 ASCII 码进行异或操作
    result += String.fromCharCode(text.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
  }
  // 将加密后的结果转换为 Hex 编码
  return stringToHex(result);
}

/**
 * 使用密钥对 Hex 编码的加密文本进行解密。
 * @param encryptedHex 加密后的 Hex 编码字符串。
 * @param secret 解密密钥。
 * @returns 解密后的原始文本。
 */
export function decrypt(encryptedHex: string, secret: string): string {
  // 首先对 Hex 编码的字符串进行解码
  const text = hexToString(encryptedHex);
  let result = '';
  for (let i = 0; i < text.length; i++) {
    // 同样进行异或操作来还原原始字符
    result += String.fromCharCode(text.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
  }
  return result;
}