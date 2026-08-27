const animalConfig = {
  bunny: { label: 'Bunny', src: 'images/bunny.png' },
  bear: { label: 'Bear', src: 'images/bunny-bear.png' },
  fox: { label: 'Fox', src: 'images/fox.png' }
};

const state = {
  selectedAnimal: null,
  mode: 'sequential',
  roundNumber: 1,
  totalRounds: 10,
  currentTarget: 1,
  currentCount: 0,
  soundEnabled: true,
  droppedAnimals: [],
  availablePoolCount: 10
};

const screens = {
  start: document.getElementById('screen-start'),
  mode: document.getElementById('screen-mode'),
  game: document.getElementById('screen-game'),
  complete: document.getElementById('screen-complete')
};

const elements = {
  soundToggle: document.getElementById('sound-toggle'),
  progressText: document.getElementById('progress-text'),
  progressFill: document.getElementById('progress-bar-fill'),
  targetNumber: document.getElementById('target-number'),
  currentCount: document.getElementById('current-count'),
  targetMax: document.getElementById('target-max'),
  countingSequence: document.getElementById('counting-sequence'),
  animalPool: document.getElementById('animal-pool'),
  dropZone: document.getElementById('drop-target-area'),
  overlay: document.getElementById('success-overlay'),
  successTitle: document.getElementById('success-title'),
  successMessage: document.getElementById('success-message'),
  nextNumberButton: document.getElementById('btn-next-number'),
  removeLastButton: document.getElementById('btn-remove-last')
};

function updateCountingSequence() {
  const pendingCount = state.currentCount;

  if (pendingCount === 0) {
    elements.countingSequence.textContent = `Count 1, 2, 3... up to ${state.currentTarget}`;
    return;
  }

  const sequence = Array.from({ length: pendingCount }, (_, index) => index + 1).join(', ');
  elements.countingSequence.textContent = `Counting: ${sequence}`;
}

function showScreen(screenName) {
  Object.values(screens).forEach((screen) => screen.classList.remove('active'));
  screens[screenName].classList.add('active');
}

function setSoundIcon() {
  elements.soundToggle.textContent = state.soundEnabled ? '🔊' : '🔇';
}

function playTone() {
  if (!state.soundEnabled) return;

  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;

  const audioContext = new AudioCtor();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.value = 520;
  gainNode.gain.value = 0.08;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.12);
}

function getKidVoice() {
  const voices = window.speechSynthesis.getVoices();

  const femaleVoice = voices.find((voice) => (
    /female|woman|girl|lady|samantha|zira|susan|aria|victoria|jenny|karen|sara|nausheen|lisa/i.test(voice.name)
    || /female|woman|girl|lady/i.test(voice.lang)
  ));

  if (femaleVoice) return femaleVoice;

  return voices.find((voice) => /en-us|english/i.test(voice.lang))
    || voices[0]
    || null;
}

function speakText(text, onEnd) {
  if (!state.soundEnabled || !('speechSynthesis' in window)) {
    if (typeof onEnd === 'function') onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.8;
  utterance.pitch = 1.6;
  utterance.volume = 1;

  const kidVoice = getKidVoice();
  if (kidVoice) {
    utterance.voice = kidVoice;
  }

  if (typeof onEnd === 'function') {
    utterance.onend = onEnd;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function speakNumber(value, onEnd) {
  const wordMap = [
    'zero', 'one', 'two', 'three', 'four', 'five',
    'six', 'seven', 'eight', 'nine', 'ten'
  ];

  const animalName = animalConfig[state.selectedAnimal]?.label?.toLowerCase() || 'animal';
  const word = wordMap[value] || String(value);
  const plural = value === 1 ? '' : 's';
  const spokenText = `${word} ${animalName}${plural}`;
  speakText(spokenText, onEnd);
}

function playGreatJobSound() {
  if (!state.soundEnabled) return;

  const audio = new Audio('assets/yes great job.mp3');
  audio.volume = 1;
  audio.play().catch(() => {});
}

function speakSuccess() {
  playGreatJobSound();
  elements.nextNumberButton.disabled = false;
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateProgress() {
  const completedPercent = (state.roundNumber / state.totalRounds) * 100;
  elements.progressText.textContent = `Number ${state.roundNumber} of ${state.totalRounds}`;
  elements.progressFill.style.width = `${Math.min(completedPercent, 100)}%`;
}

function renderDropZone() {
  elements.dropZone.innerHTML = '';
  updateCountingSequence();

  if (state.droppedAnimals.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'drop-placeholder';
    placeholder.textContent = 'DRAG AND DROP ANIMALS HERE';
    elements.dropZone.appendChild(placeholder);
    return;
  }

  state.droppedAnimals.forEach((imgSrc, index) => {
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = animalConfig[state.selectedAnimal].label;
    img.className = 'dropped-animal';
    img.draggable = false;
    img.dataset.index = String(index);
    img.addEventListener('click', () => {
      state.droppedAnimals.splice(index, 1);
      state.currentCount = state.droppedAnimals.length;
      elements.currentCount.textContent = String(state.currentCount);
      renderDropZone();
    });
    elements.dropZone.appendChild(img);
  });
}

function buildAnimalPool() {
  const pool = elements.animalPool;
  pool.innerHTML = '';

  const animalImage = animalConfig[state.selectedAnimal].src;

  for (let i = 0; i < state.availablePoolCount; i += 1) {
    const img = document.createElement('img');
    img.src = animalImage;
    img.alt = animalConfig[state.selectedAnimal].label;
    img.className = 'pool-animal';
    img.draggable = true;

    img.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', state.selectedAnimal);
      event.dataTransfer.effectAllowed = 'copy';
    });

    pool.appendChild(img);
  }
}

function addAnimalToDropZone() {
  if (state.currentCount >= state.currentTarget || state.availablePoolCount <= 0) {
    elements.dropZone.classList.add('drag-over');
    setTimeout(() => elements.dropZone.classList.remove('drag-over'), 250);
    return;
  }

  state.currentCount += 1;
  state.availablePoolCount -= 1;
  state.droppedAnimals.push(animalConfig[state.selectedAnimal].src);
  elements.currentCount.textContent = String(state.currentCount);
  updateCountingSequence();
  const isTargetReached = state.currentCount === state.currentTarget;
  speakNumber(state.currentCount, isTargetReached ? () => {
    elements.overlay.classList.add('active');
    speakSuccess();
  } : undefined);
  renderDropZone();
  buildAnimalPool();

  if (isTargetReached) {
    playTone();
    elements.successTitle.textContent = '🎉 Great Job! 🎉';
    elements.successMessage.textContent = `You counted ${state.currentTarget} ${animalConfig[state.selectedAnimal].label.toLowerCase()}s correctly!`;
  }
}

function removeLastAnimal() {
  if (state.currentCount === 0) return;

  state.droppedAnimals.pop();
  state.currentCount = state.droppedAnimals.length;
  state.availablePoolCount += 1;
  elements.currentCount.textContent = String(state.currentCount);
  updateCountingSequence();
  if (state.currentCount > 0) speakNumber(state.currentCount);
  renderDropZone();
  buildAnimalPool();
}

function startGameRound() {
  state.currentTarget = state.mode === 'sequential' ? state.roundNumber : randomNumber(1, 10);
  state.currentCount = 0;
  state.droppedAnimals = [];
  state.availablePoolCount = 10;

  elements.targetNumber.textContent = String(state.currentTarget);
  elements.currentCount.textContent = '0';
  elements.targetMax.textContent = String(state.currentTarget);
  elements.nextNumberButton.disabled = true;
  updateCountingSequence();
  renderDropZone();
  buildAnimalPool();
  updateProgress();
}

function advanceRound() {
  if (state.roundNumber >= state.totalRounds) {
    showScreen('complete');
    return;
  }

  state.roundNumber += 1;
  startGameRound();
}

function chooseAnimal(animal) {
  state.selectedAnimal = animal;
  state.roundNumber = 1;
  showScreen('mode');
}

function startSelectedMode(mode) {
  state.mode = mode;
  state.roundNumber = 1;
  showScreen('game');
  startGameRound();
}

function resetToStart() {
  state.selectedAnimal = null;
  state.roundNumber = 1;
  showScreen('start');
}

document.querySelectorAll('.choose-btn').forEach((button) => {
  button.addEventListener('click', (event) => {
    const card = event.currentTarget.closest('.animal-card');
    chooseAnimal(card.dataset.animal);
  });
});

document.getElementById('mode-sequential').addEventListener('click', () => startSelectedMode('sequential'));
document.getElementById('mode-random').addEventListener('click', () => startSelectedMode('random'));
document.getElementById('back-to-animals').addEventListener('click', resetToStart);
document.getElementById('btn-change-animal').addEventListener('click', resetToStart);
document.getElementById('btn-restart').addEventListener('click', () => {
  state.roundNumber = 1;
  startGameRound();
});
document.getElementById('btn-play-again').addEventListener('click', () => {
  state.roundNumber = 1;
  showScreen('game');
  startGameRound();
});
document.getElementById('btn-choose-other').addEventListener('click', resetToStart);

elements.soundToggle.addEventListener('click', () => {
  state.soundEnabled = !state.soundEnabled;
  setSoundIcon();
});

elements.removeLastButton.addEventListener('click', removeLastAnimal);
elements.nextNumberButton.addEventListener('click', () => {
  if (elements.nextNumberButton.disabled) return;
  elements.overlay.classList.remove('active');
  advanceRound();
});

elements.dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  elements.dropZone.classList.add('drag-over');
});

elements.dropZone.addEventListener('dragleave', () => {
  elements.dropZone.classList.remove('drag-over');
});

elements.dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  elements.dropZone.classList.remove('drag-over');
  const animalName = event.dataTransfer.getData('text/plain');
  if (animalName && animalName === state.selectedAnimal) {
    addAnimalToDropZone();
  }
});

setSoundIcon();
showScreen('start');
