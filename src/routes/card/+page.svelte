<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { 
    importPrivateKey, 
    signPayload, 
    getCurrentPosition, 
    getCurrentTimestamp,
    type Payload 
  } from '$lib/crypto';

  let isLoading = false;
  let error: string | null = null;
  let cardGenerated = false;
  let signature = '';
  let payload: Payload | null = null;
  let fileInput: HTMLInputElement;
  let privateKeyPem = '';
  let privateKeyFileName = '';
  let message = '';

  // リアクティブ変数で秘密鍵の状態を管理
  $: hasPrivateKey = !!privateKeyPem;
  $: privateKeyInfo = privateKeyFileName || (hasPrivateKey ? '設定済み' : '');


  async function generateCard() {
    console.log('名刺生成開始:', { hasKey: !!privateKeyPem, browser });
    isLoading = true;
    error = null;

    try {
      console.log('秘密鍵取得:', { hasKey: !!privateKeyPem, keyLength: privateKeyPem?.length || 0 });
      
      if (!privateKeyPem) {
        throw new Error('秘密鍵が設定されていません。まず秘密鍵ファイルを選択してください。');
      }

      if (!message.trim()) {
        throw new Error('メッセージが入力されていません。');
      }

      // デバイスの位置情報を取得
      const position = await getCurrentPosition();
      console.log('位置情報取得完了:', position);

      // 現在の日時を取得
      const timestamp = getCurrentTimestamp();

      // ペイロードを作成
      payload = {
        latitude: position.latitude,
        longitude: position.longitude,
        timestamp: timestamp,
        message: message.trim()
      };

      console.log('ペイロード作成完了:', payload);

      // 秘密鍵をインポート
      const privateKey = await importPrivateKey(privateKeyPem);
      console.log('秘密鍵インポート完了');

      // 署名を生成
      signature = await signPayload(payload, privateKey);
      
      console.log('名刺生成完了:', { 
        payloadLength: JSON.stringify(payload).length,
        signatureLength: signature.length,
      });

      cardGenerated = true;

    } catch (err) {
      error = err instanceof Error ? err.message : 'エラーが発生しました';
      console.error('名刺生成エラー:', err);
    } finally {
      isLoading = false;
    }
  }

  function setupPrivateKey() {
    if (!browser) return;
    error = null;
    fileInput.click();
  }

  async function handleFileSelect(event: Event) {
    if (!browser) return;
    
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;
    
    console.log('ファイル選択:', file.name, file.size);
    
    // .pemファイルかチェック
    if (!file.name.toLowerCase().endsWith('.pem')) {
      error = 'PEMファイル（.pem拡張子）を選択してください。';
      return;
    }
    
    try {
      const privateKeyContent = await file.text();
      console.log('ファイル内容読み込み完了:', privateKeyContent.length, '文字');
      
      // PKCS#8形式のPEMファイルかチェック
      if (!privateKeyContent.includes('-----BEGIN PRIVATE KEY-----') || 
          !privateKeyContent.includes('-----END PRIVATE KEY-----')) {
        error = 'PKCS#8形式のPRIVATE KEYファイルが必要です。\n\nOpenSSLで生成する場合は以下のコマンドを使用してください：\nopenssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in ec_key.pem -out private_key.pem';
        return;
      }

      // Web Crypto APIで秘密鍵の有効性をテスト
      try {
        await importPrivateKey(privateKeyContent);
        console.log('秘密鍵の検証成功');
      } catch (importError) {
        console.error('秘密鍵インポートエラー:', importError);
        error = '無効な秘密鍵ファイルです。ECDSA P-521形式のPKCS#8秘密鍵を使用してください。';
        return;
      }

      // メモリ内の変数にのみ保存（ローカルストレージは使用しない）
      privateKeyPem = privateKeyContent;
      privateKeyFileName = file.name;
      error = null;
      
      console.log('秘密鍵設定完了:', { 
        fileName: file.name,
        hasKey: !!privateKeyPem,
        keyLength: privateKeyPem.length
      });
      
    } catch (fileError) {
      console.error('ファイル読み込みエラー:', fileError);
      error = 'ファイルの読み込みに失敗しました。';
    }
    
    // ファイル選択をリセット
    target.value = '';
  }

  function clearPrivateKey() {
    privateKeyPem = '';
    privateKeyFileName = '';
    cardGenerated = false;
    signature = '';
    payload = null;
    error = null;
    console.log('秘密鍵削除完了');
  }
</script>

<svelte:head>
  <title>デジタル名刺 - BizCard</title>
</svelte:head>

<div class="flex flex-col w-screen items-center pt-32">
  <h1 class="text-3xl font-bold mb-8">デジタル名刺生成</h1>
  
  <!-- 隠れたファイル入力要素 -->
  <input 
    bind:this={fileInput}
    type="file" 
    accept=".pem"
    on:change={handleFileSelect}
    class="hidden"
  />

  <!-- 秘密鍵設定状態の表示 -->
  <div class="w-2/3 mb-6">
    <div class={`px-6 py-4 rounded-lg border-2 text-center ${hasPrivateKey ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
      {#if hasPrivateKey}
        <div class="flex items-center justify-center space-x-2">
          <span class="text-green-600">✓</span>
          <span><strong>秘密鍵設定済み:</strong> {privateKeyFileName}</span>
        </div>
        <div class="mt-3 space-x-3">
          <button on:click={setupPrivateKey} class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            変更
          </button>
          <button on:click={clearPrivateKey} class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
            削除
          </button>
        </div>
      {:else}
        <div class="flex items-center justify-center space-x-2 mb-3">
          <span class="text-red-600">✗</span>
          <span><strong>秘密鍵が設定されていません</strong></span>
        </div>
        <p class="text-sm mb-3">名刺を生成するには、PKCS#8形式の秘密鍵ファイル（.pem）をローカルから選択してください。</p>
        <button on:click={setupPrivateKey} class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          📁 秘密鍵ファイルを選択
        </button>
      {/if}
    </div>
  </div>

  <!-- エラー表示 -->
  {#if error}
    <div class="w-2/3 mb-4">
      <div class="px-6 py-4 rounded-lg border-2 bg-red-50 border-red-300 text-red-800">
        <div class="flex items-start space-x-2">
          <span class="text-red-600 mt-0.5">⚠️</span>
          <div>
            <strong>エラー:</strong>
            <p class="mt-1 whitespace-pre-line">{error}</p>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- メッセージ入力 -->
  <div class="w-2/3 mb-6">
    <label for="message" class="block text-sm font-medium mb-2">メッセージ</label>
    <input 
      id="message"
      type="text" 
      bind:value={message} 
      placeholder="名刺に表示するメッセージを入力してください"
      class="w-full py-3 px-4 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
      disabled={!hasPrivateKey}
    />
  </div>

  <!-- 名刺生成ボタン -->
  <button 
    on:click={generateCard} 
    disabled={!hasPrivateKey || isLoading || !message.trim()}
    class="px-6 py-3 rounded-lg text-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed {!hasPrivateKey || isLoading || !message.trim() ? 'bg-gray-400 text-gray-600' : 'bg-blue-500 text-white hover:bg-blue-600'}"
  >
    {isLoading ? '🔄 生成中...' : '📄 名刺を生成'}
  </button>

  <!-- 名刺表示 -->
  {#if cardGenerated && payload && signature}
    <div class="w-2/3 mt-8">
      <div class="border-2 border-gray-300 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-900 text-white overflow-hidden">
        <div class="flex flex-col md:flex-row divide-y md:divide-x md:divide-y-0 divide-gray-600">
          <div class="flex-1 p-6">
            <h2 class="text-4xl font-bold mb-2">{payload.message}</h2>
            <p class="text-gray-300">デジタル名刺</p>
          </div>
          <div class="flex-1 p-6">
            <h3 class="text-xl font-semibold mb-4">署名情報</h3>
            <div class="space-y-3">
              <div class="bg-black/20 rounded p-3">
                <table class="w-full text-sm">
                  <tbody class="space-y-1">
                    <tr>
                      <td class="py-1 pr-3 text-gray-300 border-r border-gray-600">緯度:</td>
                      <td class="py-1 pl-3 font-mono">{payload.latitude}</td>
                    </tr>
                    <tr>
                      <td class="py-1 pr-3 text-gray-300 border-r border-gray-600">経度:</td>
                      <td class="py-1 pl-3 font-mono">{payload.longitude}</td>
                    </tr>
                    <tr>
                      <td class="py-1 pr-3 text-gray-300 border-r border-gray-600">UTC時刻:</td>
                      <td class="py-1 pl-3 font-mono text-xs">{payload.timestamp}</td>
                    </tr>
                    <tr>
                      <td class="py-1 pr-3 text-gray-300 border-r border-gray-600">メッセージ:</td>
                      <td class="py-1 pl-3 font-mono">{payload.message}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 class="text-sm font-semibold mb-2 text-gray-300">デジタル署名</h4>
                <div class="bg-black/30 rounded p-3 font-mono text-xs break-all leading-relaxed">
                  {signature}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style lang="postcss">
  /* 既存のスタイルを保持 */
</style>
