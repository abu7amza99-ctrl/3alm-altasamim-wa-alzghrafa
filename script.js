/* script-part1.js
   الجزء 1/2 - واجهة، رسالة ترحيب، شريط جانبي، التنقل بين الأقسام، فتح لوحة التحكم (مصادقة)
   نسخة نهائية متوافقة مع index.html و style.css
*/
(function(){
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {

    // عناصر الترحيب
    const welcomeModal = document.getElementById("welcomeModal");
    const startApp = document.getElementById("startApp");
    const mainContent = document.getElementById("mainContent");

    if (startApp && welcomeModal) {
      startApp.addEventListener("click", () => {
        // إخفاء أنيق
        welcomeModal.style.transition = "opacity .35s ease, transform .35s ease";
        welcomeModal.style.opacity = "0";
        welcomeModal.style.transform = "scale(.98)";
        setTimeout(() => {
          if (welcomeModal && welcomeModal.parentNode) welcomeModal.parentNode.removeChild(welcomeModal);
        }, 360);
        if (mainContent) mainContent.classList.remove("hidden");
        // notify app ready (part2 will attach)
        document.dispatchEvent(new CustomEvent("app:started"));
      });
    }

    // Sidebar toggle
    const sectionsToggle = document.getElementById("sectionsToggle");
    const sideNav = document.getElementById("sideNav");
    const closeSide = document.getElementById("closeSide");

    if (sectionsToggle && sideNav) {
      sectionsToggle.addEventListener("click", () => {
        sideNav.classList.toggle("hidden");
        sideNav.setAttribute("aria-hidden", sideNav.classList.contains("hidden") ? "true" : "false");
      });
    }
    if (closeSide && sideNav) {
      closeSide.addEventListener("click", () => {
        sideNav.classList.add("hidden");
        sideNav.setAttribute("aria-hidden", "true");
      });
    }

    // Navigation between sections
    const sideItems = Array.from(document.querySelectorAll(".side-item"));
    const pages = Array.from(document.querySelectorAll(".page"));

    function showSectionById(id) {
      pages.forEach((p) => {
        if (p.id === id) p.classList.add("active");
        else p.classList.remove("active");
      });
    }

    if (sideItems.length) {
      sideItems.forEach((li) => {
        li.addEventListener("click", () => {
          const target = li.dataset.target;
          if (!target) return;
          sideItems.forEach((s) => s.classList.remove("active"));
          li.classList.add("active");
          showSectionById(target);
          // close sidebar on mobile
          if (sideNav) {
            sideNav.classList.add("hidden");
            sideNav.setAttribute("aria-hidden", "true");
          }
          // notify selection (part2 can react)
          document.dispatchEvent(new CustomEvent("section:changed", { detail: { section: target } }));
        });
      });
    }

    // Control modal and auth
    const controlBtn = document.getElementById("controlBtn");
    const controlModal = document.getElementById("controlModal");
    const closeControl = document.getElementById("closeControl");
    const adminPass = document.getElementById("adminPass");
    const adminLogin = document.getElementById("adminLogin");
    const controlAuth = document.getElementById("controlAuth");
    const controlArea = document.getElementById("controlArea");
    const logoutBtn = document.getElementById("logoutBtn");

    if (controlBtn && controlModal) {
      controlBtn.addEventListener("click", () => {
        controlModal.classList.toggle("hidden");
        controlModal.setAttribute("aria-hidden", controlModal.classList.contains("hidden") ? "true" : "false");
        if (!controlModal.classList.contains("hidden")) {
          // reset auth view
          if (controlAuth) controlAuth.style.display = "";
          if (controlArea) controlArea.classList.add("hidden");
          if (adminPass) adminPass.value = "";
        }
      });
    }

    if (closeControl) {
      closeControl.addEventListener("click", () => {
        if (controlModal) controlModal.classList.add("hidden");
      });
    }

    if (adminLogin && adminPass && controlAuth && controlArea) {
      adminLogin.addEventListener("click", () => {
        const v = (adminPass.value || "").trim();
        if (v === "asd321") {
          controlAuth.style.display = "none";
          controlArea.classList.remove("hidden");
          // signal authenticated to part2
          document.dispatchEvent(new CustomEvent("control:authenticated"));
        } else {
          alert("كلمة المرور غير صحيحة");
          adminPass.value = "";
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (controlArea) controlArea.classList.add("hidden");
        if (controlAuth) controlAuth.style.display = "";
        if (controlModal) controlModal.classList.add("hidden");
      });
    }

    // Search local images (reads from localStorage updated by part2)
    const fileSearch = document.getElementById("fileSearch");
    const searchBtn = document.getElementById("searchBtn");
    const resultsGrid = document.getElementById("resultsGrid");

    window.renderResultsGrid = function(list) {
      if (!resultsGrid) return;
      resultsGrid.innerHTML = "";
      if (!list || !list.length) {
        const no = document.createElement("div"); no.className = "gold-card"; no.textContent = "لا توجد نتائج"; resultsGrid.appendChild(no); return;
      }
      list.forEach((item) => {
        const card = document.createElement("div"); card.className = "result-card";
        const nm = item.name || "image";
        card.dataset.name = nm;
        card.innerHTML = `<img src="${item.data}" alt="${nm}" /><div style="margin-top:8px;font-size:0.95rem">${nm}</div>
          <div style="margin-top:8px"><button class="btn download-btn" data-name="${nm}">تحميل</button></div>`;
        resultsGrid.appendChild(card);
      });
      Array.from(resultsGrid.querySelectorAll(".download-btn")).forEach((b) => {
        b.addEventListener("click", () => {
          const nm = b.getAttribute("data-name");
          document.dispatchEvent(new CustomEvent("request:download", { detail: { name: nm } }));
        });
      });
    };

    function doSearch() {
      const q = (fileSearch && fileSearch.value) ? fileSearch.value.trim().toLowerCase() : "";
      try {
        const stored = JSON.parse(localStorage.getItem("userImages") || "[]");
        const filtered = stored.filter((i) => (i.name || "").toLowerCase().includes(q));
        window.renderResultsGrid(filtered);
      } catch (e) {
        console.warn("search error", e);
        window.renderResultsGrid([]);
      }
    }

    if (searchBtn) searchBtn.addEventListener("click", doSearch);
    if (fileSearch) fileSearch.addEventListener("keyup", (e) => { if (e.key === "Enter") doSearch(); });

    // OCR button - asks part2 to run OCR on chosen image (part2 manages actual OCR)
    const ocrBtn = document.getElementById("ocrBtn");
    if (ocrBtn) {
      ocrBtn.addEventListener("click", () => {
        alert("لاستخراج نص بواسطة OCR: اختر صورة من 'الصور المضافة' ثم اضغط زر 'OCR على الصورة' في بطاقة الصورة.");
        document.dispatchEvent(new CustomEvent("request:ocr"));
      });
    }

    // app ready event so part2 can initialize UI
    document.dispatchEvent(new CustomEvent("app:ready"));
    document.dispatchEvent(new CustomEvent("app:loaded"));

  });
})();
/* script-part2.js
   الجزء 2/2 — رفع وإدارة الصور/خطوط/تلبيسات/ستايلات، توليد زخارف، حفظ محلي، تنزيل، OCR (اختياري)
   نهائي وآمن (بدون eval). متوافق مع index.html و style.css و script-part1.js
*/
(function(){
  "use strict";
  document.addEventListener("DOMContentLoaded", ()=> {

    // --- عناصر لوحة التحكم وواجهة ---
    const uploadImages = document.getElementById("uploadImages");
    const uploadClothes = document.getElementById("uploadClothes");
    const uploadFonts = document.getElementById("uploadFonts");
    const uploadStyles = document.getElementById("uploadStyles");
    const addContactImageBtn = document.getElementById("addContactImage");
    const contactImageFile = document.getElementById("contactImageFile");
    const contactImageLink = document.getElementById("contactImageLink");
    const aboutEditor = document.getElementById("aboutEditor");
    const contactEditor = document.getElementById("contactEditor");
    const saveControl = document.getElementById("saveControl");

    const gallery = document.getElementById("gallery");
    const resultsGrid = document.getElementById("resultsGrid");
    const fontSelect = document.getElementById("fontSelect");
    const clotheSelect = document.getElementById("clotheSelect");
    const gradientSelect = document.getElementById("gradientSelect");
    const fontNameInput = document.getElementById("fontNameInput");
    const generateFont = document.getElementById("generateFont");
    const fontPreview = document.getElementById("fontPreview");
    const genNameStyles = document.getElementById("genNameStyles");
    const nameInput = document.getElementById("nameInput");
    const nameResults = document.getElementById("nameResults");
    const aboutText = document.getElementById("aboutText");
    const contactLinks = document.getElementById("contactLinks");
    const primaryColorInput = document.getElementById("primaryColor");

    // --- helpers safe storage ---
    const saveJSON = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){ console.warn("saveJSON failed", e); } };
    const loadJSON = (k,def=[]) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch(e){ console.warn("loadJSON failed", e); return def; } };

    // --- initial data from storage ---
    let userImages = loadJSON("userImages", []); // [{name,data}]
    let clothesImages = loadJSON("clothesImages", []); // [dataURL]
    let uploadedFonts = loadJSON("uploadedFonts", []); // [{name,url}]
    let nameStyles = loadJSON("nameStyles", []); // objects or {js,name}
    let contactImages = loadJSON("contactImages", []); // [{src,link}]
    const uploadImagesMax = 100;

    // --- render gallery (home) ---
    function renderGallery(){
      if(!gallery) return;
      gallery.innerHTML = "";
      if(!userImages.length){
        const empty = document.createElement("div"); empty.className = "gold-card"; empty.textContent = "لا توجد صور مضافة — استخدم لوحة التحكم لإضافة صور"; gallery.appendChild(empty); return;
      }
      userImages.forEach((img)=>{
        const card = document.createElement("div"); card.className = "design-card";
        card.innerHTML = `<img src="${img.data}" alt="${img.name}" /><div style="margin-top:8px;font-size:0.95rem">${img.name}</div>
          <div style="margin-top:8px"><button class="btn download-btn" data-name="${img.name}">تحميل</button>
          <button class="btn ocr-on-img" data-name="${img.name}">OCR على الصورة</button></div>`;
        gallery.appendChild(card);
      });

      // download handlers
      Array.from(gallery.querySelectorAll(".download-btn")).forEach((b)=>{
        b.addEventListener("click", ()=> {
          const name = b.getAttribute("data-name");
          const found = userImages.find(it => it.name === name);
          if(found) downloadDataURL(found.data, found.name);
        });
      });

      // OCR handlers (dispatch perform:ocr)
      Array.from(gallery.querySelectorAll(".ocr-on-img")).forEach((b)=>{
        b.addEventListener("click", ()=> {
          const name = b.getAttribute("data-name");
          const found = userImages.find(it => it.name === name);
          if(!found) return alert("الصورة غير موجودة");
          document.dispatchEvent(new CustomEvent("perform:ocr", { detail: { name: name, data: found.data } }));
        });
      });
    }

    // --- download helper ---
    function downloadDataURL(dataUrl, filename){
      try{
        const a = document.createElement("a"); a.href = dataUrl; a.download = filename || "download.png"; document.body.appendChild(a); a.click(); a.remove();
      } catch(e) { console.warn("download failed", e); alert("فشل التحميل"); }
    }

    // allow other parts to request downloads
    document.addEventListener("request:download", (ev) => {
      const name = ev.detail && ev.detail.name;
      if(!name) return;
      const found = userImages.find(it => it.name === name);
      if(found) downloadDataURL(found.data, found.name);
    });

    // --- upload images (control) ---
    if(uploadImages){
      uploadImages.addEventListener("change", (ev) => {
        const files = Array.from(ev.target.files).slice(0, uploadImagesMax);
        if(!files.length) return;
        const readers = files.map(f => new Promise((res,rej) => {
          const r = new FileReader();
          r.onload = (e) => res({ name: f.name, data: e.target.result });
          r.onerror = rej;
          r.readAsDataURL(f);
        }));
        Promise.all(readers).then(list => {
          userImages = userImages.concat(list);
          saveJSON("userImages", userImages);
          renderGallery();
          alert(`تم رفع ${list.length} صورة وحفظها للعرض`);
          uploadImages.value = "";
        }).catch(err => { console.warn("uploadImages error", err); alert("فشل رفع الصور"); });
      });
    }

    // --- upload clothes (textures) ---
    if(uploadClothes){
      uploadClothes.addEventListener("change", (ev) => {
        const files = Array.from(ev.target.files);
        if(!files.length) return;
        const readers = files.map(f => new Promise((res,rej) => {
          const r = new FileReader(); r.onload = (e) => res(e.target.result); r.onerror = rej; r.readAsDataURL(f);
        }));
        Promise.all(readers).then(list => {
          clothesImages = clothesImages.concat(list);
          saveJSON("clothesImages", clothesImages);
          populateClotheSelect();
          alert(`تم رفع ${list.length} تلبيسات`);
          uploadClothes.value = "";
        }).catch(err => { console.warn("uploadClothes error", err); alert("فشل رفع التلبيسات"); });
      });
    }

    function populateClotheSelect(){
      if(!clotheSelect) return;
      clotheSelect.innerHTML = "";
      if(!clothesImages.length){
        const o = document.createElement("option"); o.value = ""; o.textContent = "لا توجد تلبيسات"; clotheSelect.appendChild(o); return;
      }
      clothesImages.forEach((d,i) => {
        const o = document.createElement("option"); o.value = d; o.textContent = `تلبيس ${i+1}`; clotheSelect.appendChild(o);
      });
    }

    // --- upload fonts ---
    if(uploadFonts){
      uploadFonts.addEventListener("change", (ev) => {
        const files = Array.from(ev.target.files);
        if(!files.length) return;
        const readers = files.map(f => new Promise((res,rej) => {
          const r = new FileReader(); r.onload = (e) => res({ name: f.name, data: e.target.result }); r.onerror = rej; r.readAsDataURL(f);
        }));
        Promise.all(readers).then(list => {
          const existing = loadJSON("uploadedFonts", []);
          list.forEach(f => {
            existing.push({ name: f.name, url: f.data });
            try {
              const fontFaceName = f.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
              if (!document.getElementById("font-" + fontFaceName)) {
                const style = document.createElement("style");
                style.id = "font-" + fontFaceName;
                style.innerHTML = `@font-face{font-family:'${fontFaceName}';src:url('${f.data}');}`;
                document.head.appendChild(style);
              }
            } catch (err) { console.warn("font register err", err); }
          });
          saveJSON("uploadedFonts", existing);
          uploadedFonts = existing;
          populateFontSelect();
          alert(`تم رفع ${list.length} خطوط`);
          uploadFonts.value = "";
        }).catch(err => { console.warn("uploadFonts error", err); alert("فشل رفع الخطوط"); });
      });
    }

    // --- populate fonts select ---
    function populateFontSelect(){
      if(!fontSelect) return;
      fontSelect.innerHTML = "";
      const defaults = ["Cairo","Reem Kufi","Amiri","Tajawal","Noto Kufi Arabic","El Messiri","Changa","Segoe UI"];
      defaults.forEach(f => { const o = document.createElement("option"); o.value = f; o.textContent = f; fontSelect.appendChild(o); });
      const up = loadJSON("uploadedFonts", []);
      up.forEach(f => { const o = document.createElement("option"); o.value = f.url; o.textContent = f.name; fontSelect.appendChild(o); });
    }

    // --- upload styles (json/js) ---
    if(uploadStyles){
      uploadStyles.addEventListener("change", (ev) => {
        const files = Array.from(ev.target.files);
        if(!files.length) return;
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              if (file.name.toLowerCase().endsWith(".json")) {
                const parsed = JSON.parse(e.target.result);
                nameStyles.push(parsed);
                saveJSON("nameStyles", nameStyles);
              } else if (file.name.toLowerCase().endsWith(".js")) {
                // store JS text only (no execute)
                nameStyles.push({ js: e.target.result, name: file.name });
                saveJSON("nameStyles", nameStyles);
              }
              alert(`تم إضافة ستايل: ${file.name}`);
            } catch (err) {
              console.warn("style load error", err);
              alert("فشل قراءة ملف الستايل — تحقق من الصيغة");
            }
          };
          reader.readAsText(file);
        });
        uploadStyles.value = "";
      });
    }

    nameStyles = loadJSON("nameStyles", []);

    // --- applyDecorationStyle (safe) ---
    function applyDecorationStyle(text, style){
      if(!style) return text;
      try {
        if (typeof style === "string") return style.replace("{{text}}", text);
        if (style.pattern && typeof style.pattern === "string") return style.pattern.replace("{{text}}", text);
        if (style.js && typeof style.js === "string") {
          // try extract 'pattern' string inside js text
          const m = style.js.match(/pattern\s*[:=]\s*['"`]([^'"`]+)['"`]/);
          if (m && m[1]) return m[1].replace("{{text}}", text);
          const m2 = style.js.match(/['"`]([^'"`{]*\{\{text\}\}[^'"`]*)['"`]/);
          if (m2 && m2[1]) return m2[1].replace("{{text}}", text);
        }
      } catch (e) { console.warn("applyDecorationStyle error", e); }
      return text;
    }

    function renderNameResults(text){
      if(!nameResults) return;
      nameResults.innerHTML = "";
      const styles = loadJSON("nameStyles", []);
      if(!styles.length){
        const no = document.createElement("div"); no.className = "gold-card"; no.textContent = "لا توجد ستايلات مرفوعة بعد — ارفعها من لوحة التحكم"; nameResults.appendChild(no); return;
      }
      const limit = Math.min(styles.length, 100);
      for(let i=0;i<limit;i++){
        const s = styles[i % styles.length];
        const out = applyDecorationStyle(text, s);
        const box = document.createElement("div"); box.className = "name-box"; box.textContent = out; nameResults.appendChild(box);
      }
    }

    if(genNameStyles && nameInput){
      genNameStyles.addEventListener("click", () => {
        const v = (nameInput.value || "").trim();
        if(!v) return alert("أدخل الاسم أولاً");
        renderNameResults(v);
      });
    }

    // --- contact images add & render ---
    if(addContactImageBtn && contactImageFile && contactImageLink){
      addContactImageBtn.addEventListener("click", () => {
        const f = contactImageFile.files && contactImageFile.files[0];
        const link = (contactImageLink.value || "").trim();
        if(!f || !link) return alert("اختر صورة وأدخل رابط");
        const r = new FileReader();
        r.onload = (e) => {
          contactImages = contactImages.concat([{ src: e.target.result, link }]);
          saveJSON("contactImages", contactImages);
          renderContactLinks();
          alert("تم إضافة الصورة مع الرابط");
          contactImageFile.value = ""; contactImageLink.value = "";
        };
        r.readAsDataURL(f);
      });
    }

    function renderContactLinks(){
      if(!contactLinks) return;
      contactLinks.innerHTML = "";
      if(!contactImages.length){
        const no = document.createElement("div"); no.className = "gold-card"; no.textContent = "لا توجد روابط بعد"; contactLinks.appendChild(no); return;
      }
      contactImages.forEach(ci => {
        const a = document.createElement("a"); a.href = ci.link; a.target = "_blank"; a.rel="noopener noreferrer";
        a.innerHTML = `<img src="${ci.src}" alt="contact" />`;
        contactLinks.appendChild(a);
      });
    }
    contactImages = loadJSON("contactImages", []);
    renderContactLinks();

    // --- about/contact editors load & save ---
    if(aboutEditor) aboutEditor.value = localStorage.getItem("aboutText") || (aboutText ? aboutText.textContent : "");
    if(contactEditor) contactEditor.value = localStorage.getItem("contactText") || "";
    if(saveControl){
      saveControl.addEventListener("click", () => {
        const a = aboutEditor ? aboutEditor.value.trim() : "";
        const c = contactEditor ? contactEditor.value.trim() : "";
        if (aboutText && a) aboutText.textContent = a;
        localStorage.setItem("aboutText", a);
        localStorage.setItem("contactText", c);
        alert("تم حفظ تعديلات لوحة التحكم");
      });
    }

    // --- populate gradientSelect defaults ---
    (function populateGradients(){
      if(!gradientSelect) return;
      const grads = [
        "linear-gradient(90deg,#ffd700,#ff8c00)",
        "linear-gradient(90deg,#ff9a9e,#fad0c4)",
        "linear-gradient(90deg,#a1c4fd,#c2e9fb)",
        "linear-gradient(90deg,#fbc2eb,#a6c1ee)",
        "linear-gradient(90deg,#ffecd2,#fcb69f)"
      ];
      gradientSelect.innerHTML = "";
      grads.forEach((g,i) => { const o = document.createElement("option"); o.value = g; o.textContent = `تدرج ${i+1}`; gradientSelect.appendChild(o); });
    })();

    // --- font preview update ---
    function updateFontPreview(){
      if(!fontPreview) return;
      const text = (fontNameInput && fontNameInput.value) ? fontNameInput.value : "نص تجريبي";
      fontPreview.textContent = text;
      const f = (fontSelect && fontSelect.value) ? fontSelect.value : "Cairo";
      if(f && f.startsWith("data:")) fontPreview.style.fontFamily = "Cairo, sans-serif";
      else fontPreview.style.fontFamily = `${f}, sans-serif`;

      // mode handling
      const activeMode = document.querySelector(".mode-btn.active");
      const mode = activeMode ? activeMode.dataset.mode : "solid";
      fontPreview.style.background = ""; fontPreview.style.webkitBackgroundClip = ""; fontPreview.style.color = "";
      if(mode === "solid"){
        const c = document.getElementById("solidColor");
        fontPreview.style.color = c ? c.value : "#d4af37";
      } else if(mode === "gradient"){
        const g = gradientSelect ? gradientSelect.value : "";
        if(g){
          fontPreview.style.background = g;
          fontPreview.style.webkitBackgroundClip = "text";
          fontPreview.style.color = "transparent";
        }
      } else if(mode === "clothe"){
        const src = clotheSelect ? clotheSelect.value : "";
        if(src){
          fontPreview.style.background = `url('${src}') center/cover`;
          fontPreview.style.webkitBackgroundClip = "text";
          fontPreview.style.color = "transparent";
        }
      }
    }

    ["fontNameInput","fontSelect","gradientSelect","clotheSelect","solidColor"].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.addEventListener("input", updateFontPreview);
    });

    const modeBtns = Array.from(document.querySelectorAll(".mode-btn") || []);
    modeBtns.forEach(b => b.addEventListener("click", () => {
      modeBtns.forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      updateFontPreview();
    }));
    if(generateFont) generateFont.addEventListener("click", updateFontPreview);

    // --- global events from part1 ---
    document.addEventListener("app:ready", () => {
      renderGallery();
      populateClotheSelect();
      populateFontSelect();
      renderContactLinks();
    });

    document.addEventListener("control:authenticated", () => {
      if(aboutEditor) aboutEditor.value = localStorage.getItem("aboutText") || (aboutText ? aboutText.textContent : "");
      if(contactEditor) contactEditor.value = localStorage.getItem("contactText") || "";
      renderGallery();
      populateClotheSelect();
      populateFontSelect();
      renderContactLinks();
    });

    // --- perform OCR (uses Tesseract if present) ---
    document.addEventListener("perform:ocr", async (ev) => {
      const detail = ev.detail || {};
      const imageData = detail.data;
      if (!imageData) return alert("لا توجد صورة لمعالجتها");
      if (window.Tesseract && typeof window.Tesseract.recognize === "function") {
        try {
          const worker = window.Tesseract.createWorker();
          await worker.load();
          await worker.loadLanguage("ara+eng");
          await worker.initialize("ara+eng");
          const { data: { text } } = await worker.recognize(imageData);
          await worker.terminate();
          alert("نتيجة OCR:\n\n" + (text || "(لم يتم قراءة نص)"));
        } catch (err) {
          console.warn("OCR error", err);
          alert("خطأ أثناء معالجة OCR");
        }
      } else {
        alert("OCR غير مُفعل محليًا. لإضافة OCR ضع Tesseract.js في index.html أو استخدم زر OCR على الصورة وسيعمل إذا أضفت المكتبة.");
      }
    });

    // --- before unload save all ---
    window.addEventListener("beforeunload", () => {
      saveJSON("userImages", userImages);
      saveJSON("clothesImages", clothesImages);
      saveJSON("uploadedFonts", uploadedFonts);
      saveJSON("nameStyles", nameStyles);
      saveJSON("contactImages", contactImages);
    });

    // initial render at load
    renderGallery();
    populateClotheSelect();
    populateFontSelect();
    renderContactLinks();

  }); // DOMContentLoaded
})();