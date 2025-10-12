/* script-part1.js
   الجزء 1/2 — واجهة، ترحيب، شريط علوي (من shbg.png)، القائمة الجانبية، تنقل بين الأقسام، بحث، events عامة
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

    // show main after start
    if (startApp && welcomeModal) {
      startApp.addEventListener('click', ()=>{
        welcomeModal.style.transition = 'opacity .35s ease, transform .35s ease';
        welcomeModal.style.opacity = '0';
        welcomeModal.style.transform = 'scale(.98)';
        setTimeout(()=> {
          if (welcomeModal && welcomeModal.parentNode) welcomeModal.parentNode.removeChild(welcomeModal);
        }, 360);
        if (mainContent) mainContent.classList.remove('hidden');
        // notify other part
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

    // control modal open/close (auth handled in part2)
    if (controlBtn && controlModal) {
      controlBtn.addEventListener('click', ()=>{
        controlModal.classList.toggle('hidden');
        controlModal.setAttribute('aria-hidden', controlModal.classList.contains('hidden') ? 'true' : 'false');
        // reset auth panel
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

    // search button event
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', ()=> document.dispatchEvent(new CustomEvent('ui:search')));

    // info on OCR button
    const ocrBtn = document.getElementById('ocrBtn');
    if (ocrBtn) ocrBtn.addEventListener('click', ()=> {
      alert('لإجراء OCR: اختر صورة من "الصور المضافة" ثم اضغط زر "OCR على الصورة". لإضافة OCR محلي أضف Tesseract.js.');
    });

    // keyboard enter on global search input
    const fileSearch = document.getElementById('fileSearch');
    if (fileSearch) fileSearch.addEventListener('keyup', (e)=> { if (e.key === 'Enter') document.dispatchEvent(new CustomEvent('ui:search')); });

    // initial accessibility attributes
    if (sideNav) sideNav.setAttribute('aria-hidden', sideNav.classList.contains('hidden') ? 'true' : 'false');
    if (controlModal) controlModal.setAttribute('aria-hidden', controlModal.classList.contains('hidden') ? 'true' : 'false');

    // notify ready
    document.dispatchEvent(new CustomEvent('ui:ready'));

  });
})();
/* script-part2.js
   الجزء 2/2 — لوحة التحكم: رفع صور/خطوط/ستايلات، تغيير كلمة مرور، زخرفة الأسماء، حفظ في localStorage
*/
(function(){
  "use strict";
  document.addEventListener('DOMContentLoaded', ()=>{

    const DEFAULT_ADMIN_PWD = 'asd321';
    const LS = {
      adminPwd: 'abohamza_admin_pwd_v_final',
      userImages: 'abohamza_user_images_v_final',
      clothesImages: 'abohamza_clothes_images_v_final',
      uploadedFonts: 'abohamza_uploaded_fonts_v_final',
      nameStyles: 'abohamza_name_styles_v_final',
      contactImages: 'abohamza_contact_images_v_final',
      aboutText: 'abohamza_about_v_final',
      contactText: 'abohamza_contact_v_final'
    };

    // helpers
    const $ = id => document.getElementById(id);
    const saveJSON = (k,v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){console.warn(e);} };
    const loadJSON = (k,def) => { try{ const s = localStorage.getItem(k); return s?JSON.parse(s): (def===undefined?[]:def);}catch(e){console.warn(e); return def===undefined?[]:def;} };
    function showToast(msg, time=2200){
      let t = document.querySelector('.ab-toast');
      if(!t){ t = document.createElement('div'); t.className = 'ab-toast'; document.body.appendChild(t); }
      t.textContent = msg; t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
      setTimeout(()=>{ t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(6px)'; }, time);
    }
    function downloadDataURL(dataURL, filename){ try{ const a=document.createElement('a'); a.href=dataURL; a.download = filename||'download.png'; document.body.appendChild(a); a.click(); a.remove(); }catch(e){ console.warn(e); alert('فشل التحميل'); } }

    // register font
    function registerFontFromDataURL(filename, dataURL){
      try{
        const family = filename.replace(/\.[^/.]+$/,'').replace(/\s+/g,'_');
        const styleId = 'ab-font-'+family;
        if(document.getElementById(styleId)) return family;
        let format = 'truetype';
        if(/\.woff2$/i.test(filename)) format='woff2';
        else if(/\.woff$/i.test(filename)) format='woff';
        else if(/\.otf$/i.test(filename)) format='opentype';
        else if(/\.ttf$/i.test(filename)) format='truetype';
        const style = document.createElement('style'); style.id = styleId;
        style.innerHTML = `@font-face{font-family:'${family}';src:url('${dataURL}') format('${format}');font-weight:normal;font-style:normal;}`;
        document.head.appendChild(style);
        return family;
      }catch(e){ console.warn('registerFont err', e); return null; }
    }

    // extract pattern safe
    function extractPattern(textOrObj){
      try{
        if(!textOrObj) return null;
        if(typeof textOrObj === 'object' && textOrObj.pattern) return textOrObj.pattern;
        if(typeof textOrObj === 'string'){
          try{ const p = JSON.parse(textOrObj); if(p && p.pattern) return p.pattern; }catch(e){}
          const m = textOrObj.match(/['"`]([^'"`{]*\{\{text\}\}[^'"`]*)['"`]/);
          if(m && m[1]) return m[1];
          const m2 = textOrObj.match(/pattern\s*[:=]\s*['"`]([^'"`]*)['"`]/);
          if(m2 && m2[1]) return m2[1];
        }
      }catch(e){ console.warn('extractPattern', e); }
      return null;
    }
    function safeApplyStyle(text, style){
      if(!style) return text;
      try{
        if(typeof style === 'object' && style.pattern) return style.pattern.replace(/\{\{text\}\}/g, text);
        if(typeof style === 'string'){ const p = extractPattern(style); if(p) return p.replace(/\{\{text\}\}/g, text); }
        if(style.js && typeof style.js === 'string'){ const p = extractPattern(style.js); if(p) return p.replace(/\{\{text\}\}/g, text); }
      }catch(e){ console.warn('safeApplyStyle', e); }
      return text;
    }

    // render functions
    function renderGallery(){
      const gallery = $('gallery'); if(!gallery) return; gallery.innerHTML='';
      const arr = loadJSON(LS.userImages, []);
      if(!arr.length){ const d=document.createElement('div'); d.className='gold-card'; d.textContent='لا توجد صور مضافة — استخدم لوحة التحكم لإضافة صور'; gallery.appendChild(d); return; }
      arr.forEach(img=>{
        const card = document.createElement('div'); card.className='design-card';
        card.innerHTML = `<img src="${img.data}" alt="${img.name}" /><div style="margin-top:8px;font-size:0.95rem">${img.name}</div>
          <div style="margin-top:8px"><button class="btn download-btn" data-name="${img.name}">تحميل</button>
          <button class="btn ocr-img" data-name="${img.name}">OCR على الصورة</button></div>`;
        gallery.appendChild(card);
      });
      Array.from(gallery.querySelectorAll('.download-btn')).forEach(b=>b.addEventListener('click', ()=>{
        const nm=b.getAttribute('data-name'); const arr=loadJSON(LS.userImages,[]); const f=arr.find(x=>x.name===nm); if(f) downloadDataURL(f.data,f.name);
      }));
      Array.from(gallery.querySelectorAll('.ocr-img')).forEach(b=>b.addEventListener('click', ()=>{
        const nm=b.getAttribute('data-name'); const arr=loadJSON(LS.userImages,[]); const f=arr.find(x=>x.name===nm); if(f) document.dispatchEvent(new CustomEvent('perform:ocr',{detail:{name:nm,data:f.data}}));
      }));
    }

    function renderResultsGrid(list){
      const rg = $('resultsGrid'); if(!rg) return; rg.innerHTML='';
      if(!list || !list.length){ const d=document.createElement('div'); d.className='gold-card'; d.textContent='لا توجد نتائج'; rg.appendChild(d); return; }
      list.forEach(item=>{
        const card = document.createElement('div'); card.className='result-card';
        card.innerHTML = `<img src="${item.data}" alt="${item.name}" /><div style="margin-top:8px;font-size:0.95rem">${item.name}</div>
          <div style="margin-top:8px"><button class="btn download-btn" data-name="${item.name}">تحميل</button></div>`;
        rg.appendChild(card);
      });
      Array.from(rg.querySelectorAll('.download-btn')).forEach(b=>b.addEventListener('click', ()=>{ const nm=b.getAttribute('data-name'); const arr=loadJSON(LS.userImages,[]); const f=arr.find(x=>x.name===nm); if(f) downloadDataURL(f.data,f.name); }));
    }

    function renderNameResults(text){
      const out = $('nameResults'); if(!out) return; out.innerHTML='';
      const styles = loadJSON(LS.nameStyles, []);
      if(!styles.length){ const d=document.createElement('div'); d.className='gold-card'; d.textContent='لا توجد ستايلات مرفوعة'; out.appendChild(d); return; }
      const limit = Math.min(styles.length, 100);
      for(let i=0;i<limit;i++){
        const s = styles[i%styles.length]; const res = safeApplyStyle(text, s);
        const box = document.createElement('div'); box.className='name-box'; box.textContent = res; out.appendChild(box);
      }
    }

    function populateFontSelect(){
      const sel = $('fontSelect'); if(!sel) return; sel.innerHTML='';
      const defaults = ['Cairo','Reem Kufi','Amiri','Tajawal','Noto Kufi Arabic','El Messiri','Changa'];
      defaults.forEach(f=>{ const o=document.createElement('option'); o.value=f; o.textContent=f; sel.appendChild(o); });
      const up = loadJSON(LS.uploadedFonts, []);
      up.forEach(f=>{ const o=document.createElement('option'); o.value=f.url; o.textContent=f.name; sel.appendChild(o); });
      renderUploadedFontsList();
    }

    function populateClotheSelect(){
      const sel = $('clotheSelect'); if(!sel) return; sel.innerHTML='';
      const arr = loadJSON(LS.clothesImages, []);
      if(!arr.length){ const o=document.createElement('option'); o.value=''; o.textContent='لا توجد تلبيسات'; sel.appendChild(o); return; }
      arr.forEach((d,i)=>{ const o=document.createElement('option'); o.value=d; o.textContent=`تلبيس ${i+1}`; sel.appendChild(o); });
    }

    function renderContactLinks(){
      const el = $('contactLinks'); if(!el) return; el.innerHTML='';
      const arr = loadJSON(LS.contactImages, []);
      if(!arr.length){ const d=document.createElement('div'); d.className='gold-card'; d.textContent='لا توجد روابط بعد'; el.appendChild(d); return; }
      arr.forEach(ci => {
        const a = document.createElement('a'); a.href = ci.link; a.target='_blank'; a.rel='noopener noreferrer'; a.innerHTML = `<img src="${ci.src}" alt="contact" />`; el.appendChild(a);
      });
    }

    // uploads
    const uploadImages = $('uploadImages'), uploadClothes = $('uploadClothes'), uploadFonts = $('uploadFonts'), uploadStyles = $('uploadStyles');
    if(uploadImages) uploadImages.addEventListener('change', ev=>{
      const files = Array.from(ev.target.files||[]); if(!files.length) return;
      const readers = files.map(f=> new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res({name:f.name,data:e.target.result}); r.onerror=rej; r.readAsDataURL(f); }));
      Promise.all(readers).then(list=>{
        const existing = loadJSON(LS.userImages, []); const merged = existing.concat(list); saveJSON(LS.userImages, merged); renderGallery(); showToast(`تم رفع ${list.length} صورة`); uploadImages.value='';
      }).catch(e=>{ console.warn(e); alert('فشل رفع الصور'); });
    });

    if(uploadClothes) uploadClothes.addEventListener('change', ev=>{
      const files = Array.from(ev.target.files||[]); if(!files.length) return;
      const readers = files.map(f=> new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=rej; r.readAsDataURL(f); }));
      Promise.all(readers).then(list=>{
        const existing = loadJSON(LS.clothesImages, []); const merged = existing.concat(list); saveJSON(LS.clothesImages, merged); populateClotheSelect(); showToast(`تم رفع ${list.length} تلبيسات`); uploadClothes.value='';
      }).catch(e=>{ console.warn(e); alert('فشل رفع التلبيسات'); });
    });

    if(uploadFonts) uploadFonts.addEventListener('change', ev=>{
      const files = Array.from(ev.target.files||[]); if(!files.length) return;
      const readers = files.map(f=> new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res({name:f.name,data:e.target.result}); r.onerror=rej; r.readAsDataURL(f); }));
      Promise.all(readers).then(list=>{
        const existing = loadJSON(LS.uploadedFonts, []);
        list.forEach(f=>{
          existing.push({name:f.name,url:f.data});
          try{ registerFontFromDataURL(f.name, f.data); }catch(e){ console.warn(e); }
        });
        saveJSON(LS.uploadedFonts, existing); populateFontSelect(); showToast(`تم رفع ${list.length} خطوط`); uploadFonts.value='';
      }).catch(e=>{ console.warn(e); alert('فشل رفع الخطوط'); });
    });

    if(uploadStyles) uploadStyles.addEventListener('change', ev=>{
      const files = Array.from(ev.target.files||[]); if(!files.length) return;
      files.forEach(file=>{
        const r=new FileReader();
        r.onload = e => {
          try{
            const txt = e.target.result;
            if(file.name.toLowerCase().endsWith('.json')){
              const parsed = JSON.parse(txt); const existing = loadJSON(LS.nameStyles, []); existing.push(parsed); saveJSON(LS.nameStyles, existing); showToast(`تم إضافة ستايل: ${file.name}`);
            } else if(file.name.toLowerCase().endsWith('.js')){
              const existing = loadJSON(LS.nameStyles, []); existing.push({js: txt, name: file.name}); saveJSON(LS.nameStyles, existing); showToast(`تم إضافة ستايل JS: ${file.name}`);
            } else { showToast('امتداد غير مدعوم'); }
          }catch(err){ console.warn(err); alert('فشل قراءة الستايل'); }
        };
        r.readAsText(file);
      });
      uploadStyles.value='';
    });

    function renderUploadedFontsList(){
      let container = $('uploadedFontsList');
      if(!container){
        const controlArea = $('controlArea');
        container = document.createElement('div'); container.id = 'uploadedFontsList'; container.style.marginTop = '8px';
        if(controlArea) controlArea.appendChild(container); else document.body.appendChild(container);
      }
      container.innerHTML = "<h4 style='margin:6px 0;color:#8a6d1b'>الخطوط المرفوعة</h4>";
      const arr = loadJSON(LS.uploadedFonts, []);
      if(!arr.length){ container.innerHTML += "<div class='gold-card'>لا توجد خطوط مرفوعة بعد</div>"; return; }
      arr.forEach(f=>{
        const row = document.createElement('div'); row.style.display='flex'; row.style.alignItems='center'; row.style.gap='8px'; row.style.marginBottom='6px';
        row.innerHTML = `<div style="flex:1">${f.name}</div><button class="btn use-font" data-url="${f.url}" data-name="${f.name}">استخدام</button>`;
        container.appendChild(row);
      });
      Array.from(container.querySelectorAll('.use-font')).forEach(b=>b.addEventListener('click', ()=>{
        const url = b.getAttribute('data-url'); const name = b.getAttribute('data-name');
        const sel = $('fontSelect'); if(sel){ const opt = document.createElement('option'); opt.value = url; opt.textContent = name; sel.appendChild(opt); sel.value = url; }
        showToast("تم اختيار الخط: " + (name||''));
      }));
    }

    // contact add
    const addContactImage = $('addContactImage'), contactImageFile = $('contactImageFile'), contactImageLink = $('contactImageLink');
    if(addContactImage && contactImageFile && contactImageLink) addContactImage.addEventListener('click', ()=>{
      const f = contactImageFile.files && contactImageFile.files[0]; const link = (contactImageLink.value||'').trim();
      if(!f || !link) return alert('اختر صورة وأدخل رابط');
      const r = new FileReader(); r.onload = e => {
        const existing = loadJSON(LS.contactImages, []); existing.push({src:e.target.result, link}); saveJSON(LS.contactImages, existing); renderContactLinks(); showToast('تم إضافة صورة التواصل'); contactImageFile.value=''; contactImageLink.value='';
      }; r.readAsDataURL(f);
    });

    // save about/contact
    const saveControl = $('saveControl'), aboutEditor = $('aboutEditor'), contactEditor = $('contactEditor');
    if(aboutEditor) aboutEditor.value = localStorage.getItem(LS.aboutText) || ($('aboutText')? $('aboutText').textContent : '');
    if(contactEditor) contactEditor.value = localStorage.getItem(LS.contactText) || '';
    if(saveControl) saveControl.addEventListener('click', ()=> {
      const a = aboutEditor? aboutEditor.value.trim() : '';
      const c = contactEditor? contactEditor.value.trim() : '';
      if($('aboutText') && a) $('aboutText').textContent = a;
      localStorage.setItem(LS.aboutText, a); localStorage.setItem(LS.contactText, c); showToast('تم حفظ التغييرات');
    });

    // admin login
    const adminLogin = $('adminLogin'), adminPass = $('adminPass');
    if(!localStorage.getItem(LS.adminPwd)) localStorage.setItem(LS.adminPwd, DEFAULT_ADMIN_PWD);
    if(adminLogin && adminPass) adminLogin.addEventListener('click', ()=>{
      const v = (adminPass.value||'').trim(); const saved = localStorage.getItem(LS.adminPwd) || DEFAULT_ADMIN_PWD;
      if(v === saved){
        if($('controlAuth')) $('controlAuth').style.display = 'none';
        if($('controlArea')) $('controlArea').classList.remove('hidden');
        showToast('تم تسجيل الدخول');
        populateClotheSelect(); populateFontSelect(); renderGallery(); renderContactLinks(); renderUploadedFontsList();
      } else { alert('كلمة المرور غير صحيحة'); adminPass.value=''; }
    });

    // change password
    const changeBtn = $('changePwdBtn');
    if(changeBtn) changeBtn.addEventListener('click', ()=>{
      const cur = ($('curAdminPwd') && $('curAdminPwd').value) ? $('curAdminPwd').value.trim() : '';
      const nw = ($('newAdminPwd') && $('newAdminPwd').value) ? $('newAdminPwd').value.trim() : '';
      const cf = ($('confirmAdminPwd') && $('confirmAdminPwd').value) ? $('confirmAdminPwd').value.trim() : '';
      const saved = localStorage.getItem(LS.adminPwd) || DEFAULT_ADMIN_PWD;
      if(!cur || !nw) return alert('املأ الحقول المطلوبة');
      if(cur !== saved) return alert('كلمة المرور الحالية غير صحيحة');
      if(nw.length < 4) return alert('يجب أن تكون كلمة المرور الجديدة 4 أحرف على الأقل');
      if(nw !== cf) return alert('تأكيد كلمة المرور غير مطابق');
      localStorage.setItem(LS.adminPwd, nw); showToast('تم تغيير كلمة المرور بنجاح');
      if($('curAdminPwd')) $('curAdminPwd').value=''; if($('newAdminPwd')) $('newAdminPwd').value=''; if($('confirmAdminPwd')) $('confirmAdminPwd').value='';
    });

    // search handler
    document.addEventListener('ui:search', ()=> {
      const q = ($('fileSearch') && $('fileSearch').value) ? $('fileSearch').value.trim().toLowerCase() : '';
      try{
        const stored = loadJSON(LS.userImages, []);
        const filtered = stored.filter(i => (i.name||'').toLowerCase().includes(q));
        renderResultsGrid(filtered);
      }catch(e){ console.warn(e); renderResultsGrid([]); }
    });

    // perform OCR listener (uses Tesseract if loaded)
    document.addEventListener('perform:ocr', async (ev)=> {
      const detail = ev.detail || {}; const data = detail.data;
      if(!data) return alert('لا توجد صورة لمعالجتها');
      if(window.Tesseract && typeof window.Tesseract.recognize === 'function'){
        try{
          const worker = window.Tesseract.createWorker();
          await worker.load(); await worker.loadLanguage('ara+eng'); await worker.initialize('ara+eng');
          const { data: { text } } = await worker.recognize(data);
          await worker.terminate();
          alert('نتيجة OCR:\n\n' + (text || '(لا يوجد نص)'));
        }catch(err){ console.warn(err); alert('فشل معالجة OCR'); }
      } else {
        alert('OCR غير مفعّل محليًا. لإضافة OCR أضف Tesseract.js إلى index.html.');
      }
    });

    // initial render
    populateClotheSelect(); populateFontSelect(); renderGallery(); renderContactLinks(); renderUploadedFontsList();

    // autosave on unload
    window.addEventListener('beforeunload', ()=>{
      try{
        saveJSON(LS.userImages, loadJSON(LS.userImages, []));
        saveJSON(LS.clothesImages, loadJSON(LS.clothesImages, []));
        saveJSON(LS.uploadedFonts, loadJSON(LS.uploadedFonts, []));
        saveJSON(LS.nameStyles, loadJSON(LS.nameStyles, []));
        saveJSON(LS.contactImages, loadJSON(LS.contactImages, []));
      }catch(e){ console.warn(e); }
    });

    // wire UI interactions from part1 (start event)
    document.addEventListener('app:started', ()=>{
      populateClotheSelect(); populateFontSelect(); renderGallery(); renderContactLinks(); renderUploadedFontsList();
    });

  }); // DOMContentLoaded
})();
