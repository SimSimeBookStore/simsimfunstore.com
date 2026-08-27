const totalAnimals = 25;
let foundCount = 0;
const animalImages = [
    'assets/01_lion.png',
    'assets/02_elephant.png',
    'assets/03_giraffe.png',
    'assets/04_zebra.png',
    'assets/05_monkey.png',
    'assets/06_panda.png',
    'assets/07_tiger.png',
    'assets/08_bunny.png',
    'assets/09_koala.png',
    'assets/10_hedgehog.png',
    'assets/11_fox.png',
    'assets/12_deer.png',
    'assets/13_raccoon.png',
    'assets/14_polar_bear.png',
    'assets/15_owl.png',
    'assets/16_crocodile.png',
    'assets/17_hippo.png',
    'assets/18_squirrel.png',
    'assets/19_camel.png',
    'assets/20_duck.png',
    'assets/21_puppy.png',
    'assets/22_cat.png',
    'assets/23_chicken.png',
    'assets/24_turtle.png',
    'assets/25_fish.png'
];

const dropZoneGrid = document.getElementById('dropZoneGrid');
const animalTray = document.getElementById('animalTray');
const scoreText = document.getElementById('scoreText');
const chirrupAudio = document.getElementById('chirrupAudio');
const hornAudio = document.getElementById('hornAudio');

let audioContext = null;
let availableVoices = [];
const loadedAudio = {
    cheer: false,
    horn: false
};
const fallbackDurationMs = {
    cheer: 650,
    horn: 900
};

function refreshVoices() {
    if (!('speechSynthesis' in window)) return;
    availableVoices = window.speechSynthesis.getVoices();
}

function initSpeech() {
    if (!('speechSynthesis' in window)) return;

    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
}

function pickKidLikeVoice() {
    if (!availableVoices.length) return null;

    const strongChildPattern = /child|kid|kids|young|junior/i;
    const softChildPattern = /girl|female|lisa|aria|sara|zira/i;

    const strongMatch = availableVoices.find((voice) => strongChildPattern.test(voice.name));
    if (strongMatch) return strongMatch;

    const softMatch = availableVoices.find((voice) => softChildPattern.test(voice.name));
    if (softMatch) return softMatch;

    return availableVoices[0];
}

function speakAnimalName(name) {
    if (!('speechSynthesis' in window) || !name) return;

    const utterance = new SpeechSynthesisUtterance(`It's a ${name}`);
    const voice = pickKidLikeVoice();

    if (voice) {
        utterance.voice = voice;
    }

    // Tuned to sound closer to a young child voice.
    utterance.pitch = 1.95;
    utterance.rate = 1.08;
    utterance.volume = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}

function initAudioState() {
    if (chirrupAudio) {
        chirrupAudio.addEventListener('canplaythrough', () => {
            loadedAudio.cheer = true;
        });
        chirrupAudio.addEventListener('error', () => {
            loadedAudio.cheer = false;
        });
        chirrupAudio.load();
    }

    if (hornAudio) {
        hornAudio.addEventListener('canplaythrough', () => {
            loadedAudio.horn = true;
        });
        hornAudio.addEventListener('error', () => {
            loadedAudio.horn = false;
        });
        hornAudio.load();
    }
}

function getAudioContext() {
    if (!audioContext) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioContext = new Ctx();
    }
    return audioContext;
}

function playTone(frequency, duration, type = 'sine', volume = 0.12, delay = 0) {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }

    const startTime = ctx.currentTime + delay;
    const endTime = startTime + duration;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(endTime);
}

function playFallbackSound(kind) {
    if (kind === 'cheer') {
        // Longer upbeat double-chirp.
        playTone(740, 0.28, 'triangle', 0.12, 0);
        playTone(980, 0.34, 'triangle', 0.12, 0.22);
        return;
    }

    // Longer horn-like buzz for wrong choice.
    playTone(190, 0.55, 'sawtooth', 0.14, 0);
    playTone(170, 0.35, 'sawtooth', 0.12, 0.32);
}

function playSound(kind) {
    const audioElement = kind === 'cheer' ? chirrupAudio : hornAudio;
    const isLoaded = kind === 'cheer' ? loadedAudio.cheer : loadedAudio.horn;

    if (!audioElement || !isLoaded) {
        playFallbackSound(kind);
        return;
    }

    audioElement.currentTime = 0;
    audioElement.play().catch(() => {
        playFallbackSound(kind);
    });
}

function playSoundThen(kind, onComplete) {
    const audioElement = kind === 'cheer' ? chirrupAudio : hornAudio;
    const isLoaded = kind === 'cheer' ? loadedAudio.cheer : loadedAudio.horn;
    const finish = () => {
        if (typeof onComplete === 'function') {
            onComplete();
        }
    };

    if (!audioElement || !isLoaded) {
        playFallbackSound(kind);
        setTimeout(finish, fallbackDurationMs[kind]);
        return;
    }

    audioElement.currentTime = 0;
    const handleEnded = () => {
        audioElement.removeEventListener('ended', handleEnded);
        audioElement.removeEventListener('error', handleEnded);
        finish();
    };

    audioElement.addEventListener('ended', handleEnded, { once: true });
    audioElement.addEventListener('error', handleEnded, { once: true });

    audioElement.play().catch(() => {
        audioElement.removeEventListener('ended', handleEnded);
        audioElement.removeEventListener('error', handleEnded);
        playFallbackSound(kind);
        setTimeout(finish, fallbackDurationMs[kind]);
    });
}

function getAnimalNameById(id) {
    const imagePath = animalImages[id - 1] || '';
    const fileName = imagePath.split('/').pop() || '';
    const rawName = fileName.replace(/^\d+_/, '').replace('.png', '');

    return rawName
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function setSlotAnimalName(slot, id) {
    const existingLabel = slot.querySelector('.slot-name');
    if (existingLabel) {
        existingLabel.remove();
    }

    const label = document.createElement('span');
    label.className = 'slot-name';
    label.textContent = getAnimalNameById(id);
    slot.appendChild(label);
}

// Initialize Game Board Slots & Tray Pieces
function initGame() {
    // Create arrays and shuffle tray pieces
    let indices = Array.from({ length: totalAnimals }, (_, i) => i + 1);
    let shuffledIndices = [...indices].sort(() => Math.random() - 0.5);

    for (let i = 1; i <= totalAnimals; i++) {
        // Create Target Slot
        const slot = document.createElement('div');
        slot.classList.add('slot');
        slot.dataset.id = i;
        slot.style.backgroundImage = `linear-gradient(rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.65)), url('${animalImages[i - 1]}')`;
        
        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', handleDrop);
        dropZoneGrid.appendChild(slot);
    }

    shuffledIndices.forEach((index) => {
        // Create Draggable Animal Piece
        const piece = document.createElement('div');
        piece.classList.add('animal-piece');
        piece.dataset.id = index;
        piece.style.backgroundImage = `url('${animalImages[index - 1]}')`;
        
        piece.draggable = true;
        piece.addEventListener('dragstart', handleDragStart);
        animalTray.appendChild(piece);
    });
}

let draggedPiece = null;
const wrongReturnDelayMs = 2000;

function handleDragStart(e) {
    draggedPiece = this;
    draggedPiece.dataset.originIndex = Array.from(animalTray.children).indexOf(draggedPiece);
    this.classList.add('dragging');
}

function returnPieceToTray(piece) {
    const originIndex = Number(piece.dataset.originIndex);
    const trayPieces = Array.from(animalTray.children).filter((child) => child !== piece);

    if (originIndex >= trayPieces.length) {
        animalTray.appendChild(piece);
    } else {
        animalTray.insertBefore(piece, trayPieces[originIndex]);
    }

    piece.classList.add('returning');
    setTimeout(() => piece.classList.remove('returning'), 220);
}

function holdWrongPlacementThenReturn(slot, piece) {
    slot.classList.add('wrong');
    slot.appendChild(piece);
    piece.classList.add('locked');
    piece.draggable = false;

    setTimeout(() => {
        slot.classList.remove('wrong');
        piece.classList.remove('locked');
        piece.draggable = true;
        returnPieceToTray(piece);
    }, wrongReturnDelayMs);
}

function handleDrop(e) {
    e.preventDefault();
    if (!draggedPiece) return;

    const targetSlot = this;
    const pieceId = draggedPiece.dataset.id;
    const slotId = targetSlot.dataset.id;

    if (pieceId === slotId && !targetSlot.classList.contains('correct')) {
        // Correct Placement
        targetSlot.classList.remove('wrong');
        targetSlot.classList.add('correct');
        targetSlot.style.backgroundImage = draggedPiece.style.backgroundImage;
        const animalName = getAnimalNameById(Number(pieceId));
        setSlotAnimalName(targetSlot, Number(pieceId));
        draggedPiece.remove();
        
        playSoundThen('cheer', () => {
            speakAnimalName(animalName);
        });

        foundCount++;
        scoreText.textContent = `Found: ${foundCount} / ${totalAnimals}`;

        if (foundCount === totalAnimals) {
            setTimeout(() => alert('🎉 Amazing job! You found all the animals!'), 300);
        }
    } else {
        // Incorrect Placement
        holdWrongPlacementThenReturn(targetSlot, draggedPiece);
        playSound('horn');
    }

    if (draggedPiece) {
        draggedPiece.classList.remove('dragging');
        draggedPiece = null;
    }
}

initAudioState();
initSpeech();
initGame();