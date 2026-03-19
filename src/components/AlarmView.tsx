import React from 'react';
import type { AlarmDefinition } from '../types/Alarm.ts';

interface AlarmViewProps {
  alarms: AlarmDefinition[];
  onDeleteAlarm: (id: string) => void;
  onToggleAlarm: (id: string) => void;
  onEditAlarm: (alarm: AlarmDefinition) => void;
  setShowAlarmForm: (show: boolean) => void;
  activeAlarmId?: string | null; // 추가
}

const AlarmView: React.FC<AlarmViewProps> = ({ 
  alarms, 
  onDeleteAlarm, 
  onToggleAlarm, 
  onEditAlarm, 
  setShowAlarmForm,
  activeAlarmId // 추가
}) => {
  const getDayLabel = (day?: number) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return day !== undefined ? days[day] : '';
  };

  const formatTime = (alarm: AlarmDefinition) => {
    if (alarm.type === 'hourly') return `매시 ${alarm.minute}분`;
    if (alarm.type === 'daily') return `매일 ${alarm.time}`;
    if (alarm.type === 'weekly') return `매주 (${getDayLabel(alarm.dayOfWeek)}) ${alarm.time}`;
    return '';
  };

  const formatNotifyBefore = (alarm: AlarmDefinition) => {
    const parts = [];
    if (alarm.notifyBefore.atTime) parts.push('정시');
    if (alarm.notifyBefore.thirtySec) parts.push('30초전');
    if (alarm.notifyBefore.oneMin) parts.push('1분전');
    if (alarm.notifyBefore.threeMin) parts.push('3분전');
    if (alarm.notifyBefore.fiveMin) parts.push('5분전');
    return parts.length > 0 ? parts.join(', ') : '없음';
  };

  return (
    <div className="alarm-tab-content">
      <div className="action-buttons-container" style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setShowAlarmForm(true)} 
          className="add-task-definition-btn"
        >
          알람 추가
        </button>
      </div>

      <div className="homework-table-wrapper" style={{ marginTop: '20px' }}>
        <div className="homework-table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>상태</th>
                <th>알람 이름</th>
                <th>설정 시각</th>
                <th>사전 알림</th>
                <th style={{ width: '120px' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {alarms.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#b0b0b0' }}>
                    등록된 알람이 없습니다. '알람 추가' 버튼을 눌러주세요.
                  </td>
                </tr>
              ) : (
                alarms.map(alarm => (
                  <tr key={alarm.id} className={alarm.id === activeAlarmId ? 'active-alarm-row' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={alarm.isEnabled} 
                        onChange={() => onToggleAlarm(alarm.id)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ fontWeight: 'bold', textAlign: 'left', paddingLeft: '15px' }}>{alarm.name}</td>
                    <td style={{ textAlign: 'center' }}>{formatTime(alarm)}</td>
                    <td style={{ fontSize: '0.9em', color: '#a0c4ff', textAlign: 'center' }}>{formatNotifyBefore(alarm)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => onEditAlarm(alarm)}
                          className="reset-button"
                          style={{ padding: '4px 10px', fontSize: '0.85em', backgroundColor: '#4a4a4a', borderRadius: '4px' }}
                        >
                          수정
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('정말 삭제하시겠습니까?')) onDeleteAlarm(alarm.id);
                          }}
                          className="reset-button"
                          style={{ padding: '4px 10px', fontSize: '0.85em', backgroundColor: '#ffadad', color: '#2e2e2e', borderRadius: '4px' }}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AlarmView;
