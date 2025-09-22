// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyCSorCCCCKjeFRk-vV-AVllibqk2X-OvBE",
  authDomain: "weena-2a4b1.firebaseapp.com",
  projectId: "weena-2a4b1",
  storageBucket: "weena-2a4b1.firebasestorage.app",
  messagingSenderId: "705991665506",
  appId: "1:705991665506:web:f8f1de859440da081fae3b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase
let app, auth, db, storage;
let isFirebaseEnabled = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  isFirebaseEnabled = true;
} catch (error) {
  console.warn('Firebase not configured. Using demo mode.');
  isFirebaseEnabled = false;
}

// Sample data for demo mode
const sampleEvents = [
  {
    id: "1",
    date: "2023-06-15",
    title: "Nosso Primeiro Encontro",
    description: "O dia em que tudo começou. Nos encontramos no café da esquina e conversamos por horas sobre nossos sonhos e planos para o futuro.",
    location: "Café Belle Époque",
    photos: [],
    video: "",
    audio: "",
    createdBy: "Nathalia"
  },
  {
    id: "2",
    date: "2023-07-20",
    title: "Nossa Primeira Viagem",
    description: "Decidimos fugir da rotina e fomos para a praia. Foram três dias de puro relaxamento, risadas e momentos únicos que ficarão para sempre em nossas memórias.",
    location: "Praia do Rosa, SC",
    photos: [],
    video: "",
    audio: "",
    createdBy: "Wendel"
  },
  {
    id: "3",
    date: "2023-12-31",
    title: "Réveillon Juntos",
    description: "Nosso primeiro ano novo juntos. Assistimos aos fogos de artifício abraçados, fazendo promessas para o ano que estava chegando.",
    location: "Copacabana, Rio de Janeiro",
    photos: [],
    video: "",
    audio: "",
    createdBy: "Nathalia"
  }
];

const validUsers = [
  { username: "Nathalia", password: "2801", email: "nathalia@timeline.com" },
  { username: "Wendel", password: "2801", email: "wendel@timeline.com" }
];

// Global variables
let currentUser = null;
let events = [];
let currentAudio = null;
let observer = null;

// DOM elements - will be initialized after DOM is loaded
let loginScreen, mainApp, loginForm, loginError, currentUserEl, logoutBtn;
let addEventBtn, addEventModal, addEventForm, closeModal, cancelAdd;
let timeline, loadingSpinner, audioPlayer;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app...');
  initializeDOMElements();
  initializeApp();
});

function initializeDOMElements() {
  // Get all DOM elements
  loginScreen = document.getElementById('loginScreen');
  mainApp = document.getElementById('mainApp');
  loginForm = document.getElementById('loginForm');
  loginError = document.getElementById('loginError');
  currentUserEl = document.getElementById('currentUser');
  logoutBtn = document.getElementById('logoutBtn');
  addEventBtn = document.getElementById('addEventBtn');
  addEventModal = document.getElementById('addEventModal');
  addEventForm = document.getElementById('addEventForm');
  closeModal = document.getElementById('closeModal');
  cancelAdd = document.getElementById('cancelAdd');
  timeline = document.getElementById('timeline');
  loadingSpinner = document.getElementById('loadingSpinner');
  audioPlayer = document.getElementById('currentAudio');

  // Ensure modal is hidden on load
  if (addEventModal) {
    addEventModal.classList.add('hidden');
  }

  console.log('DOM elements initialized');
}

function initializeApp() {
  try {
    setupEventListeners();
    initializeAuth();
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

// Authentication
function initializeAuth() {
  if (isFirebaseEnabled && auth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUser = user.email.split('@')[0];
        currentUser = currentUser.charAt(0).toUpperCase() + currentUser.slice(1);
        showMainApp();
      } else {
        showLoginScreen();
      }
    });
  } else {
    // Demo mode - check localStorage
    const savedUser = localStorage.getItem('demoUser');
    if (savedUser) {
      currentUser = savedUser;
      showMainApp();
    } else {
      showLoginScreen();
    }
  }
}

async function login(username, password) {
  try {
    const user = validUsers.find(u => u.username === username && u.password === password);
    if (!user) {
      throw new Error('Usuário ou senha incorretos');
    }

    if (isFirebaseEnabled && auth) {
      // Try to sign in with Firebase
      try {
        await signInWithEmailAndPassword(auth, user.email, password);
      } catch (firebaseError) {
        if (firebaseError.code === 'auth/user-not-found') {
          // Create user if doesn't exist
          await createUserWithEmailAndPassword(auth, user.email, password);
        } else {
          throw firebaseError;
        }
      }
    } else {
      // Demo mode
      localStorage.setItem('demoUser', username);
      currentUser = username;
      showMainApp();
    }
  } catch (error) {
    throw new Error('Erro ao fazer login: ' + error.message);
  }
}

async function logout() {
  try {
    if (isFirebaseEnabled && auth) {
      await signOut(auth);
    } else {
      localStorage.removeItem('demoUser');
    }
    currentUser = null;
    showLoginScreen();
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
}

// UI Management
function showLoginScreen() {
  if (loginScreen && mainApp) {
    loginScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
    if (addEventModal) {
      addEventModal.classList.add('hidden');
    }
    if (currentAudio) {
      currentAudio.pause();
    }
    document.body.style.overflow = 'auto';
  }
}

function showMainApp() {
  if (loginScreen && mainApp && currentUserEl) {
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    if (addEventModal) {
      addEventModal.classList.add('hidden');
    }
    currentUserEl.textContent = currentUser;
    loadEvents();
    document.body.style.overflow = 'auto';
  }
}

function showError(message) {
  if (loginError) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
    setTimeout(() => {
      loginError.classList.add('hidden');
    }, 5000);
  }
}

// Event Management
async function loadEvents() {
  try {
    if (loadingSpinner && timeline) {
      loadingSpinner.style.display = 'block';
      timeline.innerHTML = '';
      timeline.appendChild(loadingSpinner);
    }

    if (isFirebaseEnabled && db) {
      // Load from Firestore
      const q = query(collection(db, 'events'), orderBy('date', 'asc'));
      onSnapshot(q, (snapshot) => {
        events = [];
        snapshot.forEach((doc) => {
          events.push({ id: doc.id, ...doc.data() });
        });
        renderTimeline();
      });
    } else {
      // Demo mode - use sample data
      events = [...sampleEvents];
      setTimeout(() => {
        renderTimeline();
      }, 1000);
    }
  } catch (error) {
    console.error('Erro ao carregar eventos:', error);
    // Fallback to sample data
    events = [...sampleEvents];
    renderTimeline();
  }
}

function renderTimeline() {
  if (!timeline || !loadingSpinner) return;

  loadingSpinner.style.display = 'none';
  timeline.innerHTML = '';

  if (events.length === 0) {
    timeline.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 60px 20px; color: var(--color-text-secondary);">
        <h3>Nenhum momento cadastrado ainda</h3>
        <p>Clique em "Adicionar Evento" para começar sua linha do tempo</p>
      </div>
    `;
    return;
  }

  // Sort events by date
  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  events.forEach((event, index) => {
    const eventEl = createEventElement(event, index);
    timeline.appendChild(eventEl);
  });

  // Setup intersection observer for audio
  setupAudioObserver();
}

function createEventElement(event, index) {
  const eventDiv = document.createElement('div');
  eventDiv.className = `timeline-event ${index % 2 === 0 ? 'left' : 'right'}`;
  eventDiv.dataset.eventId = event.id;
  eventDiv.dataset.audio = event.audio || '';

  const date = new Date(event.date);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const mediaHtml = event.video ? 
    `<div class="event-media">
      <video autoplay muted loop>
        <source src="${event.video}" type="video/mp4">
        Vídeo não suportado
      </video>
    </div>` :
    `<div class="event-media">
      <span>💝</span>
    </div>`;

  const photosHtml = event.photos && event.photos.length > 0 ? 
    `<div class="event-photos">
      ${event.photos.slice(0, 4).map(photo => 
        `<img src="${photo}" alt="Foto do evento" loading="lazy">`
      ).join('')}
    </div>` : '';

  eventDiv.innerHTML = `
    <div class="event-card">
      <div class="event-date">${formattedDate}</div>
      <div class="event-content">
        <div class="event-text">
          <h3 class="event-title">${event.title}</h3>
          ${event.location ? `<div class="event-location">${event.location}</div>` : ''}
          <p class="event-description">${event.description}</p>
          ${photosHtml}
        </div>
        ${mediaHtml}
      </div>
    </div>
  `;

  return eventDiv;
}

async function addEvent(eventData) {
  try {
    const event = {
      ...eventData,
      createdBy: currentUser,
      createdAt: isFirebaseEnabled && db ? serverTimestamp() : new Date().toISOString()
    };

    if (isFirebaseEnabled && db) {
      await addDoc(collection(db, 'events'), event);
    } else {
      // Demo mode
      event.id = Date.now().toString();
      events.push(event);
      renderTimeline();
    }

    closeAddEventModal();
    if (addEventForm) {
      addEventForm.reset();
    }
  } catch (error) {
    console.error('Erro ao adicionar evento:', error);
    alert('Erro ao adicionar evento. Tente novamente.');
  }
}

async function uploadFile(file, path) {
  if (!isFirebaseEnabled || !storage) {
    // Demo mode - return fake URL
    return `https://via.placeholder.com/200x150/f5f5f5/666?text=${encodeURIComponent(file.name)}`;
  }

  const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

// Audio Management
function setupAudioObserver() {
  if (observer) {
    observer.disconnect();
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        const audioUrl = entry.target.dataset.audio;
        playEventAudio(audioUrl, entry.target);
      }
    });
  }, {
    threshold: 0.5,
    rootMargin: '-20% 0px -20% 0px'
  });

  document.querySelectorAll('.timeline-event').forEach(event => {
    observer.observe(event);
  });
}

function playEventAudio(audioUrl, eventElement) {
  // Remove playing class from all events
  document.querySelectorAll('.event-card.playing').forEach(card => {
    card.classList.remove('playing');
  });

  if (!audioUrl || !audioPlayer) return;

  const eventCard = eventElement.querySelector('.event-card');
  if (eventCard) {
    eventCard.classList.add('playing');
  }

  if (audioPlayer.src !== audioUrl) {
    audioPlayer.src = audioUrl;
    audioPlayer.currentTime = 0;
  }

  audioPlayer.play().catch(error => {
    console.log('Erro ao reproduzir áudio:', error);
  });
}

// Event Listeners
function setupEventListeners() {
  // Login form
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username')?.value;
      const password = document.getElementById('password')?.value;

      if (!username || !password) {
        showError('Por favor, preencha todos os campos.');
        return;
      }

      try {
        await login(username, password);
      } catch (error) {
        showError(error.message);
      }
    });
  }

  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Add event button
  if (addEventBtn) {
    addEventBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openAddEventModal();
    });
  }

  // Modal controls
  if (closeModal) {
    closeModal.addEventListener('click', (e) => {
      e.preventDefault();
      closeAddEventModal();
    });
  }

  if (cancelAdd) {
    cancelAdd.addEventListener('click', (e) => {
      e.preventDefault();
      closeAddEventModal();
    });
  }
  
  // Click outside modal to close
  if (addEventModal) {
    addEventModal.addEventListener('click', (e) => {
      if (e.target === addEventModal) {
        closeAddEventModal();
      }
    });
  }

  // Add event form
  if (addEventForm) {
    addEventForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const eventData = {
        date: document.getElementById('eventDate')?.value || '',
        title: document.getElementById('eventTitle')?.value || '',
        location: document.getElementById('eventLocation')?.value || '',
        description: document.getElementById('eventDescription')?.value || '',
        photos: [],
        video: '',
        audio: ''
      };

      if (!eventData.date || !eventData.title || !eventData.description) {
        alert('Por favor, preencha os campos obrigatórios.');
        return;
      }

      try {
        // Upload files
        const photoFiles = document.getElementById('eventPhotos')?.files || [];
        const videoFile = document.getElementById('eventVideo')?.files[0];
        const audioFile = document.getElementById('eventAudio')?.files[0];

        // Upload photos
        for (let i = 0; i < Math.min(photoFiles.length, 4); i++) {
          const photoUrl = await uploadFile(photoFiles[i], 'photos');
          eventData.photos.push(photoUrl);
        }

        // Upload video
        if (videoFile) {
          eventData.video = await uploadFile(videoFile, 'videos');
        }

        // Upload audio
        if (audioFile) {
          eventData.audio = await uploadFile(audioFile, 'audio');
        }

        await addEvent(eventData);
      } catch (error) {
        console.error('Erro ao processar arquivos:', error);
        alert('Erro ao processar arquivos. Tente novamente.');
      }
    });
  }

  // Handle ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && addEventModal && !addEventModal.classList.contains('hidden')) {
      closeAddEventModal();
    }
  });

  // Audio controls
  if (audioPlayer) {
    audioPlayer.addEventListener('ended', () => {
      // Audio ended, remove playing state
      document.querySelectorAll('.event-card.playing').forEach(card => {
        card.classList.remove('playing');
      });
    });
  }
}

// Modal functions
function openAddEventModal() {
  if (addEventModal) {
    addEventModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Focus on first input after modal is shown
    setTimeout(() => {
      const firstInput = document.getElementById('eventDate');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }
}

function closeAddEventModal() {
  if (addEventModal) {
    addEventModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    if (addEventForm) {
      addEventForm.reset();
    }
  }
}