<script lang="ts">
  import { onMount } from 'svelte';
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
  let hasPrivateKeyState = false;
  let fileInput: HTMLInputElement;
  let privateKeyPem = '';
  let privateKeyInfo: string = '';
  let message = '';


  async function generateCard() {
    isLoading = true;
    error = null;

    try {
      console.log('秘密鍵取得:', { hasKey: !!privateKeyPem, keyLength: privateKeyPem?.length || 0 });
      
      if (!privateKeyPem) {
        throw new Error('秘密鍵が見つかりません。まず秘密鍵を設定してください。');
      }

      // 2. デバイスの位置情報を取得
      const position = await getCurrentPosition();

      // 3. 現在の日時を取得
      const timestamp = getCurrentTimestamp();

      // 4. ペイロードを作成（サーバーから取得したメッセージを使用）
      payload = {
        latitude: position.latitude,
        longitude: position.longitude,
        timestamp: timestamp,
        message: message
      };

      // 5. 秘密鍵をインポート
      const privateKey = await importPrivateKey(privateKeyPem);

      // 6. 署名を生成
      signature = await signPayload(payload, privateKey);
      
      console.log('名刺生成完了:', { 
        payloadLength: JSON.stringify(payload).length,
        signatureLength: signature.length,
      });

      cardGenerated = true;

    } catch (err) {
      error = err instanceof Error ? err.message : 'エラーが発生しました';
      console.error('Card generation failed:', err);
    } finally {
      isLoading = false;
    }
  }

  function setupPrivateKey() {
    
    // ファイル選択ダイアログを開く
    fileInput.click();
  }

  async function handleFileSelect(event: Event) {
    
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;
    
    console.log('ファイル選択:', file.name, file.size);
    
    // .pemファイルかチェック
    if (!file.name.toLowerCase().endsWith('.pem')) {
      alert('PEMファイル（.pem拡張子）を選択してください。');
      return;
    }
    
    try {
      const privateKeyContent = await file.text();
      console.log('ファイル内容読み込み完了:', privateKeyContent.length, '文字');
      
      // PKCS#8形式のPEMファイルかチェック
      if (!privateKeyContent.includes('-----BEGIN PRIVATE KEY-----') || 
          !privateKeyContent.includes('-----END PRIVATE KEY-----')) {
        alert('PKCS#8形式のPRIVATE KEYファイルが必要です。\n\nOpenSSLで生成する場合は以下のコマンドを使用してください：\nopenssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in ec_key.pem -out private_key.pem');
        return;
      }

      privateKeyPem = privateKeyContent;
      const oldState = hasPrivateKeyState;
      checkPrivateKeyStatus();
      updatePrivateKeyInfo(file.name);
      console.log('状態変更:', { 
        oldState, 
        newState: hasPrivateKeyState, 
        privateKeyInfo 
      });
    } catch (error) {
      console.error('File reading error:', error);
      alert('ファイルの読み込みに失敗しました。');
    }
    
    // ファイル選択をリセット
    target.value = '';
  }

  function clearPrivateKey() {
    
    localStorage.removeItem('privateKey');
    localStorage.removeItem('privateKeyFileName');
    checkPrivateKeyStatus();
    privateKeyInfo = '';
    alert('秘密鍵が削除されました。');
  }

  function checkPrivateKeyStatus() {

    const privateKey = privateKeyPem;
    hasPrivateKeyState = !!privateKey;
    console.log('秘密鍵状態チェック:', { 
      hasKey: !!privateKey, 
      keyLength: privateKey?.length || 0,
      hasPrivateKeyState
    });
    
    if (hasPrivateKeyState) {
      const fileName = localStorage.getItem('privateKeyFileName') || '不明なファイル';
      const keyData = localStorage.getItem('privateKey');
      if (keyData) {
        // PEM形式から簡単な情報を抽出
        const lines = keyData.split('\n').filter(line => line.trim());
        privateKeyInfo = `${fileName}`;
      }
    } else {
      privateKeyInfo = '';
    }
  }

  function updatePrivateKeyInfo(fileName: string) {
    localStorage.setItem('privateKeyFileName', fileName);
    checkPrivateKeyStatus();
  }

  function hasPrivateKey() {
    return hasPrivateKeyState;
  }

  onMount(() => {
    checkPrivateKeyStatus();
  });
</script>

<svelte:head>
  <title>デジタル名刺 - BizCard</title>
</svelte:head>

<div class="flex flex-col w-screen items-center pt-32">
  <h1 class="text-3xl font-bold mb-8">デジタル名刺生成</h1>
  
  <div class="flex flex-col items-center">
    <!-- 隠れたファイル入力要素 -->
    <input 
      bind:this={fileInput}
      type="file" 
      accept=".pem"
      on:change={handleFileSelect}
    class="hidden"
      
    />
    
    {#if !hasPrivateKey()}
      <button on:click={setupPrivateKey} class="px-4 py-2 rounded-md border-2 text-xl mb-4">
        ファイルから秘密鍵を選択
      </button>
    {/if}
    
    {#if hasPrivateKey()}
      <button on:click={setupPrivateKey} class="btn btn-secondary">
        秘密鍵を変更
      </button>
      
      <button on:click={clearPrivateKey} class="btn btn-danger">
        秘密鍵を削除
      </button>
      
      <button 
        on:click={generateCard} 
        disabled={isLoading}
        class="btn btn-primary"
      >
        {isLoading ? '生成中...' : '名刺を生成'}
      </button>
    {/if}
  </div>

  <div class={`px-4 py-2 rounded-md border-2 text-center mb-4 ${privateKeyInfo ? 'bg-green-300/40 border-green-300' : 'bg-red-300/40 border-red-300'}`}>
    {#if privateKeyInfo}
      <p><strong>現在の秘密鍵:</strong> {privateKeyInfo}</p>
    {:else}
      <p><strong>秘密鍵が設定されていません</strong></p>
      <p>名刺を生成するには、まず秘密鍵ファイル（.pem）を選択してください。</p>
    {/if}
  </div>


  {#if error}
    <div class="px-4 py-2 rounded-md border-2 text-center mb-4 bg-red-300/40 border-red-300">
      <strong>エラー:</strong> {error}
    </div>
  {/if}

<input 
    type="text" 
    bind:value={message} 
    placeholder="名刺に表示するメッセージを入力してください"
    class="mb-4 w-1/3 py-2 px-4 rounded-md border-2 overflow-auto"
  />
  <button on:click={generateCard} class="px-4 py-2 rounded-md border-2 text-xl mb-4">名刺を生成</button>

  {#if cardGenerated || true}
    <div class="flex-col md:flex-row flex border-2 p-4 w-2/3 divide-y md:divide-x md:divide-y-0 divide-dotted divide-slate-300 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-lg">
        <div class="flex-1 p-4">
            <h2 class="text-4xl font-bold mb-4">mersnn621</h2>
        </div>
      <div class="flex-1 p-4">
        <h3 class="text-2xl mb-3">署名情報</h3>
        <div class="mb-2">
          <table class="table-auto  border border-gray-400 rounded-md">
            <tbody>
              <tr>
                <td>緯度:</td>
                <td>{payload?.latitude}</td>
              </tr>
              <tr>
              <td>経度:</td>
              <td>{payload?.longitude}</td>
            </tr>
            <tr>
              <td>タイムスタンプ(UTC):</td>
              <td>{payload?.timestamp}</td>
            </tr>
            <tr>
              <td>メッセージ:</td>
              <td>{payload?.message}</td>
            </tr>
            </tbody>    
          </table>
        </div>
        <div >
          <h3 >デジタル署名</h3>
          <p class=" text-sm m-0 p-2 rounded-md bg-white/20 font-mono break-all">{signature ? signature : '署名がありません'}</p>
        </div>
      </div>
    </div>
  {/if}
</div>

<style lang="postcss">
    td{
        border: 1px solid #ccc;
        padding: 8px;
    }
</style>
