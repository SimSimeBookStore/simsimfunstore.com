const totalImages = 5;
const boardDimension = 500; // Visual board size (CSS). Runtime slicing uses actual inner size.
const puzzleImages = [
    'assets/1-the forest.png',
    'assets/2-rabbits.png',
    'assets/3-race.png',
    'assets/4-circus.png',
    'assets/5-school.png'
];

// Define unique difficulty settings (grid columns and rows) for each of the 5 images
const imageDifficulties = {
    1: { cols: 5, rows: 5, total: 25 },   // Image 1: 25 pieces
    2: { cols: 6, rows: 5, total: 30 },   // Image 2: 30 pieces
    3: { cols: 7, rows: 5, total: 35 },   // Image 3: 35 pieces
    4: { cols: 8, rows: 5, total: 40 },   // Image 4: 40 pieces
    5: { cols: 10, rows: 5, total: 50 }   // Image 5: 50 pieces
};

let currentImageIndex = 1;
let currentConfig = {};
let placedCount = 0;
let currentImagePath = '';
let draggedPiece = null;
const assistSnapChance = 1.0;

const galleryScreen = document.getElementById('galleryScreen');
const gameScreen = document.getElementById('gameScreen');
const imageGrid = document.getElementById('imageGrid');
const puzzleBoard = document.getElementById('puzzleBoard');
const piecesTray = document.getElementById('piecesTray');
const referenceImage = document.getElementById('referenceImage');
const progressText = document.getElementById('progressText');
const instructionText = document.getElementById('instructionText');
const stopButton = document.getElementById('stopButton');

const yesAudio = document.getElementById('yesAudio');
const noAudio = document.getElementById('noAudio');

// 1. Initialize the Gallery Menu (Display 5 Thumbnails with difficulty labels)
function initGallery() {
    imageGrid.innerHTML = '';
    for (let i = 1; i <= totalImages; i++) {
        const thumb = document.createElement('div');
        thumb.classList.add('gallery-thumb');
        const imgPath = puzzleImages[i - 1];
        thumb.style.backgroundImage = `url('${imgPath}')`;
        
        // Add a badge showing the piece count difficulty
        const badge = document.createElement('div');
        badge.classList.add('difficulty-badge');
        badge.textContent = `${imageDifficulties[i].total} Pieces`;
        thumb.appendChild(badge);

        thumb.addEventListener('click', () => startPuzzle(i, imgPath));
        imageGrid.appendChild(thumb);
    }
}

function applyTileBackground(element, tileIndex) {
    const col = tileIndex % currentConfig.cols;
    const row = Math.floor(tileIndex / currentConfig.cols);
    const xPercent = currentConfig.cols > 1 ? (col / (currentConfig.cols - 1)) * 100 : 0;
    const yPercent = currentConfig.rows > 1 ? (row / (currentConfig.rows - 1)) * 100 : 0;

    element.style.backgroundImage = `url('${currentImagePath}')`;
    element.style.backgroundSize = `${currentConfig.cols * 100}% ${currentConfig.rows * 100}%`;
    element.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
}

// 2. Start a Specific Puzzle Game based on Image Index
function startPuzzle(imageIndex, imagePath) {
    currentImageIndex = imageIndex;
    currentImagePath = imagePath;
    currentConfig = imageDifficulties[imageIndex];
    placedCount = 0;

    progressText.textContent = `Placed: 0 / ${currentConfig.total}`;
    instructionText.textContent = `Solving ${currentConfig.total}-piece puzzle! Drag pieces into place.`;
    referenceImage.src = currentImagePath;

    // Switch screens
    galleryScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    puzzleBoard.innerHTML = '';
    piecesTray.innerHTML = '';
    puzzleBoard.style.backgroundImage = 'none';
    puzzleBoard.style.backgroundSize = '100% 100%';

    // Adjust CSS grid dimensions dynamically for the board
    puzzleBoard.style.gridTemplateColumns = `repeat(${currentConfig.cols}, 1fr)`;
    puzzleBoard.style.gridTemplateRows = `repeat(${currentConfig.rows}, 1fr)`;

    let pieceIndices = Array.from({ length: currentConfig.total }, (_, i) => i);
    let shuffledIndices = [...pieceIndices].sort(() => Math.random() - 0.5);

    // Create Board Drop Slots
    for (let i = 0; i < currentConfig.total; i++) {
        const slot = document.createElement('div');
        slot.classList.add('drop-slot');
        slot.dataset.index = i;
        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', handleDrop);
        puzzleBoard.appendChild(slot);
    }

    // Create Shuffled Pieces in Tray
    shuffledIndices.forEach((index) => {
        const piece = document.createElement('div');
        piece.classList.add('puzzle-piece');
        piece.dataset.index = index;
        piece.style.width = '100%';
        piece.style.aspectRatio = `${currentConfig.rows} / ${currentConfig.cols}`;
        applyTileBackground(piece, index);

        piece.draggable = true;
        piece.addEventListener('dragstart', handleDragStart);
        piecesTray.appendChild(piece);
    });
}

function handleDragStart(e) {
    this.dataset.originIndex = Array.from(piecesTray.children).indexOf(this);
    draggedPiece = this;
}

function returnPieceToTray(piece) {
    const originIndex = Number(piece.dataset.originIndex);
    const trayPieces = Array.from(piecesTray.children).filter((child) => child !== piece);

    if (originIndex >= trayPieces.length) {
        piecesTray.appendChild(piece);
    } else {
        piecesTray.insertBefore(piece, trayPieces[originIndex]);
    }
}

function placePieceInSlot(piece, slot, pieceIndex) {
    slot.classList.add('correct');
    slot.style.border = 'none';
    applyTileBackground(slot, pieceIndex);
    piece.remove();

    yesAudio.currentTime = 0;
    yesAudio.play();

    placedCount++;
    progressText.textContent = `Placed: ${placedCount} / ${currentConfig.total}`;

    if (placedCount === currentConfig.total) {
        setTimeout(() => {
            alert(`🌟 Fantastic! You completed the ${currentConfig.total}-piece puzzle!`);
            returnToGallery();
        }, 300);
    }
}

function handleDrop(e) {
    e.preventDefault();
    if (!draggedPiece) return;

    const targetSlot = this;
    const pieceIndex = parseInt(draggedPiece.dataset.index);
    const slotIndex = parseInt(targetSlot.dataset.index);

    if (pieceIndex === slotIndex && !targetSlot.classList.contains('correct')) {
        placePieceInSlot(draggedPiece, targetSlot, pieceIndex);
    } else {
        returnPieceToTray(draggedPiece);
        noAudio.currentTime = 0;
        noAudio.play();
    }

    draggedPiece = null;
}

// 3. Stop / Quit current puzzle and return to menu
function returnToGallery() {
    gameScreen.classList.add('hidden');
    galleryScreen.classList.remove('hidden');
    instructionText.textContent = "Choose a picture to start solving your puzzle!";
}

stopButton.addEventListener('click', () => {
    if (confirm("Do you want to stop this puzzle and pick a different image?")) {
        returnToGallery();
    }
});

// Run Gallery on load
initGallery();