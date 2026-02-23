// src/components/DataManagementModal.tsx
import React, { useState } from 'react';
import './DataManagementModal.css'; // Will create this CSS file

interface DataManagementModalProps {
  onClose: () => void;
  onExport: () => string;
  onImport: (data: string) => boolean;
}

const DataManagementModal: React.FC<DataManagementModalProps> = ({ onClose, onExport, onImport }) => {
  const [exportedData, setExportedData] = useState<string>('');
  const [importDataString, setImportDataString] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  const handleExportClick = () => {
    const data = onExport();
    setExportedData(data);
  };

  const handleImportClick = () => {
    setImportError(null);
    setImportSuccess(false);
    if (!importDataString.trim()) {
      setImportError("가져올 데이터가 비어 있습니다.");
      return;
    }
    const success = onImport(importDataString);
    if (success) {
      setImportSuccess(true);
      setImportDataString(''); // Clear input after successful import
      setExportedData(''); // Clear exported data as well, as it's now stale
      onClose(); // Close on success for immediate effect
    } else {
      setImportError("데이터 가져오기 실패: 유효하지 않은 데이터 형식입니다.");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>데이터 관리</h2>
        
        <div className="data-section">
          <h3>데이터 내보내기</h3>
          <button onClick={handleExportClick}>현재 데이터 내보내기</button>
          {exportedData && (
            <textarea
              readOnly
              value={exportedData}
              rows={10}
              cols={50}
              placeholder="내보내기 버튼을 누르면 여기에 데이터가 표시됩니다."
            />
          )}
        </div>

        <div className="data-section">
          <h3>데이터 가져오기</h3>
          <textarea
            value={importDataString}
            onChange={(e) => {
              setImportDataString(e.target.value);
              setImportError(null); // Clear error on change
              setImportSuccess(false); // Clear success on change
            }}
            rows={10}
            cols={50}
            placeholder="여기에 가져올 데이터를 붙여넣으세요."
          />
          <button onClick={handleImportClick}>가져오기 및 적용</button>
          {importError && <p className="error-message">{importError}</p>}
          {importSuccess && <p className="success-message">데이터를 성공적으로 가져왔습니다!</p>}
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export default DataManagementModal;
