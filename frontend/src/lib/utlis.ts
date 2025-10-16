/**
 * 获取一个随机字符
 * @returns {string} 从 "abcdefghijklmnopqrstuvwxyz." 中随机选择一个字符
 */
export function getRandomCharacter(): string {
  const characters = "abcdefghijklmnopqrstuvwxyz.";
  return characters.charAt(Math.floor(Math.random() * characters.length));
}

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
 * 使用密钥对文本进行简单的 XOR 加密，并返回 Hex 编码的字符串。
 * @param text 要加密的文本。
 * @param secret 加密密钥。
 * @returns 加密后的 Hex 编码字符串。
 */
export function encrypt(text: string, secret: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
  }
  return stringToHex(result);
}

/**
 * 格式化密码字符串为 "AAAA-BBBB-..." 的形式。
 * @param hexPassword - 经过加密的十六进制密码字符串。
 * @returns 格式化后的密码字符串。
 */
export function formatPassword(hexPassword: string): string {
  // 1. 转换为大写
  const uppercased = hexPassword.toUpperCase();
  // 2. 每4个字符插入一个连字符
  const formatted = uppercased.match(/.{1,4}/g)?.join('-') || uppercased;
  return formatted;
}