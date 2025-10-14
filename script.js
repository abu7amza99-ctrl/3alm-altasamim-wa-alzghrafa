/* ------------- إعدادات أولية ------------- */
document.addEventListener('DOMContentLoaded', () => {
  // عناصر عامة
  const startBtn = document.getElementById('start-btn');
  const welcome = document.getElementById('welcome-screen');
  const sideMenu = document.getElementById('side-menu');
  const sideBtn = document.getElementById('side-menu-btn');
  const closeSide = document.getElementById('close-side');
  const menuItems = document.querySelectorAll('#side-menu li');
  const sections = document.querySelectorAll('.app-section');

  // لوحة التحكم
  const controlPanel = document.getElementById('control-panel');
  const settingsBtn = document.getElementById('settings-btn');
  const closePanel = document.getElementById('close-panel');
  const loginArea = document.getElementById('login-area');
  const panelOptions = document.getElementById('panel-options');
  const panelLogin = document.getElementById('panel-login');
  const panelPassword = document.getElementById('panel-password');
  const savePasswordBtn = document.getElementById('save-password');
  const newPasswordInput = document.getElementById('new-password');

  // عناصر Pro-Decor
  const fontSelect = document.getElementById('font-select');
  const decorText = document.getElementById('decor-text');
  const decorUpload = document.getElementById('decor-upload');
  const colorType = document.getElementById('color-type');
  const solidColor = document.getElementById('solid-color');
  const gradientsGrid = document.getElementById('gradients');
  const texturesGrid = document.getElementById('textures');
  const previewCanvas = document.getElementById('preview-canvas');
  const downloadBtn = document.getElementById('download-image');
  const ctx = previewCanvas.getContext('2d');

  // الصفحة الرئيسية عناصر
  const galleryEl = document.getElementById('gallery');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const resultsEl = document.getElementById('results');

  // About/Contact elements
  const aboutContent = document.getElementById('about-content');
  const contactContent = document.getElementById('contact-content');

  /* -------- بيانات محلية مخزنة -------- */
  let savedPassword = localStorage.getItem('panelPassword') || '1234';
  let galleryList = JSON.parse(localStorage.getItem('app_gallery') || '[]'); // dataURLs
  let texList = JSON.parse(localStorage.getItem('app_textures') || '[]'); // dataURLs
  let fontsList = JSON.parse(localStorage.getItem('app_fonts') || '[]'); // {name, dataBase64}
  let aboutText = localStorage.getItem('app_about') || '';
  let contactText = localStorage.getItem('app_contact') || '';

  // تحميل إعدادات سابقة للعرض
  if (aboutText) aboutContent.textContent = aboutText;
  if (contactText) contactContent.textContent = contactText;

  /* -------- خطوط افتراضية (أسماء) --------
     لاحظ: يجب رفع ملفات الخطوط الفعلية في assets/fonts/ أو رفعها عبر لوحة التحكم
     هنا نعرض 5 أسماء افتراضية ويمكن استبدالها بخطوط مرفوعة من المستخدم.
  */
  const defaultFonts = [
    {name:'Diwani', cssName:'Diwani'},
    {name:'Thuluth', cssName:'Thuluth'},
    {name:'Kufi', cssName:'Kufi'},
    {name:'Riqaa', cssName:'Riqaa'},
    {name:'Naskh', cssName:'Naskh'}
  ];

  // تحميل الخطود المضافة سابقًا (إذا وجدت) عبر FontFace
  async function loadSavedFonts(){
    // أولاً نضيف الافتراضية كخيارات (إن لم تكن ملفات فعلية، سيستخدم المتصفح خطًا افتراضيًا)
    defaultFonts.forEach(f => addFontOption(f.name));
    // ثم الخطوط المحفوظه
    for(const f of fontsList){
      try{
        const fontData = atob(f.data); // base64 -> binary
        const arr = new Uint8Array(fontData.length);
        for(let i=0;i<fontData.length;i++) arr[i]=fontData.charCodeAt(i);
        const fontFace = new FontFace(f.name, arr);
        await fontFace.load();
        document.fonts.add(fontFace);
        addFontOption(f.name);
      }catch(e){
        console.warn('خط مخزن فشل بالتحمّل', e);
      }
    }
  }

  function addFontOption(name){
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    fontSelect.appendChild(opt);
  }

  /* -------- إنشاء 50 تدرج لوني -------- */
  const gradients = [];
  // نولد 50 تدرج جمالي جاهز (ثنائية الألوان)
  const palette = [
    ['#FFD27F','#FFB347'], ['#FF9A9E','#FAD0C4'], ['#A18CD1','#FBC2EB'], ['#FAD961','#F76B1C'],
    ['#4facfe','#00f2fe'], ['#43e97b','#38f9d7'], ['#667eea','#764ba2'], ['#f6d365','#fda085'],
    ['#ffecd2','#fcb69f'], ['#a1c4fd','#c2e9fb'], ['#fbc2eb','#a6c1ee'], ['#fdcbf1','#e6dee9'],
    ['#fddb92','#d1fdff'], ['#e0c3fc','#8ec5fc'], ['#f093fb','#f5576c'], ['#5ee7df','#b490ca'],
    ['#ff9a9e','#fecfef'], ['#f6d365','#fda085'], ['#92a9f8','#a0e9fd'], ['#cfd9df','#e2ebf0'],
    ['#ff7e5f','#feb47b'], ['#ffafbd','#ffc3a0'], ['#84fab0','#8fd3f4'], ['#c6ffdd','#fbd786'],
    ['#fbc2eb','#a6c1ee'], ['#fad0c4','#ffd1ff'], ['#fbc2eb','#f8d3ff'], ['#dfe9f3','#fffcdc'],
    ['#f3a683','#f7d794'], ['#c3cfe2','#cfd9df'], ['#fef9a7','#fdd1b6'], ['#e0f7fa','#ffe6f0'],
    ['#ffecd2','#fcb69f'], ['#f093fb','#f5576c'], ['#89f7fe','#66a6ff'], ['#fbd3e9','#bbf7d0'],
    ['#f6d365','#fda085'], ['#fd84a1','#ffb199'], ['#c1dfc4','#f0d4ff'], ['#fceabb','#f8b500'],
    ['#d9a7c7','#fff1f1'], ['#b8e1ff','#d6f3ff'], ['#ffd3a5','#fd6585'], ['#e0c3fc','#8ec5fc'],
    ['#f0e2ec','#b3f0ff'], ['#ffd1ff','#c1f1c5'], ['#f9d29d','#ff8484'], ['#c7ffd8','#a1ffd9'],
    ['#f7ffbe','#ffd1dc'], ['#e6f7ff','#d8ffd6']
  ];
  for(let i=0;i<50;i++){
    gradients.push(palette[i % palette.length]);
  }

  // عرض شبكة التدرجات
  function renderGradientsGrid(){
    gradientsGrid.innerHTML = '';
    gradients.forEach((g, idx) => {
      const el = document.createElement('div');
      el.className = 'result-card';
      el.style.height = '70px';
      el.style.borderRadius = '8px';
      el.style.cursor = 'pointer';
      el.style.background = `linear-gradient(90deg, ${g[0]}, ${g[1]})`;
      el.title = `تدرج ${idx+1}`;
      el.addEventListener('click', () => {
        selectedGradientIndex = idx;
        renderPreview();
      });
      gradientsGrid.appendChild(el);
    });
  }

  // عرض شبكة التلبيسات (من textures)
  function renderTexturesGrid(){
    texturesGrid.innerHTML = '';
    if(texList.length === 0){
      texturesGrid.innerHTML = '<p class="muted">لا توجد تلبيسات مضافة بعد</p>';
      return;
    }
    texList.forEach((data, idx) => {
      const img = document.createElement('img');
      img.src = data;
      img.style.width = '100%';
      img.style.height = '80px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        selectedTextureIndex = idx;
        renderPreview();
      });
      texturesGrid.appendChild(img);
    });
  }

  /* -------- حالة مختارة للتلوين -------- */
  let selectedGradientIndex = 0;
  let selectedTextureIndex = 0;

  /* -------- تحميل الصور المعرض والمعاينة (gallery) -------- */
  function renderGallery(){
    galleryEl.innerHTML = '';
    if(galleryList.length === 0){
      galleryEl.innerHTML = '<p class="muted">لا توجد صور مضافة بعد</p>';
      return;
    }
    galleryList.forEach((d, idx) => {
      const img = document.createElement('img');
      img.src = d;
      img.style.width = '100%';
      img.style.height = '130px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      galleryEl.appendChild(img);
    });
  }

  /* -------- نتائج البحث (بسيط - يطابق أسماء الصور الافتراضية) -------- */
  searchBtn.addEventListener('click', () => {
    const q = searchInput.value.trim().toLowerCase();
    resultsEl.innerHTML = '';
    if(!q) return;
    // بحث بسيط داخل galleryList اسمح بالعرض كبطاقات
    let found = false;
    galleryList.forEach((d, idx) => {
      // هنا لا أسماء ملفات فعلية لذلك نعرض كل الصور كـ نتائج مطابقة جزئياً
      if(d && d.toLowerCase().includes(q) || true){
        const card = document.createElement('div');
        card.className = 'result-card';
        const im = document.createElement('img'); im.src = d; im.style.width = '100%'; im.style.height='120px'; im.style.objectFit='cover';
        const dl = document.createElement('button'); dl.textContent = 'تحميل'; dl.addEventListener('click', ()=> downloadDataURL(d, `image-${idx+1}.png`));
        card.appendChild(im); card.appendChild(dl);
        resultsEl.appendChild(card);
        found = true;
      }
    });
    if(!found) resultsEl.innerHTML = '<p class="muted">لا توجد نتائج</p>';
  });

  /* -------- names section : نعرض نتائج فارغة كما طلبت -------- */
  const namesInput = document.getElementById('names-input');
  const namesResults = document.getElementById('names-results');
  namesInput.addEventListener('input', () => {
    namesResults.innerHTML = ''; // نظيف النتائج (تفريغ) — تظل فارغة كما طلبت
  });

  /* -------- تفعيل تبديل الأقسام -------- */
  menuItems.forEach(it => {
    it.addEventListener('click', () => {
      const target = it.getAttribute('data-section');
      sections.forEach(s => s.classList.remove('active'));
      const el = document.getElementById(target);
      if(el) el.classList.add('active');
      sideMenu.classList.remove('active');
    });
  });
  sideBtn.addEventListener('click', ()=> sideMenu.classList.add('active'));
  closeSide.addEventListener('click', ()=> sideMenu.classList.remove('active'));

  // زر ابدأ
  startBtn.addEventListener('click', ()=> welcome.style.display = 'none');

  /* -------- لوحة التحكم: الدخول فقط ثم إظهار الخيارات -------- */
  settingsBtn.addEventListener('click', () => {
    controlPanel.classList.remove('hidden');
    loginArea.style.display = 'block';
    panelOptions.classList.add('hidden');
    panelPassword.value = '';
  });
  closePanel.addEventListener('click', () => controlPanel.classList.add('hidden'));

  panelLogin.addEventListener('click', () => {
    const val = panelPassword.value;
    if(val === savedPassword){
      loginArea.style.display = 'none';
      panelOptions.classList.remove('hidden');
      // عند الدخول، نعرض البيانات المخزنة داخل لوحة التحكم
      document.getElementById('about-text').value = aboutText;
      document.getElementById('contact-text').value = contactText;
    } else {
      alert('كلمة المرور غير صحيحة');
    }
  });

  savePasswordBtn.addEventListener('click', () => {
    const np = newPasswordInput.value.trim();
    if(!np || np.length < 3) return alert('أدخل كلمة مرور أقوى (3 أحرف على الأقل).');
    savedPassword = np;
    localStorage.setItem('panelPassword', savedPassword);
    newPasswordInput.value = '';
    alert('تم حفظ كلمة المرور');
  });

  /* -------- رفع وحفظ الصور للتطبيق (gallery) -------- */
  const uploadGallery = document.getElementById('upload-gallery');
  const saveGallery = document.getElementById('save-gallery');
  saveGallery.addEventListener('click', async () => {
    const files = uploadGallery.files;
    if(!files || files.length === 0) return alert('اختر صوراً أولاً');
    for(const f of files){
      const data = await readFileAsDataURL(f);
      galleryList.push(data);
    }
    localStorage.setItem('app_gallery', JSON.stringify(galleryList));
    uploadGallery.value = '';
    renderGallery();
    alert('تم حفظ صور المعرض');
  });

  /* -------- رفع وحفظ التلبيسات (textures) -------- */
  const uploadTex = document.getElementById('upload-tex');
  const saveTex = document.getElementById('save-tex');
  saveTex.addEventListener('click', async () => {
    const files = uploadTex.files;
    if(!files || files.length === 0) return alert('اختر صور التلبيس');
    for(const f of files){
      const data = await readFileAsDataURL(f);
      texList.push(data);
    }
    localStorage.setItem('app_textures', JSON.stringify(texList));
    uploadTex.value = '';
    renderTexturesGrid();
    alert('تم حفظ التلبيسات');
  });

  /* -------- رفع وحفظ الخطوط (ttf/otf) -------- */
  const uploadFonts = document.getElementById('upload-fonts');
  const saveFonts = document.getElementById('save-fonts');
  saveFonts.addEventListener('click', async () => {
    const files = uploadFonts.files;
    if(!files || files.length === 0) return alert('اختر ملفات الخطوط');
    for(const f of files){
      const base64 = await readFileAsBase64(f); // data:...;base64,....
      // نحفظ فقط الجزء بعد "base64,"
      const parts = base64.split(',');
      const b64 = parts.length>1?parts[1]:parts[0];
      const fontName = f.name.replace(/\.[^/.]+$/, "");
      fontsList.push({name:fontName, data:b64});
      // تحميل فوري عبر FontFace
      try{
        const binary = atob(b64);
        const arr = new Uint8Array(binary.length);
        for(let i=0;i<binary.length;i++) arr[i]=binary.charCodeAt(i);
        const fontFace = new FontFace(fontName, arr);
        await fontFace.load();
        document.fonts.add(fontFace);
        addFontOption(fontName);
      }catch(e){
        console.warn('فشل تحميل الخط مؤقتاً', e);
      }
    }
    localStorage.setItem('app_fonts', JSON.stringify(fontsList));
    uploadFonts.value = '';
    alert('تم رفع الخطوط وإضافتها للقائمة');
  });

  // دالة مساعدة: قراءة ملف كـ dataURL
  function readFileAsDataURL(file){
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = ()=> res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  }
  // دالة مساعدة: قراءة ملف كـ base64
  function readFileAsBase64(file){
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = ()=> res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  }

  /* -------- حفظ نص About & Contact من لوحة التحكم -------- */
  const aboutTextEl = document.getElementById('about-text');
  const contactTextEl = document.getElementById('contact-text');
  document.getElementById('save-about').addEventListener('click', () => {
    const t = aboutTextEl.value.trim();
    aboutText = t;
    localStorage.setItem('app_about', aboutText);
    aboutContent.textContent = aboutText || 'تطبيق يقدم أدوات زخرفة وتصميم بسيطة وسريعة.';
    alert('تم حفظ نص لمحة التطبيق');
  });
  document.getElementById('save-contact').addEventListener('click', () => {
    const t = contactTextEl.value.trim();
    contactText = t;
    localStorage.setItem('app_contact', contactText);
    contactContent.textContent = contactText || 'email@example.com';
    alert('تم حفظ نص اتصل بنا');
  });

  /* -------- تحميل داتا-يو آر إل كصورة -------- */
  function downloadDataURL(dataURL, filename){
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* -------- إعداد المحرر/الـ canvas لمعرفة النتائج -------- */
  // تحميل الخطوط الافتراضية أولاً ثم أي خطوط مخزنة
  loadFontsOnStart();

  async function loadFontsOnStart(){
    // أضف الخيارات الافتراضية
    defaultFonts.forEach(f=> addFontOption(f.name));
    // ثم الخطوط المحفوظة سابقاً
    for(const f of fontsList){
      try{
        // تحويل base64 إلى ArrayBuffer ثم FontFace
        const binary = atob(f.data);
        const arr = new Uint8Array(binary.length);
        for(let i=0;i<binary.length;i++) arr[i]=binary.charCodeAt(i);
        const fontFace = new FontFace(f.name, arr);
        await fontFace.load();
        document.fonts.add(fontFace);
        addFontOption(f.name);
      }catch(e){
        console.warn('فشل تحميل خط مخزن', e);
      }
    }
    renderGradientsGrid();
    renderTexturesGrid();
    renderGallery();
  }

  // إضافة خيار في select
  function addFontOption(name){
    // تمنع التكرار
    if([...fontSelect.options].some(o=>o.value===name)) return;
    const op = document.createElement('option');
    op.value = name; op.textContent = name;
    fontSelect.appendChild(op);
  }

  // تحميل صورة مرفوعة لعنصر معاينة (لو رفع المستخدم صورة اسم)
  let uploadedNameImage = null;
  decorUpload.addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if(!f) return;
    uploadedNameImage = await readFileAsDataURL(f);
    renderPreview();
  });

  // تريجر المعاينة عند كتابة الاسم أو تغيير الإعدادات
  [decorText, fontSelect, solidColor, colorType].forEach(el => {
    el.addEventListener('input', () => renderPreview());
  });

  // استجابة لاختيار نوع اللون: إظهار/إخفاء شبكات
  colorType.addEventListener('change', () => {
    const v = colorType.value;
    gradientsGrid.style.display = v==='gradient' ? 'grid' : 'none';
    texturesGrid.style.display = v==='texture' ? 'grid' : 'none';
    renderPreview();
  });

  // دالة رسم المعاينة الحقيقية
  function clearCanvas(){
    ctx.clearRect(0,0,previewCanvas.width, previewCanvas.height);
    // خلفية شفافه
    ctx.fillStyle = 'rgba(255,255,255,0)';
    ctx.fillRect(0,0,previewCanvas.width, previewCanvas.height);
  }

  function renderPreview(){
    clearCanvas();
    const text = decorText.value.trim();
    // إذا رفع المستخدم صورة للاسم، نعرضها مباشرة (لاطباق تلوين النص)
    if(uploadedNameImage){
      const img = new Image();
      img.onload = () => {
        // رسم الصورة داخل الكانفاس مع تناسب
        const ratio = Math.min(previewCanvas.width / img.width, previewCanvas.height / img.height);
        const w = img.width * ratio, h = img.height * ratio;
        ctx.drawImage(img, (previewCanvas.width-w)/2, (previewCanvas.height-h)/2, w, h);
      };
      img.src = uploadedNameImage;
      return;
    }

    // بدون نص: نعرض رسالة
    if(!text){
      ctx.fillStyle = '#222';
      ctx.font = '18px sans-serif';
      ctx.fillText('اكتب اسماً لمعاينته هنا', 20, 40);
      return;
    }

    // إعداد الخط من الاختيار
    const fontName = fontSelect.value || 'sans-serif';
    const fontSize = 72;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fontSize}px "${fontName}", sans-serif`;

    // القياسات
    const x = previewCanvas.width/2;
    const y = previewCanvas.height/2;

    // تلوين حسب النوع
    const type = colorType.value;
    if(type==='solid'){
      ctx.fillStyle = solidColor.value;
      ctx.fillText(text, x, y);
    } else if(type==='gradient'){
      const g = gradients[selectedGradientIndex] || gradients[0];
      const grad = ctx.createLinearGradient(0,0,previewCanvas.width,0);
      grad.addColorStop(0, g[0]); grad.addColorStop(1, g[1]);
      ctx.fillStyle = grad;
      ctx.fillText(text, x, y);
    } else if(type==='texture'){
      // استخدام التلبيس كـ pattern
      if(!texList[selectedTextureIndex]) {
        // fallback to solid
        ctx.fillStyle = solidColor.value;
        ctx.fillText(text, x, y);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const pattern = ctx.createPattern(img, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillText(text, x, y);
      };
      img.src = texList[selectedTextureIndex];
    }
  }

  // زر تحميل النتيجة
  downloadBtn.addEventListener('click', () => {
    // نسأل المستخدم عن العرض (المقاسات) - بسيط عبر prompt
    const w = parseInt(prompt('أدخل عرض الصورة بالـ px (مثال 1200):', '1200')) || 1200;
    const h = parseInt(prompt('أدخل ارتفاع الصورة بالـ px (مثال 400):', '400')) || 400;
    // نستخدم كانفاس مؤقت
    const temp = document.createElement('canvas');
    temp.width = w; temp.height = h;
    const tctx = temp.getContext('2d');

    // نعيد رسم بنفس الإعدادات
    // خلفية شفافة
    tctx.clearRect(0,0,w,h);
    // نص/صورة مشابه للمعاينة
    if(uploadedNameImage){
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(w / img.width, h / img.height);
        const rw = img.width * ratio, rh = img.height * ratio;
        tctx.drawImage(img, (w-rw)/2, (h-rh)/2, rw, rh);
        downloadDataURL(temp.toDataURL('image/png'), 'result.png');
      };
      img.src = uploadedNameImage;
      return;
    }

    const text = decorText.value.trim();
    const fontName = fontSelect.value || 'sans-serif';
    const fontSize = Math.floor(h * 0.4);
    tctx.textAlign = 'center'; tctx.textBaseline = 'middle';
    tctx.font = `${fontSize}px "${fontName}", sans-serif`;

    const type = colorType.value;
    if(type==='solid'){
      tctx.fillStyle = solidColor.value;
      tctx.fillText(text, w/2, h/2);
      downloadDataURL(temp.toDataURL('image/png'), 'result.png');
    } else if(type==='gradient'){
      const g = gradients[selectedGradientIndex] || gradients[0];
      const grad = tctx.createLinearGradient(0,0,w,0);
      grad.addColorStop(0, g[0]); grad.addColorStop(1, g[1]);
      tctx.fillStyle = grad;
      tctx.fillText(text, w/2, h/2);
      downloadDataURL(temp.toDataURL('image/png'), 'result.png');
    } else if(type==='texture'){
      if(!texList[selectedTextureIndex]){
        tctx.fillStyle = solidColor.value;
        tctx.fillText(text, w/2, h/2);
        downloadDataURL(temp.toDataURL('image/png'), 'result.png');
        return;
      }
      const img = new Image();
      img.onload = () => {
        const pattern = tctx.createPattern(img, 'repeat');
        tctx.fillStyle = pattern;
        tctx.fillText(text, w/2, h/2);
        downloadDataURL(temp.toDataURL('image/png'), 'result.png');
      };
      img.src = texList[selectedTextureIndex];
    }
  });

  /* -------- مساعدة تحميل داتا-يو آر إل -------- */
  function downloadDataURL(dataURL, filename){
    const a = document.createElement('a'); a.href = dataURL; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  }

});
