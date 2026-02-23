import React, { useState } from 'react';

interface ResetConfigModalProps {
  onClose: () => void;
  onSave: (dailyResetHour: number, dailyResetMinute: number, dailyResetSecond: number, weeklyResetDay: number, weeklyResetHour: number, weeklyResetMinute: number, weeklyResetSecond: number) => void;
  initialDailyResetHour: number;
  initialWeeklyResetDay: number; // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  initialWeeklyResetHour: number;
  initialDailyResetMinute: number;
  initialDailyResetSecond: number;
  initialWeeklyResetMinute: number;
  initialWeeklyResetSecond: number;
  onSetTestDailyReset: (hour: number, minute: number, second: number) => void;
}

const ResetConfigModal: React.FC<ResetConfigModalProps> = ({
  onClose,
  onSave,
  initialDailyResetHour,
  initialWeeklyResetDay,
  initialWeeklyResetHour,
  initialDailyResetMinute,
  initialDailyResetSecond,
  initialWeeklyResetMinute,
  initialWeeklyResetSecond,
  onSetTestDailyReset,
}) => {
  const [dailyResetHour, setDailyResetHour] = useState(initialDailyResetHour);
  const [dailyResetMinute, setDailyResetMinute] = useState(initialDailyResetMinute);
  const [dailyResetSecond, setDailyResetSecond] = useState(initialDailyResetSecond);
  const [weeklyResetDay, setWeeklyResetDay] = useState(initialWeeklyResetDay);
  const [weeklyResetHour, setWeeklyResetHour] = useState(initialWeeklyResetHour);
  const [weeklyResetMinute, setWeeklyResetMinute] = useState(initialWeeklyResetMinute);
  const [weeklyResetSecond, setWeeklyResetSecond] = useState(initialWeeklyResetSecond);

  const handleSave = () => {
    onSave(dailyResetHour, dailyResetMinute, dailyResetSecond, weeklyResetDay, weeklyResetHour, weeklyResetMinute, weeklyResetSecond);
    onClose();
  };

  const daysOfWeek = [
    { value: 0, label: '일요일' },
    { value: 1, label: '월요일' },
    { value: 2, label: '화요일' },
    { value: 3, label: '수요일' },
    { value: 4, label: '목요일' },
    { value: 5, label: '금요일' },
    { value: 6, label: '토요일' },
  ];

  return (
    <div className="form-overlay">
      <div className="task-form"> {/* Reusing task-form class for styling */}
        <h2>초기화 시간 설정</h2>
        <p>매일 초기화 시간 (0-23시):</p>
        <input
          type="number"
          min="0"
          max="23"
          value={dailyResetHour}
          onChange={(e) => setDailyResetHour(parseInt(e.target.value))}
          className="task-input"
        />
        <p>분 (0-59분):</p>
        <input
          type="number"
          min="0"
          max="59"
          value={dailyResetMinute}
          onChange={(e) => setDailyResetMinute(parseInt(e.target.value))}
          className="task-input"
        />
        <p>초 (0-59초):</p>
        <input
          type="number"
          min="0"
          max="59"
          value={dailyResetSecond}
          onChange={(e) => setDailyResetSecond(parseInt(e.target.value))}
          className="task-input"
        />

        <p>매주 초기화 요일:</p>
        <select
          value={weeklyResetDay}
          onChange={(e) => setWeeklyResetDay(parseInt(e.target.value))}
          className="task-type-select" // Reusing task-type-select for styling
        >
          {daysOfWeek.map(day => (
            <option key={day.value} value={day.value}>{day.label}</option>
          ))}
        </select>

        <p>매주 초기화 시간 (0-23시):</p>
        <input
          type="number"
          min="0"
          max="23"
          value={weeklyResetHour}
          onChange={(e) => setWeeklyResetHour(parseInt(e.target.value))}
          className="task-input"
        />
        <p>분 (0-59분):</p>
        <input
          type="number"
          min="0"
          max="59"
          value={weeklyResetMinute}
          onChange={(e) => setWeeklyResetMinute(parseInt(e.target.value))}
          className="task-input"
        />
        <p>초 (0-59초):</p>
        <input
          type="number"
          min="0"
          max="59"
          value={weeklyResetSecond}
          onChange={(e) => setWeeklyResetSecond(parseInt(e.target.value))}
          className="task-input"
        />

        <div className="form-actions">
          <button onClick={handleSave} className="add-task-button">저장</button>
          <button onClick={onClose} className="cancel-button">취소</button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              now.setSeconds(now.getSeconds() + 10); // Set to 10 seconds from now
              onSetTestDailyReset(now.getHours(), now.getMinutes(), now.getSeconds());
              onClose();
            }}
            className="add-task-button" // Reusing button style
            style={{ backgroundColor: '#ffc107', color: 'black' }} // A distinct color for test button
          >
            일일 초기화 10초 후 테스트
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetConfigModal;