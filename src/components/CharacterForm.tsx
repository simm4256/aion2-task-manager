import React, { useState } from 'react';

interface CharacterFormProps {
  onAddCharacter: (name: string) => void;
  onCancel: () => void;
}

const CharacterForm: React.FC<CharacterFormProps> = ({ onAddCharacter, onCancel }) => {
  const [characterName, setCharacterName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (characterName.trim()) {
      onAddCharacter(characterName.trim());
      setCharacterName('');
    }
  };

  return (
    <div className="task-form character-form">
      <h2>캐릭터 추가</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          placeholder="캐릭터 이름"
          className="character-input"
          autoFocus
        />
        <div className="form-actions">
          <button type="submit" className="add-task-button">추가</button>
          <button type="button" onClick={onCancel} className="cancel-button">취소</button>
        </div>
      </form>
    </div>
  );
};

export default CharacterForm;