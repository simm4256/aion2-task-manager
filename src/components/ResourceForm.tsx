import React, { useState, useEffect } from 'react';
import type { ResourceDefinition } from '../types/Resource.ts';
import { availableImages, getImageUrl } from '../utils/image-helpers.ts';

interface ResourceFormProps {
  initialResource?: ResourceDefinition; // Optional, for editing
  onSaveResource: (id: string | undefined, name: string, chargeStartTimeHour: number, chargeStartTimeMinute: number, chargeStartTimeSecond: number, chargeCycleHours: number, amountPerCharge: number, maxAmount: number, displayOnCharacter: boolean, imageUrl?: string, displayFirstLetterOnImage?: boolean) => void;
  onCancel: () => void;
}

const ResourceForm: React.FC<ResourceFormProps> = ({ initialResource, onSaveResource, onCancel }) => {
  const [resourceName, setResourceName] = useState(initialResource ? initialResource.name : '');
  const [chargeStartTimeHour, setChargeStartTimeHour] = useState(initialResource ? initialResource.chargeStartTimeHour : 0);
  const [chargeStartTimeMinute, setChargeStartTimeMinute] = useState(initialResource ? initialResource.chargeStartTimeMinute : 0);
  const [chargeStartTimeSecond, setChargeStartTimeSecond] = useState(initialResource ? initialResource.chargeStartTimeSecond : 0);
  const [chargeCycleHours, setChargeCycleHours] = useState(initialResource ? initialResource.chargeCycleHours : 24);
  const [amountPerCharge, setAmountPerCharge] = useState(initialResource ? initialResource.amountPerCharge : 1);
  const [maxAmount, setMaxAmount] = useState(initialResource ? initialResource.maxAmount : 1);
  const [displayOnCharacter, setDisplayOnCharacter] = useState(initialResource ? initialResource.displayOnCharacter : false);
  const [imageUrl, setImageUrl] = useState(initialResource ? initialResource.imageUrl : '');
  const [displayFirstLetterOnImage, setDisplayFirstLetterOnImage] = useState(initialResource ? initialResource.displayFirstLetterOnImage : false);

  useEffect(() => {
    if (initialResource) {
      setResourceName(initialResource.name);
      setChargeStartTimeHour(initialResource.chargeStartTimeHour);
      setChargeStartTimeMinute(initialResource.chargeStartTimeMinute);
      setChargeStartTimeSecond(initialResource.chargeStartTimeSecond);
      setChargeCycleHours(initialResource.chargeCycleHours);
      setAmountPerCharge(initialResource.amountPerCharge);
      setMaxAmount(initialResource.maxAmount);
      setDisplayOnCharacter(initialResource.displayOnCharacter);
      setImageUrl(initialResource.imageUrl || '');
      setDisplayFirstLetterOnImage(initialResource.displayFirstLetterOnImage || false);
    } else {
      // Reset form fields when no initialResource is provided (e.g., adding a new resource)
      setResourceName('');
      setChargeStartTimeHour(0);
      setChargeStartTimeMinute(0);
      setChargeStartTimeSecond(0);
      setChargeCycleHours(24);
      setAmountPerCharge(1);
      setMaxAmount(1);
      setDisplayOnCharacter(false);
      setImageUrl('');
      setDisplayFirstLetterOnImage(false);
    }
  }, [initialResource?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resourceName.trim()) {
      onSaveResource(
        initialResource ? initialResource.id : undefined,
        resourceName.trim(),
        chargeStartTimeHour,
        chargeStartTimeMinute,
        chargeStartTimeSecond,
        chargeCycleHours,
        amountPerCharge,
        maxAmount,
        displayOnCharacter,
        imageUrl,
        displayFirstLetterOnImage
      );
      setResourceName('');
      setChargeStartTimeHour(0);
      setChargeStartTimeMinute(0);
      setChargeStartTimeSecond(0);
      setChargeCycleHours(24);
      setAmountPerCharge(1);
      setMaxAmount(1);
      setDisplayOnCharacter(false);
      setImageUrl('');
      setDisplayFirstLetterOnImage(false);
    }
  };

  const handleSetTestChargeTime = () => {
    const now = new Date();
    now.setSeconds(now.getSeconds() + 5); // Set to 5 seconds from now
    setChargeStartTimeHour(now.getHours());
    setChargeStartTimeMinute(now.getMinutes()); // Set minutes
    setChargeStartTimeSecond(now.getSeconds()); // Set seconds
  };

  return (
    <div className="form-overlay">
      <div className="task-form resource-form">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>자원 {initialResource ? '수정' : '추가'}</h2>
            <button type="button" onClick={handleSetTestChargeTime} className="test-button">테스트</button>
        </div>
        <form onSubmit={handleSubmit}>
          <p>충전 시작 시간:</p> {/* Modified label */}
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <input
              type="number"
              min="0"
              max="23"
              value={chargeStartTimeHour}
              onChange={(e) => setChargeStartTimeHour(parseInt(e.target.value))}
              className="task-input"
              style={{ width: '60px', textAlign: 'center' }}
            />
            <span>시</span>
            <input
              type="number"
              min="0"
              max="59"
              value={chargeStartTimeMinute}
              onChange={(e) => setChargeStartTimeMinute(parseInt(e.target.value))}
              className="task-input"
              style={{ width: '60px', textAlign: 'center' }}
            />
            <span>분</span>
            <input
              type="number"
              min="0"
              max="59"
              value={chargeStartTimeSecond}
              onChange={(e) => setChargeStartTimeSecond(parseInt(e.target.value))}
              className="task-input"
              style={{ width: '60px', textAlign: 'center' }}
            />
            <span>초</span>
          </div>

          <p>자원 이름:</p>
          <input
            type="text"
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
            placeholder="자원 이름"
            className="task-input"
            autoFocus
          />
          <p>충전 주기 (시간):</p>
          <input
            type="number"
            min="1"
            value={chargeCycleHours}
            onChange={(e) => setChargeCycleHours(parseInt(e.target.value))}
            className="task-input"
          />

          <p>한번에 추가되는 양:</p> {/* New label */}
          <input
            type="number"
            min="1"
            value={amountPerCharge}
            onChange={(e) => setAmountPerCharge(parseInt(e.target.value))}
            className="task-input"
          />

          <p>최대 보유량:</p>
          <input
            type="number"
            min="1"
            value={maxAmount}
            onChange={(e) => setMaxAmount(parseInt(e.target.value))}
            className="task-input"
          />
          <label className="radio-label checkbox-label"> {/* Reusing radio-label and adding checkbox-label */}
            <input
              type="checkbox"
              checked={displayOnCharacter}
              onChange={(e) => setDisplayOnCharacter(e.target.checked)}
            />
            캐릭터에 표기
          </label>
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

          {imageUrl && (
            <div className="image-overlay-container" style={{ margin: '10px auto', width: '50px', height: '50px' }}>
              <img src={getImageUrl(imageUrl)} alt="선택된 이미지" className="form-preview-image" />
              {displayFirstLetterOnImage && resourceName.trim().length > 0 && (
                <span className="overlay-text">{resourceName.trim().charAt(0)}</span>
              )}
            </div>
          )}

          <label className="radio-label checkbox-label" style={{ marginTop: '10px' }}>
            <input
              type="checkbox"
              checked={displayFirstLetterOnImage}
              onChange={(e) => setDisplayFirstLetterOnImage(e.target.checked)}
              disabled={!imageUrl} // Disable if no image is selected
            />
            이름 첫글자 이미지에 표시
          </label>
          
          <div style={{ marginTop: '20px' }} /> {/* Added spacing */}
          <div className="form-actions">
            <button type="submit" className="add-task-button">{initialResource ? '저장' : '추가'}</button>
            <button type="button" onClick={onCancel} className="cancel-button">취소</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceForm;
