<script lang="ts">
  import { storage } from "#imports";
  import { languages, SETTINGS_KEY } from "./constants";
  import { defaultSettings, type Settings } from "./entity/Settings";
  import { onMount } from "svelte";

  const { trigger } = $props();
  let settings = $state<Settings>(defaultSettings);
  let modal: HTMLDialogElement;

  async function readState() {
    settings =
      (await storage.getItem<Settings>(SETTINGS_KEY)) ?? defaultSettings;
  }

  async function saveSettings(newSettings: Settings) {
    await storage.setItem<Settings>(SETTINGS_KEY, newSettings);
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    saveSettings(settings);
    closeModal();
  }

  function openModal() {
    if (modal) {
      modal.showModal();
    }
  }

  function closeModal() {
    if (modal) {
      modal.close();
    }
  }

  onMount(() => {
    readState();
  });
</script>

{#if trigger}
  {@render trigger(openModal)}
{/if}
<dialog bind:this={modal} class="modal">
  {#if settings}
    <div class="modal-box">
      <h3 class="text-lg font-bold">Settings</h3>
      <form onsubmit={handleSubmit} class="contents">
        <div class="py-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Maximum display of an entry</legend>
            <input
              type="number"
              class="input w-full"
              placeholder="50"
              bind:value={settings.maxEntryDisplayCount}
            />
            <p class="label">
              Maximum number of times an entry will be displayed.<br />
              beyond which we stop displaying it
            </p>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Maximum quiz display count</legend>
            <input
              class="input w-full"
              type="number"
              placeholder="50"
              bind:value={settings.maxQuizDisplayCount}
            />
            <p class="label">
              Maximum number of times user will must pass the entry quiz.<br />
              beyond which we stop displaying it
            </p>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Display interval</legend>
            <input
              class="input w-full"
              type="number"
              bind:value={settings.displayIntervalSeconds}
            />
            <p class="label">
              How long before we display the next entry in seconds
            </p>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Display duration</legend>
            <input
              type="number"
              class="input w-full"
              bind:value={settings.displayDurationSeconds}
            />
            <p class="label">
              How long does a display last before<br />
              it's automatically dismissed in seconds
            </p>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">I speak</legend>
            <select class="select w-full" bind:value={settings.nativeLanguage}>
              <option disabled selected>Select a language</option>
              {#each languages as language}
                <option
                  value={language.value}
                  selected={language.value === settings.nativeLanguage}
                >
                  {language.label}
                </option>
              {/each}
            </select>
            <p class="label">Your native language</p>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">I want to learn</legend>
            <select class="select w-full" bind:value={settings.learnedLanguage}>
              <option disabled selected>Select a language</option>
              {#each languages as language}
                <option
                  value={language.value}
                  selected={language.value === settings.learnedLanguage}
                >
                  {language.label}
                </option>
              {/each}
            </select>
            <p class="label">The language you wish to learn</p>
          </fieldset>
          <fieldset class="fieldset pt-2">
            <label class="label">
              <input type="checkbox" checked="checked" class="checkbox" />
              Enable notifications
            </label>
          </fieldset>
        </div>
        <div class="modal-action">
          <button class="btn" type="button">Close</button>
          <button class="btn" type="submit">save</button>
        </div>
      </form>
    </div>
  {/if}
</dialog>
