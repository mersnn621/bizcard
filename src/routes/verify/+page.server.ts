import type { PageServerLoad } from './$types';
import { readFileSync } from 'fs';
import { join } from 'path';

export const load: PageServerLoad = async () => {
  try {
    // 公開鍵とメッセージを取得
    const pubkeyPath = join(process.cwd(), 'config', 'pubkey.pem');
    
    const publicKeyPem = readFileSync(pubkeyPath, 'utf-8');

    return {
      publicKey: publicKeyPem,
    };
  } catch (err) {
    console.error('Failed to load verification data:', err);
    return {
      publicKey: '',
    };
  }
};
