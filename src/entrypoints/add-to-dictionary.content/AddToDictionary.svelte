<script lang="ts">
  import { onMount } from "svelte";
  import { computePosition, shift, flip, offset } from "@floating-ui/dom";
  import { CONTEXT_MENU_CLICKED, ADD_TO_DICTIONARY } from "@/lib/constants";
  import type { Settings } from "@/lib/entity/Settings";
  import VolumeDownIcon from "@/lib/icons/volume-down-icon.svelte";
  import SaveIcon from "@/lib/icons/save-icon.svelte";

  let environment = chrome || browser;

  let open = $state(false);
  let word = $state("");
  let translation = $state("");
  let settings = $state<Settings | null>(null);
  let loading = $state(false);
  let playing = $state(false);
  let controller: AbortController | null;
  const modalCheckBoxId = "modal-check-box";
  let wrapper: HTMLDivElement;

  function positionDialog() {
    if (window == undefined || !window.getSelection || !wrapper) {
      return;
    }
    const selectionCoords = window
      .getSelection()
      .getRangeAt(0)
      .getBoundingClientRect();
    const clientX = selectionCoords.left;
    const clientY = selectionCoords.bottom;
    const virtualEl = {
      getBoundingClientRect() {
        return {
          width: 0,
          height: 0,
          x: clientX,
          y: clientY,
          left: clientX,
          right: clientX,
          top: clientY,
          bottom: clientY,
        };
      },
    };

    computePosition(virtualEl, wrapper, {
      placement: "right-start",
      middleware: [offset(5), flip(), shift()],
    }).then(({ x, y }) => {
      Object.assign(wrapper.style, {
        top: `${y}px`,
        left: `${x}px`,
      });
    });
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    loading = true;
    environment.runtime.sendMessage({
      messageId: ADD_TO_DICTIONARY,
      word,
      translation,
    });
    open = false;
  }

  /**
   * Function that transfer text to speech.
   *
   * @param {string} word Word to transfer
   * @param {string} language Language to transfer
   */
  async function playWord() {
    playing = true;
    try {
      let audio = new Audio(
        `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${settings?.learnedLanguage}&q=${encodeURIComponent(translation)}`,
      );
      await audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
    } finally {
      playing = false;
    }
  }

  /**
   * Translate word from one language to another.
   *
   * @param {string} from
   * @param {string} into
   * @param {string} text Word to translate
   * @param {function} after Function that will be executed after translation is fetched
   */
  async function translate(from, into, text) {
    loading = true;
    // text.toLowerCase() gives more variants of result in some cases.
    let googleTranslator =
      "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&dt=bd&hl=" +
      encodeURIComponent(from) +
      "&sl=" +
      encodeURIComponent(from) +
      "&tl=" +
      encodeURIComponent(into) +
      "&q=" +
      encodeURIComponent(text.toLowerCase());
    controller = new AbortController();
    const response = await fetch(googleTranslator, {
      signal: controller.signal,
    });
    console.log({ response });
    if (response.status !== 200) {
      return;
    }
    let alternative: any = {};
    let alternatives: any[] = [];
    const result = await response.json();
    translation = result[0][0][0];
    translation = translation.charAt(0).toUpperCase() + translation.slice(1);

    // Save alternatives for future functionality.
    if (result[1] != null) {
      for (let i = 0; i < result[1].length; i++) {
        alternative = {};

        // Capitalize first letter in each alternative word.
        result[1][i][1].forEach(function (part, index, array) {
          array[index] =
            array[index].charAt(0).toUpperCase() + array[index].slice(1);
        });
        alternative[result[1][i][0]] = result[1][i][1];
        alternatives.push(alternative);
      }
    }
    loading = false;
  }

  function abortTranslation() {
    if (controller) {
      controller.abort();
      controller = null;
      loading = false;
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeDialog();
    }
  }

  function closeDialog() {
    open = false;
    abortTranslation();
  }

  function handleMount() {
    environment.runtime.onMessage.addListener(
      async (request, sender, sendResponse) => {
        switch (request.messageId) {
          case CONTEXT_MENU_CLICKED: {
            word = request.word;
            translation = request.translation;
            settings = request.settings;
            language = request.learnedLanguage;
            open = true;
            // schedule positioning of the dialog in next microtask
            setTimeout(() => {
              if (wrapper) {
                positionDialog();
              }
            }, 0);
            await translate(
              settings?.nativeLanguage,
              settings?.learnedLanguage,
              word,
            );
            break;
          }
          default: {
            // noOp
            break;
          }
        }
      },
    );
  }

  onMount(handleMount);
</script>

<svelte:window onkeydown={handleEscape} />
<input
  type="checkbox"
  id={modalCheckBoxId}
  class="modal-toggle"
  bind:checked={open}
/>
{#if open}
  <div class="modal no-backdrop" role="dialog">
    <div class="modal-box max-w-sm absolute shadow" bind:this={wrapper}>
      <h3 class="text-lg text-base-content font-bold">Parrotly</h3>
      <form class="contents" onsubmit={handleSubmit}>
        <div class="flex flex-col gap-3 pt-3">
          <fieldset class="fieldset">
            <!-- <legend class="fieldset-legend">Word</legend> -->
            <input
              required
              type="text"
              class="input w-full text-base-content"
              bind:value={word}
            />
          </fieldset>
          <fieldset class="fieldset">
            <!-- <legend class="fieldset-legend">Translated word</legend> -->
            <input
              required
              type="text"
              class="input w-full text-base-content"
              bind:value={translation}
              oninput={abortTranslation}
            />
          </fieldset>
        </div>
        <div class="modal-action">
          <button
            class="btn btn-ghost text-base-content"
            type="button"
            onclick={playWord}
          >
            {#if loading || playing}
              <span class="loading loading-dots loading-sm"></span>
            {:else}
              <VolumeDownIcon class="relative left-1" />
            {/if}
          </button>
          <button class="btn btn-ghost text-base-content">
            {#if loading}
              <span class="loading loading-dots loading-sm"></span>
            {:else}
              <SaveIcon />
            {/if}
          </button>
        </div>
      </form>
    </div>
    <label
      onclick={() => closeDialog()}
      class="modal-backdrop no-backdrop"
      for={modalCheckBoxId}>Close</label
    >
  </div>
{/if}

<style>
  .no-backdrop {
    background-color: transparent !important;
  }
</style>
