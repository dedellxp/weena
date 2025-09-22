// ========================================
// CONFIGURAÇÃO NECESSÁRIA
// ========================================
// Para usar todas as funcionalidades, configure:

// 1. FIREBASE CONFIGURATION
// Substitua pelas suas credenciais do Firebase:
const firebaseConfig = {
  apiKey: "AIzaSyCSorCCCCKjeFRk-vV-AVllibqk2X-OvBE",
  authDomain: "weena-2a4b1.firebaseapp.com",
  databaseURL: "https://weena-2a4b1-default-rtdb.firebaseio.com",
  projectId: "weena-2a4b1",
  storageBucket: "weena-2a4b1.firebasestorage.app",
  messagingSenderId: "705991665506",
  appId: "1:705991665506:web:f8f1de859440da081fae3b"
};

// 2. GOOGLE DRIVE API CONFIGURATION  
// Substitua pelas suas credenciais do Google Drive API:
const GOOGLE_DRIVE_CONFIG = {
  apiKey: "AIzaSyBlC-ERbUwnwKXPKEDNjxDne8or_3v1fbc",
  clientId: "105576248017-cpf45e21at7j9f5bk396d8hf6duhkh3e.apps.googleusercontent.com",
  discoveryDoc: "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
  scopes: "https://www.googleapis.com/auth/drive.file"
};

const DRIVE_FOLDER_ID = "1X1G_dH1__6p6vjNrtKxoxfF8IDlsGOwe?hl=pt-br"; // Opcional

// ========================================
// INSTRUÇÕES DE CONFIGURAÇÃO
// ========================================
/*
CONFIGURAÇÃO DO FIREBASE:
1. Acesse https://console.firebase.google.com/
2. Crie um novo projeto ou use um existente
3. Vá em "Configurações do projeto" > "Geral"
4. Em "Seus apps", clique em "Adicionar app" > "Web"
5. Copie a configuração e substitua FIREBASE_CONFIG acima
6. Vá em "Firestore Database" e crie um banco de dados
7. Configure as regras de segurança (para teste, use modo público)

CONFIGURAÇÃO DO GOOGLE DRIVE API:
1. Acesse https://console.developers.google.com/
2. Crie um novo projeto ou selecione um existente
3. Ative a "Google Drive API"
4. Vá em "Credenciais" > "Criar credenciais" > "Chave de API"
5. Copie a chave de API
6. Crie credenciais OAuth 2.0:
   - Tipo: Aplicativo da Web
   - Origens JavaScript autorizadas: seu domínio
7. Copie o Client ID
8. Substitua GOOGLE_DRIVE_CONFIG acima

ESTRUTURA DO FIRESTORE:
Collection: events
Document structure:
{
  id: string,
  date: string,
  title: string,
  description: string,
  location: string,
  photoUrls: array,
  videoUrl: string,
  audioUrl: string,
  createdBy: string,
  createdAt: timestamp
}

PERMISSÕES DO GOOGLE DRIVE:
Os arquivos serão salvos na pasta "Nossa História" no Drive
com permissões públicas para visualização via URL.
*/

// ========================================
// GLOBAL VARIABLES
// ========================================
let currentUser = null;
let events = [];
let currentAudio = null;
let observer = null;
let db = null;
let eventsListener = null;
let gapi = null;
let driveInitialized = false;
let firebaseInitialized = false;

// DOM elements
let loginScreen, mainApp, loginForm, loginError, currentUserEl, logoutBtn;
let addEventBtn, addEventModal, addEventForm, closeModal, cancelAdd;
let timeline, loadingSpinner, audioPlayer, progressModal, errorModal;
let connectionStatus, configNotice;

// Configuration
const CONFIG = {
  maxPhotoSize: 10 * 1024 * 1024, // 10MB
  maxVideoSize: 25 * 1024 * 1024, // 25MB  
  maxAudioSize: 15 * 1024 * 1024, // 15MB
  maxPhotos: 4,
  driveFolderName: "Nossa História"
};

// Valid users
const VALID_USERS = [
  { username: "wendel", password: "2801" },
  { username: "nathalia", password: "2801" }
];

// Sample data for fallback
const SAMPLE_EVENTS = [
  {
    id: "sample_1",
    date: "2023-06-15",
    title: "Nosso Primeiro Encontro", 
    description: "O dia em que tudo começou. Nos encontramos no café da esquina e conversamos por horas sobre nossos sonhos e planos para o futuro. Foi mágico desde o primeiro momento.",
    location: "Café Belle Époque",
    photoUrls: [],
    videoUrl: "",
    audioUrl: "",
    createdBy: "Nathalia",
    createdAt: new Date("2023-06-15T18:00:00Z")
  },
  {
    id: "sample_2", 
    date: "2023-07-20",
    title: "Nossa Primeira Viagem",
    description: "Decidimos fugir da rotina e fomos para a praia. Foram três dias de puro relaxamento, risadas e momentos únicos que ficarão para sempre em nossas memórias.",
    location: "Praia do Rosa, SC",
    photoUrls: [],
    videoUrl: "",
    audioUrl: "", 
    createdBy: "Wendel",
    createdAt: new Date("2023-07-20T10:00:00Z")
  },
  {
    id: "sample_3",
    date: "2023-12-31", 
    title: "Réveillon Juntos",
    description: "Nosso primeiro ano novo juntos. Assistimos aos fogos de artifício abraçados, fazendo promessas para o ano que estava chegando. Um momento inesquecível.",
    location: "Copacabana, Rio de Janeiro",
    photoUrls: [],
    videoUrl: "",
    audioUrl: "",
    createdBy: "Nathalia", 
    createdAt: new Date("2023-12-31T23:00:00Z")
  }
];

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM carregado, inicializando aplicação...');
  setTimeout(() => {
    initializeDOMElements();
    initializeApp();
  }, 100);
});

function initializeDOMElements() {
  console.log('Inicializando elementos DOM...');
  
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
  progressModal = document.getElementById('progressModal');
  errorModal = document.getElementById('errorModal');
  connectionStatus = document.getElementById('connectionStatus');
  configNotice = document.getElementById('configNotice');

  console.log('Elementos DOM inicializados');
}

async function initializeApp() {
  console.log('Inicializando aplicação...');
  try {
    setupEventListeners();
    await initializeServices();
    initializeAuth();
    console.log('Aplicação inicializada com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error);
    showError('Erro ao inicializar aplicação', error.message);
  }
}

async function initializeServices() {
  console.log('Inicializando serviços...');
  
  // Check if configurations are default/placeholder
  const isFirebaseConfigured = FIREBASE_CONFIG.apiKey !== "your-firebase-api-key";
  const isDriveConfigured = GOOGLE_DRIVE_CONFIG.apiKey !== "your-google-api-key";
  
  if (!isFirebaseConfigured && !isDriveConfigured) {
    showConfigNotice();
    return;
  }
  
  showConnectionStatus('Conectando aos serviços...', 'connecting');
  
  try {
    // Initialize Firebase if configured
    if (isFirebaseConfigured) {
      await initializeFirebase();
    }
    
    // Initialize Google Drive if configured  
    if (isDriveConfigured) {
      await initializeGoogleDrive();
    }
    
    if (firebaseInitialized || driveInitialized) {
      showConnectionStatus('Serviços conectados!', 'success');
      setTimeout(hideConnectionStatus, 2000);
    } else {
      showConfigNotice();
    }
    
  } catch (error) {
    console.error('Erro ao conectar serviços:', error);
    showConnectionStatus('Erro de conexão - usando modo offline', 'error');
    setTimeout(hideConnectionStatus, 3000);
  }
}

async function initializeFirebase() {
  try {
    console.log('Inicializando Firebase...');
    
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase SDK não carregado');
    }
    
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    
    // Test connection
    await db.collection('events').limit(1).get();
    
    firebaseInitialized = true;
    console.log('Firebase inicializado com sucesso');
    
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
    throw new Error(`Firebase: ${error.message}`);
  }
}

async function initializeGoogleDrive() {
  try {
    console.log('Inicializando Google Drive API...');
    
    if (typeof gapi === 'undefined') {
      throw new Error('Google APIs não carregadas');
    }
    
    await new Promise((resolve) => {
      gapi.load('auth2:client', resolve);
    });
    
    await gapi.client.init({
      apiKey: GOOGLE_DRIVE_CONFIG.apiKey,
      clientId: GOOGLE_DRIVE_CONFIG.clientId,
      discoveryDocs: [GOOGLE_DRIVE_CONFIG.discoveryDoc],
      scope: GOOGLE_DRIVE_CONFIG.scopes
    });
    
    driveInitialized = true;
    console.log('Google Drive API inicializada com sucesso');
    
  } catch (error) {
    console.error('Erro ao inicializar Google Drive:', error);
    throw new Error(`Google Drive: ${error.message}`);
  }
}

// ========================================
// AUTHENTICATION
// ========================================
function initializeAuth() {
  console.log('Verificando autenticação...');
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    console.log('Usuário encontrado no localStorage:', savedUser);
    currentUser = savedUser;
    showMainApp();
  } else {
    console.log('Nenhum usuário logado, mostrando tela de login');
    showLoginScreen();
  }
}

function attemptLogin(username, password) {
  console.log('Tentando login com:', username);
  
  if (!username || !password) {
    throw new Error('Por favor, preencha todos os campos.');
  }

  const user = VALID_USERS.find(u => 
    u.username.toLowerCase() === username.toLowerCase() && 
    u.password === password
  );
  
  if (!user) {
    console.log('Credenciais inválidas para:', username);
    throw new Error('Usuário ou senha incorretos');
  }
  
  currentUser = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  localStorage.setItem('currentUser', currentUser);
  console.log('Login bem-sucedido para:', currentUser);
  showMainApp();
}

function logout() {
  console.log('Fazendo logout...');
  currentUser = null;
  localStorage.removeItem('currentUser');
  
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.src = '';
  }
  
  // Unsubscribe from Firestore listener
  if (eventsListener) {
    eventsListener();
    eventsListener = null;
  }
  
  showLoginScreen();
}

// ========================================
// UI MANAGEMENT  
// ========================================
function showLoginScreen() {
  console.log('Mostrando tela de login');
  if (loginScreen && mainApp) {
    loginScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
    hideModal(addEventModal);
    hideModal(progressModal);
    hideModal(errorModal);
    hideConnectionStatus();
    hideConfigNotice();
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    
    hideError();
  }
}

function showMainApp() {
  console.log('Mostrando aplicação principal');
  if (loginScreen && mainApp && currentUserEl) {
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    hideModal(addEventModal);
    hideModal(progressModal);
    hideModal(errorModal);
    currentUserEl.textContent = currentUser;
    loadEvents();
  }
}

function showError(title, message, details = null) {
  console.log('Mostrando erro:', title, message);
  
  if (loginError && !mainApp.classList.contains('hidden')) {
    // Show inline error if on main app
    loginError.textContent = message;
    loginError.classList.remove('hidden');
  } else if (errorModal) {
    // Show error modal
    document.getElementById('errorMessage').textContent = message;
    
    const errorDetails = document.getElementById('errorDetails');
    const errorDetailText = document.getElementById('errorDetailText');
    
    if (details && errorDetails && errorDetailText) {
      errorDetailText.textContent = details;
      document.getElementById('showErrorDetails').classList.remove('hidden');
    } else {
      document.getElementById('showErrorDetails').classList.add('hidden');
    }
    
    showModal(errorModal);
  }
}

function hideError() {
  if (loginError) {
    loginError.classList.add('hidden');
  }
}

function showModal(modal) {
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function hideModal(modal) {
  if (modal) {
    modal.classList.add('hidden');
    if (!addEventModal.classList.contains('hidden') || 
        !progressModal.classList.contains('hidden') ||
        !errorModal.classList.contains('hidden')) {
      return; // Keep body overflow hidden if other modals are open
    }
    document.body.style.overflow = 'auto';
  }
}

function showConnectionStatus(message, type = 'connecting') {
  if (connectionStatus) {
    const statusText = document.getElementById('statusText');
    const statusIcon = document.getElementById('statusIcon');
    
    if (statusText) statusText.textContent = message;
    if (statusIcon) {
      statusIcon.textContent = type === 'success' ? '✅' : 
                              type === 'error' ? '❌' : '⏳';
    }
    
    connectionStatus.className = `connection-status ${type}`;
    connectionStatus.classList.remove('hidden');
  }
}

function hideConnectionStatus() {
  if (connectionStatus) {
    connectionStatus.classList.add('hidden');
  }
}

function showConfigNotice() {
  if (configNotice) {
    configNotice.classList.remove('hidden');
  }
}

function hideConfigNotice() {
  if (configNotice) {
    configNotice.classList.add('hidden');
  }
}

// ========================================
// DATA MANAGEMENT
// ========================================
async function loadEvents() {
  console.log('Carregando eventos...');
  
  if (loadingSpinner && timeline) {
    loadingSpinner.style.display = 'block';
    timeline.innerHTML = '';
    timeline.appendChild(loadingSpinner);
  }
  
  try {
    if (firebaseInitialized && db) {
      await loadEventsFromFirestore();
    } else {
      await loadEventsFromLocalStorage();
    }
  } catch (error) {
    console.error('Erro ao carregar eventos:', error);
    showError('Erro ao carregar eventos', error.message);
    await loadEventsFromLocalStorage(); // Fallback
  }
}

async function loadEventsFromFirestore() {
  console.log('Carregando eventos do Firestore...');
  
  try {
    // Unsubscribe from previous listener
    if (eventsListener) {
      eventsListener();
    }
    
    // Setup real-time listener
    eventsListener = db.collection('events')
      .orderBy('date', 'asc')
      .onSnapshot((snapshot) => {
        console.log('Eventos atualizados do Firestore');
        events = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          events.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          });
        });
        
        console.log(`${events.length} eventos carregados do Firestore`);
        renderTimeline();
      }, (error) => {
        console.error('Erro no listener do Firestore:', error);
        loadEventsFromLocalStorage(); // Fallback
      });
      
  } catch (error) {
    console.error('Erro ao configurar listener do Firestore:', error);
    throw error;
  }
}

async function loadEventsFromLocalStorage() {
  console.log('Carregando eventos do localStorage...');
  
  const savedEvents = localStorage.getItem('timelineEvents');
  
  if (savedEvents) {
    try {
      events = JSON.parse(savedEvents);
      console.log(`${events.length} eventos carregados do localStorage`);
    } catch (error) {
      console.error('Erro ao parsear eventos salvos:', error);
      loadSampleData();
    }
  } else {
    loadSampleData();
  }
  
  renderTimeline();
}

function loadSampleData() {
  console.log('Carregando dados de exemplo...');
  events = [...SAMPLE_EVENTS];
  saveEventsToLocalStorage();
}

function saveEventsToLocalStorage() {
  try {
    localStorage.setItem('timelineEvents', JSON.stringify(events));
    console.log('Eventos salvos no localStorage');
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
  }
}

async function saveEventToFirestore(eventData) {
  if (!firebaseInitialized || !db) {
    throw new Error('Firebase não está inicializado');
  }
  
  try {
    console.log('Salvando evento no Firestore...');
    
    const docRef = await db.collection('events').add({
      ...eventData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Evento salvo no Firestore com ID:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('Erro ao salvar no Firestore:', error);
    throw new Error(`Erro ao salvar evento: ${error.message}`);
  }
}

// ========================================
// GOOGLE DRIVE INTEGRATION
// ========================================
async function authenticateGoogleDrive() {
  if (!driveInitialized) {
    throw new Error('Google Drive API não está inicializada');
  }
  
  const authInstance = gapi.auth2.getAuthInstance();
  
  if (!authInstance.isSignedIn.get()) {
    console.log('Autenticando com Google Drive...');
    await authInstance.signIn();
  }
  
  return authInstance.currentUser.get().getAuthResponse().access_token;
}

async function createDriveFolder() {
  try {
    // Check if folder already exists
    const response = await gapi.client.drive.files.list({
      q: `name='${CONFIG.driveFolderName}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)'
    });
    
    if (response.result.files && response.result.files.length > 0) {
      return response.result.files[0].id;
    }
    
    // Create new folder
    const folderResponse = await gapi.client.drive.files.create({
      resource: {
        name: CONFIG.driveFolderName,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });
    
    console.log('Pasta criada no Drive:', CONFIG.driveFolderName);
    return folderResponse.result.id;
    
  } catch (error) {
    console.error('Erro ao criar pasta no Drive:', error);
    throw error;
  }
}

async function uploadFileToDrive(file, fileName, onProgress) {
  try {
    await authenticateGoogleDrive();
    const folderId = await createDriveFolder();
    
    console.log(`Enviando arquivo para o Drive: ${fileName}`);
    
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    const base64 = base64Data.split(',')[1]; // Remove data URL prefix
    
    // Upload file
    const response = await gapi.client.request({
      path: 'https://www.googleapis.com/upload/drive/v3/files',
      method: 'POST',
      params: {
        uploadType: 'multipart',
        fields: 'id'
      },
      headers: {
        'Content-Type': 'multipart/related; boundary="foo_bar_baz"'
      },
      body: 
        '--foo_bar_baz\r\n' +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify({
          name: fileName,
          parents: [folderId]
        }) + '\r\n' +
        '--foo_bar_baz\r\n' +
        `Content-Type: ${file.type}\r\n` +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        base64 + '\r\n' +
        '--foo_bar_baz--'
    });
    
    const fileId = response.result.id;
    
    // Make file public
    await gapi.client.drive.permissions.create({
      fileId: fileId,
      resource: {
        role: 'reader',
        type: 'anyone'
      }
    });
    
    const publicUrl = `https://drive.google.com/uc?id=${fileId}`;
    console.log(`Arquivo enviado com sucesso: ${publicUrl}`);
    
    if (onProgress) onProgress(100);
    return publicUrl;
    
  } catch (error) {
    console.error('Erro ao enviar arquivo para o Drive:', error);
    throw new Error(`Erro no upload: ${error.message}`);
  }
}

async function uploadMultipleFilesToDrive(files, fileType, onProgress) {
  const urls = [];
  const total = files.length;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = `${fileType}_${Date.now()}_${i + 1}.${file.name.split('.').pop()}`;
    
    const url = await uploadFileToDrive(file, fileName, (fileProgress) => {
      const overallProgress = ((i + (fileProgress / 100)) / total) * 100;
      if (onProgress) onProgress(overallProgress);
    });
    
    urls.push(url);
  }
  
  return urls;
}

// ========================================
// EVENT MANAGEMENT
// ========================================
async function addEvent(eventData) {
  try {
    console.log('Adicionando novo evento:', eventData.title);
    
    const event = {
      ...eventData,
      createdBy: currentUser
    };
    
    if (firebaseInitialized && db) {
      const eventId = await saveEventToFirestore(event);
      console.log('Evento adicionado ao Firestore com sucesso');
    } else {
      // Fallback to localStorage
      event.id = `local_${Date.now()}`;
      event.createdAt = new Date();
      events.push(event);
      saveEventsToLocalStorage();
      renderTimeline();
    }
    
    hideModal(addEventModal);
    if (addEventForm) {
      addEventForm.reset();
      clearPreviews();
    }
    
    console.log('Evento adicionado com sucesso');
    
  } catch (error) {
    console.error('Erro ao adicionar evento:', error);
    throw error;
  }
}

async function processEventFiles(photoFiles, videoFile, audioFile, onProgress) {
  if (!driveInitialized) {
    // Fallback to base64 encoding for localStorage
    return await processFilesAsBase64(photoFiles, videoFile, audioFile, onProgress);
  }
  
  const result = {
    photoUrls: [],
    videoUrl: '',
    audioUrl: ''
  };
  
  try {
    let totalSteps = 0;
    let completedSteps = 0;
    
    if (photoFiles.length > 0) totalSteps++;
    if (videoFile) totalSteps++;
    if (audioFile) totalSteps++;
    
    // Upload photos
    if (photoFiles.length > 0) {
      const photoUrls = await uploadMultipleFilesToDrive(
        Array.from(photoFiles).slice(0, CONFIG.maxPhotos),
        'photo',
        (progress) => {
          const stepProgress = (completedSteps + (progress / 100)) / totalSteps * 100;
          if (onProgress) onProgress(stepProgress, 'Enviando fotos...');
        }
      );
      result.photoUrls = photoUrls;
      completedSteps++;
    }
    
    // Upload video
    if (videoFile) {
      result.videoUrl = await uploadFileToDrive(
        videoFile,
        `video_${Date.now()}.${videoFile.name.split('.').pop()}`,
        (progress) => {
          const stepProgress = (completedSteps + (progress / 100)) / totalSteps * 100;
          if (onProgress) onProgress(stepProgress, 'Enviando vídeo...');
        }
      );
      completedSteps++;
    }
    
    // Upload audio
    if (audioFile) {
      result.audioUrl = await uploadFileToDrive(
        audioFile,
        `audio_${Date.now()}.${audioFile.name.split('.').pop()}`,
        (progress) => {
          const stepProgress = (completedSteps + (progress / 100)) / totalSteps * 100;
          if (onProgress) onProgress(stepProgress, 'Enviando áudio...');
        }
      );
      completedSteps++;
    }
    
    if (onProgress) onProgress(100, 'Upload concluído!');
    return result;
    
  } catch (error) {
    console.error('Erro no upload dos arquivos:', error);
    throw error;
  }
}

async function processFilesAsBase64(photoFiles, videoFile, audioFile, onProgress) {
  const result = {
    photoUrls: [],
    videoUrl: '',
    audioUrl: ''
  };

  let totalFiles = photoFiles.length + (videoFile ? 1 : 0) + (audioFile ? 1 : 0);
  let processedFiles = 0;

  // Validate file sizes
  for (let i = 0; i < Math.min(photoFiles.length, CONFIG.maxPhotos); i++) {
    validateFileSize(photoFiles[i], CONFIG.maxPhotoSize, 'Foto');
  }
  
  if (videoFile) validateFileSize(videoFile, CONFIG.maxVideoSize, 'Vídeo');
  if (audioFile) validateFileSize(audioFile, CONFIG.maxAudioSize, 'Áudio');

  // Process photos
  for (let i = 0; i < Math.min(photoFiles.length, CONFIG.maxPhotos); i++) {
    const base64 = await fileToBase64(photoFiles[i]);
    result.photoUrls.push(base64);
    processedFiles++;
    if (onProgress) onProgress((processedFiles / totalFiles) * 100, 'Processando fotos...');
  }

  // Process video
  if (videoFile) {
    result.videoUrl = await fileToBase64(videoFile);
    processedFiles++;
    if (onProgress) onProgress((processedFiles / totalFiles) * 100, 'Processando vídeo...');
  }

  // Process audio
  if (audioFile) {
    result.audioUrl = await fileToBase64(audioFile);
    processedFiles++;
    if (onProgress) onProgress((processedFiles / totalFiles) * 100, 'Processando áudio...');
  }

  return result;
}

// ========================================
// TIMELINE RENDERING
// ========================================
function renderTimeline() {
  console.log('Renderizando timeline com', events.length, 'eventos');
  
  if (!timeline || !loadingSpinner) return;

  loadingSpinner.style.display = 'none';
  timeline.innerHTML = '';

  if (events.length === 0) {
    timeline.innerHTML = `
      <div class="empty-state">
        <h3>Nenhum momento cadastrado ainda</h3>
        <p>Clique em "Adicionar Evento" para começar sua linha do tempo</p>
      </div>
    `;
    return;
  }

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedEvents.forEach((event, index) => {
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
  eventDiv.dataset.audio = event.audioUrl || '';

  const date = new Date(event.date);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long', 
    year: 'numeric'
  });

  const mediaHtml = event.videoUrl ? 
    `<div class="event-media">
      <video autoplay muted loop>
        <source src="${event.videoUrl}" type="video/mp4">
        <source src="${event.videoUrl}" type="video/webm">
        Vídeo não suportado
      </video>
    </div>` :
    `<div class="event-media">
      <span>💝</span>
    </div>`;

  const photosHtml = event.photoUrls && event.photoUrls.length > 0 ? 
    `<div class="event-photos">
      ${event.photoUrls.slice(0, 4).map(photoUrl => 
        `<img src="${photoUrl}" alt="Foto do evento" loading="lazy">`
      ).join('')}
    </div>` : '';

  const createdDate = event.createdAt ? new Date(event.createdAt).toLocaleDateString('pt-BR') : '';

  eventDiv.innerHTML = `
    <div class="event-card">
      <div class="event-date">${formattedDate}</div>
      <div class="event-content">
        <div class="event-text">
          <h3 class="event-title">${event.title}</h3>
          ${event.location ? `<div class="event-location">${event.location}</div>` : ''}
          <p class="event-description">${event.description}</p>
          ${photosHtml}
          <div class="event-meta">
            <div class="event-author">Adicionado por ${event.createdBy}</div>
            ${createdDate ? `<span>em ${createdDate}</span>` : ''}
          </div>
        </div>
        ${mediaHtml}
      </div>
    </div>
  `;

  return eventDiv;
}

// ========================================
// AUDIO MANAGEMENT
// ========================================
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

// ========================================
// FILE HANDLING
// ========================================
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function validateFileSize(file, maxSize, type) {
  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    throw new Error(`${type} deve ter no máximo ${sizeMB}MB`);
  }
}

function updatePreview(input, previewContainer, type) {
  if (!input.files || !previewContainer) return;

  previewContainer.innerHTML = '';

  if (type === 'photos') {
    const container = document.createElement('div');
    container.className = 'photo-preview';
    
    Array.from(input.files).slice(0, CONFIG.maxPhotos).forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(img.src);
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'preview-remove';
      removeBtn.innerHTML = '×';
      removeBtn.onclick = () => removeFileFromInput(input, index, previewContainer, type);
      
      item.appendChild(img);
      item.appendChild(removeBtn);
      container.appendChild(item);
    });
    
    previewContainer.appendChild(container);
    
  } else if (type === 'video') {
    const file = input.files[0];
    const item = document.createElement('div');
    item.className = 'preview-item';
    
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.onload = () => URL.revokeObjectURL(video.src);
      item.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(img.src);
      item.appendChild(img);
    }
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'preview-remove';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = () => {
      input.value = '';
      updatePreview(input, previewContainer, type);
    };
    
    item.appendChild(removeBtn);
    previewContainer.appendChild(item);
    
  } else if (type === 'audio') {
    const file = input.files[0];
    const item = document.createElement('div');
    item.className = 'preview-item audio';
    
    const fileName = document.createElement('span');
    fileName.textContent = file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'preview-remove';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = () => {
      input.value = '';
      updatePreview(input, previewContainer, type);
    };
    
    item.appendChild(fileName);
    item.appendChild(removeBtn);
    previewContainer.appendChild(item);
  }
}

function removeFileFromInput(input, indexToRemove, previewContainer, type) {
  const dt = new DataTransfer();
  Array.from(input.files).forEach((file, index) => {
    if (index !== indexToRemove) {
      dt.items.add(file);
    }
  });
  input.files = dt.files;
  updatePreview(input, previewContainer, type);
}

function clearPreviews() {
  const previews = ['photoPreview', 'videoPreview', 'audioPreview'];
  previews.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = '';
    }
  });
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
  console.log('Configurando event listeners...');

  // Login form
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username')?.value?.trim();
      const password = document.getElementById('password')?.value;

      if (!username || !password) {
        showError('Login', 'Por favor, preencha todos os campos.');
        return;
      }

      try {
        attemptLogin(username, password);
      } catch (error) {
        showError('Login', error.message);
      }
    });
  }

  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Add event button
  if (addEventBtn) {
    addEventBtn.addEventListener('click', function() {
      showModal(addEventModal);
      setTimeout(() => {
        document.getElementById('eventDate')?.focus();
      }, 100);
    });
  }

  // Modal controls
  if (closeModal) closeModal.addEventListener('click', () => hideModal(addEventModal));
  if (cancelAdd) cancelAdd.addEventListener('click', () => hideModal(addEventModal));
  
  // Config notice close
  const hideConfigNoticeBtn = document.getElementById('hideConfigNotice');
  if (hideConfigNoticeBtn) {
    hideConfigNoticeBtn.addEventListener('click', hideConfigNotice);
  }
  
  // Error modal controls
  const closeErrorModal = document.getElementById('closeErrorModal');
  const closeError = document.getElementById('closeError');
  const showErrorDetails = document.getElementById('showErrorDetails');
  
  if (closeErrorModal) closeErrorModal.addEventListener('click', () => hideModal(errorModal));
  if (closeError) closeError.addEventListener('click', () => hideModal(errorModal));
  if (showErrorDetails) {
    showErrorDetails.addEventListener('click', function() {
      const errorDetails = document.getElementById('errorDetails');
      if (errorDetails) {
        errorDetails.classList.toggle('hidden');
        this.textContent = errorDetails.classList.contains('hidden') ? 'Mostrar Detalhes' : 'Ocultar Detalhes';
      }
    });
  }

  // Click outside modal to close
  [addEventModal, errorModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          hideModal(modal);
        }
      });
    }
  });

  // File input previews
  const eventPhotos = document.getElementById('eventPhotos');
  const eventVideo = document.getElementById('eventVideo');
  const eventAudio = document.getElementById('eventAudio');

  if (eventPhotos) {
    eventPhotos.addEventListener('change', function() {
      updatePreview(eventPhotos, document.getElementById('photoPreview'), 'photos');
    });
  }

  if (eventVideo) {
    eventVideo.addEventListener('change', function() {
      updatePreview(eventVideo, document.getElementById('videoPreview'), 'video');
    });
  }

  if (eventAudio) {
    eventAudio.addEventListener('change', function() {
      updatePreview(eventAudio, document.getElementById('audioPreview'), 'audio');
    });
  }

  // Add event form
  if (addEventForm) {
    addEventForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const eventData = {
        date: document.getElementById('eventDate')?.value || '',
        title: document.getElementById('eventTitle')?.value?.trim() || '',
        location: document.getElementById('eventLocation')?.value?.trim() || '',
        description: document.getElementById('eventDescription')?.value?.trim() || ''
      };

      if (!eventData.date || !eventData.title || !eventData.description) {
        showError('Formulário', 'Por favor, preencha os campos obrigatórios (data, título e descrição).');
        return;
      }

      const photoFiles = document.getElementById('eventPhotos')?.files || [];
      const videoFile = document.getElementById('eventVideo')?.files[0];
      const audioFile = document.getElementById('eventAudio')?.files[0];
      
      const submitBtn = document.getElementById('submitBtn');
      const submitText = document.getElementById('submitText');

      try {
        // Disable submit button
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add('btn--loading');
        }
        
        if (submitText) {
          submitText.textContent = 'Salvando...';
        }

        if (photoFiles.length > 0 || videoFile || audioFile) {
          // Show progress modal
          showModal(progressModal);
          const progressText = document.getElementById('progressText');
          const progressFill = document.getElementById('progressFill');
          const progressDetail = document.getElementById('progressDetail');

          const media = await processEventFiles(photoFiles, videoFile, audioFile, (progress, detail) => {
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressText) progressText.textContent = driveInitialized ? 'Enviando para o Google Drive...' : 'Processando arquivos...';
            if (progressDetail && detail) progressDetail.textContent = detail;
          });

          eventData.photoUrls = media.photoUrls;
          eventData.videoUrl = media.videoUrl;
          eventData.audioUrl = media.audioUrl;
          
          hideModal(progressModal);
        } else {
          eventData.photoUrls = [];
          eventData.videoUrl = '';
          eventData.audioUrl = '';
        }

        await addEvent(eventData);

      } catch (error) {
        console.error('Erro ao adicionar evento:', error);
        hideModal(progressModal);
        showError('Erro ao salvar evento', error.message, error.stack);
        
      } finally {
        // Re-enable submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('btn--loading');
        }
        if (submitText) {
          submitText.textContent = 'Salvar Momento';
        }
      }
    });
  }

  // Handle ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (!addEventModal?.classList.contains('hidden')) {
        hideModal(addEventModal);
      } else if (!errorModal?.classList.contains('hidden')) {
        hideModal(errorModal);
      }
    }
  });

  // Audio controls
  if (audioPlayer) {
    audioPlayer.addEventListener('ended', function() {
      document.querySelectorAll('.event-card.playing').forEach(card => {
        card.classList.remove('playing');
      });
    });
  }

  console.log('Event listeners configurados');
}

console.log('Script da aplicação Nossa História carregado!');