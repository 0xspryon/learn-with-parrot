import AddToDictionary from "./DisplayEntry.svelte";
import { mount, unmount } from "svelte";
import "@/assets/tailwind.css";

export default defineContentScript({
  matches: ['<all_urls>'], // Or specific URLs
  cssInjectionMode: 'ui', // This is key for Shadow DOM injection
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'lwp-display-entry',
      position: 'inline', // Or 'overlay', 'fixed', etc.
      anchor: 'body', // Or a specific CSS selector
      onMount: (container) => {
        // Create the Svelte app inside the UI container
        return mount(AddToDictionary, { target: container });
      },
      onRemove: (app: any) => {
        unmount(app);
      },
    });
    ui.mount();
  },
});
