/**
 * ECDSA P-521を使用した署名・検証のユーティリティ関数
 */

export interface Payload {
  latitude: number;
  longitude: number;
  timestamp: string;
  message: string;
}

/**
 * PEM形式の秘密鍵をCryptoKeyにインポート
 * PKCS#8形式（PRIVATE KEY）をサポート
 */
export async function importPrivateKey(pemPrivateKey: string): Promise<CryptoKey> {
  // PEMの内容を正規化
  const normalizedPem = pemPrivateKey.trim();
  
  // PKCS#8 PRIVATE KEY形式かチェック
  if (!normalizedPem.includes('-----BEGIN PRIVATE KEY-----') || 
      !normalizedPem.includes('-----END PRIVATE KEY-----')) {
    throw new Error('PKCS#8形式の秘密鍵が必要です。PRIVATE KEY形式を使用してください。');
  }

  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = normalizedPem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "ECDSA",
      namedCurve: "P-521"
    },
    false,
    ["sign"]
  );
}

/**
 * PEM形式の公開鍵をCryptoKeyにインポート
 */
export async function importPublicKey(pemPublicKey: string): Promise<CryptoKey> {
  // PEMヘッダーとフッターを削除し、Base64デコード
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = pemPublicKey
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "ECDSA",
      namedCurve: "P-521"
    },
    false,
    ["verify"]
  );
}

/**
 * ペイロードを署名する
 */
export async function signPayload(payload: Payload, privateKey: CryptoKey): Promise<string> {
  // ペイロードをJSON文字列に変換
  const jsonString = JSON.stringify(payload);
  
  // UTF-8エンコード
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  
  // 署名
  const signature = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: "SHA-512"
    },
    privateKey,
    data
  );
  
  // Base64エンコード
  const signatureArray = new Uint8Array(signature);
  return btoa(String.fromCharCode(...signatureArray));
}

/**
 * 署名を検証する
 */
export async function verifySignature(
  payload: Payload,
  signatureBase64: string,
  publicKey: CryptoKey
): Promise<boolean> {
  try {
    // ペイロードをJSON文字列に変換
    const jsonString = JSON.stringify(payload);
    
    // UTF-8エンコード
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString);
    
    // Base64デコード
    const signatureArray = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
    
    // 検証
    return await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: "SHA-512"
      },
      publicKey,
      signatureArray,
      data
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * 現在位置を取得（小数点以下3桁まで）
 */
export function getCurrentPosition(): Promise<{latitude: number, longitude: number}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Math.round(position.coords.latitude * 1000) / 1000;
        const longitude = Math.round(position.coords.longitude * 1000) / 1000;
        resolve({ latitude, longitude });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

/**
 * 現在時刻をISO 8601 UTC形式で取得
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
