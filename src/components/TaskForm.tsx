import React, { useState, useRef, useEffect } from 'react';
import type { TaskType, TaskDefinition, TaskInputType } from '../types/Task.ts';
import { availableImages, getImageUrl } from '../utils/image-helpers.ts';

interface TaskFormProps {
  initialTask?: TaskDefinition; // Optional, for editing
  onSaveTask: (
    id: string | undefined,
    name: string,
    type: TaskType,
    inputType: TaskInputType, // Added inputType
    resetDays?: number[], // New: Array of numbers (0-6, Sun-Sat)
    resetTime?: string,   // New: Time in "HH:mm" format
    imageUrl?: string,
    displayFirstLetterOnImage?: boolean
  ) => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ initialTask, onSaveTask, onCancel }) => {
  const [taskName, setTaskName] = useState(initialTask ? initialTask.name : '');
  const [taskType, setTaskType] = useState<TaskType>(initialTask ? initialTask.type : 'daily');
  const [taskInputType, setTaskInputType] = useState<TaskInputType>(initialTask ? initialTask.inputType : 'check'); // New state
  const [selectedResetDays, setSelectedResetDays] = useState<number[]>(initialTask?.resetDays || []);
  const [resetTime, setResetTime] = useState<string>(initialTask?.resetTime || '00:00');
  const [imageUrl, setImageUrl] = useState(initialTask ? initialTask.imageUrl : '');
  const [displayFirstLetterOnImage, setDisplayFirstLetterOnImage] = useState(initialTask ? initialTask.displayFirstLetterOnImage : false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTaskName(initialTask ? initialTask.name : '');
    setTaskType(initialTask ? initialTask.type : 'daily');
    setTaskInputType(initialTask ? initialTask.inputType : 'check');
    setSelectedResetDays(initialTask?.resetDays || []);
    setResetTime(initialTask?.resetTime || '00:00');
    setImageUrl(initialTask ? initialTask.imageUrl : '');
    setDisplayFirstLetterOnImage(initialTask ? initialTask.displayFirstLetterOnImage : false);
  }, [initialTask]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskName.trim()) {
        alert('숙제 이름을 입력해주세요.');
        return;
    }

    if (taskType === 'custom' && selectedResetDays.length === 0) {
        alert('초기화 요일을 최소 하나 선택해주세요.');
        return;
    }

    onSaveTask(
        initialTask ? initialTask.id : undefined,
        taskName.trim(),
        taskType,
        taskInputType, // Pass inputType
        taskType === 'custom' ? selectedResetDays : undefined,
        taskType === 'custom' ? resetTime : undefined,
        imageUrl,
        displayFirstLetterOnImage
    );
    setTaskName('');
    if (!initialTask || initialTask.type !== 'custom') {
        setSelectedResetDays([]);
        setResetTime('00:00');
    }
    setImageUrl('');
    setDisplayFirstLetterOnImage(false);
  };

  const handleDayCheckboxChange = (dayValue: number) => {
    setSelectedResetDays(prev => 
      prev.includes(dayValue)
        ? prev.filter(day => day !== dayValue)
        : [...prev, dayValue].sort((a, b) => a - b)
    );
  };

  const dayOptions = [
    { value: 1, label: '월' }, // Monday
    { value: 2, label: '화' },
    { value: 3, label: '수' },
    { value: 4, label: '목' },
    { value: 5, label: '금' },
    { value: 6, label: '토' },
    { value: 0, label: '일' }, // Sunday
  ];

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <input
        type="text"
        placeholder="새 숙제 이름"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        className="task-input"
        ref={inputRef}
      />
      <p>이미지 선택:</p>
      <div className="image-selection-gallery">
        {availableImages.map(img => (
          <div
            key={img}
            className={`image-option ${imageUrl === img ? 'selected' : ''}`}
            onClick={() => setImageUrl(imageUrl === img ? '' : img)}
          >
            <img src={getImageUrl(img)} alt={img} />
          </div>
        ))}
      </div>

      <label className="radio-label checkbox-label" style={{ marginTop: '10px' }}>
        <input
          type="checkbox"
          checked={displayFirstLetterOnImage}
          onChange={(e) => setDisplayFirstLetterOnImage(e.target.checked)}
          disabled={!imageUrl}
        />
        이름 첫글자 이미지에 표시
      </label>
      
      {imageUrl && (
        <div className="image-overlay-container" style={{ margin: '10px auto', width: '50px', height: '50px' }}>
          <img src={getImageUrl(imageUrl)} alt="선택된 이미지" className="form-preview-image" />
          {displayFirstLetterOnImage && taskName.trim().length > 0 && (
            <span className="overlay-text">{taskName.trim().charAt(0)}</span>
          )}
        </div>
      )}

      <p style={{ marginTop: '10px', fontWeight: 'bold' }}>입력 유형:</p>
      <div className="task-type-radio-group">
        <label className="radio-label">
          <input
            type="radio"
            name="taskInputType"
            value="check"
            checked={taskInputType === 'check'}
            onChange={() => setTaskInputType('check')}
          />
          체크형
        </label>
        <label className="radio-label">
          <input
            type="radio"
            name="taskInputType"
            value="count"
            checked={taskInputType === 'count'}
            onChange={() => setTaskInputType('count')}
          />
          카운트형
        </label>
      </div>

      <p style={{ marginTop: '10px', fontWeight: 'bold' }}>초기화 주기:</p>
      <div className="task-type-radio-group">
        <label className="radio-label">
          <input
            type="radio"
            name="taskType"
            value="daily"
            checked={taskType === 'daily'}
            onChange={() => setTaskType('daily')}
          />
          일일 숙제
        </label>
        <label className="radio-label">
          <input
            type="radio"
            name="taskType"
            value="weekly"
            checked={taskType === 'weekly'}
            onChange={() => setTaskType('weekly')}
          />
          주간 숙제
        </label>
        <label className="radio-label">
          <input
            type="radio"
            name="taskType"
            value="custom"
            checked={taskType === 'custom'}
            onChange={() => setTaskType('custom')}
          />
          기타
        </label>
      </div>
      {taskType === 'custom' && (
        <div className="custom-reset-options">
          <p>초기화 요일:</p>
          <div className="reset-day-checkboxes">
            {dayOptions.map(day => (
              <label key={day.value} className="checkbox-label">
                <input
                  type="checkbox"
                  value={day.value}
                  checked={selectedResetDays.includes(day.value)}
                  onChange={() => handleDayCheckboxChange(day.value)}
                />
                {day.label}
              </label>
            ))}
          </div>

          <p style={{ marginTop: '10px' }}>초기화 시간:</p>
          <input
            type="time"
            value={resetTime}
            onChange={(e) => setResetTime(e.target.value)}
            className="task-input"
          />
        </div>
      )}
      <div className="form-actions">
        <button type="submit" className="add-task-button">{initialTask ? '숙제 저장' : '숙제 추가'}</button>
        <button type="button" onClick={onCancel} className="cancel-button">취소</button>
      </div>
    </form>
  );
};

export default TaskForm;
