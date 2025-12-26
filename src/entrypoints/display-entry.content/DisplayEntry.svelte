<script lang="ts">
  import { onMount } from "svelte";
  import { DISPLAY_ENTRY } from "@/lib/constants";
  import type { Settings } from "@/lib/entity/Settings";
  import type { DictionaryEntry } from "@/lib/entity/DictionaryEntry";
  import VolumeDownIcon from "@/lib/icons/volume-down-icon.svelte";
  import TimesIcon from "@/lib/icons/times-icon.svelte";
  import { slide } from "svelte/transition";

  let environment = chrome || browser;

  let open = $state(false);
  let entry = $state<DictionaryEntry | null>(null);
  let settings = $state<Settings | null>(null);
  let playing = $state(false);
  let timeout: Nodejs.Timeout | null = null;

  /**
   * Function that transfer text to speech.
   *
   * @param {string} word Word to transfer
   * @param {string} language Language to transfer
   */
  async function playWord() {
    playing = true;
    let audio = new Audio(
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${settings?.learnedLanguage}&q=${encodeURIComponent(entry?.translation)}`,
    );
    await audio.play();
    playing = false;
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeDialog();
    }
  }

  function openDialog() {
    open = true;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      open = false;
    }, settings!.displayDurationSeconds * 1000);
  }

  function closeDialog() {
    open = false;
    clearTimeout(timeout);
  }

  function handleMount() {
    environment.runtime.onMessage.addListener(
      async (request, sender, sendResponse) => {
        switch (request.messageId) {
          case DISPLAY_ENTRY: {
            settings = request.settings as Settings;
            entry = request.entry as DictionaryEntry;
            openDialog();
            break;
          }
          default: {
            // noOp
          }
        }
      },
    );
  }

  onMount(handleMount);
</script>

<svelte:window onkeydown={handleEscape} />
{#if open}
  <section
    class="fixed top-0 w-full left-0 flex flex-col top-layer shadow"
    transition:slide={{ duration: 1500 }}
  >
    <div class="relative w-full">
      <div class="bg-base-100 opacity-90 absolute h-full w-full -z-50"></div>
      <div class="w-full flex flex-col gap-4 p-4">
        <h1 class="text-base-content">Parrotly</h1>
        <div
          class="div flex flex-col items-center justify-center text-base-content"
        >
          <span class="text-base-content text-2xl font-bold">{entry?.word}</span
          >
          <span class="text-base-content text-2xl font-bold">-</span>
          <span class="text-base-content text-2xl font-bold"
            >{entry?.translation}</span
          >
        </div>
        <div class="w-full flex justify-end gap-4">
          <button
            class="btn btn-square btn-ghost text-base-content"
            onclick={playWord}
          >
            <VolumeDownIcon class="relative left-1" />
          </button>
          <button
            class="btn btn-square btn-ghost text-base-content"
            onclick={closeDialog}
          >
            <TimesIcon />
          </button>
        </div>
      </div>
    </div>
  </section>
{/if}

<style>
  .top-layer {
    z-index: 1000;
  }
</style>
