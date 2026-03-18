// Simple frontend logic: registration, voice recording, nearby finder
const api = '';
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const workersEl = document.getElementById('workers');
const langSelect = document.getElementById('langSelect');

// Search functionality
function searchServices() {
  const searchInput = document.getElementById('serviceSearch');
  if (searchInput && searchInput.value.trim()) {
    filterBySkill(searchInput.value.trim());
  }
}

// Splash Screen Animation
window.addEventListener('load', () => {
  const splashScreen = document.getElementById('splashScreen');
  if (splashScreen) {
    setTimeout(() => {
      splashScreen.classList.add('splash-hidden');
      setTimeout(() => {
        splashScreen.style.display = 'none';
      }, 600);
    }, 2000); // Show for 2 seconds
  }
});

// Voice Assistant Feature
let voiceRecognition = null;
let voiceSynthesis = window.speechSynthesis;
let isListening = false;
let currentTranscript = '';
let recognitionActive = false;

function initVoiceAssistant() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('Speech Recognition not supported');
    return;
  }
  
  voiceRecognition = new SpeechRecognition();
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = false;
  voiceRecognition.maxAlternatives = 1;
  
  const voiceBtn = document.getElementById('voiceAssistantBtn');
  const voicePanel = document.getElementById('voiceAssistantPanel');
  const closeBtn = document.getElementById('closeAssistant');
  const statusEl = document.getElementById('assistantStatus');
  const voiceCommandArea = document.getElementById('voiceCommandArea');
  const voiceTranscript = document.getElementById('voiceTranscript');
  const sendBtn = document.getElementById('sendVoiceCommand');
  const cancelBtn = document.getElementById('cancelVoiceCommand');
  const startListeningBtn = document.getElementById('startListeningBtn');
  const voiceTextInput = document.getElementById('voiceTextInput');
  const sendTextCommand = document.getElementById('sendTextCommand');
  
  if (!voiceBtn || !voicePanel) return;
  
  // Toggle assistant panel
  voiceBtn.addEventListener('click', () => {
    if (voicePanel.style.display === 'none') {
      voicePanel.style.display = 'block';
      resetVoiceUI();
    } else {
      voicePanel.style.display = 'none';
      stopListening();
    }
  });
  
  // Text command input
  sendTextCommand.addEventListener('click', () => {
    const textCommand = voiceTextInput.value.trim();
    if (textCommand) {
      processVoiceCommand(textCommand);
      voiceTextInput.value = '';
      voicePanel.style.display = 'none';
    }
  });
  
  // Allow Enter key to send text command
  voiceTextInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendTextCommand.click();
    }
  });
  
  // Start listening button
  startListeningBtn.addEventListener('click', async () => {
    await startListening();
  });
  
  closeBtn.addEventListener('click', () => {
    voicePanel.style.display = 'none';
    stopListening();
    resetVoiceUI();
  });
  
  // Send button click
  sendBtn.addEventListener('click', () => {
    if (currentTranscript) {
      processVoiceCommand(currentTranscript);
      resetVoiceUI();
    }
  });
  
  // Cancel button click
  cancelBtn.addEventListener('click', () => {
    resetVoiceUI();
    startListening();
  });
  
  // Suggestion button clicks
  document.querySelectorAll('.suggestion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const command = btn.getAttribute('data-command');
      processVoiceCommand(command);
    });
  });
  
  function resetVoiceUI() {
    voiceCommandArea.style.display = 'none';
    voiceTranscript.textContent = '';
    currentTranscript = '';
    startListeningBtn.style.display = 'flex';
    statusEl.textContent = 'Click "Start Listening" to speak your command';
    statusEl.style.background = '#f1f5f9';
    statusEl.style.color = '#64748b';
  }
  
  async function startListening() {
    // Prevent multiple simultaneous starts
    if (isListening || recognitionActive) {
      console.log('Recognition already active');
      return;
    }
    
    // Ensure any previous recognition is fully stopped
    try {
      voiceRecognition.abort();
    } catch(e) {}
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Request microphone permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Microphone permission error:', err);
      statusEl.textContent = '❌ Microphone access denied. Please allow microphone in browser settings.';
      statusEl.style.background = '#fee2e2';
      statusEl.style.color = '#991b1b';
      startListeningBtn.style.display = 'flex';
      return;
    }
    
    const currentLang = langSelect ? langSelect.value : 'en';
    const langCodes = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'mr': 'mr-IN',
      'ta': 'ta-IN',
      'ml': 'ml-IN'
    };
    
    voiceRecognition.lang = langCodes[currentLang] || 'en-US';
    
    try {
      recognitionActive = true;
      isListening = true;
      startListeningBtn.style.display = 'none';
      voiceBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)';
      statusEl.textContent = '🎤 Listening... Speak your command now';
      statusEl.style.background = '#fee2e2';
      statusEl.style.color = '#991b1b';
      
      voiceRecognition.start();
      console.log('Voice recognition started');
    } catch (err) {
      console.error('Voice recognition start error:', err);
      statusEl.textContent = '❌ Could not start voice recognition. Please try again.';
      statusEl.style.background = '#fee2e2';
      statusEl.style.color = '#991b1b';
      startListeningBtn.style.display = 'flex';
      isListening = false;
      recognitionActive = false;
    }
  }
  
  function stopListening() {
    if (!isListening) return;
    try {
      voiceRecognition.stop();
      isListening = false;
      recognitionActive = false;
      voiceBtn.style.background = 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)';
    } catch (err) {
      recognitionActive = false;
    }
  }
  
  voiceRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    currentTranscript = transcript.toLowerCase();
    
    console.log('Voice recognized:', transcript);
    
    // Show the transcript and send button
    voiceTranscript.textContent = transcript;
    voiceCommandArea.style.display = 'block';
    statusEl.textContent = '✓ Voice command received. Review and click Send.';
    statusEl.style.background = '#d1fae5';
    statusEl.style.color = '#065f46';
    
    recognitionActive = false;
    stopListening();
  };
  
  voiceRecognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    let errorMsg = '❌ ';
    
    switch(event.error) {
      case 'network':
        errorMsg += 'Connection issue. Please try again or check if microphone is working.';
        break;
      case 'not-allowed':
      case 'service-not-allowed':
        errorMsg += 'Microphone permission denied. Please allow microphone access in browser settings.';
        break;
      case 'no-speech':
        errorMsg += 'No speech detected. Click Start Listening and speak clearly.';
        break;
      case 'audio-capture':
        errorMsg += 'Microphone not found. Please check your microphone.';
        break;
      case 'aborted':
        errorMsg += 'Recognition cancelled. Click Start Listening to try again.';
        break;
      default:
        errorMsg += 'Error occurred. Please click Start Listening to try again.';
    }
    
    statusEl.textContent = errorMsg;
    statusEl.style.background = '#fee2e2';
    statusEl.style.color = '#991b1b';
    startListeningBtn.style.display = 'flex';
    isListening = false;
    recognitionActive = false;
  };
  
  voiceRecognition.onend = () => {
    console.log('Voice recognition ended');
    isListening = false;
    recognitionActive = false;
    stopListening();
  };
}

function processVoiceCommand(command) {
  command = command.toLowerCase().trim();
  
  // Speak feedback
  function speak(text) {
    if (voiceSynthesis) {
      voiceSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const currentLang = langSelect ? langSelect.value : 'en';
      const langCodes = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'mr': 'mr-IN',
        'ta': 'ta-IN',
        'ml': 'ml-IN'
      };
      utterance.lang = langCodes[currentLang] || 'en-US';
      voiceSynthesis.speak(utterance);
    }
  }
  
  // Command processing
  if (command.includes('find') || command.includes('search') || command.includes('plumb') || command.includes('electric') || command.includes('paint') || command.includes('carpenter') || command.includes('clean')) {
    let skill = '';
    if (command.includes('plumb')) skill = 'plumber';
    else if (command.includes('electric')) skill = 'electrician';
    else if (command.includes('paint')) skill = 'painter';
    else if (command.includes('carpenter')) skill = 'carpenter';
    else if (command.includes('clean')) skill = 'cleaner';
    
    speak('Finding workers for you');
    filterBySkill(skill);
    document.getElementById('voiceAssistantPanel').style.display = 'none';
  }
  else if (command.includes('post') && command.includes('job')) {
    speak('Opening job posting form');
    document.getElementById('postJob').click();
    document.getElementById('voiceAssistantPanel').style.display = 'none';
  }
  else if (command.includes('register') || command.includes('sign up')) {
    speak('Opening registration');
    document.getElementById('registerBtn').click();
    document.getElementById('voiceAssistantPanel').style.display = 'none';
  }
  else if (command.includes('login') || command.includes('log in')) {
    speak('Opening login');
    document.getElementById('loginBtn').click();
    document.getElementById('voiceAssistantPanel').style.display = 'none';
  }
  else if (command.includes('show') && (command.includes('worker') || command.includes('service'))) {
    speak('Showing all workers');
    loadWorkers();
    document.getElementById('voiceAssistantPanel').style.display = 'none';
  }
  else if (command.includes('nearby') || command.includes('near me')) {
    speak('Finding nearby workers');
    document.getElementById('findNearbyWorkers').click();
    document.getElementById('voiceAssistantPanel').style.display = 'none';
  }
  else if (command.includes('help')) {
    speak('You can say find plumber, post job, register, login, or show workers');
  }
  else {
    speak('Sorry, I did not understand that command. Try saying find plumber, post job, register, or login');
  }
}

// Initialize voice assistant when page loads
window.addEventListener('load', initVoiceAssistant);

// Filter workers by skill category
async function filterBySkill(skill) {
  // Load all workers
  const res = await fetch('/api/workers');
  const data = await res.json();
  
  // Filter by skill if specified
  let filtered = data.workers;
  if (skill) {
    filtered = data.workers.filter(w => 
      w.skills && w.skills.toLowerCase().includes(skill.toLowerCase())
    );
  }
  
  // Render filtered workers
  renderWorkers(filtered);
  
  // Scroll to workers section
  const workersSection = document.getElementById('workers');
  if (workersSection) {
    workersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
const htmlElement = document.documentElement;

// Load saved theme preference or default to light mode
const savedTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', savedTheme);
updateDarkModeButton(savedTheme);

function updateDarkModeButton(theme) {
  if (darkModeToggle) {
    darkModeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
    darkModeToggle.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  }
}

if (darkModeToggle) {
  darkModeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateDarkModeButton(newTheme);
  });
}

const translations = {
  en: {
    heroTitle: 'QuickHire — Connect with nearby workers instantly',
    heroDesc: 'Find trusted plumbers, electricians, painters and helpers nearby. Record a short voice resume, verify your ID and get hired locally.',
    findNearby: 'Find Nearby Workers',
    skillPlaceholder: 'Filter by skill (e.g., plumber)',
    recordVoice: 'Record Voice Resume',
    uploadId: 'Upload ID (Aadhaar/PAN)',
    postJob: 'Post a Job',
    register: 'Register',
    login: 'Login',
    userReg: 'User Registration',
    labourReg: 'Labour Registration',
    workerProfile: 'Worker Profile',
    clientDashboard: 'Client Dashboard',
    workerDashboard: 'Worker Dashboard',
    myPostedJobs: 'My Posted Jobs',
    urgentJobs: 'Urgent Jobs',
    jobsAvailable: 'Jobs Available',
    acceptJob: 'Accept Job',
    jobDetails: 'Job Details',
    clientName: 'Client Name',
    clientPhone: 'Client Phone',
    jobLocation: 'Location',
    jobDescription: 'Description',
    hourlyRate: 'Hourly Rate',
    noJobsAvailable: 'No urgent jobs available at the moment',
    admin: 'Admin',
    serviceCategories: 'SERVICE CATEGORIES',
    allInOne: 'Everything You Need, All In One Place',
    plumber: 'Plumber',
    electrician: 'Electrician',
    carpenter: 'Carpenter',
    painter: 'Painter',
    cleaning: 'Cleaning',
    allServices: 'All Services',
    call: 'Call',
    rate: 'Rate',
    whatsapp: 'WhatsApp',
    verified: 'Verified',
    reviews: 'reviews',
    kmAway: 'km away',
    emergencyRequest: '🚨 Emergency Request',
    emergencyTitle: 'Emergency Request',
    urgent: 'URGENT',
    pay: 'Pay',
    negotiable: 'Negotiable',
    delete: 'Delete',
    close: 'Close',
    applyForJob: 'Apply for Job',
    applyingAs: 'Applying as',
    accepted: 'Accepted',
    open: 'Open',
    noJobsYet: 'No jobs yet.',
    noAvailableJobs: 'No available jobs right now.',
    distance: 'Dist'
  },
  hi: {
    heroTitle: 'क्विकहायर — पास के कामगारों से तुरंत जुड़ें',
    heroDesc: 'नजदीकी प्लंबर, इलेक्ट्रिशियन, पेंटर और हेल्पर खोजें। एक छोटा वॉइस रिज्यूमे रिकॉर्ड करें, अपनी आईडी सत्यापित करें और स्थानीय स्तर पर काम पाएं।',
    findNearby: 'नज़दीकी कामगार खोजें',
    skillPlaceholder: 'कौशल से फ़िल्टर करें (जैसे प्लंबर)',
    recordVoice: 'वॉइस रिज्यूमे रिकॉर्ड करें',
    uploadId: 'आईडी अपलोड करें (आधार/पैन)',
    postJob: 'नौकरी पोस्ट करें',
    register: 'रजिस्टर करें',
    login: 'लॉगिन',
    userReg: 'उपयोगकर्ता पंजीकरण',
    labourReg: 'मजदूर पंजीकरण',
    workerProfile: 'कार्यकर्ता प्रोफ़ाइल',
    clientDashboard: 'ग्राहक डैशबोर्ड',
    workerDashboard: 'कार्यकर्ता डैशबोर्ड',
    myPostedJobs: 'मेरी पोस्ट की गई नौकरियां',
    urgentJobs: 'तत्काल नौकरियां',
    jobsAvailable: 'उपलब्ध नौकरियां',
    acceptJob: 'नौकरी स्वीकार करें',
    jobDetails: 'नौकरी विवरण',
    clientName: 'ग्राहक का नाम',
    clientPhone: 'ग्राहक फ़ोन',
    jobLocation: 'स्थान',
    jobDescription: 'विवरण',
    hourlyRate: 'प्रति घंटा दर',
    noJobsAvailable: 'इस समय कोई तत्काल नौकरी उपलब्ध नहीं है',
    admin: 'प्रशासक',
    serviceCategories: 'सेवा श्रेणियाँ',
    allInOne: 'सब कुछ एक जगह, आपकी ज़रूरत के अनुसार',
    plumber: 'प्लंबर',
    electrician: 'बिजली मिस्त्री',
    carpenter: 'बढ़ई',
    painter: 'पेंटर',
    cleaning: 'सफाई',
    allServices: 'सभी सेवाएं',
    call: 'कॉल करें',
    rate: 'रेटिंग दें',
    whatsapp: 'व्हाट्सएप',
    verified: 'सत्यापित',
    reviews: 'समीक्षाएं',
    kmAway: 'किमी दूर',
    emergencyRequest: '🚨 आपातकालीन अनुरोध',
    emergencyTitle: 'आपातकालीन अनुरोध',
    urgent: 'तत्काल',
    pay: 'वेतन',
    negotiable: 'बातचीत योग्य',
    delete: 'हटाएं',
    close: 'बंद करें',
    applyForJob: 'नौकरी के लिए आवेदन करें',
    applyingAs: 'आवेदन कर रहे हैं',
    accepted: 'स्वीकृत',
    open: 'खुला',
    noJobsYet: 'अभी तक कोई नौकरी नहीं।',
    noAvailableJobs: 'अभी कोई भी नौकरी उपलब्ध नहीं है।',
    distance: 'दूरी'
  },
  mr: {
    heroTitle: 'हायर ईझ — जवळच्या कामगारांशी त्वरित संपर्क साधा',
    heroDesc: 'जवळचे प्लंबर, इलेक्ट्रिशियन, पेंटर आणि हेल्पर शोधा. एक लहान व्हॉइस रेझ्युमे रेकॉर्ड करा, तुमचा आयडी सत्यापित करा आणि स्थानिक पातळीवर काम मिळवा.',
    findNearby: 'जवळचे कामगार शोधा',
    skillPlaceholder: 'कौशल्यानुसार फिल्टर करा (उदा. प्लंबर)',
    recordVoice: 'व्हॉइस रेझ्युमे रेकॉर्ड करा',
    uploadId: 'आयडी अपलोड करा (आधार/पॅन)',
    postJob: 'नोकरी पोस्ट करा',
    register: 'नोंदणी करा',
    login: 'लॉगिन',
    userReg: 'वापरकर्ता नोंदणी',
    labourReg: 'कामगार नोंदणी',
    workerProfile: 'कामगार प्रोफाइल',
    clientDashboard: 'क्लायंट डॅशबोर्ड',
    workerDashboard: 'कामगार डॅशबोर्ड',
    myPostedJobs: 'माझ्या पोस्ट केलेल्या नोकऱ्या',
    urgentJobs: 'तातडीच्या नोकऱ्या',
    jobsAvailable: 'उपलब्ध नोकऱ्या',
    acceptJob: 'नोकरी स्वीकारा',
    jobDetails: 'नोकरीचा तपशील',
    clientName: 'क्लायंटचे नाव',
    clientPhone: 'क्लायंट फोन',
    jobLocation: 'स्थान',
    jobDescription: 'वर्णन',
    hourlyRate: 'प्रति तास दर',
    noJobsAvailable: 'या क्षणी कोणतीही तातडीची नोकरी उपलब्ध नाही',
    admin: 'प्रशासक',
    serviceCategories: 'सेवा श्रेणी',
    allInOne: 'सर्व काही एका ठिकाणी',
    plumber: 'प्लंबर',
    electrician: 'इलेक्ट्रिशियन',
    carpenter: 'सुतार',
    painter: 'पेंटर',
    cleaning: 'साफसफाई',
    allServices: 'सर्व सेवा',
    call: 'कॉल करा',
    rate: 'रेटिंग द्या',
    whatsapp: 'व्हाट्सअॅप',
    verified: 'सत्यापित',
    reviews: 'पुनरावलोकने',
    kmAway: 'किमी दूर',
    emergencyRequest: '🚨 आणीबाणी विनंती',
    emergencyTitle: 'आणीबाणी विनंती',
    urgent: 'तातडीचे',
    pay: 'पगार',
    negotiable: 'वाटाघाटी करण्यायोग्य',
    delete: 'हटवा',
    close: 'बंद करा',
    applyForJob: 'नोकरीसाठी अर्ज करा',
    applyingAs: 'अर्ज करत आहे',
    accepted: 'स्वीकारले',
    open: 'उघडा',
    noJobsYet: 'अद्याप कोणतीही नोकरी नाही.',
    noAvailableJobs: 'सध्या कोणतीही नोकरी उपलब्ध नाही.',
    distance: 'अंतर'
  },
  ta: {
    heroTitle: 'ஹையர் ஈஸ் — அருகிலுள்ள தொழிலாளர்களுடன் உடனடியாக இணைக்கவும்',
    heroDesc: 'அருகிலுள்ள குழாய்வழி பழுதுபார்ப்பு, மின்சாரம், ஓவியம் மற்றும் உதவியாளர்களை கண்டறியவும். குறுகிய குரல் விண்ணப்பம் பதிவு செய்யவும், உங்கள் அடையாள சான்றை சரிபார்க்கவும் மற்றும் உள்ளூர் பணி பெறவும்.',
    findNearby: 'அருகிலுள்ள தொழிலாளர்களை கண்டறியவும்',
    skillPlaceholder: 'திறன் அடிப்படையில் வடிகட்டவும் (எ.கா. குழாய்வழி)',
    recordVoice: 'குரல் விண்ணப்பம் பதிவு செய்யவும்',
    uploadId: 'அடையாள சான்று பதிவேற்றவும் (ஆதார்/பான்)',
    postJob: 'வேலை இடுகை',
    register: 'பதிவு செய்யவும்',
    login: 'உள்நுழைவு',
    userReg: 'பயனர் பதிவு',
    labourReg: 'தொழிலாளர் பதிவு',
    workerProfile: 'தொழிலாளர் சுயவிவரம்',
    clientDashboard: 'வாடிக்கையாளர் டாஷ்போர்டு',
    workerDashboard: 'தொழிலாளர் டாஷ்போர்டு',
    myPostedJobs: 'எனது வேலைகள்',
    urgentJobs: 'அவசர வேலைகள்',
    jobsAvailable: 'கிடைக்கும் வேலைகள்',
    acceptJob: 'வேலையை ஏற்கவும்',
    jobDetails: 'வேலை விவரங்கள்',
    clientName: 'வாடிக்கையாளர் பெயர்',
    clientPhone: 'வாடிக்கையாளர் தொலைபேசி',
    jobLocation: 'இடம்',
    jobDescription: 'விளக்கம்',
    hourlyRate: 'மணிநேர விகிதம்',
    noJobsAvailable: 'தற்போது அவசர வேலைகள் இல்லை',
    admin: 'நிர்வாகி',
    serviceCategories: 'சேவை வகைகள்',
    allInOne: 'எல்லாம் ஒரே இடத்தில்',
    plumber: 'குழாய்வழி பழுதுபார்ப்பு',
    electrician: 'மின்சாரம்',
    carpenter: 'தச்சர்',
    painter: 'ஓவியர்',
    cleaning: 'சுத்தம்',
    allServices: 'அனைத்து சேவைகள்',
    call: 'அழைக்கவும்',
    rate: 'மதிப்பிடவும்',
    whatsapp: 'வாட்ஸ்அப்',
    verified: 'சரிபார்க்கப்பட்டது',
    reviews: 'மதிப்புரைகள்',
    kmAway: 'கி.மீ தூரம்',
    emergencyRequest: '🚨 அவசர கோரிக்கை',
    emergencyTitle: 'அவசர கோரிக்கை',
    urgent: 'அவசரம்',
    pay: 'சம்பளம்',
    negotiable: 'பேச்சுவார்த்தைக்குரியது',
    delete: 'நீக்கு',
    close: 'மூடு',
    applyForJob: 'வேலைக்கு விண்ணப்பிக்கவும்',
    applyingAs: 'விண்ணப்பிக்கிறது',
    accepted: 'ஏற்றுக்கொள்ளப்பட்டது',
    open: 'திறந்தது',
    noJobsYet: 'இன்னும் வேலைகள் இல்லை.',
    noAvailableJobs: 'தற்போது கிடைக்கும் வேலைகள் இல்லை.',
    distance: 'தூரம்'
  },
  ml: {
    heroTitle: 'ഹായർ ഈസ് — സമീപത്തുള്ള തൊഴിലാളികളുമായി ഉടനടി ബന്ധപ്പെടുക',
    heroDesc: 'സമീപത്തുള്ള പ്ലംബർമാർ, ഇലക്ട്രീഷ്യൻമാർ, പെയിന്റർമാർ, സഹായികൾ എന്നിവരെ കണ്ടെത്തുക. ഒരു ചെറിയ വോയ്സ് റെസ്യൂം റെക്കോർഡ് ചെയ്യുക, നിങ്ങളുടെ ഐഡി പരിശോധിച്ച് പ്രാദേശികമായി ജോലി നേടുക.',
    findNearby: 'സമീപത്തുള്ള തൊഴിലാളികളെ കണ്ടെത്തുക',
    skillPlaceholder: 'വൈദഗ്ധ്യം അനുസരിച്ച് ഫിൽട്ടർ ചെയ്യുക (ഉദാ: പ്ലംബർ)',
    recordVoice: 'വോയ്സ് റെസ്യൂം റെക്കോർഡ് ചെയ്യുക',
    uploadId: 'ഐഡി അപ്ലോഡ് ചെയ്യുക (ആധാർ/പാൻ)',
    postJob: 'ജോലി പോസ്റ്റ് ചെയ്യുക',
    register: 'രജിസ്റ്റർ ചെയ്യുക',
    login: 'ലോഗിൻ',
    userReg: 'ഉപയോക്തൃ രജിസ്ട്രേഷൻ',
    labourReg: 'തൊഴിലാളി രജിസ്ട്രേഷൻ',
    workerProfile: 'തൊഴിലാളി പ്രൊഫൈൽ',
    clientDashboard: 'ക്ലയന്റ് ഡാഷ്ബോർഡ്',
    workerDashboard: 'തൊഴിലാളി ഡാഷ്ബോർഡ്',
    myPostedJobs: 'എന്റെ പോസ്റ്റ് ചെയ്ത ജോലികൾ',
    urgentJobs: 'അടിയന്തിര ജോലികൾ',
    jobsAvailable: 'ലഭ്യമായ ജോലികൾ',
    acceptJob: 'ജോലി സ്വീകരിക്കുക',
    jobDetails: 'ജോലി വിശദാംശങ്ങൾ',
    clientName: 'ക്ലയന്റ് പേര്',
    clientPhone: 'ക്ലയന്റ് ഫോൺ',
    jobLocation: 'സ്ഥലം',
    jobDescription: 'വിവരണം',
    hourlyRate: 'മണിക്കൂർ നിരക്ക്',
    noJobsAvailable: 'ഇപ്പോൾ അടിയന്തിര ജോലികളൊന്നുമില്ല',
    admin: 'അഡ്മിൻ',
    serviceCategories: 'സേവന വിഭാഗങ്ങൾ',
    allInOne: 'എല്ലാം ഒരിടത്ത്',
    plumber: 'പ്ലംബർ',
    electrician: 'ഇലക്ട്രീഷ്യൻ',
    carpenter: 'മരപ്പണിക്കാരൻ',
    painter: 'പെയിന്റർ',
    cleaning: 'വൃത്തിയാക്കൽ',
    allServices: 'എല്ലാ സേവനങ്ങളും',
    call: 'വിളിക്കുക',
    rate: 'റേറ്റ് ചെയ്യുക',
    whatsapp: 'വാട്സാപ്പ്',
    verified: 'പരിശോധിച്ചു',
    reviews: 'അവലോകനങ്ങൾ',
    kmAway: 'കി.മീ അകലം',
    emergencyRequest: '🚨 അടിയന്തിര അഭ്യർത്ഥന',
    emergencyTitle: 'അടിയന്തിര അഭ്യർത്ഥന',
    urgent: 'അടിയന്തിരം',
    pay: 'ശമ്പളം',
    negotiable: 'ചർച്ച ചെയ്യാവുന്നത്',
    delete: 'ഇല്ലാതാക്കുക',
    close: 'അടയ്ക്കുക',
    applyForJob: 'ജോലിക്ക് അപേക്ഷിക്കുക',
    applyingAs: 'അപേക്ഷിക്കുന്നു',
    accepted: 'സ്വീകരിച്ചു',
    open: 'തുറന്നത്',
    noJobsYet: 'ഇതുവരെ ജോലികളൊന്നുമില്ല.',
    noAvailableJobs: 'ഇപ്പോൾ ജോലികളൊന്നും ലഭ്യമല്ല.',
    distance: 'ദൂരം'
  }
};

// Global variable to store current language
let currentLanguage = 'en';

function applyLang(lang){
  currentLanguage = lang; // Store globally
  const t = translations[lang] || translations.en;
  const heroTitle = document.getElementById('heroTitle');
  const heroDesc = document.getElementById('heroDesc');
  const findNearby = document.getElementById('findNearby');
  const skillFilter = document.getElementById('skillFilter');
  const recordVoiceBtn = document.getElementById('recordVoice');
  const uploadIdBtn = document.getElementById('uploadId');
  const postJobBtn = document.getElementById('postJob');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const clientDashboardBtn = document.getElementById('clientDashboardBtn');
  const workerDashboardBtn = document.getElementById('workerDashboardBtn');
  const emergencyBtn = document.getElementById('postEmergency');
  const emergencyTitle = document.getElementById('emergencyTitle');
  
  if (heroTitle) heroTitle.textContent = t.heroTitle;
  if (heroDesc) heroDesc.textContent = t.heroDesc;
  if (findNearby) findNearby.textContent = t.findNearby;
  if (skillFilter) skillFilter.placeholder = t.skillPlaceholder;
  if (recordVoiceBtn) recordVoiceBtn.textContent = t.recordVoice;
  if (uploadIdBtn) uploadIdBtn.textContent = t.uploadId;
  if (postJobBtn) postJobBtn.textContent = t.postJob;
  if (loginBtn) loginBtn.textContent = t.login;
  if (registerBtn) registerBtn.textContent = t.register;
  if (clientDashboardBtn) clientDashboardBtn.textContent = t.clientDashboard;
  if (workerDashboardBtn) workerDashboardBtn.textContent = t.workerDashboard;
  if (emergencyBtn) emergencyBtn.textContent = t.emergencyRequest;
  if (emergencyTitle) emergencyTitle.textContent = t.emergencyTitle;
  
  // Update category section
  const categoryTitle = document.querySelector('#categoriesSection h2');
  const categorySubtitle = document.querySelector('#categoriesSection p');
  if (categoryTitle) categoryTitle.textContent = t.serviceCategories;
  if (categorySubtitle) categorySubtitle.textContent = t.allInOne;
  
  // Update category cards
  const categories = document.querySelectorAll('.category-card h4');
  const categoryTexts = [t.plumber, t.electrician, t.carpenter, t.painter, t.cleaning, t.allServices];
  categories.forEach((cat, i) => {
    if (categoryTexts[i]) cat.textContent = categoryTexts[i];
  });
  
  // Store language preference
  try { localStorage.setItem('preferredLang', lang); } catch(e) {}
  
  // Reload workers and jobs to apply translations
  loadWorkers();
  loadJobs();
}

if (langSelect){
  langSelect.addEventListener('change', (e)=> applyLang(e.target.value));
  // Set default to Hindi and apply
  const savedLang = localStorage.getItem('preferredLang') || 'hi';
  langSelect.value = savedLang;
  applyLang(savedLang);
}

// Role-Based Access Control
function applyRoleBasedAccess(role) {
  const clientModeBtn = document.getElementById('clientModeBtn');
  const workerModeBtn = document.getElementById('workerModeBtn');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  
  // Get current user data
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  // Hide mode toggle buttons, login and registration buttons
  if (clientModeBtn) clientModeBtn.style.display = 'none';
  if (workerModeBtn) workerModeBtn.style.display = 'none';
  if (registerBtn) registerBtn.style.display = 'none';
  if (loginBtn) loginBtn.style.display = 'none';
  
  // Show profile dropdown
  if (profileDropdown) {
    profileDropdown.style.display = 'block';
    const profileUserName = document.getElementById('profileUserName');
    if (profileUserName && currentUser.name) {
      profileUserName.textContent = currentUser.name;
    }
  }
  
  // Initialize profile dropdown toggle
  initializeProfileDropdown();
  
  // Show appropriate dashboard based on role
  if (role === 'worker') {
    setMode('worker');
  } else if (role === 'employer' || role === 'client') {
    setMode('client');
  }
}

// Initialize Profile Dropdown
function initializeProfileDropdown() {
  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');
  const viewProfileLink = document.getElementById('viewProfileLink');
  const editProfileLink = document.getElementById('editProfileLink');
  const myPostsLink = document.getElementById('myPostsLink');
  const logoutLink = document.getElementById('logoutLink');
  
  // Toggle dropdown menu
  if (profileBtn && profileMenu) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.style.display = profileMenu.style.display === 'none' ? 'block' : 'none';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.style.display = 'none';
      }
    });
    
    // Add hover effects to menu items
    const menuItems = profileMenu.querySelectorAll('a');
    menuItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.background = '#f1f5f9';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });
    });
  }
  
  // View Profile
  if (viewProfileLink) {
    viewProfileLink.addEventListener('click', (e) => {
      e.preventDefault();
      profileMenu.style.display = 'none';
      showProfileModal();
    });
  }
  
  // Edit Profile
  if (editProfileLink) {
    editProfileLink.addEventListener('click', (e) => {
      e.preventDefault();
      profileMenu.style.display = 'none';
      showEditProfileModal();
    });
  }
  
  // My Posts
  if (myPostsLink) {
    myPostsLink.addEventListener('click', (e) => {
      e.preventDefault();
      profileMenu.style.display = 'none';
      showMyPostsModal();
    });
  }
  
  // Logout
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      showToast('Logged Out', 'You have been logged out successfully', 'success');
      setTimeout(() => location.reload(), 1000);
    });
  }
}

// Show Profile Modal
function showProfileModal() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userRole = localStorage.getItem('userRole');
  
  let profileHTML = `
    <div style="text-align:center;margin-bottom:20px;">
      <div style="width:80px;height:80px;background:linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:36px;">👤</div>
      <h3 style="color:#0f766e;margin:0 0 4px 0;">${currentUser.name || 'User'}</h3>
      <p style="color:#64748b;font-size:13px;margin:0;">${userRole === 'worker' ? '🔧 Worker' : '👥 Client'}</p>
    </div>
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:16px;">
      <div style="margin-bottom:12px;"><strong style="color:#0f172a;">📞 Phone:</strong> <span style="color:#64748b;">${currentUser.phone || 'N/A'}</span></div>
      <div style="margin-bottom:12px;"><strong style="color:#0f172a;">⭐ Trust Score:</strong> <span style="color:#64748b;">${currentUser.trust_score || 0} / 5</span></div>
      <div style="margin-bottom:12px;"><strong style="color:#0f172a;">✅ Verified:</strong> <span style="color:#64748b;">${currentUser.verified ? 'Yes' : 'No'}</span></div>
  `;
  
  if (userRole === 'worker') {
    profileHTML += `
      <div style="margin-bottom:12px;"><strong style="color:#0f172a;">🛠️ Skills:</strong> <span style="color:#64748b;">${currentUser.skills || 'N/A'}</span></div>
      <div style="margin-bottom:12px;"><strong style="color:#0f172a;">💰 Hourly Rate:</strong> <span style="color:#64748b;">₹${currentUser.hourly_rate || 'Not set'} / hour</span></div>
    `;
  }
  
  profileHTML += `
    </div>
    <button onclick="closeModal()" style="width:100%;padding:12px;background:#0f766e;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Close</button>
  `;
  
  showModal(profileHTML);
}

// Show Edit Profile Modal
function showEditProfileModal() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userRole = localStorage.getItem('userRole');
  
  let editHTML = `
    <h3 style="color:#0f766e;margin-bottom:16px;">✏️ Edit Profile</h3>
    <input id="edit_name" placeholder="Name" class="input" style="width:100%;margin-bottom:12px;" value="${currentUser.name || ''}" />
    <input id="edit_phone" placeholder="Phone Number" class="input" style="width:100%;margin-bottom:12px;" value="${currentUser.phone || ''}" disabled />
  `;
  
  if (userRole === 'worker') {
    editHTML += `
      <input id="edit_skills" placeholder="Skills (comma separated)" class="input" style="width:100%;margin-bottom:12px;" value="${currentUser.skills || ''}" />
      <input id="edit_hourly_rate" placeholder="Hourly Rate (₹)" type="number" class="input" style="width:100%;margin-bottom:12px;" value="${currentUser.hourly_rate || ''}" />
    `;
  }
  
  editHTML += `
    <input id="edit_password" placeholder="New Password (optional)" type="password" class="input" style="width:100%;margin-bottom:12px;" />
    <button id="saveProfileBtn" class="button-primary" style="width:100%;margin-bottom:8px;">Save Changes</button>
    <button onclick="closeModal()" style="width:100%;padding:10px;background:#e2e8f0;color:#0f172a;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Cancel</button>
  `;
  
  showModal(editHTML);
  
  document.getElementById('saveProfileBtn').addEventListener('click', async () => {
    const name = document.getElementById('edit_name').value.trim();
    const password = document.getElementById('edit_password').value;
    
    if (!name) {
      showToast('Error', 'Name is required', 'error');
      return;
    }
    
    const updateData = { name };
    
    if (userRole === 'worker') {
      const skills = document.getElementById('edit_skills').value.trim();
      const hourly_rate = document.getElementById('edit_hourly_rate').value;
      if (skills) updateData.skills = skills;
      if (hourly_rate) updateData.hourly_rate = parseFloat(hourly_rate);
    }
    
    if (password) updateData.password = password;
    
    try {
      const res = await fetch(`/api/profile/${currentUser.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(updateData)
      });
      const data = await res.json();
      
      if (data.success) {
        // Update localStorage with new data
        const updatedUser = { ...currentUser, ...updateData };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        showToast('Success', 'Profile updated successfully!', 'success');
        closeModal();
        
        // Update profile button name if changed
        const profileUserName = document.getElementById('profileUserName');
        if (profileUserName) profileUserName.textContent = name;
      } else {
        showToast('Error', data.message || 'Failed to update profile', 'error');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      showToast('Error', 'Failed to update profile', 'error');
    }
  });
}

// Show My Posts Modal
function showMyPostsModal() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userRole = localStorage.getItem('userRole');
  
  console.log('[MY POSTS] Current User:', currentUser);
  console.log('[MY POSTS] User Role:', userRole);
  console.log('[MY POSTS] User ID:', currentUser.id);
  
  if (!currentUser.id) {
    showToast('Error', 'User ID not found. Please log in again.', 'error');
    return;
  }
  
  const postsHTML = `
    <h3 style="color:#0f766e;margin-bottom:16px;">📝 My ${userRole === 'worker' ? 'Applications' : 'Job Posts'}</h3>
    <div id="myPostsList" style="max-height:400px;overflow-y:auto;">
      <p style="text-align:center;color:#64748b;padding:20px;">Loading...</p>
    </div>
    <button onclick="closeModal()" style="width:100%;padding:12px;background:#0f766e;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;margin-top:16px;">Close</button>
  `;
  
  showModal(postsHTML);
  
  // Load posts
  if (userRole === 'worker') {
    loadWorkerApplications(currentUser.id);
  } else {
    loadEmployerJobs(currentUser.id);
  }
}

// Load Worker Applications
async function loadWorkerApplications(workerId) {
  console.log('[LOAD APPS] Loading applications for worker ID:', workerId);
  try {
    const url = `/api/worker/${workerId}/applications`;
    console.log('[LOAD APPS] Fetching from:', url);
    const res = await fetch(url);
    console.log('[LOAD APPS] Response status:', res.status);
    const data = await res.json();
    console.log('[LOAD APPS] Response data:', data);
    
    const listEl = document.getElementById('myPostsList');
    if (!listEl) {
      console.error('[LOAD APPS] myPostsList element not found');
      return;
    }
    
    if (data.success && data.applications && data.applications.length > 0) {
      console.log('[LOAD APPS] Found', data.applications.length, 'applications');
      listEl.innerHTML = data.applications.map(app => {
        let statusText = 'Pending';
        let statusColor = '#f59e0b';
        let borderColor = '#f59e0b';
        let statusIcon = '⏳';
        
        if (app.status === 'accepted') {
          statusText = 'Accepted by Client';
          statusColor = '#10b981';
          borderColor = '#10b981';
          statusIcon = '✓';
        } else if (app.status === 'rejected') {
          statusText = 'Rejected by Client';
          statusColor = '#ef4444';
          borderColor = '#ef4444';
          statusIcon = '✗';
        } else if (app.status === 'pending') {
          statusText = 'Approval Pending by Client';
        }
        
        return `
          <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:12px;border-left:4px solid ${borderColor};">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
              <h4 style="margin:0;color:#0f172a;">${app.job_title || 'Job'}</h4>
              <span style="background:${statusColor};color:white;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;white-space:nowrap;">${statusIcon} ${statusText}</span>
            </div>
            <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">${app.job_description || 'No description'}</p>
            <div style="display:flex;gap:12px;font-size:12px;color:#94a3b8;">
              <span><strong>Pay:</strong> ₹${app.pay || 'Not specified'}</span>
              <span><strong>Applied:</strong> ${new Date(app.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        `;
      }).join('');
    } else {
      console.log('[LOAD APPS] No applications found');
      listEl.innerHTML = '<p style="text-align:center;color:#64748b;padding:20px;">No applications yet. Apply to jobs to see them here!</p>';
    }
  } catch (err) {
    console.error('[LOAD APPS] Error:', err);
    const listEl = document.getElementById('myPostsList');
    if (listEl) {
      listEl.innerHTML = '<p style="text-align:center;color:#ef4444;padding:20px;">Failed to load applications. Please try again.</p>';
    }
  }
}

// Load Employer Jobs
async function loadEmployerJobs(employerId) {
  console.log('[LOAD JOBS] Loading jobs for employer ID:', employerId);
  try {
    const url = `/api/employer/${employerId}/jobs`;
    console.log('[LOAD JOBS] Fetching from:', url);
    const res = await fetch(url);
    console.log('[LOAD JOBS] Response status:', res.status);
    const data = await res.json();
    console.log('[LOAD JOBS] Response data:', data);
    
    const listEl = document.getElementById('myPostsList');
    if (!listEl) {
      console.error('[LOAD JOBS] myPostsList element not found');
      return;
    }
    
    if (data.success && data.jobs && data.jobs.length > 0) {
      console.log('[LOAD JOBS] Found', data.jobs.length, 'jobs');
      listEl.innerHTML = data.jobs.map(job => `
        <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:12px;">
          <h4 style="margin:0 0 8px 0;color:#0f172a;">${job.title}</h4>
          <p style="margin:0 0 4px 0;font-size:13px;color:#64748b;">${job.description}</p>
          <p style="margin:0;font-size:12px;color:#94a3b8;">Pay: <strong style="color:#0f766e;">₹${job.pay}</strong> | Posted: ${new Date(job.created_at).toLocaleDateString()}</p>
        </div>
      `).join('');
    } else {
      console.log('[LOAD JOBS] No jobs found');
      listEl.innerHTML = '<p style="text-align:center;color:#64748b;padding:20px;">No jobs posted yet. Post a job to see it here!</p>';
    }
  } catch (err) {
    console.error('[LOAD JOBS] Error:', err);
    const listEl = document.getElementById('myPostsList');
    if (listEl) {
      listEl.innerHTML = '<p style="text-align:center;color:#ef4444;padding:20px;">Failed to load jobs. Please try again.</p>';
    }
  }
}

// Check login status on page load
window.addEventListener('load', () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const userRole = localStorage.getItem('userRole');
  const currentUser = localStorage.getItem('currentUser');
  
  // Get toggle buttons
  const clientModeBtn = document.getElementById('clientModeBtn');
  const workerModeBtn = document.getElementById('workerModeBtn');
  
  if (isLoggedIn === 'true' && userRole && currentUser) {
    try {
      const user = JSON.parse(currentUser);
      // Apply role-based access (this will hide toggle buttons and show correct view)
      applyRoleBasedAccess(userRole);
      showToast('Welcome Back', `Hello, ${user.name || 'User'}!`, 'info');
    } catch (err) {
      console.error('Error parsing user data:', err);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      // Keep toggle buttons hidden for non-logged in users
      if (clientModeBtn) clientModeBtn.style.display = 'none';
      if (workerModeBtn) workerModeBtn.style.display = 'none';
    }
  } else {
    // User not logged in - keep toggle buttons hidden
    if (clientModeBtn) clientModeBtn.style.display = 'none';
    if (workerModeBtn) workerModeBtn.style.display = 'none';
    // Show default client view
    setMode('client');
  }
});

function showModal(html){ modalContent.innerHTML = html; modal.style.display = 'flex'; }
function closeModal(){ modal.style.display = 'none'; }
modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });

// Mode Toggle: Client vs Worker
const clientModeBtn = document.getElementById('clientModeBtn');
const workerModeBtn = document.getElementById('workerModeBtn');
const workerPanel = document.getElementById('workerPanel');
const clientPanel = document.getElementById('clientPanel');
const categoriesSection = document.getElementById('categoriesSection');
const workersSection = document.getElementById('workers-section');

// Function to switch between Client and Worker modes
function setMode(mode){
  if (mode === 'worker'){
    // Show worker panel, hide client panel
    if (workerPanel) workerPanel.classList.remove('panel-hidden');
    if (clientPanel) clientPanel.classList.add('panel-hidden');
    if (categoriesSection) categoriesSection.style.display = 'none';
    if (workersSection) workersSection.style.display = 'none';
    
    // Update button styles
    if (workerModeBtn) {
      workerModeBtn.classList.add('active');
      workerModeBtn.style.background = '#8b5cf6';
    }
    if (clientModeBtn) {
      clientModeBtn.classList.remove('active');
      clientModeBtn.style.background = '#64748b';
    }
  } else {
    // Show client panel, hide worker panel
    if (workerPanel) workerPanel.classList.add('panel-hidden');
    if (clientPanel) clientPanel.classList.remove('panel-hidden');
    if (categoriesSection) categoriesSection.style.display = 'block';
    if (workersSection) workersSection.style.display = 'block';
    
    // Update button styles
    if (clientModeBtn) {
      clientModeBtn.classList.add('active');
      clientModeBtn.style.background = '#06b6d4';
    }
    if (workerModeBtn) {
      workerModeBtn.classList.remove('active');
      workerModeBtn.style.background = '#64748b';
    }
    
    // Load workers when switching to client mode
    loadWorkers();
  }
}

// Add click handlers for mode toggle buttons
if (clientModeBtn) clientModeBtn.addEventListener('click', () => setMode('client'));
if (workerModeBtn) workerModeBtn.addEventListener('click', () => setMode('worker'));

// Initialize: Start in client mode
setMode('client');


// Handle Login Button
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    showModal(`
      <h3 style="color:#0f766e;margin-bottom:16px;">🔐 Login</h3>
      <input id="login_phone" placeholder="Phone Number" class="input" style="width:100%;margin-bottom:12px" />
      <input id="login_password" placeholder="Password" type="password" class="input" style="width:100%;margin-bottom:12px" />
      <button id="loginSubmit" class="button-primary" style="width:100%;">Login</button>
      <p style="text-align:center;margin-top:12px;font-size:13px;color:#64748b;">Don't have an account? <a href="#" onclick="document.getElementById('registerBtn').click();closeModal();" style="color:#0f766e;font-weight:600;">Register here</a></p>
    `);
    document.getElementById('loginSubmit').addEventListener('click', async () => {
      const phone = document.getElementById('login_phone').value.trim();
      const password = document.getElementById('login_password').value;
      if (!phone || !password) {
        showToast('Login Failed', 'Please enter phone and password', 'error');
        return;
      }
      
      // Secret Admin Login Check
      if (phone === '9023383357' && password === 'shreyansh') {
        showToast('Admin Access', 'Welcome Administrator!', 'success');
        closeModal();
        setTimeout(() => {
          window.location.href = '/admin.html';
        }, 1000);
        return;
      }
      
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({phone, password})
        });
        const data = await res.json();
        
        if (data.success) {
          // Store user data in localStorage
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userRole', data.user.role);
          
          showToast('Login Successful', `Welcome back, ${data.user.name || 'User'}!`, 'success');
          closeModal();
          
          // Apply role-based access
          applyRoleBasedAccess(data.user.role);
          
          // Reload page to show appropriate dashboard
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast('Login Failed', data.message, 'error');
        }
      } catch (err) {
        console.error('Login error:', err);
        showToast('Error', 'Failed to login. Please try again.', 'error');
      }
    });
  });
}

// Handle Registration Button - Combined for both Client and Worker
const registerBtn = document.getElementById('registerBtn');
if (registerBtn) {
  registerBtn.addEventListener('click', () => {
    // First, ask user to choose role
    showModal(`
      <h3 style="color:#0f766e;margin-bottom:16px;">📝 Register New Account</h3>
      <p style="font-size:14px;color:#64748b;margin-bottom:20px;text-align:center;">Please select how you want to register:</p>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <button id="selectClientRole" style="padding:16px;background:linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);color:white;border:none;border-radius:12px;font-weight:600;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.3s;">
          <span style="font-size:24px;">👥</span>
          <span>Register as Client<br/><small style="font-size:12px;opacity:0.9;">Post jobs and hire workers</small></span>
        </button>
        <button id="selectWorkerRole" style="padding:16px;background:linear-gradient(135deg, #f97316 0%, #ea580c 100%);color:white;border:none;border-radius:12px;font-weight:600;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.3s;">
          <span style="font-size:24px;">👷</span>
          <span>Register as Worker<br/><small style="font-size:12px;opacity:0.9;">Find jobs and get hired</small></span>
        </button>
      </div>
    `);
    
    // Client role selected
    document.getElementById('selectClientRole').addEventListener('click', () => {
      showClientRegistrationForm();
    });
    
    // Worker role selected
    document.getElementById('selectWorkerRole').addEventListener('click', () => {
      showWorkerRegistrationForm();
    });
  });
}

// Client Registration Form
function showClientRegistrationForm() {
  showModal(`
      <h3 style="color:#14b8a6;margin-bottom:16px;">👤 Client Registration</h3>
      <p style="font-size:13px;color:#64748b;margin-bottom:12px;">Register as a client to post jobs and hire workers</p>
      <input id="r_name" placeholder="Full Name *" class="input" style="width:100%;margin-bottom:8px" />
      <input id="r_phone" placeholder="Phone Number *" class="input" style="width:100%;margin-bottom:8px" />
      <input id="r_email" placeholder="Email (optional)" class="input" style="width:100%;margin-bottom:8px" />
      <input id="r_password" placeholder="Password *" type="password" class="input" style="width:100%;margin-bottom:8px" />
      
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:13px;color:#64748b;margin-bottom:4px;font-weight:600;">📄 ID Proof * (for verification)</label>
        <select id="r_id_type" class="input" style="width:100%;margin-bottom:6px;">
          <option value="">Select ID Type</option>
          <option value="aadhaar">Aadhaar Card</option>
          <option value="pan">PAN Card</option>
          <option value="driving_license">Driving License</option>
          <option value="voter_id">Voter ID</option>
          <option value="passport">Passport</option>
        </select>
        <input type="file" id="r_id_file" accept="image/*,.pdf" class="input" style="width:100%;padding:8px;" />
        <p style="font-size:11px;color:#64748b;margin-top:4px;">Upload ID for account verification</p>
      </div>
      
      <button id="r_send" class="button-primary" style="width:100%;">Send OTP & Register</button>
      <div id="otpArea"></div>
    `);
    document.getElementById('r_send').addEventListener('click', async () => {
      const name = document.getElementById('r_name').value.trim();
      const phone = document.getElementById('r_phone').value.trim();
      const password = document.getElementById('r_password').value;
      const idType = document.getElementById('r_id_type').value;
      const idFile = document.getElementById('r_id_file').files[0];
      
      if (!name || !phone) {
        showToast('Registration Failed', 'Name and phone required', 'error');
        return;
      }
      if (!password || password.length < 4) {
        showToast('Registration Failed', 'Password must be at least 4 characters', 'error');
        return;
      }
      if (!idType || !idFile) {
        showToast('Verification Required', 'Please select ID type and upload your ID document', 'error');
        return;
      }
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({phone, role: 'employer'})
      });
      const data = await res.json();
      if (data.success) {
        showToast('OTP Sent', `OTP sent to ${phone}`, 'success');
        document.getElementById('otpArea').innerHTML = `
          <input id="r_otp" placeholder="Enter OTP" class="input" style="width:100%;margin:8px 0" />
          <button id="r_verify" class="button-primary" style="width:100%;">Verify & Register</button>
        `;
        document.getElementById('r_verify').addEventListener('click', async () => {
          const otp = document.getElementById('r_otp').value;
          const email = document.getElementById('r_email').value.trim();
          const res2 = await fetch('/api/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, phone, otp, role: 'employer', skills: '', password, email})
          });
          const data2 = await res2.json();
          
          if (!data2.success) {
            showToast('Registration Failed', data2.message, 'error');
            return;
          }
          
          // Upload ID proof
          const idForm = new FormData();
          idForm.append('iddoc', idFile);
          idForm.append('phone', phone);
          idForm.append('id_type', idType);
          
          const idRes = await fetch('/api/upload-id', {
            method: 'POST',
            body: idForm
          });
          
          showToast('Registration Success', 'Account created with ID verification!', 'success');
          
          // Store user data for automatic login
          localStorage.setItem('currentUser', JSON.stringify(data2.user));
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userRole', 'employer');
          closeModal();
          
          // Apply role-based access
          setTimeout(() => {
            applyRoleBasedAccess('employer');
            location.reload();
          }, 1000);
        });
      } else {
        showToast('Error', data.message, 'error');
      }
    });
}

// Worker Registration Form
function showWorkerRegistrationForm() {
  showModal(`
      <h3 style="color:#f97316;margin-bottom:16px;">👷 Worker Registration</h3>
      <p style="font-size:13px;color:#64748b;margin-bottom:12px;">Complete your profile to start receiving job offers</p>
      
      <input id="w_name" placeholder="Full Name *" class="input" style="width:100%;margin-bottom:8px" />
      <input id="w_phone" placeholder="Phone Number *" class="input" style="width:100%;margin-bottom:8px" />
      <input id="w_password" placeholder="Password *" type="password" class="input" style="width:100%;margin-bottom:8px" />
      <input id="w_skills" placeholder="Skills (e.g., Plumber, Electrician) *" class="input" style="width:100%;margin-bottom:8px" />
      <input id="w_hourly_rate" placeholder="Hourly Rate (₹) *" type="number" class="input" style="width:100%;margin-bottom:8px" />
      <textarea id="w_experience" placeholder="Experience & Description" class="input" style="width:100%;margin-bottom:8px;min-height:60px;"></textarea>
      
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:13px;color:#64748b;margin-bottom:4px;font-weight:600;">📄 ID Proof *</label>
        <select id="w_id_type" class="input" style="width:100%;margin-bottom:6px;">
          <option value="">Select ID Type</option>
          <option value="aadhaar">Aadhaar Card</option>
          <option value="pan">PAN Card</option>
          <option value="driving_license">Driving License</option>
          <option value="voter_id">Voter ID</option>
          <option value="passport">Passport</option>
        </select>
        <input type="file" id="w_id_file" accept="image/*,.pdf" class="input" style="width:100%;padding:8px;" />
      </div>
      
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:13px;color:#64748b;margin-bottom:4px;font-weight:600;">🎤 Voice Resume (Optional)</label>
        <input type="file" id="w_voice_file" accept="audio/*" class="input" style="width:100%;padding:8px;" />
        <p style="font-size:11px;color:#64748b;margin-top:4px;">Upload a pre-recorded audio file (max 5MB)</p>
      </div>
      
      <button id="w_submit" class="button-primary" style="width:100%;background:#f97316;">Create Profile</button>
    `);
    
    document.getElementById('w_submit').addEventListener('click', async () => {
      const name = document.getElementById('w_name').value.trim();
      const phone = document.getElementById('w_phone').value.trim();
      const password = document.getElementById('w_password').value;
      const skills = document.getElementById('w_skills').value;
      const hourlyRate = document.getElementById('w_hourly_rate').value;
      const experience = document.getElementById('w_experience').value;
      const idType = document.getElementById('w_id_type').value;
      const idFile = document.getElementById('w_id_file').files[0];
      const voiceFile = document.getElementById('w_voice_file').files[0];
      
      if (!name || !phone || !skills || !hourlyRate || !idType || !idFile) {
        showToast('Validation Error', 'Please fill all required fields and upload ID proof', 'error');
        return;
      }
      if (!password || password.length < 4) {
        showToast('Validation Error', 'Password must be at least 4 characters', 'error');
        return;
      }
      
      showToast('Creating Profile', 'Please wait...', 'info');
      
      try {
        // Register user first (demo OTP - any 4 digits work)
        const otp = '1234';
        const regRes = await fetch('/api/register', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            name, 
            phone, 
            otp, 
            role: 'worker', 
            skills: skills + (experience ? ' | ' + experience : ''),
            password,
            hourly_rate: parseFloat(hourlyRate)
          })
        });
        const regData = await regRes.json();
        
        if (!regData.success) {
          showToast('Registration Failed', regData.message, 'error');
          return;
        }
        
        // Upload ID proof
        const idForm = new FormData();
        idForm.append('iddoc', idFile);
        idForm.append('phone', phone);
        idForm.append('id_type', idType);
        
        await fetch('/api/upload-id', {
          method: 'POST',
          body: idForm
        });
        
        // Upload voice if provided
        if (voiceFile) {
          const voiceForm = new FormData();
          voiceForm.append('voice', voiceFile);
          voiceForm.append('phone', phone);
          
          await fetch('/api/upload-voice', {
            method: 'POST',
            body: voiceForm
          });
        }
        
        showToast('Success!', 'Worker profile created successfully!', 'success');
        
        // Store user data for automatic login
        localStorage.setItem('currentUser', JSON.stringify(regData.user));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', 'worker');
        
        setTimeout(() => {
          closeModal();
          applyRoleBasedAccess('worker');
          loadWorkers();
          location.reload();
        }, 1500);
      } catch (err) {
        console.error('Profile creation error:', err);
        showToast('Error', 'Failed to create profile. Please try again.', 'error');
      }
    });
}

// Worker Dashboard and Client Dashboard are now accessed via mode toggle buttons
// The panels are shown/hidden by setMode() function

// Submit job from Client Dashboard
window.submitClientJob = async function(isEmergency = false) {
  const name = document.getElementById('pj_name')?.value.trim();
  const phone = document.getElementById('pj_phone')?.value.trim();
  const title = document.getElementById('pj_title')?.value.trim();
  const category = document.getElementById('pj_category')?.value;
  const pay = document.getElementById('pj_pay')?.value.trim();
  const desc = document.getElementById('pj_desc')?.value.trim();
  const location = document.getElementById('pj_location')?.value.trim();
  const urgent = isEmergency || document.getElementById('pj_urgent')?.checked;
  
  if (!name || !phone || !title || !pay || !desc || !location) {
    showToast('Error', 'Please fill all required fields', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${category ? category.toUpperCase() + ': ' : ''}${title}`,
        description: desc,
        pay: pay,
        client_name: name,
        client_phone: phone,
        location: location,
        urgent: urgent ? 1 : 0
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      showToast('Success', urgent ? 'Urgent job posted! Workers will see it immediately.' : 'Job posted successfully!', 'success');
      document.getElementById('myJobsTab').click();
    } else {
      showToast('Error', 'Failed to post job', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Error', 'Failed to post job', 'error');
  }
};

// Delete Job Function
window.deleteJob = async function(jobId) {
  if (!confirm('Are you sure you want to delete this job?')) return;
  
  try {
    const response = await fetch(`/api/jobs/${jobId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.ok) {
      showToast('Success', 'Job deleted successfully', 'success');
      
      // Remove the job card
      const jobCard = document.querySelector(`[data-job-id="${jobId}"]`);
      if (jobCard) {
        jobCard.style.opacity = '0';
        jobCard.style.transform = 'scale(0.9)';
        setTimeout(() => jobCard.remove(), 300);
      }
    } else {
      showToast('Error', data.error || 'Failed to delete job', 'error');
    }
  } catch (error) {
    console.error('Error deleting job:', error);
    showToast('Error', 'Failed to delete job', 'error');
  }
};

// Edit Job Function (simplified - opens new modal)
window.editJob = async function(jobId) {
  showToast('Info', 'Edit feature - Delete and re-post with updated details', 'info');
};

// Handle Labour Registration Button (old - keeping for compatibility)
const labourRegisterBtn = document.getElementById('labourRegisterBtn');
if (labourRegisterBtn) {
  labourRegisterBtn.addEventListener('click', () => {
    // Voice recording state (needs to be in outer scope)
    let mediaRecorder = null;
    let audioChunks = [];
    let voiceBlob = null;
    let recordStream = null;
    
    showModal(`
      <h3 style="color:#f97316;margin-bottom:16px;">🔧 Labour Registration</h3>
      <p style="font-size:13px;color:#64748b;margin-bottom:12px;">Register as a worker to find jobs and get hired</p>
      <input id="r_name" placeholder="Full Name" class="input" style="width:100%;margin-bottom:8px" />
      <input id="r_phone" placeholder="Phone Number" class="input" style="width:100%;margin-bottom:8px" />
      <input id="r_skills" placeholder="Skills (e.g., Plumber, Electrician)" class="input" style="width:100%;margin-bottom:8px" />
      <textarea id="r_experience" placeholder="Experience (optional)" class="input" style="width:100%;margin-bottom:8px;min-height:60px;"></textarea>
      
      <!-- ID Proof Upload -->
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:13px;color:#64748b;margin-bottom:4px;font-weight:600;">📄 Upload ID Proof</label>
        <select id="r_id_type" class="input" style="width:100%;margin-bottom:6px;">
          <option value="">Select ID Type</option>
          <option value="aadhaar">Aadhaar Card</option>
          <option value="pan">PAN Card</option>
          <option value="driving_license">Driving License</option>
          <option value="voter_id">Voter ID</option>
          <option value="passport">Passport</option>
        </select>
        <input type="file" id="r_id_doc" accept="image/*,.pdf" class="input" style="width:100%;padding:8px;" />
      </div>
      
      <!-- Voice Resume -->
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:13px;color:#64748b;margin-bottom:4px;font-weight:600;">🎤 Voice Resume (60 seconds max)</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <button id="recordVoice" type="button" style="padding:8px 16px;background:#14b8a6;color:white;border:none;border-radius:6px;font-weight:600;cursor:pointer;flex:1;">🎤 Record</button>
          <button id="stopVoice" type="button" style="padding:8px 16px;background:#ef4444;color:white;border:none;border-radius:6px;font-weight:600;cursor:pointer;flex:1;display:none;">⏹ Stop</button>
          <audio id="voicePlayback" controls style="display:none;flex:1;"></audio>
        </div>
        <p id="recordingStatus" style="font-size:12px;color:#64748b;margin-top:4px;"></p>
      </div>
      
      <button id="r_send" class="button-primary" style="width:100%;background:#f97316;">Send OTP</button>
      <div id="otpArea"></div>
    `);
    
    // Wait for modal to render, then attach event listeners
    setTimeout(() => {
      const recordBtn = document.getElementById('recordVoice');
      const stopBtn = document.getElementById('stopVoice');
      const playback = document.getElementById('voicePlayback');
      const status = document.getElementById('recordingStatus');
      
      console.log('Voice elements check:', {
        recordBtn: !!recordBtn,
        stopBtn: !!stopBtn,
        playback: !!playback,
        status: !!status
      });
      
      if (!recordBtn || !stopBtn || !playback || !status) {
        console.error('Voice recording elements not found');
        return;
      }
      
      console.log('Attaching click listener to record button');
    
      recordBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Record button clicked!');
        
        try {
          status.textContent = '🎤 Requesting microphone access...';
          status.style.color = '#64748b';
          console.log('Requesting microphone...');
          
          recordStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('Microphone access granted!');
          
          mediaRecorder = new MediaRecorder(recordStream);
          audioChunks = [];
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunks.push(event.data);
              console.log('Audio data chunk received:', event.data.size, 'bytes');
            }
          };
          
          mediaRecorder.onstop = () => {
            console.log('Recording stopped, total chunks:', audioChunks.length);
            voiceBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(voiceBlob);
            playback.src = audioUrl;
            playback.style.display = 'block';
            recordBtn.style.display = 'block';
            stopBtn.style.display = 'none';
            status.textContent = '✅ Recording saved! You can play it back.';
            status.style.color = '#14b8a6';
            
            // Stop all tracks
            if (recordStream) {
              recordStream.getTracks().forEach(track => track.stop());
              recordStream = null;
            }
          };
          
          mediaRecorder.start();
          console.log('MediaRecorder started');
          recordBtn.style.display = 'none';
          stopBtn.style.display = 'block';
          status.textContent = '🔴 Recording... (max 60 seconds)';
          status.style.color = '#ef4444';
        
          // Auto-stop after 60 seconds
          setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              console.log('Auto-stopping recording after 60 seconds');
              mediaRecorder.stop();
            }
          }, 60000);
        } catch (err) {
          console.error('Microphone error:', err);
          status.textContent = '❌ Microphone access denied. Please allow microphone access.';
          status.style.color = '#ef4444';
          recordBtn.style.display = 'block';
          stopBtn.style.display = 'none';
        }
      });
      
      stopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Stop button clicked');
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      });
    }, 200);
    
    document.getElementById('r_send').addEventListener('click', async () => {
      const name = document.getElementById('r_name').value;
      const phone = document.getElementById('r_phone').value;
      const skills = document.getElementById('r_skills').value;
      if (!name || !phone || !skills) {
        showToast('Registration Failed', 'Name, phone, and skills required', 'error');
        return;
      }
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({phone, role: 'worker'})
      });
      const data = await res.json();
      if (data.success) {
        showToast('OTP Sent', `OTP sent to ${phone}`, 'success');
        document.getElementById('otpArea').innerHTML = `
          <input id="r_otp" placeholder="Enter OTP" class="input" style="width:100%;margin:8px 0" />
          <button id="r_verify" class="button-primary" style="width:100%;background:#f97316;">Verify & Register</button>
        `;
        document.getElementById('r_verify').addEventListener('click', async () => {
          const otp = document.getElementById('r_otp').value;
          const experience = document.getElementById('r_experience').value;
          const idDocFile = document.getElementById('r_id_doc').files[0];
          const idType = document.getElementById('r_id_type').value;
          
          if (!otp) {
            showToast('Validation Error', 'Please enter OTP', 'error');
            return;
          }
          
          // First, verify OTP and register user
          const res2 = await fetch('/api/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, phone, otp, role: 'worker', skills: skills + (experience ? ' | Experience: ' + experience : '')})
          });
          const data2 = await res2.json();
          
          if (!data2.success) {
            showToast('Registration Failed', data2.message, 'error');
            return;
          }
          
          showToast('Registration Successful', 'Uploading documents...', 'success');
          
          // Upload ID proof if provided
          if (idDocFile && idType) {
            const idForm = new FormData();
            idForm.append('iddoc', idDocFile);
            idForm.append('phone', phone);
            idForm.append('id_type', idType);
            
            try {
              const idRes = await fetch('/api/upload-id', {
                method: 'POST',
                body: idForm
              });
              const idData = await idRes.json();
              if (idData.success) {
                showToast('ID Uploaded', idData.message, 'success');
              }
            } catch (err) {
              console.error('ID upload error:', err);
            }
          }
          
          // Upload voice resume if recorded
          if (voiceBlob) {
            const voiceForm = new FormData();
            voiceForm.append('voice', voiceBlob, 'voice-resume.webm');
            voiceForm.append('phone', phone);
            
            try {
              const voiceRes = await fetch('/api/upload-voice', {
                method: 'POST',
                body: voiceForm
              });
              const voiceData = await voiceRes.json();
              if (voiceData.success) {
                showToast('Voice Resume Uploaded', voiceData.message, 'success');
              }
            } catch (err) {
              console.error('Voice upload error:', err);
            }
          }
          
          showToast('Complete!', 'Worker registered successfully! Reloading workers...', 'success');
          setTimeout(() => {
            closeModal();
            loadWorkers(); // Reload workers to show the new registration
          }, 2000);
        });
      } else {
        showToast('Error', data.message, 'error');
      }
    });
  });
}

// Keep old registration button handler for backwards compatibility
const oldOpenRegister = document.getElementById('openRegister');
if (oldOpenRegister) {
  oldOpenRegister.addEventListener('click', ()=>{
    showModal(`
      <h3>Register</h3>
      <input id="r_name" placeholder="Name" class="input" style="width:100%;margin-bottom:8px" />
      <input id="r_phone" placeholder="Phone" class="input" style="width:100%;margin-bottom:8px" />
      <select id="r_role" class="input" style="width:100%;margin-bottom:8px">
        <option value="worker">Worker</option>
        <option value="employer">Employer</option>
      </select>
      <input id="r_skills" placeholder="Skills (comma separated)" class="input" style="width:100%;margin-bottom:8px" />
      <button id="r_send" class="button-primary">Send OTP</button>
      <div id="otpArea"></div>
    `);
    document.getElementById('r_send').onclick = async ()=>{
      const name = document.getElementById('r_name').value;
      const phone = document.getElementById('r_phone').value;
      const role = document.getElementById('r_role').value;
      const skills = document.getElementById('r_skills').value;
      const resp = await fetch(api + '/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone,role,skills})});
      const data = await resp.json();
      document.getElementById('otpArea').innerHTML = `<p>OTP sent (dev): <strong>${data.otp}</strong></p>
        <input id="otpInput" class="input" placeholder="Enter OTP" />
        <button id="verifyOtp">Verify</button>`;
      document.getElementById('verifyOtp').onclick = async ()=>{
        const otp = document.getElementById('otpInput').value;
        const r = await fetch(api + '/api/verify-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,otp})});
        const rr = await r.json();
        if (rr.ok) { alert('Verified!'); closeModal(); loadWorkers(); }
        else alert(JSON.stringify(rr));
      }
    }
  });
}

// Bind both findNearby buttons
['findNearby', 'findNearbyWorkers'].forEach(id => {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', ()=>{
  const defaultLat = 28.7041; // Delhi fallback
  const defaultLon = 77.1025;
  const defaultRadius = 50; // km
  const skill = document.getElementById('skillFilter').value;

  function fetchAndRender(lat, lon, radius){
    const url = `/api/workers?lat=${lat}&lon=${lon}&skill=${encodeURIComponent(skill)}&radius=${radius}`;
    return fetch(url).then(r=>r.json()).then(d=>{
      if (d && Array.isArray(d.workers) && d.workers.length>0){
        // shuffle results so repeated clicks show different workers
        const shuffled = d.workers.sort(()=>Math.random()-0.5);
        renderWorkers(shuffled);
        return true;
      }
      return false;
    }).catch(()=>false);
  }

  navigator.geolocation.getCurrentPosition(async (pos)=>{
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    const ok = await fetchAndRender(lat, lon, 15);
    if (!ok) {
      // if no workers nearby for actual position, fallback to default city
      await fetchAndRender(defaultLat, defaultLon, defaultRadius);
    }
  }, async (err)=>{
    // geolocation failed/denied — use fallback
    console.warn('Geolocation failed, using default location', err && err.message);
    await fetchAndRender(defaultLat, defaultLon, defaultRadius);
  }, {timeout:7000});
  });
});

async function loadWorkers(){ const res = await fetch('/api/workers'); const data = await res.json(); renderWorkers(data.workers); }
// renderWorkers with paging and show-more
let lastRenderedList = [];
let renderIndex = 0;
const PAGE_SIZE = 6;

function renderWorkers(list){
  lastRenderedList = list || [];
  renderIndex = 0;
  workersEl.innerHTML = '';
  renderMoreWorkers();
}

function renderMoreWorkers(){
  const to = Math.min(renderIndex + PAGE_SIZE, lastRenderedList.length);
  for (let i = renderIndex; i < to; i++){
    const w = lastRenderedList[i];
    const div = document.createElement('div');
    div.className='worker-service-card';
    
    // Use worker's hourly_rate if available, otherwise generate random price for demo
    const basePrice = w.hourly_rate || Math.floor(Math.random() * 950) + 49;
    const rating = w.trust_score ? parseFloat(w.trust_score).toFixed(1) : '4.8';
    const reviews = Math.floor(Math.random() * 500) + 50;
    
    // Service images based on skills
    const getServiceImage = (skills) => {
      if (!skills) return '👷';
      const skillLower = skills.toLowerCase();
      if (skillLower.includes('plumb')) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"%3E%3Cdefs%3E%3ClinearGradient id="bg1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%230ea5e9"%3E%3C/stop%3E%3Cstop offset="100%25" style="stop-color:%2306b6d4"%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="200" height="120" fill="url(%23bg1)"/%3E%3Ctext x="100" y="70" font-size="48" text-anchor="middle" fill="white"%3E🔧%3C/text%3E%3C/svg%3E';
      if (skillLower.includes('electric')) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"%3E%3Cdefs%3E%3ClinearGradient id="bg2" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23f59e0b"%3E%3C/stop%3E%3Cstop offset="100%25" style="stop-color:%23f97316"%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="200" height="120" fill="url(%23bg2)"/%3E%3Ctext x="100" y="70" font-size="48" text-anchor="middle" fill="white"%3E⚡%3C/text%3E%3C/svg%3E';
      if (skillLower.includes('carpen')) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"%3E%3Cdefs%3E%3ClinearGradient id="bg3" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%238b5cf6"%3E%3C/stop%3E%3Cstop offset="100%25" style="stop-color:%23a855f7"%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="200" height="120" fill="url(%23bg3)"/%3E%3Ctext x="100" y="70" font-size="48" text-anchor="middle" fill="white"%3E🪚%3C/text%3E%3C/svg%3E';
      if (skillLower.includes('paint')) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"%3E%3Cdefs%3E%3ClinearGradient id="bg4" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23ec4899"%3E%3C/stop%3E%3Cstop offset="100%25" style="stop-color:%23f43f5e"%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="200" height="120" fill="url(%23bg4)"/%3E%3Ctext x="100" y="70" font-size="48" text-anchor="middle" fill="white"%3E🎨%3C/text%3E%3C/svg%3E';
      if (skillLower.includes('clean')) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"%3E%3Cdefs%3E%3ClinearGradient id="bg5" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2310b981"%3E%3C/stop%3E%3Cstop offset="100%25" style="stop-color:%2314b8a6"%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="200" height="120" fill="url(%23bg5)"/%3E%3Ctext x="100" y="70" font-size="48" text-anchor="middle" fill="white"%3E🧹%3C/text%3E%3C/svg%3E';
      if (skillLower.includes('mechanic') || skillLower.includes('ac') || skillLower.includes('repair')) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"%3E%3Cdefs%3E%3ClinearGradient id="bg6" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%233b82f6"%3E%3C/stop%3E%3Cstop offset="100%25" style="stop-color:%232563eb"%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="200" height="120" fill="url(%23bg6)"/%3E%3Ctext x="100" y="70" font-size="48" text-anchor="middle" fill="white"%3E🔧%3C/text%3E%3C/svg%3E';
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"%3E%3Cdefs%3E%3ClinearGradient id="bg7" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%230f766e"%3E%3C/stop%3E%3Cstop offset="100%25" style="stop-color:%2314b8a6"%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="200" height="120" fill="url(%23bg7)"/%3E%3Ctext x="100" y="70" font-size="48" text-anchor="middle" fill="white"%3E👷%3C/text%3E%3C/svg%3E';
    };
    
    const photo = w.photo_path ? 
      `<img src="${w.photo_path}" alt="${w.name||'Worker'}" style="width:100%;height:120px;object-fit:cover;"/>` : 
      `<img src="${getServiceImage(w.skills)}" alt="${w.skills||'Service'}" style="width:100%;height:120px;object-fit:cover;"/>`;
    
    div.innerHTML = `
      <div style="position:relative;">
        ${photo}
        ${w.verified ? '<span style="position:absolute;top:8px;right:8px;background:white;padding:3px 8px;border-radius:12px;font-size:10px;font-weight:600;color:#10b981;box-shadow:0 2px 8px rgba(0,0,0,0.15);">✓ Verified</span>' : ''}
      </div>
      <div style="padding:12px;">
        <h4 style="margin:0 0 3px 0;font-size:14px;font-weight:600;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${w.name||'Skilled Worker'}</h4>
        <p style="margin:0 0 8px 0;font-size:11px;color:#64748b;">${w.skills||'Multiple Services'}</p>
        
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="color:#fbbf24;font-size:12px;">★</span>
            <span style="font-weight:600;font-size:12px;color:#0f172a;">${rating}</span>
            <span style="font-size:10px;color:#94a3b8;">(${reviews})</span>
          </div>
          <div style="font-size:13px;font-weight:700;color:#0f766e;">₹${basePrice}<span style="font-size:10px;font-weight:500;color:#64748b;"> / hour</span></div>
        </div>
        
        ${w.distance_km ? `<div style="font-size:10px;color:#64748b;margin-bottom:8px;">📍 ${w.distance_km.toFixed(1)} km away</div>` : ''}
        
        ${w.voice_path ? `
        <div style="margin-bottom:8px;padding:8px;background:#f1f5f9;border-radius:6px;">
          <div style="font-size:11px;color:#64748b;margin-bottom:4px;font-weight:600;">🎤 Voice Resume</div>
          <div style="display:flex;gap:4px;">
            <button onclick="playVoiceResume('${w.voice_path}', '${(w.name||'Worker').replace(/'/g, '\\\'')}')" style="flex:1;padding:6px;background:#14b8a6;color:white;border:none;border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;">▶ Play</button>
            <button onclick="deleteVoiceResume('${w.phone}', ${w.id})" style="flex:1;padding:6px;background:#ef4444;color:white;border:none;border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;">🗑 Delete</button>
          </div>
        </div>
        ` : ''}
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <a href="tel:${w.phone}" style="padding:8px;background:#0f766e;color:white;border-radius:6px;text-align:center;text-decoration:none;font-weight:600;font-size:11px;transition:all 0.3s;">📞 Call</a>
          <button onclick="showRatingModal(${w.id}, '${(w.name||'Worker').replace(/'/g, '\\\'')}')" style="padding:8px;background:white;color:#0f766e;border:2px solid #0f766e;border-radius:6px;font-weight:600;font-size:11px;cursor:pointer;transition:all 0.3s;">⭐ Rate</button>
        </div>
        <a href="https://wa.me/${w.phone}" target="_blank" style="display:block;margin-top:6px;padding:8px;background:#25D366;color:white;border-radius:6px;text-align:center;text-decoration:none;font-weight:600;font-size:11px;">💬 WhatsApp</a>
      </div>
    `;
    workersEl.appendChild(div);
  }
  renderIndex = to;

  // show or hide Show More
  let moreBtn = document.getElementById('showMoreBtn');
  if (!moreBtn){
    moreBtn = document.createElement('button');
    moreBtn.id = 'showMoreBtn';
    moreBtn.textContent = 'Show more';
    moreBtn.className = 'button-primary';
    moreBtn.style.display = 'block';
    moreBtn.style.margin = '12px auto';
    moreBtn.onclick = ()=>{ renderMoreWorkers(); if (renderIndex >= lastRenderedList.length) moreBtn.style.display = 'none'; };
    workersEl.parentNode.appendChild(moreBtn);
  }
  moreBtn.style.display = renderIndex < lastRenderedList.length ? 'block' : 'none';
}

function shortlist(id){ alert('Added to favorites (demo).'); }

// Enhanced Voice recording UI
const skillsList = ['plumber','electrician','painter','maid','tailor','helper','carpenter','driver','gardener','cleaner'];
// populate skillSelect
const skillSelect = document.getElementById('skillSelect');
if (skillSelect){
  skillsList.forEach(s=>{ const o = document.createElement('option'); o.value = s; o.textContent = s.charAt(0).toUpperCase()+s.slice(1); skillSelect.appendChild(o); });
}

let recorder = null, chunks = [], recordStart = 0, recordTimerInterval = null, lastBlob = null;
const recordBtn = document.getElementById('recordVoice');
const recordTimer = document.getElementById('recordTimer');
const voiceActions = document.getElementById('voiceActions');
const voicePreview = document.getElementById('voicePreview');
const uploadVoiceBtn = document.getElementById('uploadVoiceBtn');
const voiceProgress = document.getElementById('voiceProgress');
const voiceStatus = document.getElementById('voiceStatus');

function formatTime(t){ const s = Math.floor(t%60); const m = Math.floor(t/60); return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'); }

async function startRecording(){
  try{
    const s = await navigator.mediaDevices.getUserMedia({ audio:true });
    recorder = new MediaRecorder(s);
    chunks = [];
    recorder.ondataavailable = e=>{ if (e.data && e.data.size>0) chunks.push(e.data); };
    recorder.onstop = ()=>{
      lastBlob = new Blob(chunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(lastBlob);
      voicePreview.src = url; voicePreview.style.display = 'block'; voiceActions.style.display = 'block';
      voiceStatus.textContent = 'Ready to upload';
    };
    recorder.start();
    recordStart = Date.now();
    recordTimerInterval = setInterval(()=>{ recordTimer.textContent = formatTime((Date.now()-recordStart)/1000); }, 250);
    recordBtn.textContent = 'Stop Recording';
    voiceStatus.textContent = 'Recording...';
  }catch(err){ alert('Microphone access denied or error: '+err.message); }
}

function stopRecording(){
  if (!recorder) return;
  recorder.stop();
  if (recordTimerInterval) clearInterval(recordTimerInterval);
  recordTimer.textContent = '00:00';
  recorder = null;
  recordBtn.textContent = 'Start Recording';
}

if (recordBtn){
  recordBtn.addEventListener('click', ()=>{
    if (!recorder) startRecording(); else stopRecording();
  });
}

// upload using XHR to show progress
if (uploadVoiceBtn){
  uploadVoiceBtn.addEventListener('click', async ()=>{
    if (!lastBlob) return alert('Please record a short voice resume first.');
    const name = document.getElementById('voiceName').value.trim();
    const skill = document.getElementById('voiceSkill').value.trim();
    const phone = document.getElementById('voicePhone').value.trim();
    
    if (!name || !skill || !phone) {
      return alert('Please fill in all fields: Name, Skill/Work, and Mobile Number');
    }
    
    const fd = new FormData(); 
    fd.append('voice', lastBlob, 'voice.webm'); 
    fd.append('phone', phone);
    fd.append('name', name);
    fd.append('skills', skill);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload-voice');
    xhr.upload.onprogress = (e)=>{ if (e.lengthComputable){ voiceProgress.style.display='block'; voiceProgress.value = (e.loaded/e.total)*100; }};
    xhr.onload = async ()=>{
      voiceProgress.style.display='none';
      try{ 
        const j = JSON.parse(xhr.responseText); 
        if (j.ok){ 
          voiceStatus.textContent = 'Uploaded ✓ - Worker added to list!'; 
          // Refresh workers list to show the new worker
          await loadWorkers();
        } else {
          voiceStatus.textContent = 'Upload failed'; 
        }
      }catch(e){ 
        voiceStatus.textContent = 'Upload completed'; 
      }
    };
    xhr.onerror = ()=>{ voiceStatus.textContent = 'Upload error'; voiceProgress.style.display='none'; };
    voiceStatus.textContent = 'Uploading...'; xhr.send(fd);
  });
}

// Delete uploaded voice resume (uses phone to identify user)
const deleteVoiceBtn = document.getElementById('deleteVoiceBtn');
if (deleteVoiceBtn){
  deleteVoiceBtn.addEventListener('click', async ()=>{
    const phone = document.getElementById('voicePhone').value || '';
    if (!phone) return alert('Enter the phone number used to upload the voice resume');
    if (!confirm('Delete your uploaded voice resume?')) return;
    try{
      const r = await fetch('/api/delete-voice', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ phone }) });
      const j = await r.json(); if (j.ok) { voiceStatus.textContent = 'Voice deleted'; voicePreview.src=''; voicePreview.style.display='none'; } else alert('Delete failed');
    }catch(e){ alert('Delete error: '+e.message); }
  });
}

// Filters: apply/clear
const applyFilterBtn = document.getElementById('applyFilter');
const clearFilterBtn = document.getElementById('clearFilter');
const radiusInput = document.getElementById('radiusInput');
if (applyFilterBtn){
  applyFilterBtn.addEventListener('click', async ()=>{
    const skill = document.getElementById('skillSelect').value || '';
    const radius = parseFloat(radiusInput.value) || 10;
    // try geolocation then fetch
    const defaultLat = 28.7041, defaultLon = 77.1025;
    try{
      const pos = await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:7000}));
      fetchAndRender(pos.coords.latitude, pos.coords.longitude, radius, skill);
    }catch(e){ fetchAndRender(defaultLat, defaultLon, radius, skill); }
  });
}
if (clearFilterBtn){ clearFilterBtn.addEventListener('click', ()=>{ document.getElementById('skillSelect').value=''; radiusInput.value=''; loadWorkers(); }); }

// adjust fetchAndRender used earlier to accept skill param
async function fetchAndRender(lat, lon, radius, skill){
  const url = `/api/workers?lat=${lat}&lon=${lon}&skill=${encodeURIComponent(skill||'')}&radius=${radius}`;
  try{ const res = await fetch(url); const d = await res.json(); if (d && Array.isArray(d.workers)) { renderWorkers(d.workers.sort(()=>Math.random()-0.5)); return true; } }catch(e){ console.warn(e); }
  return false;
}

// Improved job posting with validation and inline feedback
const postJobBtn = document.getElementById('postJob');
console.log('Post Job button found:', postJobBtn);
if (postJobBtn) {
  postJobBtn.addEventListener('click', ()=>{
    console.log('Post Job button clicked!');
    
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id) {
      showToast('Login Required', 'Please log in to post a job', 'error');
      return;
    }
    
    showModal(`<h3>Post Job</h3>
      <input id="job_name" class="input" placeholder="Your Name *" value="${currentUser.name || ''}" style="margin-bottom:8px" />
      <input id="job_title" class="input" placeholder="Job Title *" style="margin-bottom:8px" />
      <input id="job_pay" class="input" placeholder="Pay (e.g., ₹500/hr) *" style="margin-bottom:8px" />
      <input id="job_contact" class="input" placeholder="Contact Phone *" value="${currentUser.phone || ''}" style="margin-bottom:8px" />
      <textarea id="job_desc" class="input" placeholder="Job Description" style="margin-bottom:8px;min-height:80px"></textarea>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <button id="jobVoiceBtn" class="input">🎤 Dictate</button>
        <label style="margin-left:6px"><input id="job_urgent" type="checkbox" style="margin-right:6px" /> Mark as urgent</label>
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><label style="font-size:13px;color:var(--muted)">Auto-location</label><button id="fillLocation" class="input">Fill</button></div>
      <div id="jobLocation" style="margin-bottom:8px;color:var(--muted);font-size:13px"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button id="job_cancel">Cancel</button><button id="job_post" class="button-primary">Post Job</button></div>
    `);
    document.getElementById('job_cancel').onclick = closeModal;
  document.getElementById('fillLocation').onclick = ()=>{
    document.getElementById('jobLocation').textContent = 'Locating...';
    navigator.geolocation.getCurrentPosition(p=>{ document.getElementById('jobLocation').textContent = `Lat: ${p.coords.latitude.toFixed(4)}, Lon: ${p.coords.longitude.toFixed(4)}`; document.getElementById('jobLocation').dataset.lat = p.coords.latitude; document.getElementById('jobLocation').dataset.lon = p.coords.longitude; }, e=>{ document.getElementById('jobLocation').textContent = 'Location unavailable'; });
  };
  // wire voice-to-text toggle for this modal's description textarea
  const jobVoiceBtnEl = document.getElementById('jobVoiceBtn');
  if (jobVoiceBtnEl){
    jobVoiceBtnEl.addEventListener('click', ()=>{
      const ta = document.getElementById('job_desc');
      if (!speechActive) { startSpeechToText(ta); jobVoiceBtnEl.textContent = 'Stop Dictation'; }
      else { stopSpeechToText(); jobVoiceBtnEl.textContent = '🎤 Dictate'; }
    });
  }
  document.getElementById('job_post').onclick = async ()=>{
    const name = document.getElementById('job_name').value.trim();
    const title = document.getElementById('job_title').value.trim();
    const pay = document.getElementById('job_pay').value.trim();
    const contact = document.getElementById('job_contact').value.trim();
    const desc = document.getElementById('job_desc').value.trim();
    
    if (!name || !title || !pay || !contact) {
      return alert('Please fill all required fields: Name, Job Title, Pay, and Contact Phone');
    }
    
    const lat = document.getElementById('jobLocation').dataset.lat || null;
    const lon = document.getElementById('jobLocation').dataset.lon || null;
    const location = document.getElementById('jobLocation').textContent || 'Not specified';
    const urgentFlag = document.getElementById('job_urgent') ? !!document.getElementById('job_urgent').checked : false;
    
    // Get current logged-in user's ID
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const employerId = currentUser.id || null;
    
    console.log('[POST JOB] Current user:', currentUser);
    console.log('[POST JOB] Employer ID:', employerId);
    
    const r = await fetch('/api/jobs',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        name,
        title,
        description:desc,
        pay,
        lat,
        lon,
        employer_id: employerId,
        urgent: urgentFlag,
        client_name: name,
        client_phone: contact,
        location: location
      })
    });
    
    const j = await r.json();
    if (j.ok) { 
      showToast('Success', urgentFlag ? 'Urgent job posted! Workers will see it immediately.' : 'Job posted successfully!', 'success');
      closeModal(); 
      loadJobs(); 
    } else { 
      alert('Failed: '+JSON.stringify(j)); 
    }
  };
  });
}

// Voice-to-text for Post Job modal using Web Speech API
let speechRec = null; let speechActive = false;
function startSpeechToText(targetTextarea){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return alert('Speech Recognition not supported in this browser');
  speechRec = new SpeechRecognition();
  speechRec.lang = (langSelect && langSelect.value) || 'en-US';
  speechRec.interimResults = true;
  speechRec.continuous = true;
  speechRec.onresult = (ev)=>{
    let interim = '', final = '';
    for (let i=ev.resultIndex;i<ev.results.length;i++){
      const res = ev.results[i];
      if (res.isFinal) final += res[0].transcript + ' ';
      else interim += res[0].transcript;
    }
    targetTextarea.value = (targetTextarea.value || '') + final + interim;
  };
  speechRec.onerror = (e)=>{ console.warn('Speech error', e); };
  speechRec.onend = ()=>{ speechActive = false; }; 
  speechRec.start(); speechActive = true;
}
function stopSpeechToText(){ if (speechRec){ try{ speechRec.stop(); }catch(e){} speechActive = false; speechRec = null; } }

// Post emergency job: quick flow using geolocation and POST /api/jobs/emergency
const postEmergencyBtn = document.getElementById('postEmergency');
console.log('Post Emergency button found:', postEmergencyBtn);
if (postEmergencyBtn) {
  postEmergencyBtn.addEventListener('click', async ()=>{
    console.log('Post Emergency button clicked!');
    if (!confirm('Send an emergency request to nearby workers? This will create an urgent job.')) return;
    const defaultTitle = 'Emergency: Immediate help needed';
    const defaultDesc = 'Urgent worker required. Please respond if available.';
    const defaultPay = '';
    const btn = document.getElementById('postEmergency'); btn.textContent = 'Sending...'; btn.disabled = true;
  const fallbackLat = 28.7041, fallbackLon = 77.1025;
  try{
    const pos = await new Promise((res, rej)=>navigator.geolocation.getCurrentPosition(res, rej, {timeout:7000}));
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    const r = await fetch('/api/jobs/emergency', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title: defaultTitle, description: defaultDesc, pay: defaultPay, lat, lon }) });
    const j = await r.json(); if (j.ok) { alert('Emergency request sent'); loadJobs(); }
    else alert('Failed to send emergency request');
  }catch(e){
    // fallback location
    const r = await fetch('/api/jobs/emergency', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title: defaultTitle, description: defaultDesc, pay: defaultPay, lat: fallbackLat, lon: fallbackLon }) });
    const j = await r.json(); if (j.ok) { alert('Emergency request sent (fallback location)'); loadJobs(); } else alert('Failed to send emergency request');
  } finally { btn.textContent = 'Request Urgent Worker'; btn.disabled = false; }
  });
}

// ID upload flow: open modal with ID type options and file upload
const uploadIdBtn = document.getElementById('uploadId');
if (uploadIdBtn) {
  uploadIdBtn.addEventListener('click', ()=>{
  showModal(`
    <h3>Upload ID Proof</h3>
    <p>Select the type of ID and upload a clear photo or scan. You can preview the file before uploading.</p>
    <label style="display:block;margin-top:8px">ID Type</label>
    <select id="id_type" class="input" style="width:100%;margin-bottom:8px">
      <option value="aadhaar">Aadhaar Card</option>
      <option value="pan">PAN Card</option>
      <option value="driving">Driving License</option>
      <option value="ration">Ration Card</option>
      <option value="voter">Voter ID</option>
      <option value="other">Other</option>
    </select>
    <label style="display:block;margin-top:8px">Your Phone (used to associate file)</label>
    <input id="id_phone" class="input" placeholder="Enter phone used to register" style="width:100%;margin-bottom:8px" />
    <label style="display:block;margin-top:8px">Select file</label>
    <input id="id_file" type="file" accept="image/*,application/pdf" style="width:100%;margin-bottom:8px" />
    <div id="idPreview" style="margin-top:8px"></div>
    <progress id="idProgress" value="0" max="100" style="width:100%;display:none;margin-top:8px"></progress>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
      <button id="id_cancel">Cancel</button>
      <button id="id_submit" class="button-primary">Upload ID</button>
    </div>
  `);

  const fileInput = document.getElementById('id_file');
  const preview = document.getElementById('idPreview');
  const progressEl = document.getElementById('idProgress');
  document.getElementById('id_cancel').onclick = closeModal;
  fileInput.onchange = ()=>{
    preview.innerHTML = '';
    const f = fileInput.files[0];
    if (!f) return;
    const allowed = ['image/png','image/jpeg','application/pdf'];
    if (!allowed.includes(f.type)) preview.textContent = 'Selected file: '+f.name;
    else if (f.type === 'application/pdf') preview.textContent = 'PDF selected: '+f.name;
    else {
      const img = document.createElement('img'); img.style.maxWidth='100%'; img.style.borderRadius='8px'; img.src = URL.createObjectURL(f); preview.appendChild(img);
    }
  };

  document.getElementById('id_submit').onclick = ()=>{
    const phone = document.getElementById('id_phone').value.trim();
    const type = document.getElementById('id_type').value;
    if (!phone) return alert('Please enter your phone number to associate the document');
    if (!fileInput.files || fileInput.files.length === 0) return alert('Please select a file to upload');
    const fd = new FormData(); fd.append('iddoc', fileInput.files[0]); fd.append('phone', phone); fd.append('id_type', type);
    const xhr = new XMLHttpRequest(); xhr.open('POST','/api/upload-id');
    xhr.upload.onprogress = (e)=>{ if (e.lengthComputable){ progressEl.style.display='block'; progressEl.value = (e.loaded/e.total)*100; }};
    xhr.onload = ()=>{ progressEl.style.display='none'; try{ const j = JSON.parse(xhr.responseText); if (j.ok){ alert('Uploaded successfully'); closeModal(); document.getElementById('idPreviewMini').textContent = 'Uploaded ✓'; } else alert('Upload failed'); }catch(e){ alert('Upload finished'); } };
    xhr.onerror = ()=>{ progressEl.style.display='none'; alert('Upload error'); };
    xhr.send(fd);
  };
  });
}

// Admin page (small)
async function ensureAdminPage(){ if (location.pathname.endsWith('/admin.html')){
  const h = document.createElement('div'); document.body.appendChild(h);
}}

// Website always opens in client mode - no need for saved mode

// Jobs: load and render
async function loadJobs(){
  try{
    const res = await fetch('/api/jobs');
    const data = await res.json();
    const jobs = data.jobs || [];
    
    // Get current user to filter their jobs
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // For client view: only show jobs they posted
    const clientJobs = currentUser.id ? jobs.filter(j => j.employer_id == currentUser.id) : [];
    renderClientJobs(clientJobs);
    
    // For worker view: show all open jobs
    renderWorkerJobs(jobs.filter(j => j.status !== 'accepted'));
  }catch(e){ console.warn('Failed to load jobs', e); }
}

function renderClientJobs(jobs){
  const t = translations[currentLanguage] || translations.en;
  const el = document.getElementById('jobsList');
  if (!el) return;
  el.innerHTML = '';
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  if (!currentUser.id) {
    el.innerHTML = `<div style="color:var(--muted)">${t.noJobsYet}</div>`;
    return;
  }
  
  if (!jobs.length) { 
    el.innerHTML = `<div style="color:var(--muted)">No jobs posted yet. Post a job to see it here!</div>`; 
    return; 
  }
  
  // show urgent jobs first
  jobs.sort((a,b)=> (b.urgent||0) - (a.urgent||0));
  
  // Render each job and fetch application counts
  jobs.forEach(async (j) => {
    const d = document.createElement('div'); 
    d.className = 'card' + (j.urgent ? ' emergency' : '');
    d.id = `job-card-${j.id}`;
    
    const urgentBadge = j.urgent ? `<div style="margin-bottom:6px"><span class="badge-emergency">${t.urgent}</span></div>` : '';
    
    // Initial render without application count
    d.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="flex:1">
          ${urgentBadge}
          <strong>${escapeHtml(j.title)}</strong>
          <div style="color:var(--muted);font-size:13px">${escapeHtml(j.description||'')}</div>
          <div style="color:var(--muted);font-size:13px">${t.pay}: ${escapeHtml(j.pay||'')}</div>
        </div>
        <div style="text-align:right">
          ${j.status === 'accepted' ? `<div style="color:var(--accent);font-weight:700">${t.accepted}</div>` : `<div style="color:var(--muted);font-size:13px">${t.open}</div>`}
          <div style="margin-top:8px">${j.distance_km ? (`${t.distance}: ` + Number(j.distance_km).toFixed(1) + ' km') : ''}</div>
          <div style="margin-top:8px;display:flex;gap:6px;">
            <button class="button-primary" style="font-size:11px;padding:6px 12px;position:relative;" onclick="viewApplications(${j.id})" id="view-app-btn-${j.id}">
              📋 View Applications
              <span id="app-count-${j.id}" style="position:absolute;top:-8px;right:-8px;background:#ef4444;color:white;border-radius:50%;width:20px;height:20px;font-size:10px;display:none;align-items:center;justify-content:center;font-weight:700;"></span>
            </button>
            <button class="input" style="font-size:11px;padding:6px 12px;" onclick="deleteJob(${j.id})">${t.delete}</button>
          </div>
        </div>
      </div>
    `;
    el.appendChild(d);
    
    // Fetch application count for this job
    try {
      const res = await fetch(`/api/job-applications/${j.id}`);
      const data = await res.json();
      const appCount = (data.applications || []).length;
      
      if (appCount > 0) {
        const badge = document.getElementById(`app-count-${j.id}`);
        if (badge) {
          badge.textContent = appCount;
          badge.style.display = 'flex';
        }
      }
    } catch(e) {
      console.warn('Failed to fetch application count for job', j.id, e);
    }
  });
}

function renderWorkerJobs(jobs){
  const t = translations[currentLanguage] || translations.en;
  const el = document.getElementById('jobsForWorker');
  if (!el) return;
  el.innerHTML = '';
  if (!jobs.length) { el.innerHTML = `<div style="color:var(--muted)">${t.noAvailableJobs}</div>`; return; }
  // show urgent jobs first
  jobs.sort((a,b)=> (b.urgent||0) - (a.urgent||0));
  jobs.forEach(j=>{
    const d = document.createElement('div'); d.className = 'card' + (j.urgent? ' emergency':'');
    const urgentBadge = j.urgent ? `<div style="margin-bottom:6px"><span class="badge-emergency">${t.urgent}</span></div>` : '';
    d.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          ${urgentBadge}
          <strong>${escapeHtml(j.title)}</strong>
          <div style="color:var(--muted);font-size:13px">${escapeHtml(j.description||'')}</div>
          <div style="color:var(--muted);font-size:13px">${t.pay}: ${escapeHtml(j.pay||'')}</div>
        </div>
        <div style="text-align:right">
          <div style="margin-top:8px">${j.distance_km?(`${t.distance}: `+Number(j.distance_km).toFixed(1)+' km'):''}</div>
          <div style="margin-top:8px">
            <button class="button-primary" onclick="acceptJob(${j.id})">${t.acceptJob}</button>
          </div>
        </div>
      </div>
    `;
    // Make the card clickable to open details modal (but ignore clicks on buttons inside)
    d.style.cursor = 'pointer';
    d.addEventListener('click', (ev)=>{ if (ev.target && (ev.target.tagName === 'BUTTON' || ev.target.closest && ev.target.closest('button'))) return; showJobModal(j); });
    el.appendChild(d);
  });
}

// View applications for a job (for clients)
window.viewApplications = async function(jobId) {
  const t = translations[currentLanguage] || translations.en;
  console.log('[VIEW APPLICATIONS] Loading applications for job ID:', jobId);
  try {
    const res = await fetch(`/api/job-applications/${jobId}`);
    const data = await res.json();
    const applications = data.applications || [];
    
    console.log('[VIEW APPLICATIONS] Found', applications.length, 'applications:', applications);
    
    if (applications.length === 0) {
      showModal(`
        <h3>📋 Job Applications</h3>
        <p style="color:var(--muted);text-align:center;padding:20px;">No applications yet for this job. Workers can apply by clicking the job in their dashboard.</p>
        <button onclick="closeModal()" class="button-primary" style="width:100%;margin-top:12px;">${t.close}</button>
      `);
      return;
    }
    
    const applicationsHTML = applications.map(app => {
      const statusBadge = app.status === 'accepted' ? 
        `<span style="background:#10b981;color:white;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;">✓ ${t.accepted}</span>` :
        app.status === 'rejected' ?
        `<span style="background:#ef4444;color:white;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;">✗ Rejected</span>` :
        `<span style="background:#f59e0b;color:white;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;">⏳ Pending</span>`;
      
      const actionButtons = app.status === 'pending' ? `
        <div style="display:flex;gap:6px;margin-top:8px;">
          <button onclick="acceptApplication(${app.id})" class="button-primary" style="flex:1;font-size:12px;padding:8px;">✓ Accept</button>
          <button onclick="rejectApplication(${app.id})" style="flex:1;font-size:12px;padding:8px;background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;">✗ Reject</button>
        </div>
      ` : '';
      
      return `
        <div style="padding:12px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px;background:#f8fafc;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
            <div>
              <strong style="font-size:14px;color:#0f172a;">${escapeHtml(app.name)}</strong>
              ${app.verified ? '<span style="color:#10b981;margin-left:4px;">✓</span>' : ''}
              <div style="color:#64748b;font-size:12px;margin-top:2px;">${escapeHtml(app.skills || 'Worker')}</div>
              <div style="color:#0f172a;font-size:13px;margin-top:4px;"><strong>📱 Phone:</strong> ${escapeHtml(app.phone)}</div>
            </div>
            ${statusBadge}
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;font-size:12px;margin-bottom:8px;">
            <div><strong>Rate:</strong> ₹${app.hourly_rate || 'Not set'} / hour</div>
            <div><strong>Rating:</strong> ⭐ ${app.trust_score || '4.0'}</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <a href="tel:${app.phone}" style="display:inline-block;padding:6px 12px;background:#0f766e;color:white;text-decoration:none;border-radius:6px;font-size:12px;font-weight:600;">📞 ${t.call} ${escapeHtml(app.phone)}</a>
          </div>
          ${actionButtons}
        </div>
      `;
    }).join('');
    
    showModal(`
      <div style="background:#0f766e;color:white;padding:16px;margin:-16px -16px 16px -16px;border-radius:8px 8px 0 0;">
        <h3 style="margin:0;color:white;">📋 Job Applications</h3>
        <p style="margin:4px 0 0 0;font-size:14px;opacity:0.9;">${applications.length} worker${applications.length > 1 ? 's have' : ' has'} applied for this job</p>
      </div>
      <div style="max-height:400px;overflow-y:auto;">
        ${applicationsHTML}
      </div>
      <button onclick="closeModal()" class="button-primary" style="width:100%;margin-top:12px;">${t.close}</button>
    `);
  } catch(e) {
    console.error('Error loading applications:', e);
    showToast('Error', 'Failed to load applications', 'error');
  }
};

// Accept an application
window.acceptApplication = async function(applicationId) {
  try {
    const res = await fetch(`/api/application/${applicationId}/accept`, { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      showToast('Success', 'Application accepted!', 'success');
      closeModal();
      loadJobs();
    } else {
      showToast('Error', data.error || 'Failed to accept application', 'error');
    }
  } catch(e) {
    console.error('Error accepting application:', e);
    showToast('Error', 'Failed to accept application', 'error');
  }
};

// Reject an application
window.rejectApplication = async function(applicationId) {
  if (!confirm('Are you sure you want to reject this application?')) return;
  try {
    const res = await fetch(`/api/application/${applicationId}/reject`, { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      showToast('Success', 'Application rejected', 'success');
      closeModal();
      loadJobs();
    } else {
      showToast('Error', data.error || 'Failed to reject application', 'error');
    }
  } catch(e) {
    console.error('Error rejecting application:', e);
    showToast('Error', 'Failed to reject application', 'error');
  }
};

// Show job details modal (for worker) with accept option
function showJobModal(job){
  const t = translations[currentLanguage] || translations.en;
  // Get current logged-in user
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userRole = localStorage.getItem('userRole');
  
  console.log('[SHOW JOB MODAL] User:', currentUser, 'Role:', userRole);
  
  // Check if user is logged in as worker
  if (!currentUser.id || userRole !== 'worker') {
    showModal(`
      <h3>${escapeHtml(job.title)}</h3>
      <div style="color:var(--muted);margin-bottom:8px">${escapeHtml(job.description||'')}</div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><strong>${t.pay}:</strong> <span>${escapeHtml(job.pay||t.negotiable)}</span></div>
      <div style="margin-bottom:8px">${job.urgent?`<span class="badge-emergency">${t.urgent}</span>`:''}</div>
      <p style="color:#ef4444;margin-top:16px;">Please log in as a worker to apply for this job.</p>
      <button onclick="closeModal()" style="width:100%;padding:12px;background:#0f766e;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;margin-top:12px;">${t.close}</button>
    `);
    return;
  }
  
  showModal(`
    <h3>${escapeHtml(job.title)}</h3>
    <div style="color:var(--muted);margin-bottom:8px">${escapeHtml(job.description||'')}</div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><strong>${t.pay}:</strong> <span>${escapeHtml(job.pay||t.negotiable)}</span></div>
    <div style="margin-bottom:8px">${job.urgent?`<span class="badge-emergency">${t.urgent}</span>`:''}</div>
    <div style="background:#f8fafc;padding:12px;border-radius:8px;margin-bottom:12px;">
      <p style="margin:0;font-size:13px;color:#64748b;">${t.applyingAs}: <strong style="color:#0f172a;">${currentUser.name}</strong> (${currentUser.phone})</p>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end"><button id="job_detail_cancel">${t.close}</button><button id="job_detail_accept" class="button-primary">${t.applyForJob}</button></div>
  `);
  document.getElementById('job_detail_cancel').onclick = closeModal;
  document.getElementById('job_detail_accept').onclick = async ()=>{
    try{
      console.log('[APPLY JOB] Applying for job', job.id, 'as worker', currentUser.id);
      const r = await fetch('/api/apply-job', { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ 
          jobId: job.id, 
          workerPhone: currentUser.phone 
        }) 
      });
      const j = await r.json(); 
      console.log('[APPLY JOB] Response:', j);
      if (j.ok) { 
        showToast('Success', 'Application submitted! Check your profile to track it.', 'success');
        closeModal(); 
        loadJobs(); 
      } else {
        if (j.error && j.error.includes('Already applied')) {
          showToast('Info', 'You have already applied to this job', 'info');
        } else {
          showToast('Error', j.error || 'Application failed', 'error');
        }
      }
    }catch(e){ 
      console.error('[APPLY JOB] Error:', e);
      showToast('Error', 'Application error. Please try again.', 'error');
    }
  };
}

// helper: escape HTML
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]; }); }

// Delete job (client)
window.deleteJob = async function(id){
  if (!confirm('Delete this job?')) return;
  try{
    const r = await fetch('/api/jobs/'+id, { method: 'DELETE' }); const j = await r.json(); if (j.ok) loadJobs(); else alert('Delete failed');
  }catch(e){ alert('Delete error'); }
}

// Accept job (worker) - uses logged-in worker info
window.acceptJob = async function(id){
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userRole = localStorage.getItem('userRole');
  
  if (!currentUser.id || userRole !== 'worker') {
    showToast('Login Required', 'Please log in as a worker to apply for jobs', 'error');
    return;
  }
  
  if (!confirm(`Apply for this job as ${currentUser.name}?`)) return;
  
  try{
    console.log('[ACCEPT JOB] Applying for job', id, 'as worker', currentUser.id);
    const r = await fetch('/api/apply-job', { 
      method: 'POST', 
      headers: {'Content-Type':'application/json'}, 
      body: JSON.stringify({ 
        jobId: id, 
        workerPhone: currentUser.phone 
      }) 
    });
    const j = await r.json(); 
    console.log('[ACCEPT JOB] Response:', j);
    if (j.ok) { 
      showToast('Success', 'Application submitted successfully!', 'success');
      loadJobs(); 
    } else {
      if (j.error && j.error.includes('Already applied')) {
        showToast('Info', 'You have already applied to this job', 'info');
      } else {
        showToast('Error', j.error || 'Application failed', 'error');
      }
    }
  }catch(e){ 
    console.error('[ACCEPT JOB] Error:', e);
    showToast('Error', 'Application error. Please try again.', 'error');
  }
}

// load jobs initially
loadJobs();

// Jobs: fetch and render in client panel
const jobsListEl = document.getElementById('jobsList');
async function fetchJobs(lat=null, lon=null, radius=50){
  let url = '/api/jobs';
  if (lat && lon) url += `?lat=${lat}&lon=${lon}&radius=${radius}`;
  try{
    const res = await fetch(url); const d = await res.json(); if (d && Array.isArray(d.jobs)) return d.jobs;
  }catch(e){ console.warn('fetchJobs error', e); }
  return [];
}

function renderJobs(list){
  if (!jobsListEl) return;
  jobsListEl.innerHTML = '';
  if (!list || list.length === 0){ jobsListEl.innerHTML = '<div style="color:var(--muted)">No jobs posted yet.</div>'; return; }
  // sort urgent first
  list.sort((a,b)=> (b.urgent||0) - (a.urgent||0));
  list.forEach(j => {
    const div = document.createElement('div'); div.className = 'card' + (j.urgent? ' emergency':'');
    const urgentBadge = j.urgent ? '<div style="margin-bottom:6px"><span class="badge-emergency">URGENT</span></div>' : '';
    div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        ${urgentBadge}
        <strong>${escapeHtml(j.title || 'Untitled')}</strong>
        <div style="color:var(--muted);font-size:13px">${escapeHtml(j.description || '')}</div>
      </div>
      <div style="text-align:right">
        <div class="badge">${j.pay||'Negotiable'}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:6px">${new Date(j.created_at||Date.now()).toLocaleString()}</div>
      </div>
    </div>`;
    jobsListEl.appendChild(div);
  });
}

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

// Refresh jobs when client panel is shown
function ensureJobsLoaded(){
  // try to use geolocation for localized jobs, fallback to server list
  navigator.geolocation.getCurrentPosition(async (pos)=>{ const jobs = await fetchJobs(pos.coords.latitude,pos.coords.longitude,50); renderJobs(jobs); }, async ()=>{ const jobs = await fetchJobs(); renderJobs(jobs); }, {timeout:5000});
}

// After posting a job, refresh the jobs list
const _fetch = window.fetch;
window.fetch = async function(resource, init){
  const res = await _fetch(resource, init);
  try{
    if (resource && typeof resource === 'string' && resource.startsWith('/api/jobs') && init && init.method && init.method.toUpperCase() === 'POST'){
      // refresh jobs after a short delay to allow DB commit
      setTimeout(()=>{ ensureJobsLoaded(); }, 600);
    }
  }catch(e){/* ignore */}
  return res;
};

// Toast Notification System
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="removeToast(this.parentElement)">×</button>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => removeToast(toast), 5000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function removeToast(toast) {
  if (!toast) return;
  toast.classList.add('removing');
  setTimeout(() => toast.remove(), 300);
}

// Enhanced Rating System
let selectedRating = 0;

function showRatingModal(workerId, workerName) {
  const modal = document.getElementById('modal');
  const content = document.getElementById('modalContent');
  
  content.innerHTML = `
    <h3 style="margin:0 0 16px 0;color:#0f172a;">Rate ${workerName}</h3>
    <div class="rating-section">
      <p style="color:#64748b;margin-bottom:10px;text-align:center">How would you rate this worker?</p>
      <div class="rating-stars" id="ratingStars" style="display:flex;gap:8px;justify-content:center;font-size:32px;margin-bottom:16px;">
        ${[1,2,3,4,5].map(i => `<span class="rating-star" data-rating="${i}" onclick="selectRating(${i})" style="cursor:pointer;color:#d1d5db;transition:all 0.2s;">★</span>`).join('')}
      </div>
      <textarea id="ratingComment" placeholder="Share your experience (optional)..." style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;min-height:80px;font-family:inherit;"></textarea>
      <div style="display:flex;gap:10px">
        <button onclick="submitRating(${workerId})" style="flex:1;padding:10px;background:#0f766e;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Submit Rating</button>
        <button onclick="closeRatingModal()" style="flex:1;padding:10px;background:#64748b;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Cancel</button>
      </div>
    </div>
    
    <div class="reviews-list" id="reviewsList" style="margin-top:20px;"></div>
  `;
  
  modal.style.display = 'flex';
  selectedRating = 0;
  loadReviews(workerId);
}

function closeRatingModal() {
  const modal = document.getElementById('modal');
  if (modal) modal.style.display = 'none';
}

function selectRating(rating) {
  selectedRating = rating;
  const stars = document.querySelectorAll('.rating-star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.style.color = '#fbbf24';
    } else {
      star.style.color = '#d1d5db';
    }
  });
}

async function submitRating(workerId) {
  if (selectedRating === 0) {
    showToast('Rating Required', 'Please select a star rating', 'warning');
    return;
  }
  
  const comment = document.getElementById('ratingComment').value.trim();
  const clientName = prompt('Enter your name:');
  if (!clientName) return;
  
  try {
    const res = await fetch('/api/rate-worker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId,
        rating: selectedRating,
        comment,
        clientName
      })
    });
    
    if (res.ok) {
      showToast('Rating Submitted', 'Thank you for your feedback!', 'success');
      closeRatingModal();
      loadWorkers();
    } else {
      showToast('Error', 'Failed to submit rating', 'error');
    }
  } catch(err) {
    showToast('Error', 'Failed to submit rating', 'error');
  }
}

async function loadReviews(workerId) {
  try {
    const res = await fetch(`/api/reviews/${workerId}`);
    const data = await res.json();
    const reviewsList = document.getElementById('reviewsList');
    
    if (data.reviews && data.reviews.length > 0) {
      reviewsList.innerHTML = '<h4 style="margin:20px 0 10px 0;color:#1e293b">Recent Reviews</h4>' +
        data.reviews.map(r => `
          <div class="review-card">
            <div class="review-header">
              <div>
                <div class="review-author">${r.client_name}</div>
                <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
              </div>
            </div>
            <div class="review-text">${r.comment || 'No comment'}</div>
          </div>
        `).join('');
    } else {
      reviewsList.innerHTML = '<p style="color:#64748b;font-size:13px;margin:20px 0;">No reviews yet</p>';
    }
  } catch(err) {
    console.error('Error loading reviews:', err);
  }
}

// Voice Resume Functions
function playVoiceResume(voicePath, workerName) {
  showModal(`
    <h3 style="color:#14b8a6;margin-bottom:16px;">🎤 Voice Resume - ${workerName}</h3>
    <div style="padding:20px;background:#f1f5f9;border-radius:8px;text-align:center;">
      <audio controls autoplay style="width:100%;margin-bottom:12px;">
        <source src="${voicePath}" type="audio/webm">
        <source src="${voicePath}" type="audio/wav">
        <source src="${voicePath}" type="audio/mp3">
        Your browser does not support the audio element.
      </audio>
      <p style="font-size:12px;color:#64748b;margin:0;">Listen to the worker's voice introduction</p>
    </div>
    <button onclick="closeModal()" class="button-primary" style="width:100%;margin-top:12px;">Close</button>
  `);
}

async function deleteVoiceResume(phone, workerId) {
  if (!confirm('Are you sure you want to delete this voice resume? This action cannot be undone.')) {
    return;
  }
  
  try {
    const res = await fetch('/api/delete-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    
    const data = await res.json();
    
    if (data.ok || data.success) {
      showToast('Voice Deleted', 'Voice resume has been removed', 'success');
      loadWorkers(); // Reload to update the UI
    } else {
      showToast('Error', data.message || 'Failed to delete voice resume', 'error');
    }
  } catch(err) {
    console.error('Error deleting voice:', err);
    showToast('Error', 'Failed to delete voice resume', 'error');
  }
}