document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#draggable-table tbody');
    let draggedRow = null;
    let ghostRow = null;
    let currentDropTarget = null;
    let draggedRowInitialIndex = -1; // 드래그 오버 중인 대상 행

    // 드래그 시작
    tableBody.addEventListener('dragstart', (e) => {
        const targetRow = e.target.closest('tr');
        if (!targetRow || targetRow.parentNode !== tableBody) return; // 테이블 행이 아니거나 tbody의 자식이 아니면 무시

        draggedRow = targetRow;
        draggedRow.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ''); // Firefox에서 드래그를 작동시키기 위해 필요

        // Store the initial index
        draggedRowInitialIndex = Array.from(tableBody.children).indexOf(draggedRow);

    });


    // 드래그 중
    document.addEventListener('dragover', (e) => {
        e.preventDefault(); // 드롭을 허용하기 위해 기본 동작 방지
        e.dataTransfer.dropEffect = 'move';


        if (!draggedRow) return;

        const target = e.target.closest('tr');

        // 드롭 대상이 유효한 테이블 행인지 확인하고, 드래그 중인 행 자신이 아닌지 확인
        if (!target || target.parentNode !== tableBody || target === draggedRow) {
            if (currentDropTarget) {
                currentDropTarget.classList.remove('drag-over');
                currentDropTarget = null;
            }
            return;
        }

        // 이전 드롭 대상에서 강조 클래스 제거 (새로운 대상이면)
        if (currentDropTarget && currentDropTarget !== target) {
            currentDropTarget.classList.remove('drag-over');
        }
        // 현재 대상에 강조 클래스 추가
        if (currentDropTarget !== target) {
            target.classList.add('drag-over');
            currentDropTarget = target;
        }

        // 2. 마우스 위치에 따라 표 미리보기
        // Get all current rows to determine their current indices
        const allRows = Array.from(tableBody.children);
        const draggedRowCurrentDOMIndex = allRows.indexOf(draggedRow);
        const targetCurrentDOMIndex = allRows.indexOf(target);

        let referenceNode = null;

        // Determine if we are dragging "up" or "down" relative to the target in the current DOM
        if (draggedRowCurrentDOMIndex < targetCurrentDOMIndex) {
            // draggedRow is currently *above* the target in the DOM.
            // If the mouse is moving *down* (or over the target from above), we want to insert *after* the target.
            referenceNode = target.nextSibling;
        } else {
            // draggedRow is currently *below* or at the same position as the target in the DOM.
            // If the mouse is moving *up* (or over the target from below), we want to insert *before* the target.
            referenceNode = target;
        }


        // 불필요한 DOM 조작을 방지하기 위한 체크
        // If the draggedRow is already in the position defined by referenceNode, do nothing.
        // 1. If referenceNode is null, it means we want to append to the end. Check if draggedRow is already the last element.
        if (referenceNode === null && draggedRow === tableBody.lastElementChild) {
            return;
        }
        // 2. If referenceNode is not null, check if draggedRow is already the element immediately before referenceNode.
        if (referenceNode !== null && draggedRow === referenceNode.previousElementSibling) {
            return;
        }

        // 실제 DOM 재정렬 수행
        tableBody.insertBefore(draggedRow, referenceNode);
        updateRowNumbers(); // 행 번호 업데이트

    });

    // 드롭
    tableBody.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedRow) return;

        // 드롭 시점에 이미 `dragover` 이벤트에서 행이 재정렬되었으므로 추가적인 `insertBefore` 로직은 필요 없음.
        // 드롭 대상 강조 해제
        if (currentDropTarget) {
            currentDropTarget.classList.remove('drag-over');
            currentDropTarget = null;
        }
        updateRowNumbers(); // 최종 행 번호 업데이트
    });

    // 드래그 끝
    tableBody.addEventListener('dragend', () => {
        if (!draggedRow) return;

        draggedRow.classList.remove('dragging');
        draggedRow = null;
        draggedRowInitialIndex = -1; // Reset the initial index


        // 혹시 남아있을 수 있는 drag-over 클래스 제거
        if (currentDropTarget) {
            currentDropTarget.classList.remove('drag-over');
            currentDropTarget = null;
        }
        updateRowNumbers(); // 최종 행 번호 업데이트
    });

    // 행 번호 (첫 번째 td) 업데이트 함수
    function updateRowNumbers() {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const firstCell = row.querySelector('td:first-child');
            if (firstCell) {
                firstCell.textContent = index + 1;
            }
        });
    }
});
