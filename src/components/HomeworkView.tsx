import React, { useState } from 'react';
import type { Character } from '../types/Character.ts';
import type { TaskDefinition, CharacterTaskCompletion } from '../types/Task.ts';
import type { ResourceDefinition, CharacterResourceState } from '../types/Resource.ts'; // NEW IMPORT
import { getTimeRemainingUntilReset } from '../utils/date-helpers';
import { getImageUrl } from '../utils/image-helpers';
import CharacterForm from './CharacterForm'; // RESTORED

interface HomeworkViewProps {
  taskDefinitions: TaskDefinition[];
  characters: Character[];
  characterTaskCompletions: CharacterTaskCompletion[];
  resourceDefinitions: ResourceDefinition[]; // NEW PROP
  characterResourceStates: CharacterResourceState[]; // NEW PROP
  onToggleCompletion: (characterId: string, taskDefinitionId: string) => void;
  onUpdateCount: (characterId: string, taskDefinitionId: string, newCount: number) => void; // NEW PROP
  onDeleteTaskDefinition: (taskDefinitionId: string) => void;
  onAddCharacter: (name: string) => void; // RESTORED
  onDeleteCharacter: (characterId: string) => void; // RESTORED
  onEditCharacterName: (characterId: string, newName: string) => void; // NEW PROP
  onReorderCharacters: (reorderedCharacters: Character[]) => void; // NEW PROP
  onReorderTaskDefinitions: (reorderedTaskDefinitions: TaskDefinition[]) => void;
  onEditTaskDefinition: (taskDefinition: TaskDefinition) => void; // NEW PROP
  currentTime: Date;
  dailyResetHour: number;
  dailyResetMinute: number;
  dailyResetSecond: number;
  weeklyResetDay: number;
  weeklyResetHour: number;
  weeklyResetMinute: number;
  weeklyResetSecond: number;
  setShowTaskDefinitionForm: (show: boolean) => void;
  showCharacterForm: boolean; // RESTORED
  setShowCharacterForm: (show: boolean) => void; // RESTORED
}

const HomeworkView: React.FC<HomeworkViewProps> = ({
  taskDefinitions,
  characters,
  characterTaskCompletions,
  resourceDefinitions, // NEW PROP
  characterResourceStates, // NEW PROP
  onToggleCompletion,
  onUpdateCount, // NEW PROP
  onDeleteTaskDefinition,
  onAddCharacter, // RESTORED
  onDeleteCharacter, // RESTORED
  onEditCharacterName, // NEW PROP
  onReorderCharacters, // NEW PROP
  onReorderTaskDefinitions,
  onEditTaskDefinition, // NEW PROP
  currentTime,
  dailyResetHour,
  dailyResetMinute,
  dailyResetSecond,
  weeklyResetDay,
  weeklyResetHour,
  weeklyResetMinute,
  weeklyResetSecond,
  setShowTaskDefinitionForm,
  showCharacterForm, // RESTORED
  setShowCharacterForm, // RESTORED
}) => {
  const allTaskDefs = taskDefinitions;

  // State for task definition drag and drop

  const [draggedTaskDefId, setDraggedTaskDefId] = useState<string | null>(null);

  const [dragOverTaskDefId, setDragOverTaskDefId] = useState<string | null>(null);

  const [originalTaskDefinitionsOrder, setOriginalTaskDefinitionsOrder] = useState<TaskDefinition[] | null>(null); // NEW STATE FOR TASK DRAG REVERT  // State for character drag and drop
  const [draggedCharacterId, setDraggedCharacterId] = useState<string | null>(null);
  const [dragOverCharacterId, setDragOverCharacterId] = useState<string | null>(null);
  const [originalCharactersOrder, setOriginalCharactersOrder] = useState<Character[] | null>(null); // NEW STATE FOR DRAG REVERT
  const [isCharacterDraggingActive, setIsCharacterDraggingActive] = useState<boolean>(false); // New state for global drag active
  const [visuallyHoveredCharacterId, setVisuallyHoveredCharacterId] = useState<string | null>(null); // New state for visual hover

  // State for count-type task dragging
  const [dragCountInfo, setDragCountInfo] = useState<{ characterId: string, taskDefId: string, startY: number, startCount: number } | null>(null);

  // State for character name editing
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [editedCharacterName, setEditedCharacterName] = useState<string>('');

  const getCompletionStatus = (characterId: string, taskDefinitionId: string) => {
    return characterTaskCompletions.find(
      c => c.characterId === characterId && c.taskDefinitionId === taskDefinitionId
    )?.completed || false;
  };

  const getTaskCount = (characterId: string, taskDefinitionId: string) => {
    return characterTaskCompletions.find(
      c => c.characterId === characterId && c.taskDefinitionId === taskDefinitionId
    )?.currentCount || 0;
  };

  // Drag logic for count-type tasks
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragCountInfo) return;

      const diffY = dragCountInfo.startY - e.clientY;
      const step = 10; // 10px moving up/down changes count by 1
      const countDiff = Math.round(diffY / step);
      const newCount = Math.max(0, dragCountInfo.startCount + countDiff);

      if (newCount !== getTaskCount(dragCountInfo.characterId, dragCountInfo.taskDefId)) {
        onUpdateCount(dragCountInfo.characterId, dragCountInfo.taskDefId, newCount);
      }
    };

    const handleMouseUp = () => {
      setDragCountInfo(null);
    };

    if (dragCountInfo) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragCountInfo, onUpdateCount, characterTaskCompletions]);

  const handleMouseDownCount = (e: React.MouseEvent, characterId: string, taskDefId: string) => {
    // Only left click for drag
    if (e.button !== 0) return;
    
    setDragCountInfo({
      characterId,
      taskDefId,
      startY: e.clientY,
      startCount: getTaskCount(characterId, taskDefId)
    });
  };

  // Character Name Editing Handlers
  const handleCharacterNameClick = (character: Character) => {
    setEditingCharacterId(character.id);
    setEditedCharacterName(character.name);
  };

  const handleCharacterNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedCharacterName(e.target.value);
  };

  const handleCharacterNameBlur = () => {
    if (editingCharacterId && editedCharacterName.trim() !== '') {
      onEditCharacterName(editingCharacterId, editedCharacterName.trim());
    }
    setEditingCharacterId(null);
    setEditedCharacterName('');
  };

  const handleCharacterNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCharacterNameBlur();
    }
    if (e.key === 'Escape') {
      setEditingCharacterId(null);
      setEditedCharacterName('');
    }
  };

  // Drag handlers for Task Definitions
  const handleDragStartTask = (e: React.DragEvent<HTMLTableCellElement>, taskDefId: string) => {
    setDraggedTaskDefId(taskDefId);
    setOriginalTaskDefinitionsOrder(allTaskDefs); // SAVE ORIGINAL ORDER
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskDefId);
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0); // Set drag image to the entire TH
  };

  const handleDragOverTask = (e: React.DragEvent<HTMLTableCellElement>, targetTaskDefId: string) => {
    e.preventDefault();
    if (!draggedTaskDefId || draggedTaskDefId === targetTaskDefId) {
      return;
    }

    setDragOverTaskDefId(targetTaskDefId);

    const draggedIndex = allTaskDefs.findIndex(def => def.id === draggedTaskDefId);
    const targetIndex = allTaskDefs.findIndex(def => def.id === targetTaskDefId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    const newOrderedTasks = [...allTaskDefs];
    const [removed] = newOrderedTasks.splice(draggedIndex, 1);
    newOrderedTasks.splice(targetIndex, 0, removed);

    onReorderTaskDefinitions(newOrderedTasks);
  };

  const handleDragLeaveTask = (e: React.DragEvent<HTMLTableCellElement>) => {
    // Only clear if the dragged item actually left the current target header
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOverTaskDefId(null);
    }
  };

  const handleDropTask = (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
    // The actual reordering is handled in handleDragOverTask,
    // so here we just clear the drag state and finalize the original order.
    setDraggedTaskDefId(null);
    setDragOverTaskDefId(null);
    setOriginalTaskDefinitionsOrder(null); // Finalize the order
  };

  const handleDragEndTask = () => {
    // If the draggedTaskDefId is still set, it means the drag was cancelled or dropped outside a valid target
    if (draggedTaskDefId && originalTaskDefinitionsOrder) {
      onReorderTaskDefinitions(originalTaskDefinitionsOrder); // Revert to original order
    }
    setDraggedTaskDefId(null);
    setDragOverTaskDefId(null);
    setOriginalTaskDefinitionsOrder(null);
  };

  // Drag handlers for Characters (ORIGINAL logic)
  const handleDragStartCharacter = (e: React.DragEvent<HTMLTableDataCellElement>, characterId: string) => {
    setDraggedCharacterId(characterId);
    setIsCharacterDraggingActive(true); // Set dragging active
    setOriginalCharactersOrder(characters); // SAVE ORIGINAL ORDER
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', characterId);
    // Set the drag image to the entire parent row (<tr>)
    const rowElement = e.currentTarget.closest('tr');
    if (rowElement) {
      e.dataTransfer.setDragImage(rowElement, 0, 0);
    }
    document.body.classList.add('character-dragging-active'); // Add class to body to disable global :hover
    e.stopPropagation(); // Stop propagation to prevent parent (tr) drag events
  };

  const handleDragOverCharacter = (e: React.DragEvent<HTMLTableRowElement>, targetCharacterId: string) => {
    e.preventDefault();
    if (!draggedCharacterId) {
      return;
    }

    // --- Reordering logic ---
    // This part should determine the reorder target *first* and update `characters` prop
    // then the visual hover logic can use the updated `characters` prop.
    // The `characters` prop is already the latest provisional order due to `onReorderCharacters`.

    if (draggedCharacterId !== targetCharacterId) { // Only update reorder state if target is different
        setDragOverCharacterId(targetCharacterId);

        const draggedIndex = characters.findIndex(char => char.id === draggedCharacterId);
        const targetIndex = characters.findIndex(char => char.id === targetCharacterId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            const newOrderedCharacters = [...characters];
            const [removed] = newOrderedCharacters.splice(draggedIndex, 1);
            newOrderedCharacters.splice(targetIndex, 0, removed);
            // This call will trigger a re-render with the new `characters` order
            onReorderCharacters(newOrderedCharacters);
        }
    }


    // --- Visual Hover Logic ---
    let currentVisuallyHoveredId: string | null = null;
    const mouseY = e.clientY;

    // Get the tbody element from the event target to get its bounding box
    const tbodyElement = e.currentTarget.parentElement;
    if (tbodyElement) {
        const tbodyRect = tbodyElement.getBoundingClientRect();
        const mouseYRelativeToTbody = mouseY - tbodyRect.top;

        // Get the height of a row dynamically. Assuming all rows have equal height.
        const firstRow = tbodyElement.querySelector('tr:not(.dragging-character-row)');
        let rowHeight = firstRow ? firstRow.getBoundingClientRect().height : 0;

        if (rowHeight === 0 && characters.length > 0) {
            // Fallback: estimate row height if no non-dragging row is found
            rowHeight = tbodyRect.height / characters.length;
        }

        if (rowHeight > 0) {
            let accumulatedHeight = 0;
            for (const char of characters) {
                if (char.id === draggedCharacterId) {
                    accumulatedHeight += rowHeight; // Account for the space it takes, but do not highlight it
                    continue; // Skip the dragged item itself for highlighting
                }

                // Check if mouse is within this character's visual bounds
                if (mouseYRelativeToTbody >= accumulatedHeight && mouseYRelativeToTbody < accumulatedHeight + rowHeight) {
                    currentVisuallyHoveredId = char.id;
                    break;
                }
                accumulatedHeight += rowHeight;
            }

            // If mouse is below the last character, set the last character as hovered (if not the dragged one)
            if (!currentVisuallyHoveredId && mouseYRelativeToTbody >= accumulatedHeight && characters.length > 0) {
                const nonDraggedChars = characters.filter(c => c.id !== draggedCharacterId);
                if (nonDraggedChars.length > 0) {
                    currentVisuallyHoveredId = nonDraggedChars[nonDraggedChars.length - 1].id;
                }
            }
        }
    }

    if (currentVisuallyHoveredId !== visuallyHoveredCharacterId) {
        setVisuallyHoveredCharacterId(currentVisuallyHoveredId);
    }
  };

  const handleDragLeaveCharacter = (e: React.DragEvent<HTMLTableRowElement>) => {
    // Only clear if the dragged item actually left the current target row
    // and is not entering a child element of the same row.
    // This is a common issue with dragleave and needs careful handling.
    // For now, simpler implementation assuming `dragover` will set the new one.
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOverCharacterId(null);
    }
  };

  const handleDropCharacter = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    // The actual reordering is handled in handleDragOverCharacter,
    // so here we just clear the drag state and finalize the original order.
    setDraggedCharacterId(null);
    setDragOverCharacterId(null);
    setOriginalCharactersOrder(null); // Finalize the order
  };

  const handleDragEndCharacter = () => {
    // If the draggedCharacterId is still set, it means the drag was cancelled or dropped outside a valid target
    if (draggedCharacterId && originalCharactersOrder) {
      onReorderCharacters(originalCharactersOrder); // Revert to original order
    }
    setDraggedCharacterId(null);
    setDragOverCharacterId(null);
    setOriginalCharactersOrder(null);
    setIsCharacterDraggingActive(false); // Set dragging inactive
    setVisuallyHoveredCharacterId(null); // Clear visual hover
    document.body.classList.remove('character-dragging-active'); // Remove class from body
  };


  return (
    <div className="homework-tab-content">
      <div className="action-buttons-container">
        <button onClick={() => setShowCharacterForm(true)} className="add-character-definition-btn">캐릭터 추가</button>
        <button onClick={() => setShowTaskDefinitionForm(true)} className="add-task-definition-btn">숙제 추가</button>
      </div>


      {allTaskDefs.length === 0 && <p className="no-tasks-for-homework">숙제를 추가해주세요.</p>}

      {allTaskDefs.length > 0 && (
        <div className="homework-table-wrapper">
          <div className="homework-table-container">
            <table>
              <thead>
                <tr>
                  <th className="character-header"></th>
                  {allTaskDefs.map(taskDef => (
                    <th
                      key={taskDef.id}
                      className={`task-header ${taskDef.type === 'weekly' ? 'weekly-task-header' : ''} ${taskDef.type === 'custom' ? 'custom-task-header' : ''} ${draggedTaskDefId === taskDef.id ? 'dragging' : ''} ${dragOverTaskDefId === taskDef.id ? 'drag-over' : ''}`}
                      draggable="true"
                      onDragStart={(e) => handleDragStartTask(e, taskDef.id)}
                      onDragOver={(e) => handleDragOverTask(e, taskDef.id)}
                      onDrop={handleDropTask}
                      onDragLeave={handleDragLeaveTask}
                      onDragEnd={handleDragEndTask}
                    >
                      <div
                        className="task-header-content"
                        onClick={() => onEditTaskDefinition(taskDef)}
                      >
                        <div className="task-header-name">
                          {taskDef.imageUrl ? (
                            <div className="image-overlay-container">
                              <img src={getImageUrl(taskDef.imageUrl)} alt={taskDef.name} className="task-image" />
                              {taskDef.displayFirstLetterOnImage && taskDef.name.trim().length > 0 && (
                                <span className="overlay-text">{taskDef.name.trim().charAt(0)}</span>
                              )}
                            </div>
                          ) : (
                            taskDef.name
                          )}
                        </div>
                        <div className="task-reset-countdown">
                          {getTimeRemainingUntilReset(taskDef, currentTime, dailyResetHour, dailyResetMinute, dailyResetSecond, weeklyResetDay, weeklyResetHour, weeklyResetMinute, weeklyResetSecond)}
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteTaskDefinition(taskDef.id)}
                        className="task-definition-delete-button"
                        title="숙제 정의 삭제"
                      >
                        x
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {characters.length === 0 ? (
                  <tr>
                    <td colSpan={allTaskDefs.length + 1} className="no-characters-message" onClick={() => setShowCharacterForm(true)}>
                      캐릭터를 추가해주세요.
                    </td>
                  </tr>
                ) : (
                  characters.map(character => (
                  <tr
                    key={character.id}
                    onDragOver={(e) => handleDragOverCharacter(e, character.id)}
                    onDrop={handleDropCharacter}
                    onDragLeave={handleDragLeaveCharacter}
                    onDragEnd={handleDragEndCharacter}
                    className={`
                      ${draggedCharacterId === character.id ? 'dragging-character-row' : ''}
                      ${dragOverCharacterId === character.id ? 'drag-over-character-row' : ''}
                      ${isCharacterDraggingActive && visuallyHoveredCharacterId === character.id ? 'visually-hovered-character-row' : ''}
                    `}
                  >
                    <td
                      className="character-name-cell"
                      onClick={() => handleCharacterNameClick(character)}
                      draggable="true"
                      onDragStart={(e) => handleDragStartCharacter(e, character.id)}
                    >
                      <div className="character-name-content">
                        {editingCharacterId === character.id ? (
                          <input
                            type="text"
                            value={editedCharacterName}
                            onChange={handleCharacterNameChange}
                            onBlur={handleCharacterNameBlur}
                            onKeyDown={handleCharacterNameKeyDown}
                            autoFocus
                            className="character-name-input"
                            onFocus={(e) => e.target.select()}
                          />
                        ) : (
                          <span>{character.name}</span>
                        )}
                        <div className="character-resources-display">
                          {resourceDefinitions
                            .filter(resDef => resDef.displayOnCharacter)
                            .map((resDef) => {
                              const charResourceState = characterResourceStates.find(
                                crs => crs.characterId === character.id && crs.resourceDefinitionId === resDef.id
                              );
                              const amount = charResourceState ? charResourceState.currentAmount : 0;
                              const isFull = amount >= resDef.maxAmount;

                              return (
                                <React.Fragment key={resDef.id}>
                                  <span className="character-resource-item">
                                    {resDef.imageUrl ? (
                                      <div className="image-overlay-container">
                                        <img src={getImageUrl(resDef.imageUrl)} alt={resDef.name} className="resource-image-small" />
                                        {resDef.displayFirstLetterOnImage && resDef.name.trim().length > 0 && (
                                          <span className="overlay-text small-overlay-text">{resDef.name.trim().charAt(0)}</span>
                                        )}
                                      </div>
                                    ) : (
                                      resDef.name.charAt(0)
                                    )}
                                    <span className={isFull ? 'resource-full-small' : 'resource-not-full-small'}>
                                      {amount}
                                    </span>
                                  </span>
                                </React.Fragment>
                              );
                            })}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCharacter(character.id);
                          }}
                          className="character-delete-button"
                          title="캐릭터 삭제"
                        >
                          x
                        </button>
                      </div>
                    </td>
                    {allTaskDefs.map(taskDef => {
                      const isCountType = taskDef.inputType === 'count';
                      return (
                        <td
                          key={taskDef.id}
                          className={`task-completion-cell ${taskDef.type === 'weekly' ? 'weekly-task-cell' : ''} ${taskDef.type === 'custom' ? 'custom-task-cell' : ''} ${isCountType ? 'count-type-cell' : ''}`}
                          onClick={() => {
                            if (!isCountType) {
                              onToggleCompletion(character.id, taskDef.id);
                            } else {
                              // For count type, single click increments
                              onUpdateCount(character.id, taskDef.id, getTaskCount(character.id, taskDef.id) + 1);
                            }
                          }}
                          onContextMenu={(e) => {
                            if (isCountType) {
                              e.preventDefault();
                              const currentCount = getTaskCount(character.id, taskDef.id);
                              onUpdateCount(character.id, taskDef.id, Math.max(0, currentCount - 1));
                            }
                          }}
                          onMouseDown={(e) => {
                            if (isCountType) {
                              handleMouseDownCount(e, character.id, taskDef.id);
                            }
                          }}
                        >
                          {isCountType ? (
                            <div className="count-cell-content">
                              <span className="count-value">{getTaskCount(character.id, taskDef.id)}</span>
                              <button
                                className="count-reset-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateCount(character.id, taskDef.id, 0);
                                }}
                                title="초기화"
                              >
                                ↻
                              </button>
                            </div>
                          ) : (
                            <input
                              type="checkbox"
                              checked={getCompletionStatus(character.id, taskDef.id)}
                              onChange={(e) => e.stopPropagation()}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {showCharacterForm && (
        <div className="form-overlay">
          <CharacterForm onAddCharacter={onAddCharacter} onCancel={() => setShowCharacterForm(false)} />
        </div>
      )}
    </div>
  );
};

export default HomeworkView;