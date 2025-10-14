/* ============================================================
   script.js — الجزء الأول (تشغيل الواجهة، التنقل، لوحة التحكم،
   رفع صور الصفحة الرئيسية، البحث، حفظ الحالة الأساسية)
   ادمج هذا الجزء مع الجزء الثاني ليكون script.js واحد كامل.
   ============================================================ */

(function () {
  // ======= Helper Utilities =======
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

  function create(tag, attrs = {}) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v);
    });
    return el;
  }

  function debounce(fn, wait = 200) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), wait);
    };
  }

  // safe JSON parse
  function safeParse(str, fallback = null) {
    try { return JSON.parse(str); } catch (e) { return fallback; }
  }

  // save blob helper
  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = create('a', { href: url });
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // dataURL download
  function downloadDataURL(dataURL, filename) {
    const a = create('a', { href: dataURL });
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // read file to dataURL
  function fileToDataURL(file) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  // ======= App State (persisted) =======
  const STORAGE_KEY = 'zakhrafa_v1_state';
  let state = {
    homeImages: [], // { id, name, src (dataURL), uploadedAt }
    overlays: [],   // array of dataURL
    proFonts: [],   // { id, name }
    nameStyles: [], // { id, name, content }
    aboutText: '',
    contactText: '',
    contactImages: [], // { id, src, link }
    appearance: {
      font: 'Amiri',
      bgImage: 'bg.png',
      topbarImage: 'shbg.png',
      appIcon: 'abu7amza.png'
    },
    admin: {
      password: 'asd321',
      loggedIn: false
    }
  };

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = safeParse(raw, null);
    if (parsed) state = Object.assign({}, state, parsed);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('saveState failed', e);
    }
  }

  // ======= DOM refs (IDs/classes must match index.html) =======
  let refs = {};
  function collectRefs() {
    refs.enterApp = $('#enterApp');
    refs.welcomeScreen = $('#welcomeScreen');

    refs.menuBtn = $('#menuBtn');
    refs.sideMenu = $('#sideMenu');
    refs.closeSide = $('#closeSide');
    refs.menuItems = $$('.menu-item');

    refs.settingsBtn = $('#settingsBtn');
    refs.adminOverlay = $('#adminOverlay');
    refs.adminLogin = $('#adminLogin');
    refs.adminPassword = $('#adminPassword');
    refs.adminEnter = $('#adminEnter');
    refs.adminClose = $('#adminClose');
    refs.adminContent = $('#adminContent');
    refs.adminTabs = $$('.admin-tab');
    refs.adminTabContents = $$('.admin-tab-content');

    // Home
    refs.searchInput = $('#searchInput');
    refs.searchBtn = $('#searchBtn');
    refs.searchResults = $('#searchResults');
    refs.homeImagesInput = $('#homeImagesInput');
    refs.homeImagesGallery = $('#homeImagesGallery');

    // Pro Decor (some handlers in part 2)
    refs.decorNameInput = $('#decorNameInput');
    refs.decorImageInput = $('#decorImageInput');
    refs.decorFontSelect = $('#decorFontSelect');
    refs.decorBgBtn = $('#decorBgBtn');
    refs.colorTypeSelect = $('#colorTypeSelect');
    refs.colorPickerSection = $('#colorPickerSection');
    refs.solidColorPicker = $('#solidColorPicker');
    refs.solidColor = $('#solidColor');
    refs.gradientGallery = $('#gradientGallery');
    refs.overlayGallery = $('#overlayGallery');
    refs.decorPreview = $('#decorPreview');
    refs.downloadDecorBtn = $('#downloadDecorBtn');

    // Name Decor
    refs.nameInput = $('#nameInput');
    refs.nameResults = $('#nameResults');
    refs.nameStylesInput = $('#nameStylesInput');

    // About / Contact
    refs.aboutTextEditor = $('#aboutTextEditor');
    refs.aboutText = $('#aboutText');
    refs.contactTextEditor = $('#contactTextEditor');
    refs.contactText = $('#contactText');
    refs.contactImagesInput = $('#contactImagesInput');
    refs.contactImagesContainer = $('#contactImagesContainer');

    // background image element
    refs.backgroundImg = $('.background img');
  }

  // ======= Initialization =======
  function init() {
    collectRefs();
    loadState();
    applyAppearance();
    bindUI();
    renderHomeGallery();
    renderOverlayGallery();
    renderDecorFontsIntoSelect();
    loadAboutContactFromState();
  }

  // ensure appearance applied (backgrounds, icon)
  function applyAppearance() {
    try {
      if (refs.backgroundImg && state.appearance.bgImage) refs.backgroundImg.src = state.appearance.bgImage;
      const titleLogoEls = $$('.app-icon');
      titleLogoEls.forEach(img => { if (img) img.src = state.appearance.appIcon; });
      // topbar background via CSS elsewhere, but if you want dynamic:
      const topBar = $('.top-bar');
      if (topBar && state.appearance.topbarImage) {
        topBar.style.backgroundImage = `url(${state.appearance.topbarImage})`;
      }
      // set default font if saved
      if (state.appearance.font) document.body.style.fontFamily = state.appearance.font;
    } catch (e) { console.warn(e); }
  }

  // ======= UI Bindings =======
  function bindUI() {
    // Welcome screen
    if (refs.enterApp && refs.welcomeScreen) {
      refs.enterApp.addEventListener('click', () => {
        refs.welcomeScreen.classList.add('hidden');
      });
    }

    // Side menu open/close
    if (refs.menuBtn && refs.sideMenu) {
      refs.menuBtn.addEventListener('click', () => {
        refs.sideMenu.classList.add('active');
      });
    }
    if (refs.closeSide && refs.sideMenu) {
      refs.closeSide.addEventListener('click', () => {
        refs.sideMenu.classList.remove('active');
      });
    }
    // menu items -> switch sections
    refs.menuItems.forEach(item => {
      item.addEventListener('click', () => {
        const target = item.getAttribute('data-section');
        showSection(target);
        refs.sideMenu.classList.remove('active');
      });
    });

    // Admin overlay open
    if (refs.settingsBtn && refs.adminOverlay) {
      refs.settingsBtn.addEventListener('click', () => {
        // show overlay; if logged in show content
        refs.adminOverlay.classList.remove('hidden');
        if (state.admin && state.admin.loggedIn) {
          showAdminContent();
        } else {
          showAdminLogin();
        }
      });
    }

    // Admin login
    if (refs.adminEnter) {
      refs.adminEnter.addEventListener('click', () => {
        const v = (refs.adminPassword && refs.adminPassword.value || '').trim();
        if (v === state.admin.password) {
          state.admin.loggedIn = true;
          saveState();
          showAdminContent();
        } else {
          alert('كلمة المرور غير صحيحة');
        }
      });
    }
    // Close admin overlay
    if (refs.adminClose) {
      refs.adminClose.addEventListener('click', () => {
        refs.adminOverlay.classList.add('hidden');
        if (refs.adminPassword) refs.adminPassword.value = '';
      });
    }

    // Admin tabs
    refs.adminTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const t = tab.getAttribute('data-tab');
        refs.adminTabs.forEach(x => x.classList.remove('active'));
        tab.classList.add('active');
        refs.adminTabContents.forEach(cont => cont.classList.add('hidden'));
        const node = $(`#${t}`);
        if (node) node.classList.remove('hidden');
      });
    });

    // Home: upload images input
    if (refs.homeImagesInput) {
      refs.homeImagesInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        for (const f of files) {
          try {
            const data = await fileToDataURL(f);
            const id = 'h_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
            state.homeImages.unshift({ id, name: f.name, src: data, uploadedAt: Date.now() });
          } catch (err) {
            console.warn('read home image fail', err);
          }
        }
        if (state.homeImages.length > 500) state.homeImages.length = 500;
        saveState();
        renderHomeGallery();
      });
    }

    // Home: search
    if (refs.searchBtn && refs.searchInput) {
      refs.searchBtn.addEventListener('click', () => {
        const q = (refs.searchInput.value || '').trim().toLowerCase();
        if (!q) {
          renderHomeGallery();
          return;
        }
        const results = state.homeImages.filter(i => (i.name || '').toLowerCase().includes(q));
        renderSearchResults(results);
      });
      // Enter key
      refs.searchInput && refs.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') refs.searchBtn.click();
      });
    }

    // Name styles upload (admin)
    if (refs.nameStylesInput) {
      refs.nameStylesInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            state.nameStyles.unshift({ id: 'ns_' + Date.now() + '_' + Math.random().toString(36, 6), name: file.name, content: ev.target.result });
            saveState();
            alert(`تمت إضافة ملف زخرفة: ${file.name}`);
          };
          reader.readAsText(file);
        });
      });
    }

    // About / Contact editors
    if (refs.aboutTextEditor) {
      refs.aboutTextEditor.addEventListener('input', debounce((e) => {
        state.aboutText = e.target.value;
        saveState();
        if (refs.aboutText) refs.aboutText.textContent = state.aboutText;
      }, 350));
    }
    if (refs.contactTextEditor) {
      refs.contactTextEditor.addEventListener('input', debounce((e) => {
        state.contactText = e.target.value;
        saveState();
        if (refs.contactText) refs.contactText.textContent = state.contactText;
      }, 350));
    }

    // Contact images upload
    if (refs.contactImagesInput) {
      refs.contactImagesInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        for (const f of files) {
          try {
            const data = await fileToDataURL(f);
            const id = 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
            state.contactImages.unshift({ id, src: data, link: '' });
          } catch (err) {
            console.warn('contact image read fail', err);
          }
        }
        saveState();
        renderContactGallery();
      });
    }

    // Close admin overlay when clicking outside admin-box (optional)
    refs.adminOverlay && refs.adminOverlay.addEventListener('click', (ev) => {
      if (ev.target === refs.adminOverlay) {
        refs.adminOverlay.classList.add('hidden');
      }
    });

    // keyboard shortcut: Esc to close overlays/menus
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        refs.sideMenu && refs.sideMenu.classList.remove('active');
        refs.adminOverlay && refs.adminOverlay.classList.add('hidden');
      }
    });
  }

  // show admin login view
  function showAdminLogin() {
    if (!refs.adminOverlay) return;
    refs.adminOverlay.classList.remove('hidden');
    // hide contents and show login
    const login = $('#adminLogin');
    const content = $('#adminContent');
    if (login) login.classList.remove('hidden');
    if (content) content.classList.add('hidden');
  }

  // show admin content view
  function showAdminContent() {
    if (!refs.adminOverlay) return;
    refs.adminOverlay.classList.remove('hidden');
    const login = $('#adminLogin');
    const content = $('#adminContent');
    if (login) login.classList.add('hidden');
    if (content) content.classList.remove('hidden');

    // activate first tab by default
    const firstTab = refs.adminTabs && refs.adminTabs[0];
    firstTab && firstTab.click();
  }

  // show a section by id
  function showSection(id) {
    if (!id) return;
    const sections = $$('.app-section');
    sections.forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
    // slightly ensure focus
    target && target.scrollIntoView({ behavior: 'smooth' });
  }

  // ======= Renderers =======
  function renderHomeGallery() {
    if (!refs.homeImagesGallery) return;
    refs.homeImagesGallery.innerHTML = '';
    const list = state.homeImages || [];
    if (!list.length) {
      refs.homeImagesGallery.innerHTML = `<p class="small" style="opacity:.8">لا توجد صور مضافة بعد. استخدم لوحة التحكم لرفع الصور.</p>`;
      return;
    }
    list.forEach((it, idx) => {
      const card = create('div', { class: 'grid-card' });
      const img = create('img', { src: it.src, alt: it.name });
      const meta = create('div', { class: 'card-meta' });
      const name = create('div', { class: 'name', text: it.name || `image-${idx+1}` });
      const actions = create('div', { class: 'actions' });
      const dl = create('button', { class: 'card-actions download-small', text: 'تحميل' });
      dl.addEventListener('click', () => downloadDataURL(it.src, (it.name || 'image') + '.png'));
      actions.appendChild(dl);
      meta.appendChild(name);
      meta.appendChild(actions);
      card.appendChild(img);
      card.appendChild(meta);
      refs.homeImagesGallery.appendChild(card);
    });
  }

  function renderSearchResults(list) {
    if (!refs.searchResults) return;
    refs.searchResults.innerHTML = '';
    if (!list || list.length === 0) {
      refs.searchResults.innerHTML = `<p class="small" style="opacity:.8">لا توجد نتائج.</p>`;
      return;
    }
    list.forEach((it, idx) => {
      const card = create('div', { class: 'grid-card' });
      const img = create('img', { src: it.src, alt: it.name });
      const meta = create('div', { class: 'card-meta' });
      const name = create('div', { class: 'name', text: it.name || `image-${idx+1}` });
      const actions = create('div', { class: 'actions' });
      const dl = create('button', { class: 'card-actions download-small', text: 'تحميل' });
      dl.addEventListener('click', () => downloadDataURL(it.src, (it.name || 'image') + '.png'));
      actions.appendChild(dl);
      meta.appendChild(name);
      meta.appendChild(actions);
      card.appendChild(img);
      card.appendChild(meta);
      refs.searchResults.appendChild(card);
    });
  }

  function renderOverlayGallery() {
    if (!refs.overlayGallery) return;
    refs.overlayGallery.innerHTML = '';
    const arr = state.overlays || [];
    if (!arr.length) {
      refs.overlayGallery.innerHTML = `<p class="small" style="opacity:.8">لا توجد تلبيسات مضافة.</p>`;
      return;
    }
    arr.forEach((src, i) => {
      const wrap = create('div', { class: 'overlay-sample' });
      const img = create('img', { src });
      img.style.width = '100%';
      img.style.height = '72px';
      img.style.objectFit = 'cover';
      img.addEventListener('click', () => {
        // apply overlay selection — actual application in part2 preview logic
        console.log('overlay selected', i);
      });
      wrap.appendChild(img);
      refs.overlayGallery.appendChild(wrap);
    });
  }

  function renderDecorFontsIntoSelect() {
    if (!refs.decorFontSelect) return;
    // add some default options + uploaded ones
    const defaults = ['Amiri','Cairo','Reem Kufi','Tajawal','Changa'];
    refs.decorFontSelect.innerHTML = `<option value="">اختيار الخط</option>`;
    defaults.forEach(f => {
      const opt = create('option', { value: f, text: f });
      refs.decorFontSelect.appendChild(opt);
    });
    (state.proFonts || []).forEach(f => {
      const opt = create('option', { value: f.name, text: f.name });
      refs.decorFontSelect.appendChild(opt);
    });
  }

  function renderContactGallery() {
    if (!refs.contactImagesContainer) return;
    refs.contactImagesContainer.innerHTML = '';
    const arr = state.contactImages || [];
    if (!arr.length) {
      refs.contactImagesContainer.innerHTML = `<p class="small" style="opacity:.8">لا توجد صور تواصل.</p>`;
      return;
    }
    arr.forEach((it) => {
      const wrap = create('div', { class: 'contact-item' });
      const img = create('img', { src: it.src });
      img.className = 'contact-img';
      const linkInput = create('input', { type: 'url' });
      linkInput.placeholder = 'رابط الصورة (اختياري)';
      linkInput.value = it.link || '';
      linkInput.addEventListener('input', (e) => {
        it.link = e.target.value;
        saveState();
      });
      wrap.appendChild(img);
      wrap.appendChild(linkInput);
      wrap.addEventListener('click', () => {
        if (it.link) window.open(it.link, '_blank');
      });
      refs.contactImagesContainer.appendChild(wrap);
    });
  }

  function loadAboutContactFromState() {
    if (refs.aboutText) refs.aboutText.textContent = state.aboutText || refs.aboutText.textContent;
    if (refs.contactText) refs.contactText.textContent = state.contactText || refs.contactText.textContent;
    renderContactGallery();
  }

  // ======= Expose some dev helpers (optional) =======
  window.zakhrafaState = state;
  window.zakhrafaSave = saveState;
  window.zakhrafaRender = () => { renderHomeGallery(); renderOverlayGallery(); renderContactGallery(); renderDecorFontsIntoSelect(); };

  // ======= Auto init when DOM ready =======
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ======= End of Part 1 =======
})();
/* ============================================================
   script.js — الجزء الثاني (زخرفة الخطوط، زخرفة الأسماء،
   تطبيق التأثيرات، رفع الخطوط والتلبيسات، التحميل والمعاينة)
   ============================================================ */

(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

  const STORAGE_KEY = 'zakhrafa_v1_state';
  let state = {};
  try {
    state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) { state = {}; }

  // ====== زخرفة الخطوط (القسم الاحترافي) ======
  const decorNameInput = $('#decorNameInput');
  const decorFontSelect = $('#decorFontSelect');
  const colorTypeSelect = $('#colorTypeSelect');
  const solidColorPicker = $('#solidColorPicker');
  const solidColor = $('#solidColor');
  const gradientGallery = $('#gradientGallery');
  const overlayGallery = $('#overlayGallery');
  const decorPreview = $('#decorPreview');
  const downloadDecorBtn = $('#downloadDecorBtn');
  const decorImageInput = $('#decorImageInput');

  // الألوان المتدرجة الافتراضية
  const gradients = [
    'linear-gradient(90deg,#ff4d4d,#ffcc00)',
    'linear-gradient(90deg,#33ccff,#9933ff)',
    'linear-gradient(90deg,#00ff99,#00ccff)',
    'linear-gradient(90deg,#ff9966,#ff5e62)',
    'linear-gradient(90deg,#f9d423,#ff4e50)',
    'linear-gradient(90deg,#6a11cb,#2575fc)',
    'linear-gradient(90deg,#ee0979,#ff6a00)',
  ];

  // إنشاء معرض الألوان المتدرجة
  function renderGradientGallery() {
    if (!gradientGallery) return;
    gradientGallery.innerHTML = '';
    gradients.forEach((grad, i) => {
      const el = document.createElement('div');
      el.className = 'gradient-sample';
      el.style.background = grad;
      el.addEventListener('click', () => {
        decorPreview.style.backgroundImage = grad;
        decorPreview.style.color = 'transparent';
        decorPreview.style.backgroundClip = 'text';
        decorPreview.style.webkitBackgroundClip = 'text';
      });
      gradientGallery.appendChild(el);
    });
  }

  // عرض النص في المعاينة فقط بدون أي نصوص إضافية
  function updateDecorPreview() {
    const name = (decorNameInput.value || '').trim();
    decorPreview.textContent = name || ' ';
    decorPreview.style.fontFamily = decorFontSelect.value || 'Amiri';
    const colorType = colorTypeSelect.value;

    if (colorType === 'solid') {
      decorPreview.style.backgroundImage = '';
      decorPreview.style.color = solidColor.value;
      decorPreview.style.webkitTextFillColor = solidColor.value;
      decorPreview.style.backgroundClip = 'unset';
      decorPreview.style.webkitBackgroundClip = 'unset';
    } else if (colorType === 'gradient') {
      decorPreview.style.color = 'transparent';
      decorPreview.style.backgroundImage = gradients[0];
      decorPreview.style.backgroundClip = 'text';
      decorPreview.style.webkitBackgroundClip = 'text';
    } else if (colorType === 'overlay') {
      // overlay color logic handled below
    }
  }

  // نوع اللون
  if (colorTypeSelect) {
    colorTypeSelect.addEventListener('change', () => {
      const v = colorTypeSelect.value;
      if (v === 'solid') {
        solidColorPicker.classList.remove('hidden');
        gradientGallery.classList.add('hidden');
      } else if (v === 'gradient') {
        solidColorPicker.classList.add('hidden');
        gradientGallery.classList.remove('hidden');
      } else {
        solidColorPicker.classList.add('hidden');
        gradientGallery.classList.add('hidden');
      }
      updateDecorPreview();
    });
  }

  // اختيار لون ثابت
  if (solidColor) {
    solidColor.addEventListener('input', () => {
      if (colorTypeSelect.value === 'solid') {
        decorPreview.style.color = solidColor.value;
        decorPreview.style.webkitTextFillColor = solidColor.value;
      }
    });
  }

  // إدخال الاسم
  if (decorNameInput) {
    decorNameInput.addEventListener('input', updateDecorPreview);
  }

  // اختيار الخط
  if (decorFontSelect) {
    decorFontSelect.addEventListener('change', updateDecorPreview);
  }

  // رفع تلبيسات (Overlays)
  if (decorImageInput) {
    decorImageInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      for (const f of files) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          state.overlays = state.overlays || [];
          state.overlays.unshift(ev.target.result);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          renderOverlayGallery();
        };
        reader.readAsDataURL(f);
      }
    });
  }

  // تطبيق التلبيسة على النص
  if (overlayGallery) {
    overlayGallery.addEventListener('click', (e) => {
      const img = e.target.closest('img');
      if (!img) return;
      decorPreview.style.backgroundImage = `url(${img.src})`;
      decorPreview.style.color = 'transparent';
      decorPreview.style.backgroundClip = 'text';
      decorPreview.style.webkitBackgroundClip = 'text';
    });
  }

  // تحميل التصميم
  if (downloadDecorBtn) {
    downloadDecorBtn.addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const text = (decorNameInput.value || '').trim();
      if (!text) return alert('أدخل اسمك أولاً');

      canvas.width = 800;
      canvas.height = 400;

      // خلفية شفافة
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `80px ${decorFontSelect.value || 'Amiri'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const x = canvas.width / 2;
      const y = canvas.height / 2;

      const type = colorTypeSelect.value;
      if (type === 'solid') {
        ctx.fillStyle = solidColor.value;
      } else if (type === 'gradient') {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
        grad.addColorStop(0, '#ff4d4d');
        grad.addColorStop(1, '#ffcc00');
        ctx.fillStyle = grad;
      } else if (type === 'overlay') {
        ctx.fillStyle = '#fff';
      }

      ctx.fillText(text, x, y);
      const dataURL = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = 'decorated.png';
      a.click();
    });
  }

  // ====== زخرفة الأسماء ======
  const nameInput = $('#nameInput');
  const nameResults = $('#nameResults');

  // قائمة زخارف بسيطة افتراضية + قابلة للتوسيع لاحقاً بخوارزميات المستخدم
  const basicTemplates = [
    n => `★ ${n} ★`,
    n => `♡ ${n} ♡`,
    n => `『${n}』`,
    n => `《${n}》`,
    n => `▁ ▂ ▄ ${n} ▄ ▂ ▁`,
    n => `⟅${n}⟆`,
    n => `【☆${n}☆】`,
    n => `₪${n}₪`,
    n => `⇝${n}⇜`,
    n => `✿${n}✿`,
  ];

  function generateNameDecorations(name) {
    const results = [];
    basicTemplates.forEach(fn => results.push(fn(name)));
    // إضافة زخارف من الملفات التي يرفعها المستخدم لاحقاً
    (state.nameStyles || []).forEach(s => {
      try {
        const func = new Function('name', s.content);
        results.push(func(name));
      } catch (e) {
        console.warn('style error', e);
      }
    });
    return results;
  }

  function renderNameDecorations() {
    if (!nameInput || !nameResults) return;
    const n = (nameInput.value || '').trim();
    if (!n) {
      nameResults.innerHTML = '<p class="small" style="opacity:.8">أدخل الاسم لعرض الزخارف.</p>';
      return;
    }
    const decorations = generateNameDecorations(n);
    nameResults.innerHTML = '';
    decorations.forEach((txt) => {
      const div = document.createElement('div');
      div.className = 'name-style';
      div.textContent = txt;
      const btn = document.createElement('button');
      btn.textContent = 'نسخ';
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(txt);
        btn.textContent = 'تم النسخ ✓';
        setTimeout(() => (btn.textContent = 'نسخ'), 1500);
      });
      const box = document.createElement('div');
      box.className = 'name-style-box';
      box.appendChild(div);
      box.appendChild(btn);
      nameResults.appendChild(box);
    });
  }

  if (nameInput) {
    nameInput.addEventListener('input', renderNameDecorations);
  }

  // ====== خطوط إضافية (رفع خطوط جديدة) ======
  const fontUploadInput = $('#fontUploadInput');
  if (fontUploadInput) {
    fontUploadInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      for (const f of files) {
        const url = URL.createObjectURL(f);
        const name = f.name.replace(/\.[^/.]+$/, '');
        const newFont = new FontFace(name, `url(${url})`);
        await newFont.load();
        document.fonts.add(newFont);
        state.proFonts = state.proFonts || [];
        state.proFonts.push({ id: Date.now(), name });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
      alert('تمت إضافة الخطوط بنجاح!');
      const sel = $('#decorFontSelect');
      if (sel) {
        state.proFonts.forEach(f => {
          const opt = document.createElement('option');
          opt.value = f.name;
          opt.textContent = f.name;
          sel.appendChild(opt);
        });
      }
    });
  }

  // ====== إعداد المعرض والتحميل ======
  function renderOverlayGallery() {
    const overlayGallery = $('#overlayGallery');
    if (!overlayGallery) return;
    overlayGallery.innerHTML = '';
    (state.overlays || []).forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.style.width = '100%';
      img.style.height = '70px';
      img.style.objectFit = 'cover';
      overlayGallery.appendChild(img);
    });
  }

  // ====== بدء التطبيق ======
  function initDecorPart2() {
    renderGradientGallery();
    renderOverlayGallery();
    updateDecorPreview();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDecorPart2);
  } else {
    initDecorPart2();
  }

  // ====== نهاية الجزء الثاني من script.js ======
})();
