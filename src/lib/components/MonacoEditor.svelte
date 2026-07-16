<script lang="ts">
    import type { MonacoEditorProps } from '$lib/components/ComponentPropsTypes';
		import { onMount, onDestroy } from 'svelte';

    let {
			value = '',
			language = 'python',
			theme = 'vs-dark',
			readOnly = false,
			height = '60vh',
			onChange = () => {}
		}: MonacoEditorProps = $props()

    let editor: any;
    let editorContainer: HTMLElement;
    let isInitialized = false;

    function loadMonacoScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            if ((window as any).monaco) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
            script.onload = () => {
                (window as any).require.config({ 
                    paths: { 
                        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' 
                    } 
                });
                (window as any).require(['vs/editor/editor.main'], () => {
                    isInitialized = true;
                    resolve();
                });
            };
            script.onerror = () => reject(new Error('Failed to load Monaco script'));
            document.body.appendChild(script);
        });
    }

    onMount(async () => {
        try {
            await loadMonacoScript();
            if (isInitialized && editorContainer) {
                editor = (window as any).monaco.editor.create(editorContainer, {
                    value,
                    language,
                    theme,
                    readOnly,
                    automaticLayout: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollbar: {
                        vertical: 'visible',
                        horizontal: 'visible',
                        useShadows: false,
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10
                    }
                });

                editor.onDidChangeModelContent(() => {
                    onChange(editor.getValue());
                });
            }
        } catch (e) {
            console.error('Failed to initialize Monaco editor:', e);
        }
    });

    onDestroy(() => {
        if (editor) {
            editor.dispose();
        }
    });

    export function getEditor() {
        return editor;
    }
</script>

<div class="monaco-editor" bind:this={editorContainer} style="height: {height};" /> 
