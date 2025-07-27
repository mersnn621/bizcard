<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    importPublicKey, 
    verifySignature,
    type Payload 
  } from '$lib/crypto';

  let latitude = '';
  let longitude = '';
  let message = '';
  let timestamp = '';
  let signature = '';
  let isVerifying = false;
  let verificationResult: boolean | null = null;
  let error: string | null = null;
  let pubkey: string | null = null;

  onMount(async () => {
    // https://HOST/config/pubkey.pem からデータを取得
    try {
      const response = await fetch('/config/pubkey.pem');
      if (!response.ok) {
        throw new Error('公開鍵の取得に失敗しました');
      }
      const publicKeyPem = await response.text();
      pubkey = publicKeyPem.trim();
    } catch (err) {
      error = err instanceof Error ? err.message : '公開鍵の取得中にエラーが発生しました';
      console.error('Error fetching public key:', error);
    }
  });

  async function verifyCard() {
    isVerifying = true;
    error = null;
    verificationResult = null;

    try {
      // 入力値の検証
      if (!latitude || !longitude || !timestamp || !signature) {
        throw new Error('すべてのフィールドを入力してください');
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('緯度・経度は数値で入力してください');
      }

      // タイムスタンプの形式チェック
      const timestampDate = new Date(timestamp);
      if (isNaN(timestampDate.getTime())) {
        throw new Error('タイムスタンプの形式が正しくありません（ISO 8601形式で入力してください）');
      }

      // ペイロードを作成
      const payload: Payload = {
        latitude: lat,
        longitude: lng,
        timestamp: timestamp.trim(),
        message: message.trim()
      };

      // 公開鍵をインポート
      const publicKey = await importPublicKey(pubkey ? pubkey : '');

      // 署名を検証
      verificationResult = await verifySignature(payload, signature.trim(), publicKey);

    } catch (err) {
      error = err instanceof Error ? err.message : '検証エラーが発生しました';
      console.error('Verification failed:', err);
    } finally {
      isVerifying = false;
    }
  }

  function resetForm() {
    latitude = '';
    longitude = '';
    timestamp = '';
    signature = '';
    message = '';
    verificationResult = null;
    error = null;
  }
</script>

<svelte:head>
  <title>署名検証 - BizCard</title>
</svelte:head>

<div class="pt-32 flex flex-col items-center">
      <h1 class="text-4xl font-bold  mb-8">デジタル署名検証</h1>
    <div class="rounded-xl bg-slate-800 shadow-lg p-8 w-2/3">
      <form class="space-y-6">
        <div class="space-y-4">
          <h2 class="text-xl font-semibold border-b border-gray-200 pb-2">
            位置情報
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="latitude" class="block text-sm font-medium  mb-2">
                緯度 (Latitude)
              </label>
              <input 
                id="latitude"
                type="number" 
                step="0.001"
                bind:value={latitude} 
                placeholder="例: 35.689"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label for="longitude" class="block text-sm font-medium  mb-2">
                経度 (Longitude)
              </label>
              <input 
                id="longitude"
                type="number" 
                step="0.001"
                bind:value={longitude} 
                placeholder="例: 139.692"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <!-- タイムスタンプとメッセージセクション -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold  border-b border-gray-200 pb-2">
            タイムスタンプ・メッセージ
          </h2>
          
          <div>
            <label for="timestamp" class="block text-sm font-medium  mb-2">
              タイムスタンプ (ISO 8601形式)
            </label>
            <input 
              id="timestamp"
              type="text" 
              bind:value={timestamp} 
              placeholder="例: 2023-10-01T12:00:00.000Z"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
            />
          </div>

          <div>
            <label for="message" class="block text-sm font-medium  mb-2">
              メッセージ
            </label>
            <input 
              id="message"
              type="text" 
              bind:value={message} 
              placeholder="検証するメッセージを入力"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <!-- 署名セクション -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold  border-b border-gray-200 pb-2">
            デジタル署名
          </h2>
          
          <div>
            <label for="signature" class="block text-sm font-medium  mb-2">
              署名データ (Base64)
            </label>
            <textarea 
              id="signature"
              bind:value={signature} 
              placeholder="Base64エンコードされた署名を入力してください"
              rows="4"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm resize-vertical"
            ></textarea>
          </div>
        </div>

        <!-- ボタンセクション -->
        <div class="flex flex-col sm:flex-row gap-4 pt-6">
          <button 
            type="button"
            on:click={verifyCard} 
            disabled={isVerifying || pubkey === null}
            class="flex-1 bg-slate-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {#if isVerifying}
              <span>検証中...</span>
            {:else}
              <span>署名を検証</span>
            {/if}
          </button>
          
          <button 
            type="button"
            on:click={resetForm} 
            class="sm:flex-initial bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            リセット
          </button>
        </div>
      </form>
    </div>

    <!-- エラー表示 -->
    {#if error}
      <div class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">エラーが発生しました</h3>
            <p class="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- 検証結果表示 -->
    {#if verificationResult !== null}
      <div class="mt-6 rounded-lg p-6 {verificationResult ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
        {#if verificationResult}
          <div class="flex items-start">
            <div class="ml-4">
              <h3 class="text-lg font-semibold text-green-800">検証成功</h3>
              <p class="mt-2 text-green-700">
                署名が有効です。指定された時刻・場所での存在が証明されました。
              </p>
            </div>
          </div>
        {:else}
          <div class="flex items-start">
            <div class="ml-4">
              <h3 class="text-lg font-semibold text-red-800">検証失敗</h3>
              <p class="mt-2 text-red-700">
                署名が無効です。データが改ざんされているか、署名が正しくありません。
              </p>
              <div class="mt-3 text-sm text-red-600">
                入力された情報を再度確認してください。
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
</div>


<style></style>