// ----- رسالة الترحيب -----
const welcomeScreen = document.getElementById('welcome-screen');
const startBtn = document.getElementById('start-btn');
startBtn.addEventListener('click', () => {
  welcomeScreen.style.display = 'none';
});

// ----- اللوحة الجانبية -----
const sideMenu = document.getElementById('side-menu');
const sideMenuBtn = document.getElementById('side-menu-btn');
const closeSide = document.getElementById('close-side');

sideMenuBtn.addEventListener('click', () => sideMenu.classList.add('active'));
closeSide.addEventListener('click', () => sideMenu.classList.remove('active'));

// ----- عرض الأقسام -----
const sections = document.querySelectorAll('.app-section');
const menuItems = document.querySelectorAll('#side-menu li');

menuItems.forEach(item => {
  item.addEventListener('click', () => {
    const target = item.getAttribute('data-section');
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById(target).classList.add('active');
    sideMenu.classList.remove('active');
  });
});

// ----- لوحة التحكم -----
const controlPanel = document.getElementById('control-panel');
const settingsBtn = document.getElementById('settings-btn');
const closePanel = document.getElementById('close-panel');
const passwordArea = document.getElementById('password-area');
const panelOptions = document.getElementById('panel-options');
const enterPanel = document.getElementById('enter-panel');
const passwordInput = document.getElementById('password-input');
const changePasswordBtn = document.getElementById('change-password');
const newPasswordInput = document.getElementById('new-password');

// كلمة المرور الافتراضية
let savedPassword = localStorage.getItem('panelPassword') || '1234';

settingsBtn.addEventListener('click', () => {
  controlPanel.classList.remove('hidden');
  passwordArea.style.display = 'block';
  panelOptions.classList.add('hidden');
});

closePanel.addEventListener('click', () => {
  controlPanel.classList.add('hidden');
});

// التحقق من كلمة المرور
enterPanel.addEventListener('click', () => {
  const entered = passwordInput.value;
  if (entered === savedPassword) {
    passwordArea.style.display = 'none';
    panelOptions.classList.remove('hidden');
  } else {
    alert('كلمة المرور غير صحيحة');
  }
});

// تغيير كلمة المرور
changePasswordBtn.addEventListener('click', () => {
  const newPass = newPasswordInput.value.trim();
  if (newPass.length < 3) return alert('كلمة المرور قصيرة جداً');
  savedPassword = newPass;
  localStorage.setItem('panelPassword', newPass);
  alert('تم تحديث كلمة المرور بنجاح ✅');
  newPasswordInput.value = '';
  controlPanel.classList.add('hidden');
});

// ----- الصفحة الرئيسية (بحث تجريبي) -----
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search');
const results = document.getElementById('results');

searchBtn.addEventListener('click', () => {
  const query = searchInput.value.trim();
  results.innerHTML = '';
  if (!query) return;
  for (let i = 1; i <= 6; i++) {
    const div = document.createElement('div');
    div.className = 'result-card';
    div.style.background = 'rgba(255,215,0,0.2)';
    div.style.border = '1px solid gold';
    div.style.padding = '10px';
    div.style.borderRadius = '10px';
    div.textContent = `نتيجة ${i} للبحث: ${query}`;
    results.appendChild(div);
  }
});

// ----- زخرفة الأسماء (تجريبي) -----
const nameInput = document.getElementById('name-input');
const namesResults = document.getElementById('names-results');

nameInput.addEventListener('input', () => {
  const val = nameInput.value.trim();
  namesResults.innerHTML = '';
  if (!val) return;
  for (let i = 1; i <= 10; i++) {
    const box = document.createElement('div');
    box.style.background = 'rgba(255,215,0,0.2)';
    box.style.border = '1px solid gold';
    box.style.padding = '8px';
    box.style.borderRadius = '8px';
    box.textContent = `${val} ✨ زخرفة ${i}`;
    namesResults.appendChild(box);
  }
});
