// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// Svelte 5 型定義
declare module 'svelte' {
	interface HTMLAttributes<T> {
		'on:click'?: (event: MouseEvent & { currentTarget: EventTarget & T }) => void;
		'on:dragover'?: (event: DragEvent & { currentTarget: EventTarget & T }) => void;
		'on:dragleave'?: (event: DragEvent & { currentTarget: EventTarget & T }) => void;
		'on:drop'?: (event: DragEvent & { currentTarget: EventTarget & T }) => void;
		'on:change'?: (event: Event & { currentTarget: EventTarget & T }) => void;
	}
}

export {};
