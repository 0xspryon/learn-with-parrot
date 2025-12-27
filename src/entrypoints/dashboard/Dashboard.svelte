<script lang="ts">
  import { onMount } from "svelte";
  import CogIcon from "@/lib/icons/cog-icon.svelte";
  import SettingsDialog from "@/lib/SettingsDialog.svelte";
  import { DICTIONARY_KEY } from "@/lib/constants";
  import {
    defaultDictionary,
    type DictionaryEntry,
  } from "@/lib/entity/DictionaryEntry";
  import TrashIcon from "@/lib/icons/trash-icon.svelte";

  let dictionary = $state<DictionaryEntry[]>(defaultDictionary);
  let settingsDialog: SettingsDialog

  async function readState() {
    dictionary =
      (await storage.getItem<DictionaryEntry[]>(DICTIONARY_KEY)) ??
      // defaultDictionary;
      console.log({ dictionary });
    storage.watch<DictionaryEntry[]>(DICTIONARY_KEY, (newDictionary) => {
      if (newDictionary == null) {
        newDictionary = defaultDictionary;
      }
      dictionary = newDictionary;
    });
  }

  function deleteEntry(index: number) {
    dictionary = dictionary.filter((_, i) => i !== index);
    // we can only save a raw dictionary and not a signal wrapper of the
    // dictionary variable as it's defined with a `$state`
    const storageDictionary = Array.from(dictionary);
    storage.setItem<DictionaryEntry[]>(DICTIONARY_KEY, storageDictionary);
  }

  onMount(() => {
    readState();

    const url = new URL(window.location.href);
    let firstInstall = url.searchParams.get('firstInstall');
    console.log('firstInstall:', firstInstall);
    if (firstInstall != undefined) {
      settingsDialog.openModal()
    }
  });
</script>

<main class="p-4 flex flex-col gap-4 bg-base-100">
  <nav class="flex justify-between items-center">
    <h1 class="text-2xl font-bold">Parrotly</h1>
    <SettingsDialog bind:this={settingsDialog}>
      {#snippet trigger(openModal)}
        <button
          class="btn btn-square btn-ghost text-base-content"
          onclick={openModal}
        >
          <CogIcon />
        </button>
      {/snippet}
    </SettingsDialog>
  </nav>

  <ul class="flex flex-wrap gap-4 justify-start">
    {#each dictionary as entry, index (entry.id)}
      <li class="card w-64 bg-base-200 shadow-xl">
        <div class="card-body flex-col flex">
          <h2 class="card-title self-center">{entry.translation}</h2>
          <span class="self-center">-</span>
          <p class="self-center">{entry.word}</p>
          <div class="card-actions justify-end">
            <button
              class="btn btn-square btn-ghost"
              onclick={() => deleteEntry(index)}
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </li>
    {/each}
  </ul>
</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #54bc4ae0);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
</style>
