export type AlarmType = 'hourly' | 'daily' | 'weekly';

export interface AlarmDefinition {
  id: string;
  name: string;
  type: AlarmType;
  minute?: number;       // 매시 x분 (0-59)
  time?: string;         // HH:mm 형식 (매일/매주)
  dayOfWeek?: number;    // 요일 (0-6, 일-토)
  ttsVoice?: string;     // 알람별 개별 TTS 음성 설정
  notifyBefore: {
    fiveMin: boolean;    // 5분 전
    threeMin: boolean;   // 3분 전
    oneMin: boolean;     // 1분 전
    thirtySec: boolean;  // 30초 전 (추가)
    atTime: boolean;     // 설정 시각 (추가)
  };
  isEnabled: boolean;    // 알람 활성화 여부
}
