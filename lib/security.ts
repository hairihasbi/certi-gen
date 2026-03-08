/**
 * Generates a SHA-256 hash of the given data string.
 * This is used for digital signatures of certificates.
 */
export async function generateCertificateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Verifies if a given hash matches the data.
 */
export async function verifyCertificateHash(data: string, hash: string): Promise<boolean> {
  const calculatedHash = await generateCertificateHash(data);
  return calculatedHash === hash;
}

/**
 * Formats certificate data into a consistent string for hashing.
 */
export function formatCertificateDataForHashing(recipientData: any, certificateNumber: string): string {
  // We sort keys to ensure consistency
  const sortedKeys = Object.keys(recipientData).sort();
  const dataString = sortedKeys.map(key => `${key}:${recipientData[key]}`).join("|");
  return `${certificateNumber}||${dataString}`;
}
