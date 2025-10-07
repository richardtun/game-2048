const GRID_SIZE = 4;
let board = [];
let score = 0;
const boardElement = document.getElementById('game-board');
const scoreElement = document.getElementById('score');

// === HÀM KHỞI TẠO VÀ HIỂN THỊ ===

function startGame() {
    // 1. Khởi tạo lưới 4x4 toàn số 0
    board = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    scoreElement.textContent = `Điểm: ${score}`;

    // 2. Thêm 2 số 2 ngẫu nhiên ban đầu
    addRandomTile();
    addRandomTile();

    // 3. Hiển thị ra giao diện
    drawBoard();
    console.log("Game đã bắt đầu!");
}

function drawBoard() {
    boardElement.innerHTML = ''; // Xóa bảng cũ

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const tileValue = board[r][c];
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.setAttribute('data-value', tileValue);
            tile.textContent = tileValue > 0 ? tileValue : ''; // Chỉ hiển thị số > 0
            boardElement.appendChild(tile);
        }
    }
    scoreElement.textContent = `Điểm: ${score}`;
    checkGameOver();
}

function addRandomTile() {
    const emptyTiles = [];
    // Tìm tất cả các ô trống
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (board[r][c] === 0) {
                emptyTiles.push({ r, c });
            }
        }
    }

    if (emptyTiles.length > 0) {
        // Chọn ngẫu nhiên 1 ô trống
        const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        // 90% là số 2, 10% là số 4
        board[r][c] = Math.random() < 0.9 ? 2 : 4;
        return true;
    }
    return false; // Không còn ô trống
}

// === LOGIC CHUYỂN ĐỘNG CỐT LÕI ===

// Hàm này sẽ nén (move) và hợp nhất (merge) một hàng/cột duy nhất
function operateLine(line) {
    let newScore = 0;
    let hasChanged = false;

    // 1. Nén (Loại bỏ số 0 và dồn số lại)
    let filteredLine = line.filter(val => val !== 0);
    
    // 2. Hợp nhất
    for (let i = 0; i < filteredLine.length - 1; i++) {
        if (filteredLine[i] === filteredLine[i+1]) {
            filteredLine[i] *= 2;
            newScore += filteredLine[i];
            filteredLine.splice(i + 1, 1); // Xóa phần tử đã hợp nhất
            filteredLine.push(0); // Thêm số 0 vào cuối để giữ kích thước
            hasChanged = true;
        }
    }

    // 3. Đệm lại số 0 (Pad)
    let newLine = Array(GRID_SIZE).fill(0);
    for(let i = 0; i < filteredLine.length; i++) {
        newLine[i] = filteredLine[i];
    }
    
    // Kiểm tra xem có sự thay đổi nào xảy ra không
    if (line.join(',') !== newLine.join(',')) {
        hasChanged = true;
    }

    return { newLine, newScore, hasChanged };
}

// Hàm này gọi logic nén/hợp nhất cho toàn bộ bảng theo hướng di chuyển
function move(direction) {
    let boardChanged = false;

    // Tạm lưu bảng trước khi di chuyển để so sánh
    const oldBoard = JSON.parse(JSON.stringify(board));

    // Lặp qua từng hàng hoặc cột
    for (let i = 0; i < GRID_SIZE; i++) {
        let line = [];

        // 1. Lấy dữ liệu của hàng/cột tương ứng
        if (direction === 'LEFT' || direction === 'RIGHT') {
            line = board[i]; // Lấy hàng i
        } else {
            // Lấy cột i
            for (let j = 0; j < GRID_SIZE; j++) {
                line.push(board[j][i]);
            }
        }
        
        // 2. Xử lý logic đảo chiều cho RIGHT và DOWN
        if (direction === 'RIGHT' || direction === 'DOWN') {
            line.reverse();
        }

        // 3. Thực hiện nén và hợp nhất
        let { newLine, newScore, hasChanged } = operateLine(line);
        score += newScore;
        if (hasChanged) boardChanged = true;

        // 4. Xử lý logic đảo chiều lại và cập nhật bảng
        if (direction === 'RIGHT' || direction === 'DOWN') {
            newLine.reverse();
        }

        if (direction === 'LEFT' || direction === 'RIGHT') {
            board[i] = newLine;
        } else {
            for (let j = 0; j < GRID_SIZE; j++) {
                board[j][i] = newLine[j];
            }
        }
    }

    // 5. Thêm ô ngẫu nhiên và vẽ lại bảng nếu có thay đổi
    if (boardChanged) {
        addRandomTile();
        drawBoard();
    }
}

// === KIỂM TRA TRẠNG THÁI GAME ===

function checkGameOver() {
    // 1. Kiểm tra đã thắng chưa (ví dụ: đạt 2048)
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (board[r][c] === 2048) {
                setTimeout(() => alert("Chúc mừng! Bạn đã đạt 2048!"), 10);
                // Có thể dừng game ở đây
                return;
            }
        }
    }

    // 2. Kiểm tra Game Over (không còn ô trống VÀ không còn nước đi hợp nhất nào)
    const emptyExists = board.some(row => row.includes(0));
    if (emptyExists) {
        return; // Vẫn còn ô trống, chưa Game Over
    }

    // Tạo một bản sao để kiểm tra xem có nước đi nào không (mà không thay đổi bảng gốc)
    const canMove = canMerge();

    if (!canMove) {
        setTimeout(() => alert(`Game Over! Điểm cuối cùng của bạn là: ${score}`), 10);
        // Có thể vô hiệu hóa input ở đây
    }
}

function canMerge() {
    // Kiểm tra hàng ngang
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE - 1; c++) {
            if (board[r][c] !== 0 && board[r][c] === board[r][c + 1]) return true;
        }
    }
    // Kiểm tra hàng dọc
    for (let c = 0; c < GRID_SIZE; c++) {
        for (let r = 0; r < GRID_SIZE - 1; r++) {
            if (board[r][c] !== 0 && board[r][c] === board[r + 1][c]) return true;
        }
    }
    return false;
}

// === XỬ LÝ SỰ KIỆN BÀN PHÍM ===

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

// Khởi động game lần đầu khi trang được tải
window.onload = startGame;