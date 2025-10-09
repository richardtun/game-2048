const GRID_SIZE = 4;
let board = [];
let score = 0;
const boardElement = document.getElementById('game-board');
const scoreElement = document.getElementById('score');

// track swipe location
let startX = 0;
let startY = 0;
const threshold = 50; // Minimum distance (pixels) to count as a swipe

let highScore = 0;
const highScoreElement = document.getElementById('high-score'); // add element to get high-score

// === Init & Display ===

function startGame() {
    // 1. init grid 4x4 with full of 0
    board = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    scoreElement.textContent = `Score: ${score}`;

    loadHighScore();
    
    // 2. Add random 2 number 2 first
    addRandomTile();
    addRandomTile();

    // 3. display to the UI
    drawBoard();
    console.log("Game started!");
}

function loadHighScore() {
    // Lấy điểm cao nhất từ localStorage, nếu không có thì mặc định là 0
    const storedHighScore = localStorage.getItem('2048HighScore');
    highScore = storedHighScore ? parseInt(storedHighScore) : 0;
    highScoreElement.textContent = `High score: ${highScore}`;
}

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('2048HighScore', highScore);
        highScoreElement.textContent = `High score: ${highScore}`;
        return true;
    }
    return false;
}

function drawBoard() {
    boardElement.innerHTML = ''; // delete old board

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const tileValue = board[r][c];
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.setAttribute('data-value', tileValue);
            tile.textContent = tileValue > 0 ? tileValue : ''; // just display number > 0
            boardElement.appendChild(tile);
        }
    }
    scoreElement.textContent = `Score: ${score}`;
    checkGameOver();
}

function addRandomTile() {
    const emptyTiles = [];
    // Find all blank cells
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (board[r][c] === 0) {
                emptyTiles.push({ r, c });
            }
        }
    }

    if (emptyTiles.length > 0) {
        // Select random 1 blank cell
        const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        // 90% is number 2, 10% is number 4
        board[r][c] = Math.random() < 0.9 ? 2 : 4;
        return true;
    }
    return false; // no more blank cell
}

// === LOGIC CORE MOVE ===

// This function move and merge one line/column
function operateLine(line) {
    let newScore = 0;
    let hasChanged = false;

    // 1. Move (remove 0 and add the numbers)
    let filteredLine = line.filter(val => val !== 0);
    
    // 2. Merge
    for (let i = 0; i < filteredLine.length - 1; i++) {
        if (filteredLine[i] === filteredLine[i+1]) {
            filteredLine[i] *= 2;
            newScore += filteredLine[i];
            filteredLine.splice(i + 1, 1); // delete merged cell
            filteredLine.push(0); // Add 0 to keep the size
            hasChanged = true;
        }
    }

    // 3. Pad the number 0 again
    let newLine = Array(GRID_SIZE).fill(0);
    for(let i = 0; i < filteredLine.length; i++) {
        newLine[i] = filteredLine[i];
    }
    
    // Check to see if any changes have occurred
    if (line.join(',') !== newLine.join(',')) {
        hasChanged = true;
    }

    return { newLine, newScore, hasChanged };
}

// This function calls the compaction/merge logic for the entire table in the move direction.
function move(direction) {
    let boardChanged = false;

    // Temporarily save the table before moving for comparison
    const oldBoard = JSON.parse(JSON.stringify(board));

    // Loop through each row or column
    for (let i = 0; i < GRID_SIZE; i++) {
        let line = [];

        // 1. Get data of corresponding row/column
        if (direction === 'LEFT' || direction === 'RIGHT') {
            line = board[i]; // get row i
        } else {
            // get column i
            for (let j = 0; j < GRID_SIZE; j++) {
                line.push(board[j][i]);
            }
        }
        
        // 2. Handle reversal logic for RIGHT and DOWN
        if (direction === 'RIGHT' || direction === 'DOWN') {
            line.reverse();
        }

        // 3. Perform compression and merge
        let { newLine, newScore, hasChanged } = operateLine(line);
        score += newScore;
        if (hasChanged) boardChanged = true;

        // 4. Handle the reverse logic and update the table
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

    // 5. Add random cells and redraw the table if changes are made
    if (boardChanged) {
        updateHighScore();
        
        addRandomTile();
        drawBoard();
    }
}

// === CHECK GAME STATUS ===

function checkGameOver() {
    // 1. Check if you won (e.g. reached 2048)
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (board[r][c] === 2048) {
                setTimeout(() => alert("Congratulations! You have reached 2048!"), 10);
                // can stop the game here.
                return;
            }
        }
    }

    // 2. Check Game Over (no more empty squares AND no more fusion moves)
    const emptyExists = board.some(row => row.includes(0));
    if (emptyExists) {
        return; // There are still empty cells, not Game Over yet
    }

    // Make a copy to check if there are any moves (without changing the original board)
    const canMove = canMerge();

    if (!canMove) {
        setTimeout(() => alert(`Game Over! Your final score is: ${score}`), 10);
        // Input can be disabled here
    }
}

function canMerge() {
    // Check row
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE - 1; c++) {
            if (board[r][c] !== 0 && board[r][c] === board[r][c + 1]) return true;
        }
    }
    // Check column
    for (let c = 0; c < GRID_SIZE; c++) {
        for (let r = 0; r < GRID_SIZE - 1; r++) {
            if (board[r][c] !== 0 && board[r][c] === board[r + 1][c]) return true;
        }
    }
    return false;
}

// === KEYBOARD EVENT HANDLING ===

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
    e.preventDefault(); // Prevent browser from scrolling when arrow keys are pressed
});

// === SWIPE EVENT HANDLING (MOUSE AND TOUCH) ===

function handleStart(e) {
    // Save start coordinates (for both mouse and touch)
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;
    
    // Prevent page scrolling on mobile while swiping on the game board
    if (e.touches) {
        boardElement.addEventListener('touchmove', handleMove, { passive: false });
        boardElement.addEventListener('touchend', handleEnd, { once: true });
    }
}

function handleMove(e) {
    if (e.touches) {
        // Prevent default browser scrolling behavior for smoother swiping
        e.preventDefault(); 
    }
}

function handleEnd(e) {
    // Get end coordinates (for both mouse and touch)
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

    const diffX = clientX - startX;
    const diffY = clientY - startY;

    // Check if this is a significant swipe
    if (Math.abs(diffX) > threshold || Math.abs(diffY) > threshold) {
        let direction = '';

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Swipe horizontally (LEFT/RIGHT)
            direction = diffX > 0 ? 'RIGHT' : 'LEFT';
        } else {
            // Swipe vertically (UP/DOWN)
            direction = diffY > 0 ? 'DOWN' : 'UP';
        }
        
        if (direction) {
            move(direction);
        }
    }
    
    // Remove 'touchmove' listener after finishing
    if (e.touches) {
        boardElement.removeEventListener('touchmove', handleMove);
    }
}

// === ADD LISTENER TO GAME BOARD ===

// Add events for mouse (mousedown/mouseup)
boardElement.addEventListener('mousedown', handleStart);
document.addEventListener('mouseup', handleEnd); // Attach to document to catch even when mouse leaves table

// Add event for touch (touchstart/touchend)
boardElement.addEventListener('touchstart', handleStart);
// Note: The touchmove/touchend events are dynamically attached in handleStart

// Start the game the first time the page loads
window.onload = startGame;


