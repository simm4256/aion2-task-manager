import React, { useState } from 'react';
import type { Character } from '../types/Character.ts';
import type { ResourceDefinition, CharacterResourceState } from '../types/Resource.ts';
import { getTimeRemainingUntilResourceCharge } from '../utils/date-helpers';
import { getImageUrl } from '../utils/image-helpers';

interface ResourceViewProps {
  resourceDefinitions: ResourceDefinition[];
  characters: Character[];
  characterResourceStates: CharacterResourceState[];
  onDeleteResourceDefinition: (resourceDefinitionId: string) => void;
  onUpdateResourceAmount: (characterId: string, resourceDefinitionId: string, newAmount: number) => void;
  onReorderResourceDefinitions: (reorderedResourceDefinitions: ResourceDefinition[]) => void;
  onEditResourceDefinition: (resourceDefinition: ResourceDefinition) => void;
  onEditCharacterName: (characterId: string, newName: string) => void; // NEW PROP
  onReorderCharacters: (reorderedCharacters: Character[]) => void; // NEW PROP
  setShowResourceDefinitionForm: (show: boolean) => void;
  currentTime: Date;
}

const ResourceView: React.FC<ResourceViewProps> = ({
  resourceDefinitions,
  characters,
  characterResourceStates,
  onDeleteResourceDefinition,
  onUpdateResourceAmount,
  onReorderResourceDefinitions,
  onEditResourceDefinition,
  onEditCharacterName, // NEW PROP
  onReorderCharacters, // NEW PROP
  setShowResourceDefinitionForm,
  currentTime,
}) => {
  const allResourceDefs = resourceDefinitions;

  // State for resource definition drag and drop
  const [draggedResourceDefId, setDraggedResourceDefId] = useState<string | null>(null);
  const [dragOverResourceDefId, setDragOverResourceDefId] = useState<string | null>(null);
  const [originalResourceDefinitionsOrder, setOriginalResourceDefinitionsOrder] = useState<ResourceDefinition[] | null>(null); // NEW STATE FOR RESOURCE DRAG REVERT

  // State for character drag and drop
  const [draggedCharacterId, setDraggedCharacterId] = useState<string | null>(null);
  const [dragOverCharacterId, setDragOverCharacterId] = useState<string | null>(null);
  const [originalCharactersOrder, setOriginalCharactersOrder] = useState<Character[] | null>(null); // NEW STATE FOR CHARACTER DRAG REVERT

  // State for character name editing
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [editedCharacterName, setEditedCharacterName] = useState<string>('');

  // State to manage editable resource amount cells
  const [editingCell, setEditingCell] = useState<{ characterId: string; resourceDefId: string } | null>(null);
  const [editedAmount, setEditedAmount] = useState<number>(0);

  const getResourceAmount = (characterId: string, resourceDefId: string) => {
    return characterResourceStates.find(
      crs => crs.characterId === characterId && crs.resourceDefinitionId === resourceDefId
    )?.currentAmount || 0;
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

  // Resource Amount Cell Editing Handlers (unchanged)
  const handleCellClick = (characterId: string, resourceDefId: string) => {
    const amount = getResourceAmount(characterId, resourceDefId);
    setEditedAmount(amount);
    setEditingCell({ characterId, resourceDefId });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedAmount(parseInt(e.target.value) || 0);
  };

  const handleAmountBlur = () => {
    if (editingCell) {
      const resourceDef = allResourceDefs.find(rd => rd.id === editingCell.resourceDefId);
      const finalAmount = resourceDef ? Math.min(editedAmount, resourceDef.maxAmount) : editedAmount;
      onUpdateResourceAmount(editingCell.characterId, editingCell.resourceDefId, finalAmount);
      setEditingCell(null);
    }
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAmountBlur();
    }
    if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Drag handlers for Resource Definitions
  const handleDragStartResource = (e: React.DragEvent<HTMLTableCellElement>, resourceDefId: string) => {
    setDraggedResourceDefId(resourceDefId);
    setOriginalResourceDefinitionsOrder(allResourceDefs); // SAVE ORIGINAL ORDER
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', resourceDefId);
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0); // Set drag image to the entire TH
  };

  const handleDragOverResource = (e: React.DragEvent<HTMLTableCellElement>, targetResourceDefId: string) => {
    e.preventDefault();
    if (!draggedResourceDefId || draggedResourceDefId === targetResourceDefId) {
      return;
    }

    setDragOverResourceDefId(targetResourceDefId);

    const draggedIndex = allResourceDefs.findIndex(def => def.id === draggedResourceDefId);
    const targetIndex = allResourceDefs.findIndex(def => def.id === targetResourceDefId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    const newOrderedResources = [...allResourceDefs];
    const [removed] = newOrderedResources.splice(draggedIndex, 1);
    newOrderedResources.splice(targetIndex, 0, removed);

    onReorderResourceDefinitions(newOrderedResources);
  };

  const handleDragLeaveResource = (e: React.DragEvent<HTMLTableCellElement>) => {
    // Only clear if the dragged item actually left the current target header
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOverResourceDefId(null);
    }
  };

  const handleDropResource = (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
    // The actual reordering is handled in handleDragOverResource,
    // so here we just clear the drag state and finalize the original order.
    setDraggedResourceDefId(null);
    setDragOverResourceDefId(null);
    setOriginalResourceDefinitionsOrder(null); // Finalize the order
  };

  const handleDragEndResource = () => {
    // If the draggedResourceDefId is still set, it means the drag was cancelled or dropped outside a valid target
    if (draggedResourceDefId && originalResourceDefinitionsOrder) {
      onReorderResourceDefinitions(originalResourceDefinitionsOrder); // Revert to original order
    }
    setDraggedResourceDefId(null);
    setDragOverResourceDefId(null);
    setOriginalResourceDefinitionsOrder(null);
  };

  // Drag handlers for Characters (NEW logic for enhanced preview)
  const handleDragStartCharacter = (e: React.DragEvent<HTMLTableDataCellElement>, characterId: string) => {
    setDraggedCharacterId(characterId);
    setOriginalCharactersOrder(characters); // SAVE ORIGINAL ORDER
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', characterId);
    // Set the drag image to the entire parent row (<tr>)
    const rowElement = e.currentTarget.closest('tr');
    if (rowElement) {
      e.dataTransfer.setDragImage(rowElement, 0, 0);
    }
    e.stopPropagation(); // Stop propagation to prevent parent (tr) drag events
  };

  const handleDragOverCharacter = (e: React.DragEvent<HTMLTableRowElement>, targetCharacterId: string) => {
    e.preventDefault();
    if (!draggedCharacterId) {
      return;
    }

    setDragOverCharacterId(targetCharacterId);

    const draggedIndex = characters.findIndex(char => char.id === draggedCharacterId);
    const targetIndex = characters.findIndex(char => char.id === targetCharacterId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    const newOrderedCharacters = [...characters];
    const [removed] = newOrderedCharacters.splice(draggedIndex, 1);
    newOrderedCharacters.splice(targetIndex, 0, removed);

    onReorderCharacters(newOrderedCharacters);
  };

  const handleDragLeaveCharacter = (e: React.DragEvent<HTMLTableRowElement>) => {
    // Only clear if the dragged item actually left the current target row
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
  };


  return (
    <div className="resource-tab-content">
      <div className="action-buttons-container">
        <button onClick={() => setShowResourceDefinitionForm(true)} className="add-task-definition-btn">자원 추가</button>
      </div>

      {allResourceDefs.length === 0 && <p className="no-resources">자원을 추가해주세요.</p>}

      {allResourceDefs.length > 0 && (
        <div className="resource-table-wrapper homework-table-wrapper">
          <div className="resource-table-container homework-table-container">
            <table>
              <thead>
                <tr>
                  <th className="character-header"></th>
                  {allResourceDefs.map(resourceDef => (
                    <th
                      key={resourceDef.id}
                      className={`resource-header ${draggedResourceDefId === resourceDef.id ? 'dragging' : ''} ${dragOverResourceDefId === resourceDef.id ? 'drag-over' : ''}`}
                      draggable="true"
                      onDragStart={(e) => handleDragStartResource(e, resourceDef.id)}
                      onDragOver={(e) => handleDragOverResource(e, resourceDef.id)}
                      onDrop={handleDropResource}
                      onDragLeave={handleDragLeaveResource}
                      onDragEnd={handleDragEndResource}
                    >
                      <div
                        className="resource-header-content"
                        onClick={() => onEditResourceDefinition(resourceDef)}
                      >
                        <div className="resource-header-name">
                          {resourceDef.imageUrl ? (
                            <div className="image-overlay-container">
                              <img src={getImageUrl(resourceDef.imageUrl)} alt={resourceDef.name} className="resource-image" />
                              {resourceDef.displayFirstLetterOnImage && resourceDef.name.trim().length > 0 && (
                                <span className="overlay-text">{resourceDef.name.trim().charAt(0)}</span>
                              )}
                            </div>
                          ) : (
                            resourceDef.name
                          )}
                        </div>
                        <div className="resource-charge-info">
                          {getTimeRemainingUntilResourceCharge(resourceDef, currentTime)}
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteResourceDefinition(resourceDef.id)}
                        className="resource-definition-delete-button"
                        title="자원 정의 삭제"
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
                    <td colSpan={allResourceDefs.length + 1} className="no-characters-message">
                      숙제 탭에서 캐릭터를 추가해주세요.
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
                      className={draggedCharacterId === character.id ? 'dragging-character-row' : dragOverCharacterId === character.id ? 'drag-over-character-row' : ''}
                    >
                      <td
                        className="character-name-cell"
                        onClick={() => handleCharacterNameClick(character)}
                        draggable="true"
                        onDragStart={(e) => handleDragStartCharacter(e, character.id)}
                      >
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
                      </td>
                      {allResourceDefs.map(resourceDef => (
                        <td
                          key={resourceDef.id}
                          className={`resource-amount-cell ${getResourceAmount(character.id, resourceDef.id) >= resourceDef.maxAmount ? 'resource-full' : ''}`}
                          onClick={() => handleCellClick(character.id, resourceDef.id)}
                        >
                          {editingCell?.characterId === character.id && editingCell?.resourceDefId === resourceDef.id ? (
                            <input
                              type="number"
                              value={editedAmount}
                              onChange={handleAmountChange}
                              onBlur={handleAmountBlur}
                              onKeyDown={handleAmountKeyDown}
                              autoFocus
                              className="resource-amount-input"
                              onFocus={(e) => e.target.select()}
                            />
                          ) : (
                            getResourceAmount(character.id, resourceDef.id)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div >
  );
};
export default ResourceView;