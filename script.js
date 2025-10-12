/* script-part1.js — Part 1
   تهيئة العناصر الأساسية، الترحيب، التنقل، لوحة التحكم (دخول)، رفع صور أساسية، بحث، عرض معرض، OCR
*/

// -------------------------
// عناصر DOM الأساسية
// -------------------------
const welcomeModal = document.getElementById('welcomeModal');
const startAppBtn = document.getElementById('startAppBtn');

const sectionsToggle = document.getElementById('sectionsToggle');
const sideNav = document.getElementById('sideNav');
const closeSide = document.getElementById('closeSide');
const sideItems = Array.from(document.querySelectorAll('.side-item'));
const pages = Array.from(document.querySelectorAll('.page'));

const controlBtn = document.getElementById('controlBtn');
const controlModal = document.getElementById('controlModal');
const closeControl = document.getElementById('closeControl');
const adminPass = document.getElementById('adminPass');
const adminLogin = document.getElementById('adminLogin');
const controlArea = document.getElementById('controlArea');
const controlAuth = document.getElementById('controlAuth');
const logoutBtn = document.getElementById('logoutBtn');
const primaryColor = document.getElementById('primaryColor');

// الصفحة الرئيسية عناصر
const fileSearch = document.getElementById('fileSearch');
const searchBtn = document.getElementById('searchBtn');
const ocrBtn = document.getElementById('ocrBtn');
const resultsGrid = document.getElementById('resultsGrid');
const gallery = document.getElementById('gallery');

// لوحة التحكم عناصر رفع/تحرير
const uploadImages = document.getElementById('uploadImages');
const uploadClothes = document.getElementById('uploadClothes');
const uploadFonts = document.getElementById('uploadFonts');
const uploadStyles = document.getElementById('uploadStyles');
const aboutEditor = document.getElementById('aboutEditor');
const contactEditor = document.getElementById('contactEditor');
const contactImageFile = document.getElementById('contactImageFile');
const contactImageLink = document.getElementById('contactImageLink');
const addContactImage = document.getElementById('addContactImage');
const saveControl = document.getElementById('saveControl');

// بيانات محلية (نستخدم localStorage لتخزين البيانات المضافة من لوحة التحكم)
let userImages = [];      // {name, dataURL}
let clothesImages = [];   // dataURL list
let uploadedFonts = [];   // {name, url}
let nameStyles = [];      // array of style objects loaded from JSON
let contactImages = [];   // {src, link}
let savedAboutText = '';
let savedContactText = '';

// -------------------------
// شاشة الترحيب
// -------------------------
if (startAppBtn) {
  startAppBtn.addEventListener('click', () => {
    if (welcomeModal) {
      welcomeModal.style.transition = 'opacity .6s';
      welcomeModal.style.opacity = '0';
      setTimeout(()=> welcomeModal.remove(), 650);
    }
  });
}

// -------------------------
// فتح/اغلاق القائمة الجانبية
// -------------------------
if (sectionsToggle) {
  sectionsToggle.addEventListener('click', () => sideNav.classList.toggle('hidden'));
}
if (closeSide) closeSide.addEventListener('click', () => sideNav.classList.add('hidden'));

// التنقل بين الأقسام
sideItems.forEach(li => {
  li.addEventListener('click', () => {
    const target = li.dataset.section;
    // تفعيل الستايل على العنصر
    sideItems.forEach(i => i.classList.remove('active'));
    li.classList.add('active');
    // عرض القسم المطلوب
    pages.forEach(p => p.classList.remove('active'));
    const show = document.getElementById(target);
    if (show) show.classList.add('active');
    // اغلاق الشريط الجانبي على الموبايل
    sideNav.classList.add('hidden');
  });
});

// -------------------------
// لوحة التحكم - فتح النافذة
// -------------------------
if (controlBtn) {
  controlBtn.addEventListener('click', () => {
    controlModal.classList.remove('hidden');
    controlModal.setAttribute('aria-hidden','false');
  });
}
if (closeControl) {
  closeControl.addEventListener('click', () => {
    controlModal.classList.add('hidden');
    controlModal.setAttribute('aria-hidden','true');
  });
}

// -------------------------
// تسجيل الدخول للوحة التحكم بكلمة المرور asd321
// -------------------------
if (adminLogin) {
  adminLogin.addEventListener('click', () => {
    const pass = (adminPass.value || '').trim();
    if (pass === 'asd321') {
      controlAuth.style.display = 'none';
      controlArea.classList.remove('hidden');
      // تحميل البيانات المحفوظة محلياً
      loadFromStorage();
      renderGallery();
      populateClotheSelect();
      populateGradients();
      populateFontSelect();
    } else {
      alert('كلمة المرور غير صحيحة');
    }
  });
}
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    // إعادة وضع لوحة التحكم للحالة الافتراضية
    controlArea.classList.add('hidden');
    controlAuth.style.display = '';
    adminPass.value = '';
    controlModal.classList.add('hidden');
  });
}

// -------------------------
// تحميل / حفظ في localStorage
// -------------------------
function saveToStorage(){
  try {
    localStorage.setItem('userImages', JSON.stringify(userImages));
    localStorage.setItem('clothesImages', JSON.stringify(clothesImages));
    localStorage.setItem('uploadedFonts', JSON.stringify(uploadedFonts.map(f=>({name:f.name,url:f.url}))));
    localStorage.setItem('nameStyles', JSON.stringify(nameStyles));
    localStorage.setItem('contactImages', JSON.stringify(contactImages));
    localStorage.setItem('aboutText', savedAboutText);
    localStorage.setItem('contactText', savedContactText);
    // لون رئيسي
    localStorage.setItem('primaryColor', primaryColor.value);
  } catch(e){
    console.warn('فشل الحفظ على التخزين المحلي', e);
  }
}

function loadFromStorage(){
  try {
    userImages = JSON.parse(localStorage.getItem('userImages') || '[]');
    clothesImages = JSON.parse(localStorage.getItem('clothesImages') || '[]');
    nameStyles = JSON.parse(localStorage.getItem('nameStyles') || '[]');
    contactImages = JSON.parse(localStorage.getItem('contactImages') || '[]');
    savedAboutText = localStorage.getItem('aboutText') || document.getElementById('aboutText').textContent;
    savedContactText = localStorage.getItem('contactText') || document.getElementById('contactText').textContent;
    document.getElementById('aboutText').textContent = savedAboutText;
    document.getElementById('contactText').textContent = savedContactText;

    // تحميل الخطوط (إذا وُجدت روابط مخزنة)
    const fonts = JSON.parse(localStorage.getItem('uploadedFonts') || '[]');
    uploadedFonts = fonts.map(f=>({name:f.name, url:f.url}));
    // لون رئيسي
    const pc = localStorage.getItem('primaryColor');
    if(pc && primaryColor) primaryColor.value = pc;
  } catch(e){
    console.warn('فشل التحميل', e);
  }
}

// -------------------------
// رفع صور (الصفحة الرئيسية) من لوحة التحكم
// -------------------------
if (uploadImages) {
  uploadImages.addEventListener('change', (ev) => {
    const files = Array.from(ev.target.files).slice(0, 50); // حماية الحجم
    const readers = files.map(f => {
      return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = e => res({name: f.name, data: e.target.result});
        r.onerror = rej;
        r.readAsDataURL(f);
      });
    });
    Promise.all(readers).then(list => {
      userImages = userImages.concat(list);
      saveToStorage();
      renderGallery();
      alert('تم رفع الصور وعرضها في الصفحة الرئيسية ✅');
    }).catch(()=> alert('خطأ بإضافة الصور'));
  });
}

// -------------------------
// عرض gallery (الصور المضافة)
// -------------------------
function renderGallery(){
  gallery.innerHTML = '';
  if(!userImages.length){
    gallery.innerHTML = '<div class="gold-card">لا توجد صور مضافة بعد — استخدم لوحة التحكم لإضافة صور</div>';
    return;
  }
  userImages.forEach(img => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `<img src="${img.data}" alt="${img.name}" />
      <div class="result-actions">
        <button class="btn" onclick="downloadDataURL('${escape(img.data)}','${img.name}')">تحميل</button>
        <button class="btn" onclick="showOCR('${escape(img.data)}')">OCR</button>
      </div>`;
    gallery.appendChild(card);
  });
}

// دالة مساعدة للتحميل
function downloadDataURL(dataUrl, filename){
  const a = document.createElement('a');
  a.href = unescape(dataUrl);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// -------------------------
// البحث بالاسم (بحث ذكي عبر أسماء الملفات)
// -------------------------
if (searchBtn){
  searchBtn.addEventListener('click', () => {
    const q = (fileSearch.value || '').trim().toLowerCase();
    const found = userImages.filter(i => i.name.toLowerCase().includes(q));
    renderResultsGrid(found);
  });
}

// عرض نتائج سريعة
function renderResultsGrid(list){
  resultsGrid.innerHTML = '';
  if(!list.length) {
    resultsGrid.innerHTML = '<div class="gold-card">لا توجد نتائج</div>';
    return;
  }
  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `<img src="${item.data}" alt="${item.name}" /><div>${item.name}</div>
      <div class="result-actions">
        <button class="btn" onclick="downloadDataURL('${escape(item.data)}','${item.name}')">تحميل</button>
        <button class="btn" onclick="showOCR('${escape(item.data)}')">OCR</button>
      </div>`;
    resultsGrid.appendChild(card);
  });
}

// -------------------------
// OCR — استدعاء tesseract لمعالجة صورة
// -------------------------
function showOCR(dataEscaped){
  const data = unescape(dataEscaped);
  // عرض نافذة بسيطة للنتيجة
  const win = window.open('','ocr','width=600,height=400');
  win.document.body.innerHTML = `<div style="font-family:inherit;padding:12px"><h3>جارٍ تحليل النص من الصورة...</h3><div id="ocrText">...</div></div>`;
  Tesseract.recognize(data, 'ara')
    .then(({ data: { text } }) => {
      win.document.getElementById('ocrText').textContent = text || '[لا نتج نص واضح]';
    }).catch(err => {
      win.document.getElementById('ocrText').textContent = 'فشل التحليل: ' + err.message;
    });
}

// اجعل showOCR و downloadDataURL متاحين عالمياً (لأزرار inline)
window.showOCR = showOCR;
window.downloadDataURL = downloadDataURL;

// نهاية part1
/* script-part2.js — Part 2
   وظائف زخرفة الخطوط و الأسماء، رفع الخطوط، التلبيسات، الستايلات، حفظ النصوص
*/

// -------------------------
// بيانات وDOM إضافي خاص بالزخرفة
// -------------------------
const fontNameInput = document.getElementById('fontNameInput');
const fontSelect = document.getElementById('fontSelect');
const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
const solidPanel = document.getElementById('solidPanel');
const gradientPanel = document.getElementById('gradientPanel');
const clothePanel = document.getElementById('clothePanel');
const solidColor = document.getElementById('solidColor');
const gradientSelect = document.getElementById('gradientSelect');
const clotheSelect = document.getElementById('clotheSelect');
const generateFont = document.getElementById('generateFont');
const fontPreview = document.getElementById('fontPreview');

// زخارف الأسماء
const nameInput = document.getElementById('nameInput');
const genNameStyles = document.getElementById('genNameStyles');
const nameResults = document.getElementById('nameResults');

// رفع ستايلات، خطوط، تلبيسات
const uploadStylesInput = document.getElementById('uploadStyles');
const uploadFontsInput = document.getElementById('uploadFonts');
const uploadClothesInput = document.getElementById('uploadClothes');

// تدرجات (نحو 20+، يمكنك تعديل/إضافة)
const gradientList = [
  'linear-gradient(90deg,#D4AF37,#FFD66B)',
  'linear-gradient(90deg,#FF9A9E,#FAD0C4)',
  'linear-gradient(90deg,#A1C4FD,#C2E9FB)',
  'linear-gradient(90deg,#FBC2EB,#A6C1EE)',
  'linear-gradient(90deg,#FFEFBA,#FFFFFF)',
  'linear-gradient(90deg,#e0c3fc,#8ec5fc)',
  'linear-gradient(90deg,#f6d365,#fda085)',
  'linear-gradient(90deg,#f093fb,#f5576c)',
  'linear-gradient(90deg,#5ee7df,#b490ca)',
  'linear-gradient(90deg,#cfd9df,#e2ebf0)'
];

// populate gradients
function populateGradients(){
  gradientSelect.innerHTML = '';
  gradientList.forEach((g, idx) => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = 'تدرج ' + (idx+1);
    gradientSelect.appendChild(opt);
  });
}

// populate font select (بعض الخطوط الافتراضية) + خطوط محملة
function populateFontSelect(){
  fontSelect.innerHTML = '';
  const defaults = ['Reem Kufi','Cairo','Amiri','Tajawal','Noto Kufi Arabic'];
  defaults.forEach(f => {
    const o = document.createElement('option'); o.value = f; o.textContent = f; fontSelect.appendChild(o);
  });
  // إضافات من uploadedFonts
  uploadedFonts.forEach(f => {
    const o = document.createElement('option'); o.value = f.url; o.textContent = f.name; fontSelect.appendChild(o);
    // تعريف @font-face تلقائيًا
    const fontFaceName = f.name.replace(/\.[^/.]+$/,"").replace(/\s+/g,'_');
    if(!document.getElementById('font-'+fontFaceName)){
      const style = document.createElement('style');
      style.id = 'font-'+fontFaceName;
      style.innerHTML = `
        @font-face {
          font-family: '${fontFaceName}';
          src: url('${f.url}');
        }`;
      document.head.appendChild(style);
    }
  });
}

// السكان: الاختيار بين أوضاع اللون
modeButtons.forEach(b => {
  b.addEventListener('click', () => {
    modeButtons.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const mode = b.dataset.mode;
    solidPanel.classList.toggle('hidden', mode!=='solid');
    gradientPanel.classList.toggle('hidden', mode!=='gradient');
    clothePanel.classList.toggle('hidden', mode!=='clothe');
  });
});

// توليد معاينة زخرفة الخط
if (generateFont) {
  generateFont.addEventListener('click', () => {
    const text = (fontNameInput.value || '').trim();
    if(!text) return alert('أدخل نصاً أولاً');
    const fontVal = fontSelect.value;
    const activeMode = document.querySelector('.mode-btn.active').dataset.mode;
    fontPreview.textContent = text;
    // تطبيق الخط
    if(fontVal.startsWith('http') || fontVal.includes('.')) {
      // اسم الخيار يساوي رابط الخط المحمّل
      // نستخدم اسم ملف كـ font-family عبر @font-face الموجود
      const matching = uploadedFonts.find(f=>f.url===fontVal);
      if(matching){
        const name = matching.name.replace(/\.[^/.]+$/,"").replace(/\s+/g,'_');
        fontPreview.style.fontFamily = `'${name}', sans-serif`;
      } else {
        fontPreview.style.fontFamily = fontVal;
      }
    } else {
      fontPreview.style.fontFamily = fontVal + ', sans-serif';
    }

    // تطبيق اللون/تدرج/تلبيس
    fontPreview.style.color = '';
    fontPreview.style.background = '';
    fontPreview.style.webkitBackgroundClip = '';
    fontPreview.style.webkitTextFillColor = '';

    if(activeMode === 'solid'){
      fontPreview.style.color = solidColor.value;
      fontPreview.style.background = '';
    } else if(activeMode === 'gradient'){
      const g = gradientSelect.value;
      fontPreview.style.background = g;
      fontPreview.style.webkitBackgroundClip = 'text';
      fontPreview.style.webkitTextFillColor = 'transparent';
    } else if(activeMode === 'clothe'){
      // get selected clothe
      const src = clotheSelect.value;
      if(!src) return alert('لم يتم اختيار صورة تلبيس');
      fontPreview.style.background = `url(${src}) center/cover`;
      fontPreview.style.webkitBackgroundClip = 'text';
      fontPreview.style.webkitTextFillColor = 'transparent';
    }
  });
}

// -------------------------
// رفع صور التلبيس (clothes) + ملئ القائمة
// -------------------------
if (uploadClothesInput) {}
// إعادة تعريف uploadClothesInput لأننا اخترنا ids مختلفة:
const uploadClothesEl = document.getElementById('uploadClothes');
if(uploadClothesEl){
  uploadClothesEl.addEventListener('change', e => {
    const files = Array.from(e.target.files);
    const readers = files.map(f => new Promise((res,rej)=>{
      const r = new FileReader();
      r.onload = ev => res(ev.target.result);
      r.onerror = rej;
      r.readAsDataURL(f);
    }));
    Promise.all(readers).then(list => {
      clothesImages = clothesImages.concat(list);
      saveToStorage();
      populateClotheSelect();
      alert('تم رفع صور التلبيس ✅');
    }).catch(()=> alert('فشل رفع التلبيسات'));
  });
}

function populateClotheSelect(){
  clotheSelect.innerHTML = '';
  if(!clothesImages.length){
    const opt = document.createElement('option'); opt.value=''; opt.textContent='لا توجد تلبيسات مرفوعة'; clotheSelect.appendChild(opt); return;
  }
  clothesImages.forEach((d, idx) => {
    const opt = document.createElement('option'); opt.value = d; opt.textContent = 'تلبيس ' + (idx+1); clotheSelect.appendChild(opt);
  });
}

// -------------------------
// رفع ملفات الستايلات (json/js)
// -------------------------
if (uploadStyles){
  uploadStyles.addEventListener('change', e => {
    const files = Array.from(e.target.files);
    const readers = files.map(f => new Promise((res,rej)=>{
      const r = new FileReader();
      r.onload = ev => res({name:f.name, content:ev.target.result});
      r.onerror = rej;
      r.readAsText(f);
    }));
    Promise.all(readers).then(list => {
      list.forEach(item => {
        try {
          // نجرّب parse json
          const parsed = JSON.parse(item.content);
          if(Array.isArray(parsed)) {
            nameStyles = nameStyles.concat(parsed);
          } else if(typeof parsed === 'object') {
            nameStyles.push(parsed);
          }
        } catch(e){
          // file might be JS that pushes to a global variable (not ideal) — attempt eval in sandbox
          try {
            const fn = new Function(item.content + '; return typeof styles !== "undefined" ? styles : null;');
            const maybe = fn();
            if(maybe) {
              if(Array.isArray(maybe)) nameStyles = nameStyles.concat(maybe);
              else nameStyles.push(maybe);
            } else {
              console.warn('ملف ستايل لم ينتج بيانات (JS)', item.name);
            }
          } catch(err){
            console.warn('فشل قراءة ستايل', item.name, err);
          }
        }
      });
      saveToStorage();
      alert('تم رفع ستايلات الزخرفة وتخزينها محلياً ✅');
    });
  });
}

// -------------------------
// رفع الخطوط من الهاتف (وإضافتها إلى uploadedFonts & @font-face)
// -------------------------
if (uploadFonts){
  uploadFonts.addEventListener('change', e => {
    const files = Array.from(e.target.files);
    const reads = files.map(f => new Promise((res,rej)=>{
      const r = new FileReader();
      r.onload = ev => res({name:f.name, data:ev.target.result});
      r.onerror = rej;
      r.readAsDataURL(f);
    }));
    Promise.all(reads).then(list => {
      list.forEach(f => {
        // نحفظ URL Blob مؤقت عبر DataURL (يمكن تحسينه بIndexedDB)
        uploadedFonts.push({name:f.name, url:f.data});
      });
      saveToStorage();
      populateFontSelect();
      alert('تم رفع الخطوط ✅');
    });
  });
}

// -------------------------
// زخرفة الأسماء — عرض حسب الستايلات المرفوعة
// -------------------------
if (genNameStyles){
  genNameStyles.addEventListener('click', () => {
    const name = (nameInput.value || '').trim();
    if(!name) return alert('أدخل الاسم أولاً');
    nameResults.innerHTML = '';
    if(!nameStyles.length) {
      nameResults.innerHTML = '<div class="gold-card">لم يتم رفع أي ستايلات بعد</div>';
      return;
    }
    // نعرض 2x50 أو أقل إذا عدد الستايلات أقل
    const total = Math.min(nameStyles.length, 100);
    for(let i=0;i<total;i++){
      const s = nameStyles[i % nameStyles.length];
      // إذا الستايل يماثل هيكل object {prefix, suffix, transform}
      const prefix = s.prefix || s.pre || '';
      const suffix = s.suffix || s.suf || '';
      const text = prefix + name + suffix;
      const box = document.createElement('div');
      box.className = 'gold-card';
      box.style.padding = '12px';
      box.style.textAlign = 'center';
      box.textContent = text;
      nameResults.appendChild(box);
    }
  });
}

// -------------------------
// إضافة صورة + رابط لقسم اتصل بنا
// -------------------------
if(addContactImage){
  addContactImage.addEventListener('click', ()=>{
    const file = contactImageFile.files[0];
    const link = (contactImageLink.value || '').trim();
    if(!file || !link) return alert('اختر صورة وأدخل رابطاً');
    const r = new FileReader();
    r.onload = e => {
      contactImages.push({src:e.target.result, link});
      saveToStorage();
      renderContactLinks();
      alert('تمت الإضافة لقسم اتصل بنا ✅');
      contactImageFile.value = '';
      contactImageLink.value = '';
    }
    r.readAsDataURL(file);
  });
}

function renderContactLinks(){
  const target = document.getElementById('contactLinks');
  target.innerHTML = '';
  if(!contactImages.length){ target.innerHTML = '<div class="gold-card">لا توجد روابط بعد</div>'; return; }
  contactImages.forEach(ci => {
    const a = document.createElement('a'); a.href = ci.link; a.target='_blank';
    a.className = 'contact-link';
    a.innerHTML = `<img src="${ci.src}" alt="contact" style="max-width:120px;border-radius:8px;display:block;margin:auto" />`;
    target.appendChild(a);
  });
}

// -------------------------
// حفظ التغييرات من لوحة التحكم: النصوص، اللون الرئيسي
// -------------------------
if(saveControl){
  saveControl.addEventListener('click', () => {
    // نصوص
    savedAboutText = (aboutEditor.value || '').trim() || document.getElementById('aboutText').textContent;
    savedContactText = (contactEditor.value || '').trim() || document.getElementById('contactText').textContent;
    document.getElementById('aboutText').textContent = savedAboutText;
    document.getElementById('contactText').textContent = savedContactText;

    // لون رئيسي
    const pc = primaryColor.value;
    document.documentElement.style.setProperty('--gold', pc);

    saveToStorage();
    alert('تم حفظ الإعدادات بنجاح ✅');
  });
}

// -------------------------
// جاهزية عند التحميل
// -------------------------
window.addEventListener('load', () => {
  loadFromStorage();
  renderGallery();
  populateClotheSelect();
  populateGradients();
  populateFontSelect();
  renderContactLinks();
});