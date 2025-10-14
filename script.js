/* =============================
   script.js
   جميع وظائف الواجهة + لوحة التحكم
   التخزين محلي (localStorage)
   كلمة المرور الافتراضية: "asd321"
   ============================= */

/* ---------- مساعدة بسيطة ---------- */
const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));
const STORAGE_KEYS = {
  PASS: 'decor_pass',
  HOME_IMAGES: 'decor_home_images',
  PRO_FONTS: 'decor_pro_fonts',
  PRO_TEXTURES: 'decor_pro_textures',
  PRO_STYLES: 'decor_pro_styles',
  NAME_STYLES: 'decor_name_styles',
  ABOUT: 'decor_about',
  CONTACT: 'decor_contact',
  SECTIONS: 'decor_sections'
};

/* ---------- init default pass & sections ---------- */
function ensureDefaults() {
  try {
    if (!localStorage.getItem(STORAGE_KEYS.PASS)) localStorage.setItem(STORAGE_KEYS.PASS, 'asd321');
    if (!localStorage.getItem(STORAGE_KEYS.SECTIONS)) localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify([
      {id:'home', title:'الصفحة الرئيسية'},
      {id:'pro', title:'الزخرفة الاحترافية'},
      {id:'names', title:'زخرفة الأسماء'},
      {id:'about', title:'لمحة عن التطبيق'},
      {id:'contact', title:'اتصل بنا'}
    ]));
  } catch(e){ console.warn('LS error', e) }
}
ensureDefaults();

/* ---------- عناصر أساسية ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // overlays & panels
  const welcome = qs('#welcome');
  const btnStart = qs('#btn-start');
  const sidebar = qs('#sidebar');
  const btnMenu = qs('#btn-menu');
  const closeSidebar = qs('#close-sidebar');
  const sectionsLinks = qs('#sections-links');
  const pages = qsa('.page');

  const panelOverlay = qs('#panel-overlay');
  const panelLogin = qs('#panel-login');
  const panelMain = qs('#panel-main');
  const panelPassInput = qs('#panel-pass');
  const panelLoginBtn = qs('#panel-login-btn');
  const panelCloseBtn = qs('#panel-close-btn');
  const panelCloseMain = qs('#panel-close-main');

  const fontList = qs('#font-list');
  const proFontSelect = qs('#pro-font-select');
  const proBgSelect = qs('#pro-bg-select');
  const gradientGrid = qs('#gradient-grid');
  const textureGrid = qs('#texture-grid');

  // home elements
  const homeGallery = qs('#home-gallery');
  const searchInput = qs('#search-input');
  const searchBtn = qs('#search-btn');
  const searchResults = qs('#search-results');

  // pro elements
  const proNameInput = qs('#pro-name-input');
  const proNameImage = qs('#pro-name-image');
  const proCanvas = qs('#pro-canvas');
  const proGenerate = qs('#pro-generate');
  const proDownload = qs('#pro-download');
  const colorTypeBtns = qsa('.color-type');
  const solidPicker = qs('#solid-picker');
  const gradientPicker = qs('#gradient-picker');
  const texturePicker = qs('#texture-picker');
  const solidColor = qs('#solid-color');
  const proTexturesContainer = qs('#texture-grid');
  const proGradientsContainer = qs('#gradient-grid');

  // names elements
  const namesInput = qs('#names-input');
  const namesResults = qs('#names-results');

  // about/contact
  const aboutBox = qs('#about-box');
  const contactBox = qs('#contact-box');
  const contactImages = qs('#contact-images');

  /* ---------- helper: show page ---------- */
  function showPage(id){
    pages.forEach(p => p.classList.remove('active'));
    const target = qs(`#${id}`);
    if (target) target.classList.add('active');
    // update active link style
    qsa('#sections-links li').forEach(li => li.classList.toggle('active', li.dataset.id === id));
  }

  /* ---------- welcome ---------- */
  btnStart && btnStart.addEventListener('click', () => {
    if (welcome) welcome.style.display = 'none';
    try { localStorage.setItem('decor_hide_welcome','1'); } catch(e){}
  });
  // if previously hidden
  try { if (localStorage.getItem('decor_hide_welcome') === '1'){ if (welcome) welcome.style.display='none'; } } catch(e){}

  /* ---------- sidebar toggles ---------- */
  btnMenu && btnMenu.addEventListener('click', () => sidebar.classList.add('active'));
  closeSidebar && closeSidebar.addEventListener('click', () => sidebar.classList.remove('active'));
  // section clicks
  sectionsLinks && sectionsLinks.addEventListener('click', (ev) => {
    const li = ev.target.closest('li');
    if (!li) return;
    const id = li.dataset.id;
    showPage(id);
    sidebar.classList.remove('active');
  });

  /* ---------- populate sections manage UI ---------- */
  function loadSectionsUI(){
    const manageList = qs('#manage-sections');
    manageList.innerHTML = '';
    let sections = JSON.parse(localStorage.getItem(STORAGE_KEYS.SECTIONS) || '[]');
    sections.forEach((s, idx) => {
      const li = document.createElement('li');
      li.className = 'card';
      li.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
        <span>${s.title}</span>
        <div>
          <button class="btn small" data-action="edit" data-idx="${idx}">تعديل</button>
          <button class="btn small" data-action="del" data-idx="${idx}">حذف</button>
        </div>
      </div>`;
      manageList.appendChild(li);
    });
    manageList.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', (e)=>{
        const action = b.dataset.action, idx = parseInt(b.dataset.idx,10);
        if(action === 'del'){
          sections.splice(idx,1);
          localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
          renderSectionsLinks();
          loadSectionsUI();
          flash('تم حذف القسم');
        } else {
          const newTitle = prompt('اكتب اسم جديد للقسم', sections[idx].title);
          if(newTitle){ sections[idx].title = newTitle; localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections)); renderSectionsLinks(); loadSectionsUI(); flash('تم التعديل'); }
        }
      });
    });
  }

  /* ---------- render sections links to sidebar ---------- */
  function renderSectionsLinks(){
    const links = qs('#sections-links');
    links.innerHTML = '';
    let sections = JSON.parse(localStorage.getItem(STORAGE_KEYS.SECTIONS) || '[]');
    sections.forEach(s=>{
      const li = document.createElement('li');
      li.dataset.id = s.id;
      li.textContent = s.title;
      links.appendChild(li);
    });
    // rebind
    renderSectionsLinksBind();
  }
  function renderSectionsLinksBind(){
    qsa('#sections-links li').forEach(li=>{
      li.addEventListener('click', ()=> {
        showPage(li.dataset.id);
        sidebar.classList.remove('active');
      });
    });
  }
  renderSectionsLinks();

  // add-section btn
  qs('#add-section-btn') && qs('#add-section-btn').addEventListener('click', ()=>{
    const name = qs('#new-section-name').value.trim();
    if(!name) return flash('اكتب اسم القسم أولاً');
    let sections = JSON.parse(localStorage.getItem(STORAGE_KEYS.SECTIONS) || '[]');
    const id = name.replace(/\s+/g,'-').toLowerCase() + '-' + Date.now();
    sections.push({id, title: name});
    localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
    qs('#new-section-name').value='';
    renderSectionsLinks();
    loadSectionsUI();
    flash('تم إضافة القسم');
  });

  loadSectionsUI();

  /* ---------- PANEL (login + main) ---------- */
  qs('#btn-settings').addEventListener('click', ()=>{
    panelOverlay.style.display = 'flex';
    panelLogin.style.display = 'block';
    panelMain.style.display = 'none';
    panelPassInput && panelPassInput.focus();
  });
  panelCloseBtn.addEventListener('click', ()=>{
    panelOverlay.style.display = 'none';
  });
  panelCloseMain && panelCloseMain.addEventListener('click', ()=> {
    panelOverlay.style.display = 'none';
  });

  // login logic
  panelLoginBtn.addEventListener('click', ()=>{
    const typed = panelPassInput.value.trim();
    const stored = localStorage.getItem(STORAGE_KEYS.PASS) || 'asd321';
    if(typed === stored){
      panelLogin.style.display = 'none';
      panelMain.style.display = 'block';
      // load panel data
      loadPanelData();
      flash('تم تسجيل الدخول');
    } else {
      alert('كلمة المرور خاطئة');
    }
  });

  /* ---------- panel: save password ---------- */
  qs('#save-password') && qs('#save-password').addEventListener('click', ()=>{
    const np = qs('#new-password').value.trim();
    if(!np) return flash('اكتب كلمة مرور جديدة');
    localStorage.setItem(STORAGE_KEYS.PASS, np);
    qs('#new-password').value = '';
    flash('تم تغيير كلمة المرور');
  });

  /* ---------- fonts list default (10) ---------- */
  const defaultFonts = [
    {name:'Amiri',css:"'Amiri', serif", cdn:"https://fonts.googleapis.com/css2?family=Amiri&display=swap"},
    {name:'Cairo',css:"'Cairo', sans-serif", cdn:"https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap"},
    {name:'Tajawal',css:"'Tajawal', sans-serif", cdn:"https://fonts.googleapis.com/css2?family=Tajawal&display=swap"},
    {name:'Noto Kufi',css:"'Noto Kufi Arabic', sans-serif", cdn:"https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic&display=swap"},
    {name:'Scheherazade',css:"'Scheherazade New', serif", cdn:"https://fonts.googleapis.com/css2?family=Scheherazade+New&display=swap"},
    {name:'Reem Kufi',css:"'Reem Kufi', sans-serif", cdn:"https://fonts.googleapis.com/css2?family=Reem+Kufi&display=swap"},
    {name:'Segoe UI',css:"'Segoe UI', system-ui", cdn: ''},
    {name:'Arial',css:"Arial, sans-serif", cdn: ''},
    {name:'Times New Roman',css:"'Times New Roman', serif", cdn: ''},
    {name:'Custom (مرفوع)',css:'', cdn:''}
  ];
  function populateFontLists(){
    const sel = qs('#font-list');
    const sel2 = qs('#pro-font-select');
    sel.innerHTML = '';
    sel2.innerHTML = '';
    defaultFonts.forEach((f, idx)=>{
      const o = document.createElement('option');
      o.value = idx;
      o.textContent = f.name;
      sel.appendChild(o);
      const o2 = o.cloneNode(true);
      sel2.appendChild(o2);
      // inject CDN if any
      if(f.cdn){
        const link = document.createElement('link');
        link.rel='stylesheet'; link.href = f.cdn; document.head.appendChild(link);
      }
    });
  }
  populateFontLists();

  // apply chosen font to body
  qs('#font-list').addEventListener('change', ()=>{
    const idx = parseInt(qs('#font-list').value,10);
    const f = defaultFonts[idx];
    if(f && f.css) document.body.style.fontFamily = f.css;
    flash('تم تطبيق الخط مؤقتاً');
  });

  /* ---------- upload home images ---------- */
  const homeUploadInput = qs('#home-upload');
  qs('#home-upload-btn').addEventListener('click', ()=>{
    const files = homeUploadInput.files;
    if(!files || files.length===0) return flash('اختر صوراً أولاً');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.HOME_IMAGES) || '[]');
    Array.from(files).forEach(f=>{
      const url = URL.createObjectURL(f);
      stored.push({name:f.name,url,ts:Date.now()});
    });
    localStorage.setItem(STORAGE_KEYS.HOME_IMAGES, JSON.stringify(stored));
    homeUploadInput.value='';
    renderHomeGallery();
    flash('تم رفع الصور للصفحة الرئيسية');
  });

  function renderHomeGallery(){
    homeGallery.innerHTML = '';
    const imgs = JSON.parse(localStorage.getItem(STORAGE_KEYS.HOME_IMAGES) || '[]');
    imgs.forEach((it, idx)=>{
      const img = document.createElement('img');
      img.src = it.url; img.alt = it.name;
      img.className = 'card';
      img.addEventListener('click', ()=> openImageModal(it.url, it.name));
      homeGallery.appendChild(img);
    });
  }
  renderHomeGallery();

  /* ---------- search images ---------- */
  searchBtn.addEventListener('click', ()=> {
    const q = searchInput.value.trim().toLowerCase();
    const imgs = JSON.parse(localStorage.getItem(STORAGE_KEYS.HOME_IMAGES) || '[]');
    const res = imgs.filter(i => i.name.toLowerCase().includes(q));
    searchResults.innerHTML = '';
    if(res.length === 0) { searchResults.textContent = 'لا توجد نتائج'; return; }
    res.forEach(it=>{
      const card = document.createElement('div'); card.className='card';
      const img = document.createElement('img'); img.src=it.url; img.alt=it.name;
      const btn = document.createElement('button'); btn.className='btn'; btn.textContent='تحميل';
      btn.addEventListener('click', ()=> downloadUrl(it.url, it.name));
      card.appendChild(img); card.appendChild(btn);
      searchResults.appendChild(card);
    });
  });

  /* ---------- open image modal ---------- */
  function openImageModal(url, name){
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999';
    modal.innerHTML = `<div style="background:#111;padding:16px;border-radius:10px;max-width:90%;max-height:90%;overflow:auto;text-align:center">
      <img src="${url}" style="max-width:100%;height:auto;border-radius:8px"><div style="margin-top:10px"><button class="btn" id="dl">تحميل</button> <button class="btn" id="close">إغلاق</button></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('#close').addEventListener('click', ()=> modal.remove());
    modal.querySelector('#dl').addEventListener('click', ()=> downloadUrl(url, name));
  }

  function downloadUrl(url, name){
    const a = document.createElement('a'); a.href = url; a.download = name || 'image';
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- PRO: load textures & gradients ---------- */
  // gradients example (populate with 12 nice gradients)
  const gradients = [
    'linear-gradient(90deg,#ffd700,#ffb400)',
    'linear-gradient(90deg,#ffb347,#ffcc33)',
    'linear-gradient(90deg,#f7971e,#ffd200)',
    'linear-gradient(90deg,#ff9a9e,#fecfef)',
    'linear-gradient(90deg,#a18cd1,#fbc2eb)',
    'linear-gradient(90deg,#43e97b,#38f9d7)',
    'linear-gradient(90deg,#30cfd0,#330867)',
    'linear-gradient(90deg,#f6d365,#fda085)',
    'linear-gradient(90deg,#fbc2eb,#a6c1ee)',
    'linear-gradient(90deg,#84fab0,#8fd3f4)',
    'linear-gradient(90deg,#cfd9df,#e2ebf0)',
    'linear-gradient(90deg,#f093fb,#f5576c)'
  ];
  function renderGradientGrid(){
    if(!qs('#gradient-grid')) return;
    qs('#gradient-grid').innerHTML = '';
    gradients.forEach((g, idx)=>{
      const d = document.createElement('div'); d.className='card';
      d.style.width='80px'; d.style.height='50px'; d.style.background = g; d.style.borderRadius='6px'; d.style.cursor='pointer';
      d.addEventListener('click', ()=> {
        // save selection to temporary
        proState.gradient = g;
        flash('تم اختيار التدرج');
      });
      qs('#gradient-grid').appendChild(d);
    });
  }
  renderGradientGrid();

  // textures from localStorage
  function renderTextureGrid(){
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRO_TEXTURES) || '[]');
    qs('#texture-grid').innerHTML = '';
    arr.forEach((it, idx)=>{
      const img = document.createElement('img'); img.src = it.url; img.style.width='80px'; img.style.height='50px'; img.style.objectFit='cover'; img.style.borderRadius='6px'; img.style.cursor='pointer';
      img.addEventListener('click', ()=> {
        proState.texture = it.url; flash('تم اختيار تلبيس');
      });
      qs('#texture-grid').appendChild(img);
    });
  }
  renderTextureGrid();

  /* ---------- panel uploads for pro textures/fonts/styles ---------- */
  qs('#pro-textures') && qs('#pro-textures').addEventListener('change', (e)=>{
    const files = e.target.files;
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRO_TEXTURES) || '[]');
    Array.from(files).forEach(f=>{
      const url = URL.createObjectURL(f);
      stored.push({name:f.name,url,ts:Date.now()});
    });
    localStorage.setItem(STORAGE_KEYS.PRO_TEXTURES, JSON.stringify(stored));
    renderTextureGrid(); flash('تم رفع التلبيسات');
    qs('#pro-textures').value='';
  });

  // pro fonts - register font-face dynamically
  qs('#pro-fonts') && qs('#pro-fonts').addEventListener('change', (e)=>{
    const files = e.target.files;
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRO_FONTS) || '[]');
    Array.from(files).forEach(f=>{
      const url = URL.createObjectURL(f);
      const id = 'font_' + Date.now() + '_' + Math.floor(Math.random()*9999);
      stored.push({id,name:f.name,url});
      // inject @font-face
      const style = document.createElement('style');
      style.textContent = `@font-face{font-family:'${id}'; src: url('${url}');}`;
      document.head.appendChild(style);
      // add to pro font select
      const opt = document.createElement('option'); opt.value = id; opt.textContent = f.name;
      proFontSelect.appendChild(opt);
    });
    localStorage.setItem(STORAGE_KEYS.PRO_FONTS, JSON.stringify(stored));
    flash('تم رفع الخطوط الاحترافية');
    qs('#pro-fonts').value='';
  });

  /* ---------- name styles upload ---------- */
  qs('#name-styles-upload') && qs('#name-styles-upload').addEventListener('change', (e)=>{
    const files = e.target.files;
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.NAME_STYLES) || '[]');
    Array.from(files).forEach(f=>{
      const reader = new FileReader();
      reader.onload = ()=>{
        stored.push({name:f.name,content:reader.result,ts:Date.now()});
        localStorage.setItem(STORAGE_KEYS.NAME_STYLES, JSON.stringify(stored));
        flash('تم حفظ ستايل زخرفة الأسماء');
        renderNameStyles(); // refresh available templates if needed
      };
      reader.readAsText(f);
    });
    qs('#name-styles-upload').value='';
  });

  function renderNameStyles(){
    // placeholder: list uploaded style names (actual execution of js/json templates is complex;
    // We'll allow JSON that contains templates to be used)
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEYS.NAME_STYLES) || '[]');
    namesResults.innerHTML = '';
    arr.forEach((s, idx)=>{
      const card = document.createElement('div'); card.className='card card-text';
      card.textContent = s.name;
      // clicking previews sample result using content if json
      card.addEventListener('click', ()=>{
        // if json and contains 'template' array, show some results
        try {
          const j = JSON.parse(s.content);
          if(Array.isArray(j.templates)){
            namesResults.innerHTML = '';
            j.templates.slice(0,10).forEach(t=>{
              const el = document.createElement('div'); el.className='card-text'; el.style.padding='8px'; el.textContent = t.replace(/\{name\}/g, namesInput.value || 'أحمد');
              namesResults.appendChild(el);
            });
          } else {
            flash('ملف الستايل لا يحتوي على قالب جاهز (templates)');
          }
        } catch(err){
          flash('ملف الستايل ليس JSON أو لا يمكن تنفيذه هنا');
        }
      });
      namesResults.appendChild(card);
    });
  }
  renderNameStyles();

  /* ---------- about & contact save/load ---------- */
  qs('#save-about') && qs('#save-about').addEventListener('click', ()=>{
    const txt = qs('#about-input').value || '';
    localStorage.setItem(STORAGE_KEYS.ABOUT, txt);
    renderAbout();
    flash('تم حفظ نص اللمحة');
  });
  qs('#contact-add-btn') && qs('#contact-add-btn').addEventListener('click', ()=>{
    const fileInput = qs('#contact-image'), linkInput = qs('#contact-link'), text = qs('#contact-input').value || '';
    const file = fileInput.files[0];
    if(!file || !linkInput.value) return flash('اختر صورة وضع رابطاً');
    const reader = new FileReader();
    reader.onload = ()=>{
      const obj = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTACT) || '[]');
      obj.push({img:reader.result, link: linkInput.value, text, ts:Date.now()});
      localStorage.setItem(STORAGE_KEYS.CONTACT, JSON.stringify(obj));
      fileInput.value=''; linkInput.value=''; qs('#contact-input').value='';
      renderContact();
      flash('تم إضافة صورة + رابط لقسم اتصل بنا');
    };
    reader.readAsDataURL(file);
  });

  function renderAbout(){
    const txt = localStorage.getItem(STORAGE_KEYS.ABOUT) || 'هذا التطبيق يقدم أدوات احترافية لتصميم الزخارف.';
    aboutBox.innerHTML = `<div class="gold-box">${txt}</div>`;
  }
  renderAbout();

  function renderContact(){
    contactBox.innerHTML = '';
    contactImages.innerHTML = '';
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTACT) || '[]');
    arr.forEach(it=>{
      const a = document.createElement('a'); a.href = it.link; a.target='_blank';
      const img = document.createElement('img'); img.src = it.img; img.alt='';
      img.style.width='100px'; img.style.height='100px'; img.style.objectFit='cover';
      a.appendChild(img);
      const caption = document.createElement('div'); caption.textContent = it.text || '';
      contactImages.appendChild(a);
      contactBox.appendChild(caption);
    });
  }
  renderContact();

  /* ---------- names simple search / use uploaded templates ---------- */
  namesInput && namesInput.addEventListener('input', ()=>{
    // if there are uploaded name styles as json with templates, update namesResults
    // else, show simple variations (mock)
    const val = namesInput.value.trim();
    namesResults.innerHTML = '';
    if(!val) return;
    // quick mock variations
    for(let i=0;i<10;i++){
      const div = document.createElement('div'); div.className='card-text';
      div.textContent = `${val} ${'-'.repeat(i%4)}`;
      namesResults.appendChild(div);
    }
  });

  /* ---------- PRO: canvas render ---------- */
  const ctx = proCanvas.getContext('2d');
  const proState = {
    type: 'solid',
    color: '#ffd700',
    gradient: gradients[0],
    texture: null,
    bg: null
  };
  // color type buttons
  colorTypeBtns.forEach(b=>{
    b.addEventListener('click', ()=> {
      colorTypeBtns.forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const t = b.dataset.type;
      proState.type = t;
      solidPicker.classList.toggle('hidden', t!=='solid');
      gradientPicker.classList.toggle('hidden', t!=='gradient');
      texturePicker.classList.toggle('hidden', t!=='texture');
    });
  });
  // solid color change
  solidColor && solidColor.addEventListener('change', ()=> proState.color = solidColor.value);

  // generate preview
  proGenerate && proGenerate.addEventListener('click', async ()=> {
    await renderProPreview();
  });

  async function renderProPreview(){
    // clear
    ctx.clearRect(0,0,proCanvas.width,proCanvas.height);
    ctx.fillStyle = '#111';
    ctx.fillRect(0,0,proCanvas.width,proCanvas.height);

    // check background (from pro-bg-select options populated from textures)
    if(proState.bg){
      // draw bg if url
      const img = await loadImage(proState.bg);
      ctx.drawImage(img,0,0,proCanvas.width,proCanvas.height);
    }

    // draw name (either text or uploaded image)
    if(proNameImage.files && proNameImage.files[0]){
      // draw uploaded image centered
      const f = proNameImage.files[0];
      const url = URL.createObjectURL(f);
      const img = await loadImage(url);
      const scale = Math.min(proCanvas.width / img.width, proCanvas.height / img.height) * 0.7;
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img,(proCanvas.width-w)/2,(proCanvas.height-h)/2,w,h);
    } else {
      // use text
      const text = proNameInput.value || 'اسمك';
      // pick font
      let ff = window.getComputedStyle(document.body).fontFamily || 'sans-serif';
      const sel = proFontSelect.value;
      if(sel) ff = sel; // for uploaded fonts we set value to font id
      ctx.font = `bold 72px ${ff}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      // create fill style based on proState
      if(proState.type === 'solid'){
        ctx.fillStyle = proState.color || '#ffd700';
        ctx.fillText(text, proCanvas.width/2, proCanvas.height/2);
      } else if(proState.type === 'gradient'){
        // create gradient (approx)
        const g = ctx.createLinearGradient(0,0,proCanvas.width,0);
        // we can't parse CSS gradient easily; use two stops from selected CSS (use pre-defined gradients variable top/bottom)
        g.addColorStop(0,'#ffd700'); g.addColorStop(1,'#ffb400');
        ctx.fillStyle = g;
        ctx.fillText(text, proCanvas.width/2, proCanvas.height/2);
      } else if(proState.type === 'texture'){
        if(proState.texture){
          const txtImg = await loadImage(proState.texture);
          // create pattern
          const pattern = ctx.createPattern(txtImg, 'repeat');
          ctx.fillStyle = pattern;
          ctx.fillText(text, proCanvas.width/2, proCanvas.height/2);
        } else {
          ctx.fillStyle = '#ffd700'; ctx.fillText(text, proCanvas.width/2, proCanvas.height/2);
        }
      }
    }
    flash('تم تحديث المعاينة');
  }

  function loadImage(src){
    return new Promise((res, rej)=>{
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = ()=>res(img);
      img.onerror = ()=>rej('error image');
      img.src = src;
    });
  }

  // download canvas
  proDownload && proDownload.addEventListener('click', ()=> {
    const mime = 'image/png';
    const url = proCanvas.toDataURL(mime);
    const a = document.createElement('a'); a.href = url; a.download = 'decor_result.png'; a.click();
  });

  // initial pro textures & fonts from localStorage (populate selects)
  function populateProOptions(){
    // pro fonts (uploaded)
    const fonts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRO_FONTS) || '[]');
    proFontSelect.innerHTML = '<option value="">(اختيار افتراضي)</option>';
    fonts.forEach(f=> {
      const o = document.createElement('option'); o.value = f.id; o.textContent = f.name; proFontSelect.appendChild(o);
      // also add to fontList for application if desired
    });
    // textures
    const tex = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRO_TEXTURES) || '[]');
    proBgSelect.innerHTML = '<option value="">(لا توجد خلفية)</option>';
    tex.forEach(t=> {
      const o = document.createElement('option'); o.value = t.url; o.textContent = t.name; proBgSelect.appendChild(o);
    });
    renderTextureGrid(); // grid visuals
  }
  populateProOptions();

  proBgSelect && proBgSelect.addEventListener('change', ()=> {
    proState.bg = proBgSelect.value || null;
  });

  // set texture selection via proState inside textureGrid click handlers earlier

  /* ---------- small helpers ---------- */
  function flash(msg, dur=2000){
    let el = qs('#__flash__');
    if(!el){
      el = document.createElement('div'); el.id='__flash__';
      el.style.cssText='position:fixed;left:50%;top:12%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:var(--gold);padding:8px 12px;border-radius:8px;z-index:99999;font-weight:700';
      document.body.appendChild(el);
    }
    el.textContent = msg; el.style.opacity='1';
    clearTimeout(el._t); el._t = setTimeout(()=> el.style.opacity='0', dur);
  }

  /* ---------- utility download blob ---------- */
  function downloadBlob(dataUrl, filename){
    const a = document.createElement('a'); a.href = dataUrl; a.download = filename; a.click();
  }

  /* ---------- drag & reorder sections (basic) ---------- */
  // (we provided edit/delete via prompt earlier; full drag-drop is a future enhancement)

  /* ---------- initial render on load ---------- */
  renderHomeGallery();
  renderContact();
  renderAbout();
  renderNameStyles();

  /* ---------- export functions (developer use) ---------- */
  window.__decorExport = function(){
    return {
      home: JSON.parse(localStorage.getItem(STORAGE_KEYS.HOME_IMAGES) || '[]'),
      pro: {
        fonts: JSON.parse(localStorage.getItem(STORAGE_KEYS.PRO_FONTS) || '[]'),
        textures: JSON.parse(localStorage.getItem(STORAGE_KEYS.PRO_TEXTURES) || '[]')
      },
      nameStyles: JSON.parse(localStorage.getItem(STORAGE_KEYS.NAME_STYLES) || '[]'),
      about: localStorage.getItem(STORAGE_KEYS.ABOUT) || '',
      contact: JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTACT) || '[]'),
      sections: JSON.parse(localStorage.getItem(STORAGE_KEYS.SECTIONS) || '[]')
    }
  };

}); // DOMContentLoaded end
