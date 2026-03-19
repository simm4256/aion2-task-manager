import React, { useState, useRef, useEffect } from 'react';
import type { AlarmDefinition, AlarmType } from '../types/Alarm.ts';

interface AlarmFormProps {
  initialAlarm?: AlarmDefinition; // 수정을 위한 초기 데이터 (옵션)
  onSaveAlarm: (alarm: AlarmDefinition) => void;
  onCancel: () => void;
}

const AlarmForm: React.FC<AlarmFormProps> = ({ initialAlarm, onSaveAlarm, onCancel }) => {
  const [name, setName] = useState(initialAlarm ? initialAlarm.name : '');
  const [type, setType] = useState<AlarmType>(initialAlarm ? initialAlarm.type : 'hourly');
  const [minute, setMinute] = useState<number>(initialAlarm?.minute ?? 0);
  const [time, setTime] = useState<string>(initialAlarm?.time ?? '00:00');
  const [dayOfWeek, setDayOfWeek] = useState<number>(initialAlarm?.dayOfWeek ?? 1); // 기본 월요일(1)
  const [notifyBefore, setNotifyBefore] = useState({
    atTime: initialAlarm?.notifyBefore.atTime ?? true,
    thirtySec: initialAlarm?.notifyBefore.thirtySec ?? false,
    oneMin: initialAlarm?.notifyBefore.oneMin ?? false,
    threeMin: initialAlarm?.notifyBefore.threeMin ?? false,
    fiveMin: initialAlarm?.notifyBefore.fiveMin ?? false,
  });
  const [ttsVoice, setTtsVoice] = useState(initialAlarm?.ttsVoice ?? '');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // 한국어(ko)인 음성만 필터링
      const filteredVoices = allVoices.filter(voice => 
        voice.lang.toLowerCase().startsWith('ko')
      );
      setVoices(filteredVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('알람 이름을 입력해주세요.');
      return;
    }

    const alarmData: AlarmDefinition = {
      id: initialAlarm ? initialAlarm.id : crypto.randomUUID(),
      name: name.trim(),
      type,
      minute: type === 'hourly' ? minute : undefined,
      time: type !== 'hourly' ? time : undefined,
      dayOfWeek: type === 'weekly' ? dayOfWeek : undefined,
      ttsVoice,
      notifyBefore,
      isEnabled: initialAlarm ? initialAlarm.isEnabled : true,
    };

    onSaveAlarm(alarmData);
  };

  const handleNotifyChange = (key: keyof typeof notifyBefore) => {
    setNotifyBefore(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const dayOptions = [
    { value: 1, label: '월요일' },
    { value: 2, label: '화요일' },
    { value: 3, label: '수요일' },
    { value: 4, label: '목요일' },
    { value: 5, label: '금요일' },
    { value: 6, label: '토요일' },
    { value: 0, label: '일요일' },
  ];

  return (
    <form onSubmit={handleSubmit} className="task-form" style={{ maxWidth: '450px' }}>
      <h3>{initialAlarm ? '알람 수정' : '알람 추가'}</h3>
      <input
        type="text"
        placeholder="알람 이름 (예: 슈고페스타)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="task-input"
        ref={inputRef}
      />

      <p style={{ marginTop: '15px', fontWeight: 'bold' }}>알람 종류:</p>
      <div className="task-type-radio-group">
        <label className="radio-label">
          <input
            type="radio"
            name="alarmType"
            value="hourly"
            checked={type === 'hourly'}
            onChange={() => setType('hourly')}
          />
          매시
        </label>
        <label className="radio-label">
          <input
            type="radio"
            name="alarmType"
            value="daily"
            checked={type === 'daily'}
            onChange={() => setType('daily')}
          />
          매일
        </label>
        <label className="radio-label">
          <input
            type="radio"
            name="alarmType"
            value="weekly"
            checked={type === 'weekly'}
            onChange={() => setType('weekly')}
          />
          매주
        </label>
      </div>

      <div className="alarm-time-options" style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
        {type === 'hourly' && (
          <div>
            <label>매시 </label>
            <input
              type="number"
              min="0"
              max="59"
              value={minute}
              onChange={(e) => setMinute(parseInt(e.target.value) || 0)}
              className="task-input"
              style={{ width: '60px', display: 'inline-block' }}
            />
            <label> 분에 알람</label>
          </div>
        )}

        {type === 'daily' && (
          <div>
            <label>시간 설정: </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="task-input"
            />
          </div>
        )}

        {type === 'weekly' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
              className="task-input"
              style={{ width: '100px' }}
            >
              {dayOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="task-input"
            />
          </div>
        )}
      </div>

      <p style={{ marginTop: '15px', fontWeight: 'bold' }}>알림 시점 설정:</p>
      <div className="task-type-radio-group" style={{ flexWrap: 'wrap', justifyContent: 'flex-start', gap: '15px' }}>
        <label className="radio-label">
          <input
            type="checkbox"
            checked={notifyBefore.atTime}
            onChange={() => handleNotifyChange('atTime')}
          />
          설정시각
        </label>
        <label className="radio-label">
          <input
            type="checkbox"
            checked={notifyBefore.thirtySec}
            onChange={() => handleNotifyChange('thirtySec')}
          />
          30초 전
        </label>
        <label className="radio-label">
          <input
            type="checkbox"
            checked={notifyBefore.oneMin}
            onChange={() => handleNotifyChange('oneMin')}
          />
          1분 전
        </label>
        <label className="radio-label">
          <input
            type="checkbox"
            checked={notifyBefore.threeMin}
            onChange={() => handleNotifyChange('threeMin')}
          />
          3분 전
        </label>
        <label className="radio-label">
          <input
            type="checkbox"
            checked={notifyBefore.fiveMin}
            onChange={() => handleNotifyChange('fiveMin')}
          />
          5분 전
        </label>
      </div>

      <p style={{ marginTop: '15px', fontWeight: 'bold' }}>TTS 음성 설정:</p>
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
        <select
          value={ttsVoice}
          onChange={(e) => setTtsVoice(e.target.value)}
          onWheel={(e) => {
            const select = e.currentTarget;
            if (e.deltaY > 0) {
              if (select.selectedIndex < select.options.length - 1) select.selectedIndex++;
            } else {
              if (select.selectedIndex > 0) select.selectedIndex--;
            }
            setTtsVoice(select.value);
            e.preventDefault();
          }}
          className="task-input"
          style={{ flex: 1, minWidth: '0' }}
        >
          <option value="">기본 음성</option>
          {voices.map(voice => (
            <option key={voice.name} value={voice.name}>{voice.name}</option>
          ))}
        </select>
        <button 
          type="button" 
          onClick={() => {
            window.speechSynthesis.cancel(); // 이전 재생 중단
            const text = name.trim() ? `${name.trim()} 시간입니다.` : '테스트입니다.';
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ko-KR';
            const voice = voices.find(v => v.name === ttsVoice);
            if (voice) utterance.voice = voice;
            window.speechSynthesis.speak(utterance);
          }}
          className="reset-button"
          style={{ backgroundColor: '#ffadad', color: '#2e2e2e', padding: '5px 10px', flexShrink: 0 }}
        >
          테스트
        </button>
      </div>

      <div className="form-actions" style={{ marginTop: '20px' }}>
        <button type="submit" className="add-task-button">
          {initialAlarm ? '알람 저장' : '알람 추가'}
        </button>
        <button type="button" onClick={onCancel} className="cancel-button">
          취소
        </button>
      </div>
    </form>
  );
};

export default AlarmForm;
