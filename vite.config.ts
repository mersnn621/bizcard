import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		fs: {
			strict: false
		},
		watch: {
			ignored: ['**/node_modules/**', '**/.git/**']
		}
	},
	optimizeDeps: {
		include: ['@sveltejs/kit', 'svelte'],
		exclude: ['@tailwindcss/vite']
	},
	build: {
		target: 'esnext',
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['svelte']
				}
			}
		}
	},
	esbuild: {
		target: 'esnext'
	}
});
