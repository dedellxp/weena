/**
 * APLICATIVO "A NOSSA HISTÓRIA" - WENDEL & NATHALIA
 * Sistema completo de timeline romântica com integração Firebase e Cloudinary
 * 
 * Funcionalidades principais:
 * - Login para wendel/nathalia (senha: 2801)
 * - Timeline interativa com eventos
 * - Upload de mídias (fotos, vídeos, áudios) via Cloudinary
 * - Reprodução automática de áudio por card
 * - Galeria expandida de fotos
 * - Carregamento progressivo de eventos
 */

// =====================================================
// CONFIGURAÇÕES E INICIALIZAÇÕES
// =====================================================

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCSorCCCCKjeFRk-vV-AVllibqk2X-OvBE",
  authDomain: "weena-2a4b1.firebaseapp.com",
  databaseURL: "https://weena-2a4b1-default-rtdb.firebaseio.com",
  projectId: "weena-2a4b1",
  storageBucket: "weena-2a4b1.firebasestorage.app",
  messagingSenderId: "705991665506",
  appId: "1:705991665506:web:6fabb0f424f88b981fae3b"
};

// Configuração do Cloudinary
const CLOUDINARY_CONFIG = {
  cloudName: 'diiqqw7px',
  apiKey: '568941925845119',
  uploadPreset: 'nossa-historia'
};

// Inicialização do Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variáveis globais para controle da aplicação
let currentUser = null;
let timelineEvents = [];
let eventsLoaded = 0;
const EVENTS_PER_PAGE = 5;
let currentAudio = null;
let currentPhotoIndex = 0;
let currentPhotoGallery = [];

// =====================================================
// SISTEMA DE LOGIN
// =====================================================

/**
 * Inicializa o sistema de login
 * Configura eventos e validações
 */
function initializeLogin() {
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Validação simples das credenciais
    if ((username === 'wendel' || username === 'nathalia') && password === '2801') {
      currentUser = username;
      showTimeline();
      loginError.classList.add('hidden');
    } else {
      loginError.textContent = 'Usuário ou senha incorretos. Lembre-se da data que os represente! 💕';
      loginError.classList.remove('hidden');
    }
  });
}

/**
 * Exibe a timeline principal e carrega os eventos
 */
function showTimeline() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('timelineScreen').classList.remove('hidden');
  
  // Carrega os eventos iniciais
  loadTimelineEvents();
}

// =====================================================
// SISTEMA DE TIMELINE E EVENTOS
// =====================================================

/**
 * Carrega eventos da timeline do Firebase
 * Implementa paginação para não sobrecarregar a interface
 */
async function loadTimelineEvents() {
  try {
    showLoading(true);
    
    // Busca eventos no Firebase ordenados por data
    const eventsRef = database.ref('events').orderByChild('date');
    const snapshot = await eventsRef.once('value');
    
    if (snapshot.exists()) {
      const allEvents = [];
      snapshot.forEach(child => {
        const eventData = child.val();
        allEvents.push({
          id: child.key,
          ...eventData
        });
      });
      
      // Ordena por data (mais recentes primeiro)
      allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
      timelineEvents = allEvents;
    } else {
      // Se não há eventos, carrega dados de exemplo
      console.log('Nenhum evento encontrado. Carregando dados de exemplo...');
      timelineEvents = getSampleEvents();
    }
    
    // Reset dos contadores
    eventsLoaded = 0;
    document.getElementById('timelineEvents').innerHTML = '';
    
    // Carrega a primeira página de eventos
    loadMoreEvents();
    
  } catch (error) {
    console.error('Erro ao carregar eventos:', error);
    // Em caso de erro, usa dados de exemplo
    timelineEvents = getSampleEvents();
    eventsLoaded = 0;
    document.getElementById('timelineEvents').innerHTML = '';
    loadMoreEvents();
  } finally {
    showLoading(false);
  }
}

/**
 * Retorna eventos de exemplo para demonstração
 */
function getSampleEvents() {
  return [
    {
      id: "exemplo1",
      title: "Nosso Primeiro Encontro",
      date: "2023-01-15",
      location: "Café da Esquina",
      description: "O dia em que tudo começou. Um encontro casual que mudou nossas vidas para sempre. O nervosismo, os sorrisos tímidos, a conversa que durou horas. Foram momentos mágicos que ficaram gravados em nossos corações para sempre.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      audioUrl: "https://www.soundjay.com/misc/sounds-of-nature/rain-02.mp3",
      photos: [
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1514846226882-28b324ef7f28?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop&auto=format"
      ]
    },
    {
      id: "exemplo2",
      title: "Primeira Viagem Juntos",
      date: "2023-03-20",
      location: "Praia do Futuro, Fortaleza",
      description: "Nossa primeira aventura como casal. Sol, mar, risadas e muitas descobertas sobre nós dois. Cada momento foi especial e inesquecível. As caminhadas na areia, os pores do sol românticos, as conversas até altas horas.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      photos: [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop&auto=format"
      ]
    },
    {
      id: "exemplo3",
      title: "Nosso Primeiro 'Eu Te Amo'",
      date: "2023-05-14",
      location: "Parque Ibirapuera, São Paulo",
      description: "Debaixo das estrelas, em uma noite perfeita, as três palavras mais importantes foram ditas. Um momento de pura magia e amor verdadeiro. O coração disparando, as mãos tremendo, mas a certeza de que era real.",
      photos: [
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format"
      ]
    },
    {
      id: "exemplo4",
      title: "Aniversário de Namoro",
      date: "2024-01-15",
      location: "Restaurante Romântico",
      description: "Comemorando nosso primeiro aniversário de namoro. Uma noite especial com jantar à luz de velas, música suave e a certeza de que queríamos muitos anos juntos. Foi mágico reviver nossa história e sonhar com o futuro.",
      photos: [
        "https://images.unsplash.com/photo-1414016642750-7fdd78dc33d9?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop&auto=format"
      ]
    },
    {
      id: "exemplo5",
      title: "Mudança Para Juntos",
      date: "2024-06-10",
      location: "Nosso Primeiro Lar",
      description: "O grande passo: decidimos morar juntos! Entre caixas de mudança, móveis novos e muitas risadas, construímos nosso primeiro lar. Cada cantinho decorado com amor, cada memória sendo criada em nosso espaço especial.",
      photos: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&auto=format"
      ]
    },
    {
      id: "exemplo6",
      title: "Adoção do Nosso Pet",
      date: "2024-08-22",
      location: "Casa",
      description: "Aumentamos nossa família com um novo membro peludo! Foi amor à primeira vista. Ver vocês dois brincando e criando laços foi emocionante. Nosso lar ficou ainda mais completo e cheio de amor.",
      photos: [
        "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop&auto=format"
      ]
    }
  ];
}

/**
 * Carrega mais eventos na timeline (paginação)
 */
function loadMoreEvents() {
  const timelineContainer = document.getElementById('timelineEvents');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  
  const eventsToShow = timelineEvents.slice(eventsLoaded, eventsLoaded + EVENTS_PER_PAGE);
  
  eventsToShow.forEach((event, index) => {
    const isLeft = (eventsLoaded + index) % 2 === 0;
    const eventElement = createTimelineEventElement(event, isLeft);
    timelineContainer.appendChild(eventElement);
  });
  
  eventsLoaded += eventsToShow.length;
  
  // Controla visibilidade do botão "Carregar Mais"
  if (eventsLoaded >= timelineEvents.length) {
    loadMoreBtn.classList.add('hidden');
  } else {
    loadMoreBtn.classList.remove('hidden');
  }
  
  // Configura áudio automático após carregamento
  setTimeout(setupAudioAutoplay, 500);
}

/**
 * Cria elemento HTML para um evento da timeline
 * @param {Object} event - Dados do evento
 * @param {boolean} isLeft - Se o card deve aparecer à esquerda
 */
function createTimelineEventElement(event, isLeft) {
  const eventDiv = document.createElement('div');
  eventDiv.className = `timeline-event ${isLeft ? 'left' : 'right'}`;
  eventDiv.dataset.eventId = event.id;
  
 // Formata a data para exibição
  const [year, month, day] = event.date.split('-');
  const eventDate = new Date(year, month - 1, day);
  const formattedDate = eventDate.toLocaleDateString({
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  eventDiv.innerHTML = `
    <div class="timeline-card">
      <div class="event-header">
        <h3 class="event-title">${event.title}</h3>
        <div class="event-meta">
          <div class="event-date">
            <i class="fas fa-calendar-heart"></i>
            ${formattedDate}
          </div>
          <div class="event-location">
            <i class="fas fa-map-marker-heart"></i>
            ${event.location}
          </div>
        </div>
      </div>
      
      <div class="event-content">
        <div class="event-description">
          ${event.description}
        </div>
        ${event.videoUrl ? `
          <div class="event-video">
            <video autoplay muted loop>
              <source src="${event.videoUrl}" type="video/mp4">
            </video>
          </div>
        ` : ''}
      </div>
      
      ${event.photos && event.photos.length > 0 ? `
        <div class="event-gallery">
          <div class="photo-grid">
            ${event.photos.slice(0, 4).map((photo, index) => `
              <div class="photo-item" onclick="openPhotoView('${event.id}', ${index})">
                <img src="${photo}" alt="Foto ${index + 1}" loading="lazy">
              </div>
            `).join('')}
          </div>
          ${event.photos.length > 4 ? `
            <button class="btn btn--outline view-more-btn" onclick="openPhotoGallery('${event.id}')">
              <i class="fas fa-images"></i>
              Ver mais fotos (${event.photos.length})
            </button>
          ` : event.photos.length > 0 ? `
            <button class="btn btn--outline view-more-btn" onclick="openPhotoGallery('${event.id}')">
              <i class="fas fa-images"></i>
              Ver todas as fotos (${event.photos.length})
            </button>
          ` : ''}
        </div>
      ` : ''}
      
      ${event.audioUrl ? `
        <audio class="event-audio" preload="metadata" loop>
          <source src="${event.audioUrl}" type="audio/mpeg">
        </audio>
      ` : ''}
    </div>
  `;
  
  return eventDiv;
}

// =====================================================
// SISTEMA DE ÁUDIO AUTOMÁTICO
// =====================================================

/**
 * Configura reprodução automática de áudio baseada no scroll
 * O áudio do card mais centralizado na tela será reproduzido
 */
function setupAudioAutoplay() {
  // Observer para detectar quando cards entram/saem da viewport
  const observer = new IntersectionObserver((entries) => {
    let mostVisibleCard = null;
    let maxVisibilityRatio = 0;
    
    entries.forEach(entry => {
      if (entry.intersectionRatio > maxVisibilityRatio) {
        maxVisibilityRatio = entry.intersectionRatio;
        mostVisibleCard = entry.target;
      }
    });
    
    // Reproduz áudio do card mais visível
    if (mostVisibleCard && maxVisibilityRatio > 0.5) {
      playCardAudio(mostVisibleCard);
    }
  }, {
    threshold: [0.1, 0.3, 0.5, 0.7, 0.9] // Múltiplos thresholds para precisão
  });
  
  // Observa todos os cards atuais
  document.querySelectorAll('.timeline-card').forEach(card => {
    observer.observe(card);
  });
}

/**
 * Reproduz o áudio de um card específico com transição suave
 * @param {Element} cardElement - Elemento do card
 */
function playCardAudio(cardElement) {
  const audioElement = cardElement.querySelector('.event-audio');
  
  if (audioElement && audioElement !== currentAudio) {
    // Para áudio atual com fade out
    if (currentAudio) {
      fadeOutAudio(currentAudio);
    }
    
    // Inicia novo áudio com fade in
    currentAudio = audioElement;
    fadeInAudio(audioElement);
  }
}

/**
 * Fade out suave do áudio
 */
function fadeOutAudio(audio) {
  const fadeStep = 0.05;
  const fadeInterval = setInterval(() => {
    if (audio.volume > fadeStep) {
      audio.volume = Math.max(0, audio.volume - fadeStep);
    } else {
      audio.volume = 0;
      audio.pause();
      clearInterval(fadeInterval);
    }
  }, 50);
}

/**
 * Fade in suave do áudio
 */
function fadeInAudio(audio) {
  audio.volume = 0;
  audio.play().then(() => {
    const fadeStep = 0.05;
    const targetVolume = 0.7; // Volume moderado para não incomodar
    
    const fadeInterval = setInterval(() => {
      if (audio.volume < targetVolume - fadeStep) {
        audio.volume = Math.min(targetVolume, audio.volume + fadeStep);
      } else {
        audio.volume = targetVolume;
        clearInterval(fadeInterval);
      }
    }, 50);
  }).catch(error => {
    console.log('Não foi possível reproduzir o áudio:', error);
  });
}

// =====================================================
// SISTEMA DE UPLOAD E CADASTRO DE EVENTOS
// =====================================================

/**
 * Inicializa o sistema de cadastro de eventos
 */
function initializeEventForm() {
  const addEventBtn = document.getElementById('addEventBtn');
  const addEventModal = document.getElementById('addEventModal');
  const addEventForm = document.getElementById('addEventForm');
  const cancelEventBtn = document.getElementById('cancelEventBtn');
  
  // Abre modal de cadastro
  addEventBtn.addEventListener('click', () => {
    openModal(addEventModal);
  });
  
  // Fecha modal
  cancelEventBtn.addEventListener('click', () => {
    closeModal(addEventModal);
    addEventForm.reset();
  });
  
  // Submit do formulário
  addEventForm.addEventListener('submit', handleEventSubmit);
}

/**
 * Processa o envio de um novo evento
 * @param {Event} e - Evento do formulário
 */
async function handleEventSubmit(e) {
  e.preventDefault();
  
  try {
    showLoading(true, 'Salvando momento especial...');
    
    // Coleta dados do formulário
    const formData = {
      title: document.getElementById('eventTitle').value,
      date: document.getElementById('formatDateBr').value,
      location: document.getElementById('eventLocation').value,
      description: document.getElementById('eventDescription').value
    };
    
    // Upload de arquivos para Cloudinary
    const videoFile = document.getElementById('eventVideo').files[0];
    const audioFile = document.getElementById('eventAudio').files[0];
    const photoFiles = document.getElementById('eventPhotos').files;
    
    // Progresso do upload
    showUploadProgress(true);
    
    // Upload do vídeo
    if (videoFile) {
      updateUploadProgress(20, 'Enviando vídeo...');
      formData.videoUrl = await uploadToCloudinary(videoFile, 'video');
    }
    
    // Upload do áudio
    if (audioFile) {
      updateUploadProgress(40, 'Enviando áudio...');
      formData.audioUrl = await uploadToCloudinary(audioFile, 'video'); // Cloudinary trata áudio como vídeo
    }
    
    // Upload das fotos
    if (photoFiles.length > 0) {
      updateUploadProgress(60, 'Enviando fotos...');
      formData.photos = [];
      
      for (let i = 0; i < Math.min(photoFiles.length, 10); i++) { // Máximo 10 fotos
        const photoUrl = await uploadToCloudinary(photoFiles[i], 'image');
        formData.photos.push(photoUrl);
        
        // Atualiza progresso para cada foto
        const progress = 60 + (i + 1) * (30 / photoFiles.length);
        updateUploadProgress(progress, `Enviando foto ${i + 1}/${photoFiles.length}...`);
      }
    }
    
    updateUploadProgress(90, 'Salvando dados...');
    
    // Salva no Firebase
    const eventsRef = database.ref('events');
    const newEventRef = eventsRef.push();
    await newEventRef.set(formData);
    
    updateUploadProgress(100, 'Momento salvo com sucesso!');
    
    // Fecha modal e recarrega timeline
    setTimeout(() => {
      closeModal(document.getElementById('addEventModal'));
      document.getElementById('addEventForm').reset();
      showUploadProgress(false);
      loadTimelineEvents();
      showSuccess('Momento especial adicionado à nossa história! 💕');
    }, 1000);
    
  } catch (error) {
    console.error('Erro ao salvar evento:', error);
    showError('Erro ao salvar o momento. Tente novamente.');
    showUploadProgress(false);
  } finally {
    showLoading(false);
  }
}

/**
 * Faz upload de arquivo para o Cloudinary
 * @param {File} file - Arquivo para upload
 * @param {string} resourceType - Tipo do recurso (image, video, raw)
 */
async function uploadToCloudinary(file, resourceType = 'auto') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Erro no upload para Cloudinary');
  }
  
  const data = await response.json();
  return data.secure_url;
}

// =====================================================
// SISTEMA DE GALERIA E VISUALIZAÇÃO DE FOTOS
// =====================================================

/**
 * Abre modal com galeria completa de fotos de um evento
 * @param {string} eventId - ID do evento
 */
function openPhotoGallery(eventId) {
  const event = timelineEvents.find(e => e.id === eventId);
  if (!event || !event.photos) return;
  
  const galleryModal = document.getElementById('photoGalleryModal');
  const galleryGrid = document.getElementById('photoGalleryGrid');
  
  // Limpa galeria anterior
  galleryGrid.innerHTML = '';
  
  // Adiciona todas as fotos
  event.photos.forEach((photo, index) => {
    const photoDiv = document.createElement('div');
    photoDiv.className = 'gallery-photo';
    photoDiv.onclick = () => openPhotoView(eventId, index);
    photoDiv.innerHTML = `<img src="${photo}" alt="Foto ${index + 1}" loading="lazy">`;
    galleryGrid.appendChild(photoDiv);
  });
  
  openModal(galleryModal);
}

/**
 * Abre visualização individual de foto
 * @param {string} eventId - ID do evento
 * @param {number} photoIndex - Índice da foto
 */
function openPhotoView(eventId, photoIndex) {
  const event = timelineEvents.find(e => e.id === eventId);
  if (!event || !event.photos) return;
  
  currentPhotoGallery = event.photos;
  currentPhotoIndex = photoIndex;
  
  const photoModal = document.getElementById('photoViewModal');
  const photoImage = document.getElementById('photoViewImage');
  
  photoImage.src = currentPhotoGallery[currentPhotoIndex];
  photoImage.alt = `Foto ${currentPhotoIndex + 1}`;
  
  // Fecha galeria se estiver aberta
  closeModal(document.getElementById('photoGalleryModal'));
  
  openModal(photoModal);
  updatePhotoNavigation();
}

/**
 * Navega para foto anterior
 */
function showPrevPhoto() {
  if (currentPhotoIndex > 0) {
    currentPhotoIndex--;
    document.getElementById('photoViewImage').src = currentPhotoGallery[currentPhotoIndex];
    updatePhotoNavigation();
  }
}

/**
 * Navega para próxima foto
 */
function showNextPhoto() {
  if (currentPhotoIndex < currentPhotoGallery.length - 1) {
    currentPhotoIndex++;
    document.getElementById('photoViewImage').src = currentPhotoGallery[currentPhotoIndex];
    updatePhotoNavigation();
  }
}

/**
 * Atualiza botões de navegação das fotos
 */
function updatePhotoNavigation() {
  const prevBtn = document.getElementById('prevPhoto');
  const nextBtn = document.getElementById('nextPhoto');
  
  prevBtn.style.opacity = currentPhotoIndex > 0 ? '1' : '0.5';
  nextBtn.style.opacity = currentPhotoIndex < currentPhotoGallery.length - 1 ? '1' : '0.5';
}

// =====================================================
// UTILITÁRIOS E HELPERS
// =====================================================

/**
 * Abre modal genérico
 * @param {Element} modal - Elemento do modal
 */
function openModal(modal) {
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  // Fecha ao clicar no overlay
  modal.querySelector('.modal-overlay').onclick = () => {
    closeModal(modal);
  };
  
  // Fecha ao clicar no botão de fechar
  modal.querySelector('.modal-close').onclick = () => {
    closeModal(modal);
  };
}

/**
 * Fecha modal genérico
 * @param {Element} modal - Elemento do modal
 */
function closeModal(modal) {
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

/**
 * Controla exibição do loading
 * @param {boolean} show - Se deve mostrar ou esconder
 * @param {string} message - Mensagem personalizada
 */
function showLoading(show, message = 'Carregando momentos especiais...') {
  const loading = document.getElementById('loadingIndicator');
  const loadingText = loading.querySelector('p');
  
  loadingText.textContent = message;
  
  if (show) {
    loading.classList.remove('hidden');
  } else {
    loading.classList.add('hidden');
  }
}

/**
 * Controla progresso do upload
 * @param {boolean} show - Se deve mostrar ou esconder
 */
function showUploadProgress(show) {
  const progressContainer = document.querySelector('.upload-progress');
  
  if (show) {
    progressContainer.classList.remove('hidden');
  } else {
    progressContainer.classList.add('hidden');
    updateUploadProgress(0, '');
  }
}

/**
 * Atualiza barra de progresso do upload
 * @param {number} percentage - Porcentagem (0-100)
 * @param {string} message - Mensagem
 */
function updateUploadProgress(percentage, message) {
  const progressFill = document.querySelector('.progress-fill');
  const progressText = document.querySelector('.progress-text');
  
  progressFill.style.width = `${percentage}%`;
  progressText.textContent = message;
}

/**
 * Exibe mensagem de sucesso
 * @param {string} message - Mensagem
 */
function showSuccess(message) {
  // Implementação simples com alert (pode ser melhorada com toast)
  alert(message);
}

/**
 * Exibe mensagem de erro
 * @param {string} message - Mensagem
 */
function showError(message) {
  // Implementação simples com alert (pode ser melhorada com toast)
  alert(message);
}

// =====================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =====================================================

/**
 * Inicializa toda a aplicação quando DOM estiver carregado
 */
document.addEventListener('DOMContentLoaded', function() {
  // Inicializa sistemas principais
  initializeLogin();
  initializeEventForm();
  
  // Configura botão "Carregar Mais"
  document.getElementById('loadMoreBtn').addEventListener('click', loadMoreEvents);
  
  // Configura navegação de fotos
  document.getElementById('prevPhoto').addEventListener('click', showPrevPhoto);
  document.getElementById('nextPhoto').addEventListener('click', showNextPhoto);
  
  // Configura atalhos de teclado para navegação de fotos
  document.addEventListener('keydown', function(e) {
    const photoModal = document.getElementById('photoViewModal');
    if (!photoModal.classList.contains('hidden')) {
      if (e.key === 'ArrowLeft') showPrevPhoto();
      if (e.key === 'ArrowRight') showNextPhoto();
      if (e.key === 'Escape') closeModal(photoModal);
    }
  });
  
  console.log('📱 Aplicativo "A Nossa História" inicializado com sucesso!');
  console.log('💕 Desenvolvido com amor para Wendel CM e Nathalia LFG');
  console.log('🏢 Uma produção Worporation');
});

// Torna as funções globais disponíveis para o HTML
window.openPhotoGallery = openPhotoGallery;
window.openPhotoView = openPhotoView;