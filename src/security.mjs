import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
export function encrypt(value, key) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((b) => b.toString("base64"))
    .join(".");
}
export function decrypt(value, key) {
  const [iv, tag, ciphertext] = value
    .split(".")
    .map((v) => Buffer.from(v, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return JSON.parse(
    Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
      "utf8",
    ),
  );
}
export function redact(record) {
  const d = { ...record };
  if (d.accountNumber) d.accountNumber = `•••• ${d.accountNumber.slice(-4)}`;
  for (const key of [
    "securityName",
    "securityPhone",
    "pan",
    "gstin",
    "phone",
    "address",
  ])
    if (d[key]) d[key] = "Restricted";
  return d;
}
