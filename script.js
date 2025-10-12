/* script-part1.js
   جزء 1/2 — واجهة، ترحيب، الشريط، sidebar، فتح لوحة التحكم (مصادقة مرتبطة بجزء2)
*/
(function(){
  "use strict";
  document.addEventListener('DOMContentLoaded', ()=>{

    // عناصر
    const welcomeModal = document.getElementById('welcomeModal');
    const startApp = document.getElementById('startApp');
    const mainContent = document.getElementById('mainContent');
    const sectionsToggle = document.getElementById('sectionsToggle');
    const sideNav = document.getElementById('sideNav');
    const closeSide = document.getElementById('closeSide');
    const sideItems = Array.from(document.querySelectorAll('.side-item') || []);
    const pages = Array.from(document.querySelectorAll('.page') || []);
    const controlBtn = document.getElementById('controlBtn');
    const controlModal = document.getElementById('controlModal');
    const closeControl = document.getElementById('closeControl');

    // إصلاح: إظهار المحتوى بعد الضغط على ابدأ
    if (startApp && welcomeModal) {
      startApp.addEventListener('click', ()=>{
        welcomeModal.style.transition = 'opacity .35s ease, transform .35s ease';
        welcomeModal.style.opacity = '0';
        welcomeModal.style.transform = 'scale(.98)';
        setTimeout(()=> {
          if (welcomeModal && welcomeModal.parentNode) welcomeModal.parentNode.removeChild(welcomeModal);
        }, 360);
        if (mainContent) mainContent.classList.remove('hidden');
        document.dispatchEvent(new CustomEvent('app:started'));
      });
    }

    // sidebar toggle
    if (sectionsToggle && sideNav) {
      sectionsToggle.addEventListener('click', ()=>{
        sideNav.classList.toggle('hidden');
        sideNav.setAttribute('aria-hidden', sideNav.classList.contains('hidden') ? 'true' : 'false');
      });
    }
    if (closeSide && sideNav) {
      closeSide.addEventListener('click', ()=>{
        sideNav.classList.add('hidden');
        sideNav.setAttribute('aria-hidden','true');
      });
    }

    // navigation between sections
    function showSection(id){
      pages.forEach(p => p.classList.toggle('active', p.id === id));
    }
    if (sideItems.length) {
      sideItems.forEach(li => {
        li.addEventListener('click', ()=>{
          sideItems.forEach(i=>i.classList.remove('active'));
          li.classList.add('active');
          const target = li.dataset.target;
          if (target) showSection(target);
          if (sideNav) { sideNav.classList.add('hidden'); sideNav.setAttribute('aria-hidden','true'); }
        });
      });
    }

    // control modal open/close
    if (controlBtn && controlModal) {
      controlBtn.addEventListener('click', ()=>{
        controlModal.classList.toggle('hidden');
        controlModal.setAttribute('aria-hidden', controlModal.classList.contains('hidden') ? 'true' : 'false');
        // reset auth panel (controlAuth visible by default)
        const controlAuth = document.getElementById('controlAuth');
        const controlArea = document.getElementById('controlArea');
        if (controlAuth) controlAuth.style.display = '';
        if (controlArea) controlArea.classList.add('hidden');
        const adminPass = document.getElementById('adminPass');
        if (adminPass) adminPass.value = '';
      });
    }
    if (closeControl) {
      closeControl.addEventListener('click', ()=> {
        if (controlModal) controlModal.classList.add('hidden');
      });
    }

    // search button (delegated to part2)
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', ()=> document.dispatchEvent(new CustomEvent('ui:search')));

    // ocr button info
    const ocrBtn = document.getElementById('ocrBtn');
    if (ocrBtn) ocrBtn.addEventListener('click', ()=> {
      alert('لإجراء OCR: اختر صورة من "الصور المضافة" ثم اضغط زر "OCR على الصورة". لإضافة OCR محلي أضف Tesseract.js.');
    });

    // notify ready
    document.dispatchEvent(new CustomEvent('ui:ready'));

  });
})();
/* script-part2.js
  جزء 2/2 — وظائف لوحة التحكم، رفع الصور/الخطوط/التلبيسات/ستايلات، زخرفة الأسماء، حفظ محلي، تنزيل، إشعارات
*/
(function(){
  "use strict";
  document.addEventListener('DOMContentLoaded', ()=>{

    // --- مفاتيح ال LocalStorage والاعدادات ---
    const DEFAULT_ADMIN_PWD = 'asd321';
    const LS = {
      adminPwd: 'app_admin_pwd_v2',
      userImages: 'userImages_v2',
      clothesImages: 'clothesImages_v2',
      uploadedFonts: 'uploadedFonts_v2',
      nameStyles: 'nameStyles_v2',
      contactImages: 'contactImages_v2',
      aboutText: 'aboutText_v2',
      contactText: 'contactText_v2'
    };

    // --- مساعدات حفظ وقراءة ---
    function save(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){console.warn(e);} }
    function load(k,def=[]){ try{ const s=localStorage.getItem(k); return s?JSON.parse(s):def;}catch(e){console.warn(e); return def;} }

    // --- بيانات مخزنة محلياً ---
    let userImages = load(LS.userImages, []);
    let clothesImages = load(LS.clothesImages, []);
    let uploadedFonts = load(LS.uploadedFonts, []);
    let nameStyles = load(LS.nameStyles, []);
    let contactImages = load(LS.contactImages, []);

    // --- عناصر واجهة ---
    const gallery = document.getElementById('gallery');
    const resultsGrid = document.getElementById('resultsGrid');
    const uploadImages = document.getElementById('uploadImages');
    const uploadClothes = document.getElementById('uploadClothes');
    const uploadFonts = document.getElementById('uploadFonts');
    const uploadStyles = document.getElementById('uploadStyles');
    const fontSelect = document.getElementById('fontSelect');
    const clotheSelect = document.getElementById('clotheSelect');
    const gradientSelect = document.getElementById('gradientSelect');
    const fontNameInput = document.getElementById('fontNameInput');
    const fontPreview = document.getElementById('fontPreview');
    const generateFont = document.getElementById('generateFont');
    const genNameStyles = document.getElementById('genNameStyles');
    const nameInput = document.getElementById('nameInput');
    const nameResults = document.getElementById('nameResults');
    const aboutEditor = document.getElementById('aboutEditor');
    const contactEditor = document.getElementById('contactEditor');
    const addContactImage = document.getElementById('addContactImage');
    const contactImageFile = document.getElementById('contactImageFile');
    const contactImageLink = document.getElementById('contactImageLink');
    const saveControl = document.getElementById('saveControl');
    const adminLogin = document.getElementById('adminLogin');
    const adminPass = document.getElementById('adminPass');
    const controlAuth = document.getElementById('controlAuth');
    const controlArea = document.getElementById('controlArea');
    const logoutBtn = document.getElementById('logoutBtn');

    // toast (إشعار ذهبي صغير حسب اختيارك 1)
    function showToast(msg, time=2200){
      let t = document.querySelector('.toast');
      if(!t){ t = document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
      t.textContent = msg; t.classList.add('show');
      setTimeout(()=> t.classList.remove('show'), time);
    }

    // ensure admin pwd saved
    function getAdminPwd(){ return localStorage.getItem(LS.adminPwd) || null; }
    function ensureAdminPwd(){ if(!getAdminPwd()) localStorage.setItem(LS.adminPwd, DEFAULT_ADMIN_PWD); }
    function setAdminPwd(p){ localStorage.setItem(LS.adminPwd, p); showToast('تم تغيير كلمة المرور'); }

    ensureAdminPwd();

    // hide any visible DEFAULT password text in DOM
    (function hideDefaultPwdText(){
      try{
        const nodes = Array.from(document.querySelectorAll('body *'));
        nodes.forEach(n=>{
          if(n && n.childNodes){
            n.childNodes.forEach(c=>{
              if(c.nodeType===3 && c.nodeValue && c.nodeValue.includes(DEFAULT_ADMIN_PWD)){
                c.nodeValue = c.nodeValue.replace(new RegExp(DEFAULT_ADMIN_PWD,'g'),'••••••');
              }
            });
          }
        });
      }catch(e){console.warn(e);}
    })();

    // render gallery
    function renderGallery(){
      if(!gallery) return;
      gallery.innerHTML = '';
      if(!userImages.length){ const d=document.createElement('div'); d.className='gold-card'; d.textContent='لا توجد صور مضافة — استخدم لوحة التحكم لإضافة صور'; gallery.appendChild(d); return;}
      userImages.forEach(img=>{
        const card=document.createElement('div'); card.className='design-card';
        card.innerHTML = `<img src="${img.data}" alt="${img.name}" /><div style="margin-top:8px;font-size:0.95rem">${img.name}</div>
          <div style="margin-top:8px"><button class="btn download-btn" data-name="${img.name}">تحميل</button>
          <button class="btn ocr-btn" data-name="${img.name}">OCR على الصورة</button></div>`;
        gallery.appendChild(card);
      });
      Array.from(gallery.querySelectorAll('.download-btn')).forEach(b=>b.addEventListener('click',()=>{
        const nm=b.getAttribute('data-name'); const found=userImages.find(i=>i.name===nm); if(found) downloadDataURL(found.data, found.name);
      }));
      Array.from(gallery.querySelectorAll('.ocr-btn')).forEach(b=>b.addEventListener('click',()=>{
        const nm=b.getAttribute('data-name'); const found=userImages.find(i=>i.name===nm); if(found) document.dispatchEvent(new CustomEvent('perform:ocr',{detail:{name:nm,data:found.data}}));
      }));
    }

    // download helper
    function downloadDataURL(dataUrl, filename){
      try{ const a=document.createElement('a'); a.href=dataUrl; a.download = filename||'image.png'; document.body.appendChild(a); a.click(); a.remove(); }catch(e){console.warn(e); alert('فشل التحميل');}
    }

    // populate font select
    function populateFontSelect(){
      if(!fontSelect) return;
      fontSelect.innerHTML='';
      const defaults = ['Cairo','Reem Kufi','Amiri','Tajawal','Noto Kufi Arabic','El Messiri','Changa'];
      defaults.forEach(f=>{ const o=document.createElement('option'); o.value=f; o.textContent=f; fontSelect.appendChild(o); });
      const up = load(LS.uploadedFonts, []);
      up.forEach(f=>{ const o=document.createElement('option'); o.value=f.url; o.textContent=f.name; fontSelect.appendChild(o); });
    }

    // populate clothe select
    function populateClotheSelect(){
      if(!clotheSelect) return;
      clotheSelect.innerHTML='';
      if(!clothesImages.length){ const o=document.createElement('option'); o.value=''; o.textContent='لا توجد تلبيسات'; clotheSelect.appendChild(o); return; }
      clothesImages.forEach((d,i)=>{ const o=document.createElement('option'); o.value=d; o.textContent=`تلبيس ${i+1}`; clotheSelect.appendChild(o); });
    }

    // upload handlers
    if(uploadImages) uploadImages.addEventListener('change', (ev)=>{
      const files = Array.from(ev.target.files||[]);
      if(!files.length) return;
      const readers = files.map(f=>new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res({name:f.name,data:e.target.result}); r.onerror=rej; r.readAsDataURL(f); }));
      Promise.all(readers).then(list=>{
        userImages = userImages.concat(list); save(LS.userImages,userImages); renderGallery(); showToast('تم رفع الصور'); uploadImages.value='';
      }).catch(e=>{console.warn(e); alert('فشل رفع الصور');});
    });

    if(uploadClothes) uploadClothes.addEventListener('change', (ev)=>{
      const files = Array.from(ev.target.files||[]);
      if(!files.length) return;
      const readers = files.map(f=>new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=rej; r.readAsDataURL(f); }));
      Promise.all(readers).then(list=>{
        clothesImages = clothesImages.concat(list); save(LS.clothesImages,clothesImages); populateClotheSelect(); showToast('تم رفع التلبيسات'); uploadClothes.value='';
      }).catch(e=>{console.warn(e); alert('فشل رفع التلبيسات');});
    });

    if(uploadFonts) uploadFonts.addEventListener('change', (ev)=>{
      const files = Array.from(ev.target.files||[]);
      if(!files.length) return;
      const readers = files.map(f=>new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res({name:f.name,data:e.target.result}); r.onerror=rej; r.readAsDataURL(f); }));
      Promise.all(readers).then(list=>{
        const existing = load(LS.uploadedFonts, []);
        list.forEach(f=>{
          existing.push({name:f.name,url:f.data});
          try{
            const fontFaceName = f.name.replace(/\.[^/.]+$/,'').replace(/\s+/g,'_');
            if(!document.getElementById('font-'+fontFaceName)){
              const style = document.createElement('style'); style.id='font-'+fontFaceName;
              style.innerHTML = `@font-face{font-family:'${fontFaceName}';src:url('${f.data}');}`;
              document.head.appendChild(style);
            }
          }catch(err){console.warn(err);}
        });
        save(LS.uploadedFonts,existing); uploadedFonts = existing; populateFontSelect(); showToast('تم رفع الخطوط'); uploadFonts.value='';
      }).catch(e=>{console.warn(e); alert('فشل رفع الخطوط');});
    });

    // upload styles (json/js)
    if(uploadStyles) uploadStyles.addEventListener('change', (ev)=>{
      const files = Array.from(ev.target.files||[]);
      if(!files.length) return;
      files.forEach(file=>{
        const reader = new FileReader();
        reader.onload = e=>{
          try{
            if(file.name.toLowerCase().endsWith('.json')){
              const parsed = JSON.parse(e.target.result);
              nameStyles.push(parsed); save(LS.nameStyles,nameStyles); showToast('تم إضافة ستايل JSON');
            } else if(file.name.toLowerCase().endsWith('.js')){
              // save JS text (no eval). We'll try to extract pattern strings safely.
              nameStyles.push({js:e.target.result, name:file.name}); save(LS.nameStyles,nameStyles); showToast('تم إضافة ستايل JS');
            }
          }catch(err){console.warn(err); alert('فشل قراءة ملف الستايل');}
        };
        reader.readAsText(file);
      });
      uploadStyles.value='';
    });

    // safeApplyStyle: يحاول استخراج pattern من json/js بدون تنفيذ
    function safeApplyStyle(text, style){
      if(!style) return text;
      try{
        if(typeof style === 'string') return style.replace('{{text}}', text);
        if(style.pattern && typeof style.pattern === 'string') return style.pattern.replace('{{text}}', text);
        if(style.js && typeof style.js === 'string'){
          // محاولة استخراج نص يحتوي {{text}}
          const m = style.js.match(/['"`]([^'"`{]*\{\{text\}\}[^'"`]*)['"`]/);
          if(m && m[1]) return m[1].replace('{{text}}', text);
        }
      }catch(e){console.warn(e);}
      return text;
    }

    // generate name results
    function renderNameResults(text){
      if(!nameResults) return;
      nameResults.innerHTML = '';
      const styles = load(LS.nameStyles, []);
      if(!styles.length){ const no=document.createElement('div'); no.className='gold-card'; no.textContent='لا توجد ستايلات مرفوعة بعد'; nameResults.appendChild(no); return; }
      const limit = Math.min(styles.length, 100);
      for(let i=0;i<limit;i++){
        const s = styles[i%styles.length];
        const out = safeApplyStyle(text, s);
        const box = document.createElement('div'); box.className='name-box'; box.textContent = out; nameResults.appendChild(box);
      }
    }

    // UI interactions: preview font
    function updateFontPreview(){
      if(!fontPreview) return;
      const text = (fontNameInput && fontNameInput.value) ? fontNameInput.value : 'نص تجريبي';
      fontPreview.textContent = text;
      const f = (fontSelect && fontSelect.value) ? fontSelect.value : 'Cairo';
      fontPreview.style.fontFamily = `${f}, sans-serif`;
      // modes
      const active = document.querySelector('.mode-btn.active');
      const mode = active ? active.dataset.mode : 'solid';
      fontPreview.style.background=''; fontPreview.style.webkitBackgroundClip=''; fontPreview.style.color='';
      if(mode==='solid'){ const c = document.getElementById('solidColor'); fontPreview.style.color = c?c.value:'#d4af37'; }
      else if(mode==='gradient'){ const g = gradientSelect?gradientSelect.value:''; if(g){ fontPreview.style.background=g; fontPreview.style.webkitBackgroundClip='text'; fontPreview.style.color='transparent'; } }
      else if(mode==='clothe'){ const src = clotheSelect?clotheSelect.value:''; if(src){ fontPreview.style.background=`url('${src}') center/cover`; fontPreview.style.webkitBackgroundClip='text'; fontPreview.style.color='transparent'; } }
    }

    // wire preview inputs
    ['fontNameInput','fontSelect','gradientSelect','clotheSelect','solidColor'].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.addEventListener('input', updateFontPreview);
    });
    const modeBtns = Array.from(document.querySelectorAll('.mode-btn')||[]);
    modeBtns.forEach(b=>b.addEventListener('click', ()=>{
      modeBtns.forEach(x=>x.classList.remove('active')); b.classList.add('active'); updateFontPreview();
    }));
    if(generateFont) generateFont.addEventListener('click', updateFontPreview);

    // gen name styles
    if(genNameStyles && nameInput) genNameStyles.addEventListener('click', ()=> {
      const v = (nameInput.value||'').trim();
      if(!v) return alert('أدخل الاسم أولاً');
      renderNameResults(v);
    });

    // contact images add
    if(addContactImage && contactImageFile && contactImageLink) addContactImage.addEventListener('click', ()=>{
      const f = contactImageFile.files && contactImageFile.files[0];
      const link = (contactImageLink.value||'').trim();
      if(!f || !link) return alert('اختر صورة وأدخل رابط');
      const r = new FileReader();
      r.onload = e=>{
        contactImages.push({src:e.target.result, link}); save(LS.contactImages, contactImages); renderContactLinks(); showToast('تم إضافة صورة التواصل');
        contactImageFile.value=''; contactImageLink.value='';
      };
      r.readAsDataURL(f);
    });

    function renderContactLinks(){
      const el = document.getElementById('contactLinks');
      if(!el) return;
      el.innerHTML='';
      if(!contactImages.length){ const d=document.createElement('div'); d.className='gold-card'; d.textContent='لا توجد روابط بعد'; el.appendChild(d); return; }
      contactImages.forEach(ci=>{
        const a = document.createElement('a'); a.href = ci.link; a.target='_blank'; a.rel='noopener noreferrer';
        a.innerHTML = `<img src="${ci.src}" alt="contact" />`;
        el.appendChild(a);
      });
    }

    // save about/contact
    if(aboutEditor) aboutEditor.value = localStorage.getItem(LS.aboutText) || (document.getElementById('aboutText')?document.getElementById('aboutText').textContent:'');
    if(contactEditor) contactEditor.value = localStorage.getItem(LS.contactText) || '';
    if(saveControl) saveControl.addEventListener('click', ()=> {
      const a = aboutEditor?aboutEditor.value.trim() : '';
      const c = contactEditor?contactEditor.value.trim() : '';
      if(document.getElementById('aboutText') && a) document.getElementById('aboutText').textContent = a;
      localStorage.setItem(LS.aboutText, a); localStorage.setItem(LS.contactText, c); showToast('تم حفظ التغييرات');
    });

    // admin login
    if(adminLogin && adminPass){
      adminLogin.addEventListener('click', ()=>{
        const v = (adminPass.value||'').trim();
        const saved = localStorage.getItem(LS.adminPwd) || DEFAULT_ADMIN_PWD;
        if(v === saved){
          if(controlAuth) controlAuth.style.display = 'none';
          if(controlArea) controlArea.classList.remove('hidden');
          showToast('تم تسجيل الدخول');
          // render initial UI
          populateClotheSelect(); populateFontSelect(); renderGallery(); renderContactLinks();
        } else { alert('كلمة المرور غير صحيحة'); adminPass.value=''; }
      });
    }

    // change password
    const changeBtn = document.getElementById('changePwdBtn');
    if(changeBtn){
      changeBtn.addEventListener('click', ()=>{
        const cur = (document.getElementById('curAdminPwd').value||'').trim();
        const nw = (document.getElementById('newAdminPwd').value||'').trim();
        const cf = (document.getElementById('confirmAdminPwd').value||'').trim();
        const saved = localStorage.getItem(LS.adminPwd) || DEFAULT_ADMIN_PWD;
        if(!cur||!nw) return alert('املأ الحقول المطلوبة');
        if(cur !== saved) return alert('كلمة المرور الحالية غير صحيحة');
        if(nw.length < 4) return alert('يجب أن تكون كلمة المرور الجديدة 4 أحرف على الأقل');
        if(nw !== cf) return alert('تأكيد كلمة المرور غير مطابق');
        localStorage.setItem(LS.adminPwd, nw); showToast('تم تغيير كلمة المرور بنجاح'); document.getElementById('curAdminPwd').value=''; document.getElementById('newAdminPwd').value=''; document.getElementById('confirmAdminPwd').value='';
      });
    }

    // render initial UI and wire events
    function init(){
      populateClotheSelect(); populateFontSelect(); renderGallery(); renderContactLinks();
    }
    init();

    // listen from part1 events
    document.addEventListener('ui:ready', ()=> init());
    document.addEventListener('ui:search', ()=> {
      const q = (document.getElementById('fileSearch') && document.getElementById('fileSearch').value) ? document.getElementById('fileSearch').value.trim().toLowerCase() : '';
      try{
        const stored = load(LS.userImages, []);
        const filtered = stored.filter(i => (i.name||'').toLowerCase().includes(q));
        // render results
        const rg = document.getElementById('resultsGrid');
        if(!rg) return;
        rg.innerHTML='';
        if(!filtered.length){ const no=document.createElement('div'); no.className='gold-card'; no.textContent='لا توجد نتائج'; rg.appendChild(no); return;}
        filtered.forEach(item=>{
          const card=document.createElement('div'); card.className='result-card';
          card.innerHTML = `<img src="${item.data}" alt="${item.name}" /><div style="margin-top:8px">${item.name}</div><div style="margin-top:8px"><button class="btn download-btn" data-name="${item.name}">تحميل</button></div>`;
          rg.appendChild(card);
        });
        Array.from(rg.querySelectorAll('.download-btn')).forEach(b=>b.addEventListener('click', ()=>{ const nm=b.getAttribute('data-name'); const found = userImages.find(i=>i.name===nm); if(found) downloadDataURL(found.data, found.name); }));
      }catch(e){ console.warn(e); }
    });

    // OCR handler (uses Tesseract if loaded)
    document.addEventListener('perform:ocr', async (ev)=> {
      const detail = ev.detail || {}; const data = detail.data;
      if(!data) return alert('لا توجد صورة لمعالجتها');
      if(window.Tesseract && typeof window.Tesseract.recognize === 'function'){
        try{
          const worker = window.Tesseract.createWorker();
          await worker.load();
          await worker.loadLanguage('ara+eng');
          await worker.initialize('ara+eng');
          const { data: { text } } = await worker.recognize(data);
          await worker.terminate();
          alert('نتيجة OCR:\n\n' + (text || '(لا يوجد نص)'));
        }catch(err){ console.warn(err); alert('فشل معالجة OCR'); }
      } else {
        alert('OCR غير مفعل محليًا. لإضافة OCR أضف Tesseract.js إلى index.html.');
      }
    });

    // save before unload
    window.addEventListener('beforeunload', ()=> {
      save(LS.userImages, userImages); save(LS.clothesImages, clothesImages); save(LS.uploadedFonts, uploadedFonts); save(LS.nameStyles, nameStyles); save(LS.contactImages, contactImages);
    });

  }); // DOMContentLoaded
})();
