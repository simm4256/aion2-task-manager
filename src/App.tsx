import { useState, useEffect } from 'react';
import './App.css';
import type { TaskDefinition, TaskType, CharacterTaskCompletion } from './types/Task.ts';
// @ts-ignore
import type { ResourceDefinition, CharacterResourceState } from './types/Resource.ts'; // New import
import HomeworkView from './components/HomeworkView'; // New component for Homework tab
// @ts-ignore
import TaskForm from './components/TaskForm'; // Reusing TaskForm for adding new task definitions
import Tabs, { Tab } from './components/Tabs';
import ResetConfigModal from './components/ResetConfigModal'; // New import
import type { Character } from './types/Character.ts'; // RESTORED
import CharacterForm from './components/CharacterForm'; // RESTORED
import ResourceView from './components/ResourceView'; // New import
import ResourceForm from './components/ResourceForm'; // New import
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import { isSameDay, getResetCheckPoint, getMostRecentDailyResetPoint, getNextCustomResetTime, getNextWeeklyResetTime, getMostRecentWeeklyResetPoint } from './utils/date-helpers';
import DataManagementModal from './components/DataManagementModal'; // NEW import

const initialTaskDefinitions: TaskDefinition[] = [
  { id: uuidv4(), name: '일일 퀘스트 A', type: 'daily' },
  { id: uuidv4(), name: '일일 퀘스트 B', type: 'daily' },
  { id: uuidv4(), name: '주간 던전 C', type: 'weekly' },
  { id: uuidv4(), name: '주간 전장 D', type: 'weekly' },
];

const resetTasks = (
  currentCompletions: CharacterTaskCompletion[],
  allTaskDefs: TaskDefinition[],
  now: Date,
  dailyResetHour: number,
  dailyResetMinute: number,
  dailyResetSecond: number,
  weeklyResetDay: number,
  weeklyResetHour: number,
  weeklyResetMinute: number,
  weeklyResetSecond: number
): CharacterTaskCompletion[] => {

  const finalCompletions = currentCompletions.map(completion => {
    const taskDef = allTaskDefs.find(td => td.id === completion.taskDefinitionId);
    if (!taskDef) return completion; // Should not happen if data integrity is maintained

    const lastReset = new Date(completion.lastResetDate);
    let needsReset = false;


    if (taskDef.type === 'daily') {
      const currentDailyResetPoint = getMostRecentDailyResetPoint(now, dailyResetHour, dailyResetMinute, dailyResetSecond);
      const lastResetDailyResetPoint = getMostRecentDailyResetPoint(lastReset, dailyResetHour, dailyResetMinute, dailyResetSecond);

      needsReset = currentDailyResetPoint.getTime() > lastResetDailyResetPoint.getTime();
    } else if (taskDef.type === 'weekly') {
      const currentWeeklyResetPoint = getMostRecentWeeklyResetPoint(now, weeklyResetDay, weeklyResetHour, weeklyResetMinute, weeklyResetSecond);
      const lastResetWeeklyResetPoint = getMostRecentWeeklyResetPoint(lastReset, weeklyResetDay, weeklyResetHour, weeklyResetMinute, weeklyResetSecond);

      needsReset = currentWeeklyResetPoint.getTime() > lastResetWeeklyResetPoint.getTime();
    } else if (taskDef.type === 'custom') {
      if (!taskDef.resetDays || taskDef.resetDays.length === 0 || !taskDef.resetTime) {
        needsReset = false; // Custom task not properly configured
      } else {
        const nextCustomReset = getNextCustomResetTime(lastReset, taskDef.resetDays, taskDef.resetTime);
        if (nextCustomReset && now.getTime() >= nextCustomReset.getTime()) {
          needsReset = true;
        } else {
          needsReset = false; // No reset needed yet
        }
      }
    } // Closes the 'else if (taskDef.type === 'custom')' block

    if (needsReset) {
      return { ...completion, completed: false, lastResetDate: now.toISOString() };
    }
    return completion;
  });

  return finalCompletions;
};

const calculateResourceCharges = (
  currentStates: CharacterResourceState[],
  resourceDefinitions: ResourceDefinition[],
  now: Date
): CharacterResourceState[] => {
  return currentStates.map(state => {
    const resourceDef = resourceDefinitions.find(rd => rd.id === state.resourceDefinitionId);
    if (!resourceDef) return state;

    const chargeCycleMillis = resourceDef.chargeCycleHours * 60 * 60 * 1000;
    const lastUpdateTimeDate = new Date(state.lastUpdateTime);

    if (chargeCycleMillis <= 0) return state; // Prevent infinite loop for 0-hour cycle

    let newAmount = state.currentAmount;
    let newLastUpdateTime = new Date(lastUpdateTimeDate);

    // 1. Determine the reference start time for the cycle (e.g., today at charge start time)
    // This is the start of the charge cycle relative to the current day.
    const currentDayChargeStartTime = new Date(now);
    currentDayChargeStartTime.setHours(resourceDef.chargeStartTimeHour, resourceDef.chargeStartTimeMinute, resourceDef.chargeStartTimeSecond, 0);

    // 2. Find the *first* scheduled charge time *strictly after* 'now'.
    // We adjust currentDayChargeStartTime until it is after 'now'.
    let nextScheduledChargeTime = new Date(currentDayChargeStartTime);
    while (nextScheduledChargeTime.getTime() <= now.getTime()) {
      nextScheduledChargeTime.setTime(nextScheduledChargeTime.getTime() + chargeCycleMillis);
    }
    
    // 3. Now, iterate *backwards* from nextScheduledChargeTime to find all charges that
    //    should have occurred between lastUpdateTimeDate and now.
    let count = 0;
    let tempChargeTime = new Date(nextScheduledChargeTime);

    // Subtract one cycle to get the most recent charge time that is <= now
    tempChargeTime.setTime(tempChargeTime.getTime() - chargeCycleMillis);

    // Keep going as long as the temporary charge time is strictly *after* lastUpdateTimeDate.
    // This correctly counts all charges that should have happened since lastUpdateTimeDate up to now.
    while (tempChargeTime.getTime() > lastUpdateTimeDate.getTime()) {
      count++;
      newAmount += resourceDef.amountPerCharge;
      newLastUpdateTime.setTime(tempChargeTime.getTime()); // Update lastUpdateTime to this specific charge point
      tempChargeTime.setTime(tempChargeTime.getTime() - chargeCycleMillis);
    }
    
    // Ensure amount does not exceed maxAmount
    newAmount = Math.min(newAmount, resourceDef.maxAmount);

    if (count > 0) {
      return { ...state, currentAmount: newAmount, lastUpdateTime: newLastUpdateTime.toISOString() };
    }
    return state;
  });
};

function App() {
  const [taskDefinitions, setTaskDefinitions] = useState<TaskDefinition[]>([]);
  // ... existing state variables ...
  const [showDataManagementModal, setShowDataManagementModal] = useState(false); // NEW state for modal visibility
  const [resourceDefinitions, setResourceDefinitions] = useState<ResourceDefinition[]>([]); // New state for resources
  const [characterTaskCompletions, setCharacterTaskCompletions] = useState<CharacterTaskCompletion[]>([]);
  const [characterResourceStates, setCharacterResourceStates] = useState<CharacterResourceState[]>([]); // New state for resources
  const [characters, setCharacters] = useState<Character[]>([]); // RESTORED
  const [showCharacterForm, setShowCharacterForm] = useState(false); // RESTORED
  const [showTaskDefinitionForm, setShowTaskDefinitionForm] = useState(false);
  const [showResourceDefinitionForm, setShowResourceDefinitionForm] = useState(false); // New state for resource form visibility
  const [showResetConfigModal, setShowResetConfigModal] = useState(false);
  const [dailyResetHour, setDailyResetHour] = useState(5); // Default to 5 AM
  const [dailyResetMinute, setDailyResetMinute] = useState(0);
  const [dailyResetSecond, setDailyResetSecond] = useState(0);
  const [weeklyResetDay, setWeeklyResetDay] = useState(3); // Default to Wednesday (0=Sun, 1=Mon, ..., 3=Wed)
  const [weeklyResetHour, setWeeklyResetHour] = useState(5); // Default to 5 AM
  const [weeklyResetMinute, setWeeklyResetMinute] = useState(0);
  const [weeklyResetSecond, setWeeklyResetSecond] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [editingTask, setEditingTask] = useState<TaskDefinition | null>(null); // NEW: State to hold task being edited
  const [editingResource, setEditingResource] = useState<ResourceDefinition | null>(null); // NEW: State to hold resource being edited
  const [dataLoadedKey, setDataLoadedKey] = useState(0); // NEW: State to force data reload after import
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null); // NEW: State to store the beforeinstallprompt event
  const [showInstallButton, setShowInstallButton] = useState(false); // NEW: State to control visibility of install button

  const ALL_LOCAL_STORAGE_KEYS = [
    'aion2-daily-reset-hour',
    'aion2-weekly-reset-day',
    'aion2-weekly-reset-hour',
    'aion2-daily-reset-minute',
    'aion2-daily-reset-second',
    'aion2-weekly-reset-minute',
    'aion2-weekly-reset-second',
    'aion2-task-definitions',
    'aion2-characters',
    'aion2-character-task-completions',
    'aion2-resource-definitions',
    'aion2-character-resource-states',
  ];

  const exportAllData = () => {
    const allData: { [key: string]: string | null } = {};
    ALL_LOCAL_STORAGE_KEYS.forEach(key => {
      allData[key] = localStorage.getItem(key);
    });
    return JSON.stringify(allData);
  };

  const importAllData = (dataString: string): boolean => {
    try {
      const parsedData = JSON.parse(dataString);
      if (typeof parsedData !== 'object' || parsedData === null) {
        console.error("Import data is not a valid object.");
        return false;
      }

      // Clear existing local storage data managed by the app
      ALL_LOCAL_STORAGE_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });

      // Set new data
      ALL_LOCAL_STORAGE_KEYS.forEach(key => {
        if (parsedData[key] !== undefined && parsedData[key] !== null) {
          localStorage.setItem(key, parsedData[key]);
        }
      });
      setDataLoadedKey(prev => prev + 1); // Trigger data reload
      return true;
    } catch (e) {
      console.error("Failed to parse import data string:", e);
      return false;
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    (deferredPrompt as any).prompt();
    const { outcome } = await (deferredPrompt as any).userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // Load reset config from localStorage on initial mount and task definitions/completions
  useEffect(() => {
    const savedDailyResetHour = localStorage.getItem('aion2-daily-reset-hour');
    const savedWeeklyResetDay = localStorage.getItem('aion2-weekly-reset-day');
    const savedWeeklyResetHour = localStorage.getItem('aion2-weekly-reset-hour');
    const savedDailyResetMinute = localStorage.getItem('aion2-daily-reset-minute');
    const savedDailyResetSecond = localStorage.getItem('aion2-daily-reset-second');
    const savedWeeklyResetMinute = localStorage.getItem('aion2-weekly-reset-minute');
    const savedWeeklyResetSecond = localStorage.getItem('aion2-weekly-reset-second');

    if (savedDailyResetHour) setDailyResetHour(parseInt(savedDailyResetHour));
    if (savedWeeklyResetDay) setWeeklyResetDay(parseInt(savedWeeklyResetDay));
    if (savedWeeklyResetHour) setWeeklyResetHour(parseInt(savedWeeklyResetHour));
    if (savedDailyResetMinute) setDailyResetMinute(parseInt(savedDailyResetMinute));
    if (savedDailyResetSecond) setDailyResetSecond(parseInt(savedDailyResetSecond));
    if (savedWeeklyResetMinute) setWeeklyResetMinute(parseInt(savedWeeklyResetMinute));
    if (savedWeeklyResetSecond) setWeeklyResetSecond(parseInt(savedWeeklyResetSecond));

    // RESTORED character-related checks and loading
    if (taskDefinitions.length === 0 && characters.length === 0 && characterTaskCompletions.length === 0 && resourceDefinitions.length === 0 && characterResourceStates.length === 0 || dataLoadedKey > 0) { // Check for resource states too
      const savedTaskDefinitions = localStorage.getItem('aion2-task-definitions');
      const savedCharacters = localStorage.getItem('aion2-characters'); // RESTORED
      const savedCompletions = localStorage.getItem('aion2-character-task-completions');
      const savedResourceDefinitions = localStorage.getItem('aion2-resource-definitions'); // NEW
      const savedCharacterResourceStates = localStorage.getItem('aion2-character-resource-states'); // NEW

      let loadedTaskDefinitions: TaskDefinition[] = savedTaskDefinitions ? JSON.parse(savedTaskDefinitions) : initialTaskDefinitions;
      let loadedCharacters: Character[] = savedCharacters ? JSON.parse(savedCharacters) : []; // RESTORED
      let loadedCompletions: CharacterTaskCompletion[] = savedCompletions ? JSON.parse(savedCompletions) : [];
      let loadedResourceDefinitions: ResourceDefinition[] = savedResourceDefinitions ? JSON.parse(savedResourceDefinitions) : []; // NEW
      let loadedCharacterResourceStates: CharacterResourceState[] = savedCharacterResourceStates ? JSON.parse(savedCharacterResourceStates) : []; // NEW

      setTaskDefinitions(loadedTaskDefinitions);
      setCharacters(loadedCharacters); // RESTORED
      setResourceDefinitions(loadedResourceDefinitions); // NEW
      
      const now = new Date();
      // Apply reset logic on load
      const resetLoadedCompletions = resetTasks(
        loadedCompletions,
        loadedTaskDefinitions,
        now,
        dailyResetHour,
        dailyResetMinute,
        dailyResetSecond,
        weeklyResetDay,
        weeklyResetHour,
        weeklyResetMinute,
        weeklyResetSecond
      );
      setCharacterTaskCompletions(resetLoadedCompletions);

      // Initialize and apply missed charges for characterResourceStates for existing characters and resource definitions
      let processedCharacterResourceStates: CharacterResourceState[] = [];
      loadedCharacters.forEach(character => {
        loadedResourceDefinitions.forEach(resourceDef => {
          let resourceState = loadedCharacterResourceStates.find(
            crs => crs.characterId === character.id && crs.resourceDefinitionId === resourceDef.id
          );
          if (!resourceState) {
            resourceState = {
              id: uuidv4(),
              characterId: character.id,
              resourceDefinitionId: resourceDef.id,
              currentAmount: 0, // Default initial amount
              lastUpdateTime: now.toISOString(),
            };
          }
          processedCharacterResourceStates.push(resourceState);
        });
      });

      // Apply any missed charges to the loaded/initialized resource states
      const updatedOnLoadResourceStates = calculateResourceCharges(processedCharacterResourceStates, loadedResourceDefinitions, now);
      setCharacterResourceStates(updatedOnLoadResourceStates); // NEW
    }
  }, [dataLoadedKey]); // Empty dependency array to run only once on mount for initial load


  useEffect(() => {
    let lastCheckedSecond = -1;

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const currentSecond = now.getSeconds();

      if (currentSecond !== lastCheckedSecond) {
        // RESTORED characters.length > 0 check
        if (taskDefinitions.length > 0 && characters.length > 0) {
          setCharacterTaskCompletions(prevCompletions => {
            const updatedCompletions = resetTasks(
              prevCompletions,
              taskDefinitions,
              now,
              dailyResetHour,
              dailyResetMinute,
              dailyResetSecond,
              weeklyResetDay,
              weeklyResetHour,
              weeklyResetMinute,
              weeklyResetSecond
            );
            return updatedCompletions;
          });

          // Check and update character resource states based on their charge cycles using the new helper
          setCharacterResourceStates(prevStates => {
            const updatedStates = calculateResourceCharges(prevStates, resourceDefinitions, now);
            if (JSON.stringify(updatedStates) !== JSON.stringify(prevStates)) {
                return updatedStates;
            }
            return prevStates;
          });
        }
        lastCheckedSecond = currentSecond;
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [taskDefinitions, characters, resourceDefinitions, dailyResetHour, dailyResetMinute, dailyResetSecond, weeklyResetDay, weeklyResetHour, weeklyResetMinute, weeklyResetSecond]); // Add resourceDefinitions to dependencies

  // NEW: Effect to listen for PWA beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem('aion2-task-definitions', JSON.stringify(taskDefinitions));
  }, [taskDefinitions]);

  useEffect(() => {
    localStorage.setItem('aion2-character-task-completions', JSON.stringify(characterTaskCompletions));
  }, [characterTaskCompletions]);

  useEffect(() => {
    localStorage.setItem('aion2-daily-reset-hour', dailyResetHour.toString());
    localStorage.setItem('aion2-weekly-reset-day', weeklyResetDay.toString());
    localStorage.setItem('aion2-weekly-reset-hour', weeklyResetHour.toString());
    localStorage.setItem('aion2-daily-reset-minute', dailyResetMinute.toString());
    localStorage.setItem('aion2-daily-reset-second', dailyResetSecond.toString());
    localStorage.setItem('aion2-weekly-reset-minute', weeklyResetMinute.toString());
    localStorage.setItem('aion2-weekly-reset-second', weeklyResetSecond.toString());
  }, [dailyResetHour, weeklyResetDay, weeklyResetHour, dailyResetMinute, dailyResetSecond, weeklyResetMinute, weeklyResetSecond]);

  useEffect(() => { // RESTORED
    localStorage.setItem('aion2-characters', JSON.stringify(characters));
  }, [characters]);

  useEffect(() => { // NEW: Save resource definitions
    localStorage.setItem('aion2-resource-definitions', JSON.stringify(resourceDefinitions));
  }, [resourceDefinitions]);

  useEffect(() => { // NEW: Save character resource states
    localStorage.setItem('aion2-character-resource-states', JSON.stringify(characterResourceStates));
  }, [characterResourceStates]);


  const handleToggleCompletion = (characterId: string, taskDefinitionId: string) => {
    setCharacterTaskCompletions(prevCompletions =>
      prevCompletions.map(completion =>
        completion.characterId === characterId && completion.taskDefinitionId === taskDefinitionId
          ? { ...completion, completed: !completion.completed }
          : completion
      )
    );
  };

  const handleSaveTask = (
    id: string | undefined,
    name: string,
    type: TaskType,
    resetDays?: number[], // New: Array of numbers (0-6, Sun-Sat)
    resetTime?: string,   // New: Time in "HH:mm" format
    imageUrl?: string,
    displayFirstLetterOnImage?: boolean
  ) => {
    if (id) {
      // Update existing task definition
      setTaskDefinitions(prevTaskDefs =>
        prevTaskDefs.map(taskDef =>
          taskDef.id === id
            ? {
                ...taskDef,
                name,
                type,
                resetDays: type === 'custom' ? resetDays : undefined,
                resetTime: type === 'custom' ? resetTime : undefined,
                imageUrl: imageUrl || undefined,
                displayFirstLetterOnImage: displayFirstLetterOnImage || undefined,
              }
            : taskDef
        )
      );
    } else {
      // Add new task definition
      const newTaskDef: TaskDefinition = {
        id: uuidv4(),
        name,
        type,
        ...(type === 'custom' && { resetDays, resetTime }),
        imageUrl: imageUrl || undefined,
        displayFirstLetterOnImage: displayFirstLetterOnImage || undefined,
      };
      setTaskDefinitions(prevTaskDefs => [...prevTaskDefs, newTaskDef]);

      // Initialize completion entries for all existing characters for this new task definition
      setCharacters(currentChars => {
        setCharacterTaskCompletions(prevCompletions => {
          const now = new Date();
          const newCompletions = currentChars.map(char => ({
            id: uuidv4(),
            characterId: char.id,
            taskDefinitionId: newTaskDef.id,
            completed: false,
            lastResetDate: now.toISOString(),
          }));
          return [...prevCompletions, ...newCompletions];
        });
        return currentChars; // No change to characters
      });
    }
    setShowTaskDefinitionForm(false);
    setEditingTask(null); // Reset editing state
  };

  const handleDeleteTaskDefinition = (taskDefinitionId: string) => {
    setTaskDefinitions(prevTaskDefs => prevTaskDefs.filter(taskDef => taskDef.id !== taskDefinitionId));
    setCharacterTaskCompletions(prevCompletions =>
      prevCompletions.filter(completion => completion.taskDefinitionId !== taskDefinitionId)
    );
  };

  const handleAddCharacter = (name: string) => { // RESTORED
    const newCharacter: Character = {
      id: uuidv4(),
      name,
    };
    setCharacters(prevCharacters => [...prevCharacters, newCharacter]);
    // Also create completion entries for all existing task definitions for this new character
    setTaskDefinitions(currentTaskDefs => {
      setCharacterTaskCompletions(prevCompletions => {
        const now = new Date();
                  const newCharacterCompletions = currentTaskDefs.map(taskDef => ({
                    id: uuidv4(),
                    characterId: newCharacter.id,
                    taskDefinitionId: taskDef.id,
                    completed: false,
                    lastResetDate: now.toISOString(),        }));
        return [...prevCompletions, ...newCharacterCompletions];
      });
      return currentTaskDefs; // No change to task definitions
    });
    // NEW: Also initialize resource states for the new character
    setResourceDefinitions(currentResourceDefs => {
      setCharacterResourceStates(prevStates => {
        const now = new Date();
        const newCharacterResourceStates = currentResourceDefs.map(resourceDef => ({
          id: uuidv4(),
          characterId: newCharacter.id,
          resourceDefinitionId: resourceDef.id,
          currentAmount: 0,
          lastUpdateTime: now.toISOString(),
        }));
        return [...prevStates, ...newCharacterResourceStates];
      });
      return currentResourceDefs;
    });

    setShowCharacterForm(false);
  };

  const handleEditCharacterName = (characterId: string, newName: string) => { // NEW
    setCharacters(prevCharacters =>
      prevCharacters.map(char =>
        char.id === characterId ? { ...char, name: newName } : char
      )
    );
  };

  const handleDeleteCharacter = (id: string) => { // RESTORED
    setCharacters(prevCharacters => prevCharacters.filter(char => char.id !== id));
    setCharacterTaskCompletions(prevCompletions =>
      prevCompletions.filter(completion => completion.characterId !== id)
    );
    // NEW: Delete resource states for the character
    setCharacterResourceStates(prevStates => prevStates.filter(state => state.characterId !== id));
  };

  const handleReorderTaskDefinitions = (reorderedTaskDefinitions: TaskDefinition[]) => {
    setTaskDefinitions(reorderedTaskDefinitions);
  };

  const handleReorderCharacters = (reorderedCharacters: Character[]) => { // NEW
    setCharacters(reorderedCharacters);
  };

  const handleSaveResource = (id: string | undefined, name: string, chargeStartTimeHour: number, chargeStartTimeMinute: number, chargeStartTimeSecond: number, chargeCycleHours: number, amountPerCharge: number, maxAmount: number, displayOnCharacter: boolean, imageUrl?: string, displayFirstLetterOnImage?: boolean) => {
    if (id) {
      // Update existing resource definition
      setResourceDefinitions(prevResourceDefs =>
        prevResourceDefs.map(resourceDef =>
          resourceDef.id === id
            ? { ...resourceDef, name, chargeStartTimeHour, chargeStartTimeMinute, chargeStartTimeSecond, chargeCycleHours, amountPerCharge, maxAmount, displayOnCharacter, imageUrl: imageUrl || undefined, displayFirstLetterOnImage: displayFirstLetterOnImage || undefined }
            : resourceDef
        )
      );
    } else {
      // Add new resource definition
      const newResourceDef: ResourceDefinition = {
        id: uuidv4(),
        name,
        chargeStartTimeHour,
        chargeStartTimeMinute,
        chargeStartTimeSecond,
        chargeCycleHours,
        amountPerCharge,
        maxAmount,
        displayOnCharacter,
        imageUrl: imageUrl || undefined,
        displayFirstLetterOnImage: displayFirstLetterOnImage || undefined,
      };
      setResourceDefinitions(prevResourceDefs => [...prevResourceDefs, newResourceDef]);

      // Initialize resource states for all existing characters for this new resource definition
      setCharacters(currentChars => {
        setCharacterResourceStates(prevStates => {
          const now = new Date();
          const newStates = currentChars.map(char => ({
            id: uuidv4(),
            characterId: char.id,
            resourceDefinitionId: newResourceDef.id,
            currentAmount: 0,
            lastUpdateTime: now.toISOString(),
          }));
          return [...prevStates, ...newStates];
        });
        return currentChars;
      });
    }
    setShowResourceDefinitionForm(false);
    setEditingResource(null); // Reset editing state
  };

  const handleDeleteResourceDefinition = (resourceDefinitionId: string) => {
    setResourceDefinitions(prevResourceDefs => prevResourceDefs.filter(resourceDef => resourceDef.id !== resourceDefinitionId));
    setCharacterResourceStates(prevStates => prevStates.filter(state => state.resourceDefinitionId !== resourceDefinitionId));
  };

  const handleReorderResourceDefinitions = (reorderedResourceDefinitions: ResourceDefinition[]) => {
    setResourceDefinitions(reorderedResourceDefinitions);
  };

  const handleSaveResetConfig = (dailyHour: number, dailyMinute: number, dailySecond: number, weeklyDay: number, weeklyHour: number, weeklyMinute: number, weeklySecond: number) => {
    setDailyResetHour(dailyHour);
    setDailyResetMinute(dailyMinute);
    setDailyResetSecond(dailySecond);
    setWeeklyResetDay(weeklyDay);
    setWeeklyResetHour(weeklyHour);
    setWeeklyResetMinute(weeklyMinute);
    setWeeklyResetSecond(weeklySecond);
  };

  // NEW: handleEditTaskDefinition function
  const handleEditTaskDefinition = (taskDefinition: TaskDefinition) => {
    setEditingTask(taskDefinition);
    setShowTaskDefinitionForm(true);
  };

  // NEW: handleEditResourceDefinition function
  const handleEditResourceDefinition = (resourceDefinition: ResourceDefinition) => {
    setEditingResource(resourceDefinition);
    setShowResourceDefinitionForm(true);
  };

  const handleSetTestDailyReset = (hour: number, minute: number, second: number) => {
    setDailyResetHour(hour);
    setDailyResetMinute(minute);
    setDailyResetSecond(second);
  };

  return (
    <div className="container">
      <div className="current-time" onClick={() => setShowResetConfigModal(true)}>
        {(() => {
          const year = currentTime.getFullYear().toString().slice(-2);
          const month = (currentTime.getMonth() + 1).toString().padStart(2, '0');
          const day = currentTime.getDate().toString().padStart(2, '0');
          const hours = currentTime.getHours().toString().padStart(2, '0');
          const minutes = currentTime.getMinutes().toString().padStart(2, '0');
          const seconds = currentTime.getSeconds().toString().padStart(2, '0');
          const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][currentTime.getDay()];
          return `${year}.${month}.${day}(${dayOfWeek}) ${hours}:${minutes}:${seconds}`;
        })()}
      </div>
      <div className="header-controls"> {/* NEW wrapper div for header elements */}
        {showInstallButton && (
            <button onClick={handleInstallClick} className="pwa-install-button">
                PWA 설치
            </button>
        )}
        <button className="data-management-button" onClick={() => setShowDataManagementModal(true)}>
            데이터 관리
        </button>
      </div>
      <h1>아이온2 숙제 관리</h1>

      <Tabs>
        <Tab label="숙제">
                      <HomeworkView
                        taskDefinitions={taskDefinitions}
                        characters={characters} // RESTORED
                        characterTaskCompletions={characterTaskCompletions}
                        resourceDefinitions={resourceDefinitions} // NEW PROP
                        characterResourceStates={characterResourceStates} // NEW PROP
                        onToggleCompletion={handleToggleCompletion}
                        onDeleteTaskDefinition={handleDeleteTaskDefinition}
                        onAddCharacter={handleAddCharacter} // RESTORED
                        onDeleteCharacter={handleDeleteCharacter} // RESTORED
                        onEditCharacterName={handleEditCharacterName} // NEW PROP
                        onReorderCharacters={handleReorderCharacters} // NEW PROP
                        onReorderTaskDefinitions={handleReorderTaskDefinitions}
                        onEditTaskDefinition={handleEditTaskDefinition} // NEW PROP
                        currentTime={currentTime}
                        dailyResetHour={dailyResetHour}
                        dailyResetMinute={dailyResetMinute}
                        dailyResetSecond={dailyResetSecond}
                        weeklyResetDay={weeklyResetDay}
                        weeklyResetHour={weeklyResetHour}
                        weeklyResetMinute={weeklyResetMinute}
                        weeklyResetSecond={weeklyResetSecond}
                        setShowTaskDefinitionForm={setShowTaskDefinitionForm}
                        showCharacterForm={showCharacterForm} // RESTORED
                        setShowCharacterForm={setShowCharacterForm} // CORRECTED
                      />        </Tab>
        {/* NEW Resource Tab */}
        <Tab label="자원">
          <ResourceView
            resourceDefinitions={resourceDefinitions}
            characters={characters}
            characterResourceStates={characterResourceStates}
            onDeleteResourceDefinition={handleDeleteResourceDefinition}
            onUpdateResourceAmount={(characterId, resourceDefinitionId, newAmount) => {
              setCharacterResourceStates(prevStates =>
                prevStates.map(state =>
                  state.characterId === characterId && state.resourceDefinitionId === resourceDefinitionId
                    ? { ...state, currentAmount: newAmount, lastUpdateTime: new Date().toISOString() }
                    : state
                )
              );
            }}
            onReorderResourceDefinitions={handleReorderResourceDefinitions} // NEW PROP
            onEditResourceDefinition={handleEditResourceDefinition} // NEW PROP
            onEditCharacterName={handleEditCharacterName} // NEW PROP
            onReorderCharacters={handleReorderCharacters} // NEW PROP
            setShowResourceDefinitionForm={setShowResourceDefinitionForm}
            currentTime={currentTime} // NEW PROP
          />
        </Tab>
      </Tabs>

      {showResetConfigModal && (
        <ResetConfigModal
          onClose={() => setShowResetConfigModal(false)}
          onSave={handleSaveResetConfig}
          initialDailyResetHour={dailyResetHour}
          initialWeeklyResetDay={weeklyResetDay}
          initialWeeklyResetHour={weeklyResetHour}
          initialDailyResetMinute={dailyResetMinute}
          initialDailyResetSecond={dailyResetSecond}
          initialWeeklyResetMinute={weeklyResetMinute}
          initialWeeklyResetSecond={weeklyResetSecond}
          onSetTestDailyReset={handleSetTestDailyReset}
        />
      )}

      {/* Conditional rendering for TaskForm */}
      {showTaskDefinitionForm && (
        <div className="form-overlay">
          <TaskForm
            initialTask={editingTask || undefined} // Pass initial task for editing
            onSaveTask={handleSaveTask}
            onCancel={() => {
              setShowTaskDefinitionForm(false);
              setEditingTask(null); // Reset editing state
            }}
          />
        </div>
      )}

      {/* Conditional rendering for ResourceForm */}
      {showResourceDefinitionForm && (
        <div className="form-overlay">
          <ResourceForm
            initialResource={editingResource ? {
                ...editingResource,
                chargeStartTimeHour: editingResource.chargeStartTimeHour,
                chargeStartTimeMinute: editingResource.chargeStartTimeMinute,
                chargeStartTimeSecond: editingResource.chargeStartTimeSecond,
            } : undefined} // Pass initial resource for editing
            onSaveResource={handleSaveResource}
            onCancel={() => {
              setShowResourceDefinitionForm(false);
              setEditingResource(null); // Reset editing state
            }}
          />
        </div>
      )}

      {/* Conditional rendering for CharacterForm, moved from removed Character Tab */}
      {showCharacterForm && (
        <div className="form-overlay">
          <CharacterForm onAddCharacter={handleAddCharacter} onCancel={() => setShowCharacterForm(false)} />
        </div>
      )}

      {showDataManagementModal && (
        <DataManagementModal
          onClose={() => setShowDataManagementModal(false)}
          onExport={exportAllData}
          onImport={importAllData}
        />
      )}
    </div>
  );
}

export default App;