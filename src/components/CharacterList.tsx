import React, { useState, useRef } from 'react';
import type { Character } from '../types/Character.ts';

interface CharacterListProps {
  characters: Character[];
  onDeleteCharacter: (id: string) => void;
  onReorderCharacters: (reorderedCharacters: Character[]) => void;
}

const CharacterList: React.FC<CharacterListProps> = ({ characters, onDeleteCharacter, onReorderCharacters }) => {
  const [draggedCharacterId, setDraggedCharacterId] = useState<string | null>(null);
  const dragItem = useRef<string | null>(null);
  const draggedNode = useRef<HTMLDivElement | null>(null);
  const characterRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const startIndexes = useRef<Map<string, number>>(new Map()); // Original indices at drag start

  // Keep track of the current provisional order during drag
  const currentProvisionalOrder = useRef<string[]>([]);


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, characterId: string) => {
    dragItem.current = characterId;
    draggedNode.current = e.currentTarget;
    setDraggedCharacterId(characterId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', characterId);
    e.currentTarget.classList.add('dragging'); // Add dragging class

    // Hide the original dragged item to allow visual shifting of others
    if (draggedNode.current) {
        draggedNode.current.style.visibility = 'hidden';
    }

    // Capture initial indexes and initialize provisional order
    const initialIndexes = new Map<string, number>();
    characters.forEach((char, idx) => initialIndexes.set(char.id, idx));
    startIndexes.current = initialIndexes;
    currentProvisionalOrder.current = characters.map(c => c.id);

    // Clear any previous transforms from other items that might persist
    characterRefs.current.forEach((el, id) => {
        if (id !== characterId) {
            el.style.transform = '';
            el.style.transition = ''; // Clear transition for immediate reset
        }
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, characterId: string) => {
    e.preventDefault();
    if (!dragItem.current || dragItem.current === characterId || !draggedNode.current) {
      return; // Not dragging, dragging over self, or draggedNode not set
    }

    const draggedId = dragItem.current;
    const targetId = characterId;

    const currentBaseOrder = characters.map(c => c.id); // Reference to original fixed order
    const draggedOriginalIndex = currentBaseOrder.findIndex(id => id === draggedId);
    const targetOriginalIndex = currentBaseOrder.findIndex(id => id === targetId);

    if (draggedOriginalIndex === -1 || targetOriginalIndex === -1) {
      return;
    }

    const targetElement = characterRefs.current.get(characterId);
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const mouseY = e.clientY;
    const middleY = rect.top + rect.height / 2;
    const before = mouseY < middleY;

    // Create a new provisional order based on current drag position
    const nextProvisionalOrder = [...currentBaseOrder];
    const [movedId] = nextProvisionalOrder.splice(draggedOriginalIndex, 1);
    
    let dropPositionIndex = targetOriginalIndex;
    if (draggedOriginalIndex < targetOriginalIndex) {
        // If moving downwards
        dropPositionIndex = before ? targetOriginalIndex -1 : targetOriginalIndex;
    } else {
        // If moving upwards
        dropPositionIndex = before ? targetOriginalIndex : targetOriginalIndex + 1;
    }

    // Ensure dropPositionIndex is within bounds
    dropPositionIndex = Math.max(0, Math.min(nextProvisionalOrder.length, dropPositionIndex));
    
    nextProvisionalOrder.splice(dropPositionIndex, 0, movedId);
    
    // Only update if the provisional order has actually changed
    if (JSON.stringify(nextProvisionalOrder) === JSON.stringify(currentProvisionalOrder.current)) {
        return;
    }
    currentProvisionalOrder.current = nextProvisionalOrder;


    const itemHeight = draggedNode.current.offsetHeight; // Assuming all items have similar height

    // Calculate offsets for all items based on the new provisional order
    characters.forEach(char => {
        const el = characterRefs.current.get(char.id);
        if (!el || char.id === draggedId) {
            return; // Skip if element not found or it's the dragged item
        }

        const newVisualIndex = currentProvisionalOrder.current.findIndex(id => id === char.id);
        const originalIndex = characters.findIndex(c => c.id === char.id); // Get index from initial 'characters' prop

        if (newVisualIndex !== -1 && originalIndex !== -1 && newVisualIndex !== originalIndex) {
            const offset = (newVisualIndex - originalIndex) * itemHeight;
            el.style.transform = `translateY(${offset}px)`;
            el.style.transition = 'transform 0.2s ease-in-out'; // Apply transition for smooth movement
        } else {
            el.style.transform = '';
            el.style.transition = '';
        }
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!dragItem.current || !currentProvisionalOrder.current) {
      handleDragEnd();
      return;
    }
    
    const newCharacters = currentProvisionalOrder.current
      .map(id => characters.find(char => char.id === id))
      .filter(Boolean) as Character[];

    onReorderCharacters(newCharacters); // Call parent handler with the final order

    handleDragEnd(); // Clean up
  };

  const handleDragEnd = () => {
    draggedNode.current?.classList.remove('dragging');
    if (draggedNode.current) {
        draggedNode.current.style.visibility = ''; // Make original item visible again
    }
    setDraggedCharacterId(null);
    dragItem.current = null;
    draggedNode.current = null;
    startIndexes.current = new Map();
    currentProvisionalOrder.current = [];

    // Clear all transforms and transitions from other items
    characterRefs.current.forEach(el => {
        el.style.transform = '';
        el.style.transition = '';
    });
  };
  
  return (
    <div className="character-list">
      {characters.length === 0 && <p className="no-characters">캐릭터를 추가해주세요.</p>}
      {characters.map((character) => (
        <div
          key={character.id}
          ref={(el) => { if (el) characterRefs.current.set(character.id, el); else characterRefs.current.delete(character.id); }}
          className={`character-item ${draggedCharacterId === character.id ? 'dragging' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, character.id)}
          onDragOver={(e) => handleDragOver(e, character.id)}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          // No inline style for transform here, it's set directly on element in handleDragOver
        >
          <span>{character.name}</span>
          <button onClick={() => onDeleteCharacter(character.id)} className="character-delete-button">삭제</button>
        </div>
      ))}
    </div>
  );
};

export default CharacterList;