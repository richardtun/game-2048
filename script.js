// ===============================================
// === script.js (PHIÊN BẢN HOÀN CHỈNH VỚI HIỆU ỨNG VÀ FIX LỖI) ===
// ===============================================

const GRID_SIZE = 4;
const TILE_GAP = 10;
const TILE_SIZE = 100;
let board = [];
let score = 0;
let tileMap = new Map();
let nextTileId = 1;

const boardElement = document.getElementById('game-board');
const scoreElement = document.getElementById('score');

// === HÀM TÍNH VỊ TRÍ CHO HIỆU ỨNG TRƯỢT ===
function getPosition(row, col) {
    const x = col * (TILE_SIZE + TILE_GAP);
    const y = row * (TILE_SIZE + TILE_GAP);
    // Sử dụng CSS Transform để di chuyển mượt mà
    return `translate(${x}px, ${y}px)`; 
}

// === HÀM KHỞI TẠO GAME VÀ BẢNG NỀN ===
function startGame() {
    board = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    tileMap.clear(); 
    nextTileId = 1;
    
    // TẠO NỀN LƯỚI CỐ ĐỊNH (Grid Cells)
    boardElement.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            boardElement.appendChild(cell);
        }
    }
    
    // Thêm 2 ô ngẫu nhiên
    addRandomTile();
    addRandomTile();

    scoreElement.textContent = `Điểm: ${score}`;
    console.log("Game đã bắt đầu.");
}

// === HÀM TẠO VÀ HIỂN THỊ Ô SỐ MỚI ===
function addRandomTile() {
    const emptyTiles = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (board[r][c] === 0) {
                emptyTiles.push({ r, c });
            }
        }
    }

    if (emptyTiles.length > 0) {
        const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        const id = nextTileId++;
        
        // 1. Cập nhật logic board (lưu Object {value, id})
        board[r][c] = { value: value, id: id }; 

        // 2. Tạo phần tử DOM mới
        const tileContainer = document.createElement('div');
        tileContainer.classList.add('tile-container');
        tileContainer.style.transform = getPosition(r, c);
        
        const tile = document.createElement('div');
        tile.classList.add('tile', 'tile-new'); // Hiệu ứng pop
        tile.setAttribute('data-value', value);
        tile.textContent = value;
        tileContainer.appendChild(tile);
        
        boardElement.appendChild(tileContainer);

        // 3. Lưu phần tử DOM vào Map để theo dõi
        tileMap.set(id, { element: tileContainer, value: value });
        
        return true;
    }
    return false;
}

// === LOGIC CỐT LÕI: NÉN VÀ HỢP NHẤT MỘT DÒNG ===
function operateLine(line) {
    let newScore = 0;
    let hasChanged = false;
    let movements = []; 

    // Loại bỏ ô rỗng
    let filteredLine = line.filter(item => item !== 0);
    
    // Hợp nhất
    for (let i = 0; i < filteredLine.length - 1; i++) {
        const currentTile = filteredLine[i];
        const nextTile = filteredLine[i+1];
        
        if (currentTile && nextTile && currentTile.value === nextTile.value) {
            
            // Ghi nhận hợp nhất: nextTile (bị xóa) hợp nhất vào currentTile (còn lại)
            movements.push({ 
                fromId: nextTile.id, 
                toId: currentTile.id, 
                merged: true,
                newValue: currentTile.value * 2
            });
            
            // Cập nhật giá trị ô đích và điểm
            currentTile.value *= 2; 
            newScore += currentTile.value;
            
            // Xóa ô đã hợp nhất và đẩy ô trống vào cuối
            filteredLine.splice(i + 1, 1); 
            filteredLine.push(0); 
            hasChanged = true;
        }
    }

    // Tạo dòng mới (đã được xử lý)
    let newLine = filteredLine.map(item => item === 0 ? 0 : item);

    // Ghi nhận hành động di chuyển (dùng để tính toán vị trí cuối cùng)
    for (let i = 0; i < newLine.length; i++) {
        if (newLine[i] !== 0) {
            // Ghi nhận di chuyển tới vị trí i
            movements.push({ 
                fromId: newLine[i].id, 
                toIndex: i, 
                merged: false 
            });
        }
    }

    // Đệm thêm số 0 để đủ 4 phần tử
    while (newLine.length < GRID_SIZE) {
        newLine.push(0);
    }
    
    return { newLine, newScore, hasChanged: hasChanged || movements.length > 0, movements };
}

// === HÀM THỰC HIỆN DI CHUYỂN TOÀN BỘ BẢNG (FIX LỖI GÁN LẠI BOARD) ===
function move(direction) {
    let boardChanged = false;
    let allMovements = []; 

    for (let i = 0; i < GRID_SIZE; i++) {
        let line = [];
        let rowIndices = [];
        let colIndices = [];

        // 1. Lấy dữ liệu dòng/cột và chỉ số của chúng
        if (direction === 'LEFT' || direction === 'RIGHT') {
            line = board[i];
            for(let j = 0; j < GRID_SIZE; j++) {
                rowIndices.push(i);
                colIndices.push(j);
            }
        } else {
            for (let j = 0; j < GRID_SIZE; j++) {
                line.push(board[j][i]);
                rowIndices.push(j);
                colIndices.push(i);
            }
        }
        
        // 2. Tạo bản sao để xử lý và xử lý đảo chiều
        let lineForProcessing = line.map(item => item === 0 ? 0 : { ...item });

        if (direction === 'RIGHT' || direction === 'DOWN') {
            lineForProcessing.reverse();
        }
        
        // 3. Thực hiện nén, hợp nhất, và lấy movements
        let { newLine, newScore, hasChanged, movements } = operateLine(lineForProcessing);
        score += newScore;
        if (hasChanged) boardChanged = true;

        // 4. Xử lý logic đảo chiều lại
        if (direction === 'RIGHT' || direction === 'DOWN') {
            newLine.reverse();
        }

        // Cập nhật lại board chính thức và thu thập movements
        for (let j = 0; j < GRID_SIZE; j++) {
            const row = rowIndices[j];
            const col = colIndices[j];
            
            // CẬP NHẬT CHÍNH XÁC MẢNG BOARD GỐC
            board[row][col] = newLine[j];

            // Xử lý movements (chỉ khi ô không phải là 0)
            const currentTile = newLine[j];
            if (currentTile !== 0) {
                // Lấy thông tin di chuyển từ mảng movements đã tạo
                const moveData = movements.find(m => m.fromId === currentTile.id);
                if (moveData) {
                    allMovements.push({ 
                        ...moveData, 
                        finalRow: row, 
                        finalCol: col 
                    });
                }
            }
        }
    }

    // 5. THỰC HIỆN HIỆU ỨNG SAU KHI LOGIC HOÀN TẤT
    if (boardChanged) {
        animateTiles(allMovements).then(() => {
            addRandomTile();
            checkGameOver();
            scoreElement.textContent = `Điểm: ${score}`;
        });
    }
}

// === HÀM THỰC HIỆN HIỆU ỨNG CHUYỂN ĐỘNG ===
function animateTiles(movements) {
    return new Promise(resolve => {
        let maxDuration = 0;
        
        movements.forEach(m => {
            const tileData = tileMap.get(m.fromId);
            if (!tileData) return;

            // 1. Di chuyển ô số đến vị trí cuối cùng
            tileData.element.style.transform = getPosition(m.finalRow, m.finalCol);
            maxDuration = Math.max(maxDuration, 150); // Thời gian transition CSS
            
            // 2. Xử lý hợp nhất
            if (m.merged) {
                const targetTileData = tileMap.get(m.toId);
                
                // Sau khi ô di chuyển đến, thực hiện hợp nhất
                setTimeout(() => {
                    // Cập nhật giá trị ô đích (cho cả logic JS và DOM)
                    targetTileData.element.firstChild.setAttribute('data-value', m.newValue);
                    targetTileData.element.firstChild.textContent = m.newValue;
                    targetTileData.element.firstChild.classList.add('tile-merged');
                    
                    // Xóa ô đã hợp nhất (ô nguồn)
                    tileData.element.remove();
                    tileMap.delete(m.fromId);
                }, 150);
            }
        });

        // Chờ tất cả hiệu ứng chuyển động và hợp nhất kết thúc
        /*setTimeout(() => {
            // Xóa lớp 'merged' để sẵn sàng cho lần hợp nhất tiếp theo
            tileMap.forEach(data => {
                data.element.firstChild.classList.remove('tile-merged');
                data.element.firstChild.classList.remove('tile-new');
            });
            resolve();
        }, maxDuration + 200); // 150ms trượt + 200ms hợp nhất*/

        // ... bên trong animateTiles(movements)
        return new Promise(resolve => {
            // Thời gian chờ: 150ms (trượt) + 200ms (pop/bounce)
            setTimeout(() => {
                
                // DỌN DẸP LỚP CSS TẠM THỜI
                tileMap.forEach(data => {
                    // Kiểm tra xem phần tử con (inner tile) có còn tồn tại không. 
                    // Điều này ngăn lỗi khi cố gắng thao tác với ô đã bị xóa do hợp nhất.
                    const innerTile = data.element.firstChild; 
                    if (innerTile) {
                        innerTile.classList.remove('tile-merged');
                        innerTile.classList.remove('tile-new'); 
                    }
                });
    
                // ... (Đảm bảo bạn có logic cập nhật DOM tại đây, nếu cần)
                
                resolve();
            }, maxDuration + 200);
        });
            
    });
}


// === KIỂM TRA TRẠNG THÁI GAME ===
function checkGameOver() {
    // ... (Giữ nguyên logic checkGameOver và canMerge của bạn, hoặc dùng phiên bản cũ)
    const emptyExists = board.some(row => row.includes(0));
    if (emptyExists) return;

    // Kiểm tra hàng ngang
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE - 1; c++) {
            if (board[r][c] !== 0 && board[r][c].value === board[r][c + 1].value) return;
        }
    }
    // Kiểm tra hàng dọc
    for (let c = 0; c < GRID_SIZE; c++) {
        for (let r = 0; r < GRID_SIZE - 1; r++) {
            if (board[r][c] !== 0 && board[r][c].value === board[r + 1][c].value) return;
        }
    }
    
    setTimeout(() => alert(`Game Over! Điểm cuối cùng của bạn là: ${score}`), 10);
}


// === XỬ LÝ SỰ KIỆN BÀN PHÍM VÀ VUỐT ===
let startX = 0;
let startY = 0;
const threshold = 50;

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': move('UP'); break;
        case 'ArrowDown': case 's': case 'S': move('DOWN'); break;
        case 'ArrowLeft': case 'a': case 'A': move('LEFT'); break;
        case 'ArrowRight': case 'd': case 'D': move('RIGHT'); break;
        default: return;
    }
    e.preventDefault();
});

function handleStart(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startX = clientX;
    startY = clientY;
    if (e.touches) {
        boardElement.addEventListener('touchmove', handleMove, { passive: false });
        boardElement.addEventListener('touchend', handleEnd, { once: true });
    }
}
function handleMove(e) { if (e.touches) e.preventDefault(); }
function handleEnd(e) {
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const diffX = clientX - startX;
    const diffY = clientY - startY;

    if (Math.abs(diffX) > threshold || Math.abs(diffY) > threshold) {
        let direction = '';
        if (Math.abs(diffX) > Math.abs(diffY)) {
            direction = diffX > 0 ? 'RIGHT' : 'LEFT';
        } else {
            direction = diffY > 0 ? 'DOWN' : 'UP';
        }
        if (direction) move(direction);
    }
    if (e.touches) boardElement.removeEventListener('touchmove', handleMove);
}

boardElement.addEventListener('mousedown', handleStart);
document.addEventListener('mouseup', handleEnd); 
boardElement.addEventListener('touchstart', handleStart);

window.onload = startGame;


