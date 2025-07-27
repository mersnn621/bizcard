<script lang="ts">
  import "../app.css";
  import { page } from "$app/stores";

  let { children } = $props();
</script>

<div class="bg-slate-900 text-white h-screen">
  <nav class="p-4 w-screen flex justify-center">
    <div
      class="w-4/5 flex justify-between md:flex-wrap shadow-lg p-4 rounded-full bg-slate-800 fixed px-8"
    >
      <a href="/" class="text-3xl">名刺</a>

      <div class="md:flex gap-16 my-auto hidden">
        <a href="/" class="hover:bg-gray-200/30 px-4 py-2 rounded-md">
          ホーム
        </a>
        <a href="/card" class="hover:bg-gray-200/30 px-4 py-2 rounded-md">
          名刺生成
        </a>
        <a href="/verify" class="hover:bg-gray-200/30 px-4 py-2 rounded-md">
          署名検証
        </a>
      </div>
    </div>
  </nav>

  <main class="">
    {@render children()}
  </main>

  <footer class="fixed bottom-24 md:hidden">
    <nav class="p-4 w-screen flex justify-center">
      <div
        class="flex justify-between md:flex-wrap shadow-lg p-4 rounded-full bg-slate-800 fixed px-8"
      >

        <div class="flex gap-16 my-auto">
          <a href="/" class="hover:bg-gray-200/30 px-4 py-2 rounded-md">
            ホーム
          </a>
          <a href="/card" class="hover:bg-gray-200/30 px-4 py-2 rounded-md">
            名刺生成
          </a>
          <a href="/verify" class="hover:bg-gray-200/30 px-4 py-2 rounded-md">
            署名検証
          </a>
        </div>
      </div>
    </nav>
  </footer>
</div>

<style>
</style>
