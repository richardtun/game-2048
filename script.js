const GRID_SIZE = 4;
const TILE_GAP = 10; // Khoảng cách (gap)
const TILE_SIZE = 100; // Kích thước mỗi ô
let board = [];
let score = 0;
// Sử dụng Map để lưu trữ các đối tượng tile HTML, khóa là một ID duy nhất
let tileMap = new Map();
let nextTileId = 1;

const boardElement = document.getElementById('game-board');
const scoreElement = document.getElementById('score');

// === 1. HÀM TÍNH VỊ TRÍ (MỚI) ===
function getPosition(row, col) {
    const x = col * (TILE_SIZE + TILE_GAP);
    const y = row * (TILE_SIZE + TILE_GAP);
    return `translate(${x}px, ${y}px)`;
}

// === 2. HÀM KHỞI TẠO GAME (CẬP NHẬT) ===
function startGame() {
    // ... (Khởi tạo board, score)
    board = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    tileMap.clear(); // Xóa các ô cũ
    nextTileId = 1;
    
    // TẠO NỀN LƯỚI CỐ ĐỊNH LẦN ĐẦU
    boardElement.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            boardElement.appendChild(cell);
        }
    }
    
    // ... (Thêm 2 số ngẫu nhiên)
    addRandomTile();
    addRandomTile();

    // Hiển thị lần đầu (vì giờ chúng ta tạo ô số trong addRandomTile, nên chỉ cần cập nhật điểm)
    scoreElement.textContent = `Điểm: ${score}`;
    console.log("Game đã bắt đầu!");
}

// === 3. HÀM TẠO Ô SỐ NGẪU NHIÊN (CẬP NHẬT) ===
function addRandomTile() {
    // ... (Tìm ô trống như cũ)
    const emptyTiles = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            // LƯU Ý: Ô trống giờ là ô có giá trị 0 VÀ không có ID (vì nó không phải là 1 ô số đang tồn tại)
            if (board[r][c] === 0) {
                emptyTiles.push({ r, c });
            }
        }
    }

    if (emptyTiles.length > 0) {
        const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        
        // 1. Cập nhật logic board
        board[r][c] = { value: value, id: nextTileId++ }; // Lưu cả ID

        // 2. Tạo phần tử DOM mới
        const tileContainer = document.createElement('div');
        tileContainer.classList.add('tile-container');
        tileContainer.style.transform = getPosition(r, c);
        
        const tile = document.createElement('div');
        tile.classList.add('tile', 'tile-new'); // Thêm lớp tile-new để có hiệu ứng pop
        tile.setAttribute('data-value', value);
        tile.textContent = value;
        tileContainer.appendChild(tile);
        
        boardElement.appendChild(tileContainer);

        // 3. Lưu phần tử DOM vào Map để theo dõi
        tileMap.set(board[r][c].id, { element: tileContainer, value: value });
        
        return true;
    }
    return false;
}

// === 4. HÀM VẼ LẠI BẢNG (LOẠI BỎ - CHỈ CẬP NHẬT VỊ TRÍ) ===
// Giờ đây, hàm drawBoard() cũ được thay thế bằng việc cập nhật vị trí trong hàm move()

// === 5. CẬP NHẬT LOGIC CHUYỂN ĐỘNG (THAY ĐỔI LỚN) ===

// Cập nhật cấu trúc dữ liệu của ô số trong bảng (thay vì chỉ lưu số, giờ lưu đối tượng)
// LƯU Ý: Phải cập nhật hàm operateLine() để làm việc với cấu trúc Object {value, id}

function operateLine(line) {
    let newScore = 0;
    let hasChanged = false;
    let movements = []; // Lưu trữ các hành động di chuyển/hợp nhất

    // 1. Nén (Loại bỏ ô rỗng)
    let filteredLine = line.filter(item => item !== 0);
    
    // 2. Hợp nhất
    for (let i = 0; i < filteredLine.length - 1; i++) {
        const currentTile = filteredLine[i];
        const nextTile = filteredLine[i+1];
        
        if (currentTile.value === nextTile.value) {
            // Ghi nhận hành động hợp nhất (nextTile hợp nhất vào currentTile)
            movements.push({ 
                fromId: nextTile.id, 
                toId: currentTile.id, 
                merged: true,
                newValue: currentTile.value * 2
            });
            
            // Cập nhật giá trị ô đích
            currentTile.value *= 2;
            newScore += currentTile.value;
            
            // Xóa ô đã hợp nhất và đẩy ô trống vào cuối
            filteredLine.splice(i + 1, 1);
            filteredLine.push(0);
            hasChanged = true;
        }
    }
    
    // 3. Tạo dòng mới (bao gồm các ô rỗng ở cuối)
    let newLine = filteredLine.map(item => item === 0 ? 0 : item);

    // 4. Ghi nhận hành động di chuyển của các ô còn lại
    for (let i = 0; i < newLine.length; i++) {
        if (newLine[i] !== 0) {
            movements.push({ 
                fromId: newLine[i].id, 
                toIndex: i, // Vị trí cuối cùng trong dòng
                merged: false 
            });
        }
    }

    // Kiểm tra xem có sự thay đổi vị trí nào không (cần so sánh phức tạp hơn)
    // Để đơn giản, ta dựa vào `movements` và `hasChanged`
    
    // Đệm thêm số 0 để đủ 4 phần tử
    while (newLine.length < GRID_SIZE) {
        newLine.push(0);
    }
    
    return { newLine, newScore, hasChanged: hasChanged || movements.length > 0, movements };
}

function move(direction) {
    let boardChanged = false;
    let allMovements = []; 

    for (let i = 0; i < GRID_SIZE; i++) {
        let line = [];
        let rowIndices = []; // Lưu chỉ số hàng
        let colIndices = []; // Lưu chỉ số cột

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

        // 4. Xử lý logic đảo chiều lại và CẬP NHẬT BOARD (PHẦN QUAN TRỌNG)
        if (direction === 'RIGHT' || direction === 'DOWN') {
            newLine.reverse();
        }

        // Cập nhật lại board chính thức và thu thập movements
        for (let j = 0; j < GRID_SIZE; j++) {
            const row = rowIndices[j];
            const col = colIndices[j];
            
            // Cập nhật lại board chính thức bằng kết quả xử lý
            board[row][col] = newLine[j];

            // Xử lý movements (chỉ khi ô không phải là 0)
            const currentTile = newLine[j];
            if (currentTile !== 0) {
                // Kiểm tra xem ID của ô này có nằm trong movements đã tạo ra không
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

    // 5. THỰC HIỆN HIỆU ỨNG
    if (boardChanged) {
        animateTiles(allMovements).then(() => {
            // Sau khi hiệu ứng kết thúc, thêm ô mới và kiểm tra Game Over
            addRandomTile();
            checkGameOver();
            scoreElement.textContent = `Điểm: ${score}`;
        });
    }
}


// === 6. HÀM THỰC HIỆN HIỆU ỨNG (MỚI) ===
function animateTiles(movements) {
    return new Promise(resolve => {
        let maxDuration = 0;
        
        movements.forEach(m => {
            const tileData = tileMap.get(m.fromId);
            if (!tileData) return;

            // 1. Di chuyển ô số đến vị trí cuối cùng
            tileData.element.style.transform = getPosition(m.finalRow, m.finalCol);
            maxDuration = Math.max(maxDuration, 150); // Lấy thời gian transition CSS
            
            // 2. Xử lý hợp nhất
            if (m.merged) {
                // Lấy ô đích (sẽ là ô nhận giá trị mới)
                const targetTileData = tileMap.get(m.toId);
                
                // Sau khi ô di chuyển đến (sau 150ms), thực hiện hợp nhất
                setTimeout(() => {
                    // Cập nhật giá trị ô đích
                    targetTileData.element.firstChild.setAttribute('data-value', m.newValue);
                    targetTileData.element.firstChild.textContent = m.newValue;
                    targetTileData.element.firstChild.classList.add('tile-merged'); // Thêm hiệu ứng bounce
                    
                    // Xóa ô đã hợp nhất (ô nguồn)
                    tileData.element.remove();
                    tileMap.delete(m.fromId);
                }, 150);
            }
        });

        // Chờ tất cả hiệu ứng chuyển động kết thúc
        setTimeout(() => {
            // Sau khi hiệu ứng hợp nhất kết thúc (tổng cộng 150ms trượt + 200ms hợp nhất)
            // Cần xóa lớp merged để sẵn sàng cho lần hợp nhất tiếp theo
            tileMap.forEach(data => {
                data.element.firstChild.classList.remove('tile-merged');
            });
            resolve();
        }, maxDuration + 200); // 150ms cho trượt + 200ms cho hợp nhất (bounce)
    });
}

// ===============================================
// === 7. XỬ LÝ SỰ KIỆN BÀN PHÍM VÀ VUỐT ===
// ===============================================

// --- Biến theo dõi cho CỬ CHỈ VUỐT ---
let startX = 0;
let startY = 0;
const threshold = 50; // Khoảng cách tối thiểu (pixel) để tính là một cú vuốt

// --- Xử lý BÀN PHÍM ---
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            move('UP');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            move('DOWN');
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            move('LEFT');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            move('RIGHT');
            break;
        default:
            return;
    }
    e.preventDefault(); // Ngăn trình duyệt cuộn khi nhấn phím mũi tên
});

// --- Xử lý CỬ CHỈ VUỐT (Chuột và Chạm) ---

function handleStart(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;
    
    // Gắn listener cho cử chỉ chạm (vì chuột đã có document.mouseup)
    if (e.touches) {
        boardElement.addEventListener('touchmove', handleMove, { passive: false });
        boardElement.addEventListener('touchend', handleEnd, { once: true });
    }
}

function handleMove(e) {
    if (e.touches) {
        e.preventDefault(); 
    }
}

function handleEnd(e) {
    // Lấy tọa độ kết thúc
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

    const diffX = clientX - startX;
    const diffY = clientY - startY;

    if (Math.abs(diffX) > threshold || Math.abs(diffY) > threshold) {
        let direction = '';

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Vuốt ngang
            direction = diffX > 0 ? 'RIGHT' : 'LEFT';
        } else {
            // Vuốt dọc
            direction = diffY > 0 ? 'DOWN' : 'UP';
        }
        
        if (direction) {
            move(direction);
        }
    }
    
    // Dọn dẹp listener touchmove
    if (e.touches) {
        boardElement.removeEventListener('touchmove', handleMove);
    }
}

// Gắn listener khởi tạo
boardElement.addEventListener('mousedown', handleStart);
document.addEventListener('mouseup', handleEnd); 
boardElement.addEventListener('touchstart', handleStart);

// Khởi động game lần đầu khi trang được tải
window.onload = startGame;


