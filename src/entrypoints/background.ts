import { storage } from '#imports';
import {
  SETTINGS_KEY,
  DISPLAY_ENTRY,
  DICTIONARY_KEY,
  ADD_TO_DICTIONARY,
  CONTEXT_MENU_CLICKED,
} from "@/lib/constants";
import { type DictionaryEntry, defaultDictionary } from '@/lib/entity/DictionaryEntry';
import { type Settings, defaultSettings } from '@/lib/entity/Settings';

export default defineBackground(() => {
  let environment = browser || chrome;
  const contextMenuId = "learn-with-parrot-context-menu";
  const displayNextEntryMenuId = "display-next-entry-menu";
  const displayAlarmName = "parrotly-display-entry-alarm";
  let dictionary: Array<DictionaryEntry> = [];
  let settings: Settings

  // Do not call this method with an empty array, it will return undefined.
  function getRandomElement<T>(arr: T[]): T {
    if (arr.length === 1) {
      return arr[0];
    }
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
  }

  async function displayNextEntry() {
    console.log("Displaying next entry");
    let randomEntry = dictionary[0]
    if (!dictionary.length) {
      return
    } else if (dictionary.length >= 2) {
      let trialCount = 0
      do {
        randomEntry = getRandomElement(dictionary);
        trialCount++;
      } while ((!randomEntry || randomEntry?.displayCount >= settings.maxEntryDisplayCount) && trialCount < 3);
      const activeTab = await environment.tabs.query({ active: true, currentWindow: true });

      console.log({ activeTab });
      if (!activeTab || activeTab.length === 0) {
        if (!settings.enableNotifications) {
          return
        }
        // show notification
        environment.notifications.create({
          type: 'basic',
          iconUrl: environment.runtime.getURL('/learn-with-parrot.png'),
          title: 'Parrotly',
          message: `Word: ${randomEntry.word}\nTranslation: ${randomEntry.translation}`,
        });
      } else {
        environment.tabs.sendMessage(
          activeTab[0].id,
          {
            settings,
            entry: randomEntry,
            messageId: DISPLAY_ENTRY,
          })
      }
      // update entry display count
      randomEntry.displayCount++;
      await saveDictionaryEntry(randomEntry)
    }
  }

  async function setupDisplayNextEntry(settings: Settings) {
    const existingAlarm = await environment.alarms.get(displayAlarmName);
    const intervalInMinutes = settings.displayIntervalSeconds / 60;
    if (existingAlarm && existingAlarm.periodInMinutes === intervalInMinutes) {
      console.log(`Alarm already exists with correct interval: ${intervalInMinutes} minutes`);
      return;
    }

    // Clear any existing alarm
    await environment.alarms.clear(displayAlarmName);

    // Create a new alarm with the configured interval
    // Note: Chrome alarms minimum is 1 minute for packed extensions
    await environment.alarms.create(displayAlarmName, {
      periodInMinutes: intervalInMinutes,
      delayInMinutes: intervalInMinutes
    });

    console.log(`Alarm set to trigger every ${intervalInMinutes} minutes`);
  }

  async function readFromStorage() {
    dictionary = (await storage.getItem<DictionaryEntry[]>(DICTIONARY_KEY)) ?? defaultDictionary;
    settings = (await storage.getItem<Settings>(SETTINGS_KEY)) ?? defaultSettings;
    storage.watch<Settings>(
      SETTINGS_KEY,
      (newSettings) => {
        if (newSettings == undefined) {
          settings = defaultSettings
        } else {
          settings = newSettings
        }
        setupDisplayNextEntry(settings);
      },
    );
    setupDisplayNextEntry(settings);
    storage.watch<DictionaryEntry[]>(
      DICTIONARY_KEY,
      (newDictionary) => {
        if (newDictionary == undefined) {
          return
        }
        dictionary = newDictionary
      },
    );
  }

  async function saveDictionaryEntry(entry: DictionaryEntry) {
    const entryIndex = dictionary.findIndex(e => e.id === entry.id);
    if (entryIndex === -1) {
      // This is a new entry, we should append it to the dictionary
      dictionary.unshift(entry);
    } else {
      // This is an old entry, we should update it
      dictionary[entryIndex] = entry;
    }
    await storage.setItem<DictionaryEntry[]>(DICTIONARY_KEY, dictionary);
  }

  // Listen for alarm events
  environment.alarms.onAlarm.addListener((alarm) => {
    console.log(`Alarm triggered: ${alarm.name}`);
    if (alarm.name === displayAlarmName) {
      displayNextEntry();
    }
  });

  environment.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === contextMenuId) {
      environment.tabs.sendMessage(
        tab.id,
        {
          messageId: CONTEXT_MENU_CLICKED,
          word: info.selectionText,
          settings,
        })
    }
    if (info.menuItemId === displayNextEntryMenuId) {
      displayNextEntry()
    }
  });

  environment.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
      console.log("received message");
      switch (request.messageId) {
        case ADD_TO_DICTIONARY: {
          const { word, translation } = request;
          const entry: DictionaryEntry = {
            word,
            translation,
            displayCount: 0,
            quizDisplayCount: 0,
            id: crypto.randomUUID(),
          };
          await saveDictionaryEntry(entry)
          break
        }
      }
    }
  );

  environment.action.onClicked.addListener(async () => {
    // Open the dashboard in a new tab
    console.log("Opening dashboard");
    await environment.tabs.create({ url: 'dashboard.html' });
  });

  environment.runtime.onInstalled.addListener(async (details) => {
    saveDictionaryEntry({
      word: "Learn vocabulary",
      translation: "Apprendre le vocabulaire",
      id: crypto.randomUUID(),
      displayCount: 0,
      quizDisplayCount: 0,
    })

    environment.contextMenus.create({
      id: displayNextEntryMenuId,
      title: "LWP display next entry",
      type: 'normal',
      contexts: ['page'],
    })

    environment.contextMenus.create({
      id: contextMenuId,
      title: "Parrotly",
      type: 'normal',
      contexts: ['selection'],
    })
    if (details.reason === 'install') {
      await storage.setItem<Settings>(SETTINGS_KEY, defaultSettings);
      settings = defaultSettings
      await environment.tabs.create({ url: 'dashboard.html?firstInstall' });
    }
  })

  environment.runtime.onStartup.addListener(async () => {
    readFromStorage()
      .then(() => { })
  })
  // set up
  readFromStorage()
    .then(() => { })
});
