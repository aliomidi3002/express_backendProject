const boardEl = document.getElementById('board');
const messageEl = document.getElementById('message');
const resetBtn = document.getElementById('reset');

let boardState;
let currentPlayer;
let gameActive;

const winConditions = [
  [0,1,2], [3,4,5], [6,7,8], // rows
  [0,3,6], [1,4,7], [2,5,8], // columns
  [0,4,8], [2,4,6]           // diagonals
];

function initializeGame() {
  boardState = Array(9).fill('');
  currentPlayer = 'X';
  gameActive = true;
  messageEl.textContent = `Player ${currentPlayer}'s turn`;

  // Clear and render board
  boardEl.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    cell.addEventListener('click', handleCellClick);
    boardEl.appendChild(cell);
  }
}

function handleCellClick(e) {
  const idx = e.target.dataset.index;
  if (boardState[idx] !== '' || !gameActive) return;

  boardState[idx] = currentPlayer;
  e.target.textContent = currentPlayer;

  if (checkWin()) {
    messageEl.textContent = `Player ${currentPlayer} wins!`;
    gameActive = false;
  } else if (boardState.every(cell => cell !== '')) {
    messageEl.textContent = "It's a draw!";
    gameActive = false;
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    messageEl.textContent = `Player ${currentPlayer}'s turn`;
  }
}

function checkWin() {
  return winConditions.some(condition => {
    const [a, b, c] = condition;
    return (
      boardState[a] === currentPlayer &&
      boardState[b] === currentPlayer &&
      boardState[c] === currentPlayer
    );
  });
}

resetBtn.addEventListener('click', initializeGame);

// Start the game
initializeGame();