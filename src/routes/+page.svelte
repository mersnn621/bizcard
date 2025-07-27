<script lang="ts">
  import { onMount } from 'svelte';

  let currentTime = '';

  onMount(() => {
    const updateTime = () => {
      currentTime = new Date().toISOString();
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>BizCard - デジタル名刺システム</title>
</svelte:head>

<div class="flex flex-col w-screen items-center pt-32">
  <div class="flex flex-col w-2/3 text-center">
    <h1 class="text-3xl font-bold">名刺</h1>
    <p class="subtitle">位置証明デジタル名刺システム</p>
  </div>

  <div class="flex items-center mt-4 text-center gap-4">
    <a href="/card" class="px-4 py-2 rounded-md border-2 text-2xl">
      名刺を生成
    </a>

    <a href="/verify" class="px-4 py-2 rounded-md border-2 text-2xl">
      署名を検証
    </a>
  </div>

</div>

<style>
</style>
