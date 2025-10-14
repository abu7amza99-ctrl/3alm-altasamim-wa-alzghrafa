/* ===============================================================
   script.js - الجزء الأول
   الوظائف: شاشة الترحيب، التنقل، القائمة الجانبية، لوحة التحكم،
            رفع صور الصفحة الرئيسية، البحث، حفظ الحالة (localStorage)
   يجب دمجه مع الجزء الثاني ليصبح ملف واحد كامل script.js
   =============================================================== */

(function () {
  "use strict";

  /* ---------------------------
     مساعدة سريعة: تحديد العناصر
     --------------------------- */
  const $ = (sel, ctx = document) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx = document) =>
    Array.from((ctx || document).querySelectorAll(sel));

  // helper لإنشاء عناصر بسرعة
  const create = (tag, attrs = {}) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else el.setAttribute(k, v);
    }
    return el;
  };

  // debounce
  function debounce(fn, ms = 200) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // read file -> dataURL
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  // read file -> text
  function fileToText(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsText(file);
    });
  }

  // تنزيل dataURL
  function downloadDataURL(dataURL, filename = "download.png") {
    const a = create("a", { href: dataURL });
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ---------------------------
     حالة التطبيق (محلية - localStorage)
     --------------------------- */
  const STORAGE_KEY = "zakhrafa_v1_state_v2";

  // البنية الافتراضية للحالة
  const defaultState = {
    homeImages: [], // [{id,name,src,uploadedAt}]
    overlays: [], // [dataURL]
    proFonts: [], // [{id,name}]
    nameStyles: [], // [{id,name,content}]  // json/js contents
    aboutText: "هذا التطبيق يحاكي عالم الزخرفة والتصاميم الاحترافية.",
    contactText: "تواصل معنا عبر القنوات الموجودة.",
    contactImages: [], // [{id,src,link}]
    appearance: {
      font: "Amiri",
      bgImage: "bg.png",
      topbarImage: "shbg.png",
      appIcon: "abu7amza.png",
    },
    admin: {
      password: "asd321",
      loggedIn: false,
    },
    updatedAt: Date.now(),
  };

  let state = {};

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        state = JSON.parse(JSON.stringify(defaultState));
        saveState();
        return;
      }
      const parsed = JSON.parse(raw);
      // merge to keep defaults for any missing keys
      state = Object.assign({}, defaultState, parsed);
    } catch (e) {
      console.warn("loadState error", e);
      state = JSON.parse(JSON.stringify(defaultState));
    }
  }

  function saveState() {
    try {
      state.updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("saveState error", e);
    }
  }

  /* ---------------------------
     عناصر DOM الأساسية (تتطابق مع index.html)
     --------------------------- */
  const refs = {};
  function collectRefs() {
    refs.enterApp = $("#enterApp");
    refs.welcomeScreen = $("#welcomeScreen");
    refs.welcomeSectionsBtn = $("#welcomeSectionsBtn");
    refs.welcomeCreateBtn = $("#welcomeCreateBtn");

    refs.menuBtn = $("#menuBtn");
    refs.sideMenu = $("#sideMenu");
    refs.closeSide = $("#closeSide");
    refs.menuItems = $$(".menu-item");

    refs.settingsBtn = $("#settingsBtn");
    refs.adminOverlay = $("#adminOverlay");
    refs.adminLogin = $("#adminLogin");
    refs.adminPassword = $("#adminPassword");
    refs.adminEnter = $("#adminEnter");
    refs.adminClose = $("#adminClose");
    refs.adminContent = $("#adminContent");
    refs.adminTabs = $$(".admin-tab");
    refs.adminTabContents = $$(".admin-tab-content");
    refs.closeAdmin = $("#closeAdmin");

    // Home
    refs.searchInput = $("#searchInput");
    refs.searchBtn = $("#searchBtn");
    refs.searchResults = $("#searchResults");
    refs.homeImagesInput = $("#homeImagesInput");
    refs.homeImagesGallery = $("#homeImagesGallery");

    // Pro Decor
    refs.decorNameInput = $("#decorNameInput");
    refs.decorImageInput = $("#decorImageInput");
    refs.decorFontSelect = $("#decorFontSelect");
    refs.decorBgBtn = $("#decorBgBtn");
    refs.colorTypeSelect = $("#colorTypeSelect");
    refs.colorPickerSection = $("#colorPickerSection");
    refs.solidColorPicker = $("#solidColorPicker");
    refs.solidColor = $("#solidColor");
    refs.gradientGallery = $("#gradientGallery");
    refs.overlayGallery = $("#overlayGallery");
    refs.decorPreview = $("#decorPreview");
    refs.downloadDecorBtn = $("#downloadDecorBtn");

    // Name Decor
    refs.nameInput = $("#nameInput");
    refs.nameResults = $("#nameResults");
    refs.nameStylesInput = $("#nameStylesInput");

    // About / Contact
    refs.aboutTextEditor = $("#aboutTextEditor");
    refs.aboutText = $("#aboutText");
    refs.contactTextEditor = $("#contactTextEditor");
    refs.contactText = $("#contactText");
    refs.contactImagesInput = $("#contactImagesInput");
    refs.contactImagesContainer = $("#contactImagesContainer");

    // background img
    refs.backgroundImg = $(".background img");
  }

  /* ---------------------------
     وظائف الواجهة الأساسية
     --------------------------- */
  function setupWelcome() {
    if (!refs.enterApp || !refs.welcomeScreen) return;

    refs.enterApp.addEventListener("click", () => {
      // إخفاء الترحيب تدريجيًا
      refs.welcomeScreen.classList.add("hidden");
    });

    // أزرار إضافية: عرض الأقسام أو الإبداع
    refs.welcomeSectionsBtn &&
      refs.welcomeSectionsBtn.addEventListener("click", () => {
        refs.welcomeScreen.classList.add("hidden");
        showSection("home");
      });

    refs.welcomeCreateBtn &&
      refs.welcomeCreateBtn.addEventListener("click", () => {
        refs.welcomeScreen.classList.add("hidden");
        showSection("proDecor");
      });
  }

  function setupSideMenu() {
    if (refs.menuBtn && refs.sideMenu) {
      refs.menuBtn.addEventListener("click", () =>
        refs.sideMenu.classList.add("active")
      );
    }
    if (refs.closeSide && refs.sideMenu) {
      refs.closeSide.addEventListener("click", () =>
        refs.sideMenu.classList.remove("active")
      );
    }

    // تنفيذ التنقل عند اختيار قسم
    refs.menuItems.forEach((item) => {
      item.addEventListener("click", (ev) => {
        const section = item.getAttribute("data-section");
        if (section) showSection(section);
        refs.sideMenu.classList.remove("active");
      });
    });
  }

  function setupAdminPanel() {
    if (!refs.settingsBtn || !refs.adminOverlay) return;

    refs.settingsBtn.addEventListener("click", () => {
      // افتح اللوحة: إن كان مسجلاً داخلاً اعرض المحتوى
      if (state.admin && state.admin.loggedIn) {
        showAdminContent();
      } else {
        showAdminLogin();
      }
    });

    refs.adminEnter &&
      refs.adminEnter.addEventListener("click", () => {
        const pass = (refs.adminPassword && refs.adminPassword.value) || "";
        if (pass === state.admin.password) {
          state.admin.loggedIn = true;
          saveState();
          showAdminContent();
        } else {
          alert("كلمة المرور غير صحيحة");
        }
      });

    refs.adminClose &&
      refs.adminClose.addEventListener("click", () => {
        // إغلاق العرض وافراغ حقل كلمة المرور
        refs.adminOverlay.classList.add("hidden");
        if (refs.adminPassword) refs.adminPassword.value = "";
      });

    // إغلاق عند الضغط على زر إغلاق داخل المحتوى
    refs.closeAdmin &&
      refs.closeAdmin.addEventListener("click", () => {
        refs.adminOverlay.classList.add("hidden");
      });

    // tabs داخل لوحة التحكم
    refs.adminTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const t = tab.getAttribute("data-tab");
        refs.adminTabs.forEach((x) => x.classList.remove("active"));
        tab.classList.add("active");
        refs.adminTabContents.forEach((ct) => ct.classList.add("hidden"));
        const node = $(`#${t}`);
        if (node) node.classList.remove("hidden");
      });
    });

    // إغلاق عند النقر على الخلفية (خارج الصندوق)
    refs.adminOverlay.addEventListener("click", (e) => {
      if (e.target === refs.adminOverlay) {
        refs.adminOverlay.classList.add("hidden");
      }
    });
  }

  function showAdminLogin() {
    refs.adminOverlay.classList.remove("hidden");
    const login = $("#adminLogin");
    const content = $("#adminContent");
    login && login.classList.remove("hidden");
    content && content.classList.add("hidden");
  }

  function showAdminContent() {
    refs.adminOverlay.classList.remove("hidden");
    const login = $("#adminLogin");
    const content = $("#adminContent");
    login && login.classList.add("hidden");
    content && content.classList.remove("hidden");
    // تلقائيًا تفعيل أول تبويب
    const firstTab = refs.adminTabs && refs.adminTabs[0];
    firstTab && firstTab.click();
    // اعرض بيانات الحاضر
    fillAdminFieldsFromState();
  }

  function fillAdminFieldsFromState() {
    // about / contact editors
    if (refs.aboutTextEditor) refs.aboutTextEditor.value = state.aboutText || "";
    if (refs.contactTextEditor) refs.contactTextEditor.value = state.contactText || "";
    // home images: لا نملأ input file لكن نعرض الجاليري
    renderHomeGallery();
    renderContactGallery();
    // decor fonts / overlays displayed via separate renderers
    renderOverlayGallery();
    renderDecorFontsIntoSelect();
  }

  /* ---------------------------
     عرض الأقسام (التبديل)
     --------------------------- */
  function showSection(id) {
    if (!id) return;
    const sections = $$(".app-section");
    sections.forEach((s) => s.classList.add("hidden"));
    const target = $(`#${id}`);
    if (target) {
      target.classList.remove("hidden");
      target.scrollIntoView({ behavior: "smooth" });
    }
  }

  /* ---------------------------
     الصفحة الرئيسية: رفع صور + البحث + عرض
     --------------------------- */
  function setupHomeControls() {
    // رفع صور من لوحة التحكم
    const homeInput = refs.homeImagesInput;
    if (homeInput) {
      homeInput.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files || []);
        for (const f of files) {
          try {
            const data = await fileToDataURL(f);
            const id = "h_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
            state.homeImages.unshift({
              id,
              name: f.name,
              src: data,
              uploadedAt: Date.now(),
            });
          } catch (err) {
            console.warn("home image read error", err);
          }
        }
        // تحجيم المصفوفة لو لزم
        if (state.homeImages.length > 500) state.homeImages.length = 500;
        saveState();
        renderHomeGallery();
      });
    }

    // زر البحث
    if (refs.searchBtn && refs.searchInput) {
      refs.searchBtn.addEventListener("click", () => {
        const q = (refs.searchInput.value || "").trim().toLowerCase();
        if (!q) {
          renderHomeGallery();
          return;
        }
        const results = (state.homeImages || []).filter((img) =>
          (img.name || "").toLowerCase().includes(q)
        );
        renderSearchResults(results);
      });

      refs.searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") refs.searchBtn.click();
      });
    }
  }

  function renderHomeGallery() {
    if (!refs.homeImagesGallery) return;
    refs.homeImagesGallery.innerHTML = "";
    const arr = state.homeImages || [];
    if (!arr.length) {
      refs.homeImagesGallery.innerHTML = `<p class="small" style="opacity:.8">لا توجد صور مضافة بعد.</p>`;
      return;
    }
    arr.forEach((it, idx) => {
      const card = create("div", { class: "grid-card" });
      const img = create("img", { src: it.src, alt: it.name });
      const meta = create("div", { class: "card-meta" });
      const name = create("div", { class: "name", text: it.name || `image-${idx+1}` });
      const actions = create("div", { class: "actions" });
      const dl = create("button", { class: "card-actions download-small", text: "تحميل" });
      dl.addEventListener("click", () => downloadDataURL(it.src, (it.name || `image-${idx+1}`)));
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
    refs.searchResults.innerHTML = "";
    const arr = list || [];
    if (!arr.length) {
      refs.searchResults.innerHTML = `<p class="small" style="opacity:.8">لا توجد نتائج.</p>`;
      return;
    }
    arr.forEach((it, idx) => {
      const card = create("div", { class: "grid-card" });
      const img = create("img", { src: it.src, alt: it.name });
      const meta = create("div", { class: "card-meta" });
      const name = create("div", { class: "name", text: it.name || `image-${idx+1}` });
      const actions = create("div", { class: "actions" });
      const dl = create("button", { class: "card-actions download-small", text: "تحميل" });
      dl.addEventListener("click", () => downloadDataURL(it.src, (it.name || `image-${idx+1}`)));
      actions.appendChild(dl);
      meta.appendChild(name);
      meta.appendChild(actions);
      card.appendChild(img);
      card.appendChild(meta);
      refs.searchResults.appendChild(card);
    });
  }

  /* ---------------------------
     زخرفة الأسماء: رفع ستايلات (js/json) وعرض نتائج مبدئية
     --------------------------- */
  function setupNameStylesUploader() {
    const input = refs.nameStylesInput;
    if (!input) return;
    input.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);
      files.forEach((file) => {
        fileToText(file)
          .then((content) => {
            const id = "ns_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
            state.nameStyles.unshift({ id, name: file.name, content });
            saveState();
            alert(`تمت إضافة ملف زخرفة: ${file.name}`);
          })
          .catch((err) => {
            console.warn("name style file read err", err);
            alert("فشل في قراءة الملف: " + file.name);
          });
      });
    });
  }

  // وظيفة لتوليد نتائج زخرفة أسماء سريعة من الستايلات الموجودة
  function generateNameDecorationsFromStyles(name) {
    const res = [];
    // قوالب افتراضية بسيطة (2x50 لاحقًا ستكون مأخوذة من ملفات)
    const baseTemplates = [
      (n) => `★ ${n} ★`,
      (n) => `♡ ${n} ♡`,
      (n) => `【${n}】`,
      (n) => `《${n}》`,
      (n) => `✿ ${n} ✿`,
      (n) => `⇝ ${n} ⇜`,
      (n) => `~ ${n} ~`,
      (n) => `ـ ${n} ـ`,
      (n) => `● ${n} ●`,
      (n) => `✦ ${n} ✦`,
    ];
    baseTemplates.forEach((fn) => res.push(fn(name)));

    // استخرج الستايلات المرفوعة (json/js)
    (state.nameStyles || []).forEach((st) => {
      // إذا كان محتوى JSON يحتوي على مصفوفة قوالب
      try {
        const parsed = JSON.parse(st.content);
        if (Array.isArray(parsed)) {
          parsed.slice(0, 50).forEach((tpl) => {
            // tpl قد يكون نصًا أو كائنًا مع مفتاح template
            if (typeof tpl === "string") {
              res.push(tpl.replace(/\{\{name\}\}/g, name));
            } else if (tpl && tpl.template) {
              res.push(String(tpl.template).replace(/\{\{name\}\}/g, name));
            }
          });
          return;
        }
      } catch (e) {
        // ليس JSON
      }
      // إذا كان ملف JS، حاول تنفيذ دالة apply إذا وُجدت
      try {
        // نحاول إنشاء دالة محمية تقبل name وترجع مصفوفة أو نص
        const wrapper = `(function(){ ${st.content}; if(typeof apply === "function"){ try{ return apply(${JSON.stringify(name)}); }catch(e){ return null;} } if(typeof module !== "undefined" && module.exports){ try{ return module.exports(${JSON.stringify(name)}); }catch(e){ return null;} } return null; })()`;
        // eslint-disable-next-line no-eval
        const out = eval(wrapper);
        if (Array.isArray(out)) {
          out.slice(0, 50).forEach((o) => res.push(String(o)));
          return;
        } else if (typeof out === "string") {
          res.push(out);
          return;
        }
      } catch (err) {
        console.warn("eval style err", st.name, err);
      }
    });

    // حد أقصى 100 نتيجة (2x50)
    return res.slice(0, 100);
  }

  function renderNameResults(name) {
    if (!refs.nameResults) return;
    refs.nameResults.innerHTML = "";
    if (!name || !name.trim()) {
      refs.nameResults.innerHTML = `<p class="small" style="opacity:.8">أدخل الاسم لعرض النتائج.</p>`;
      return;
    }
    const arr = generateNameDecorationsFromStyles(name.trim());
    if (!arr.length) {
      refs.nameResults.innerHTML = `<p class="small" style="opacity:.8">لا توجد أنماط حالياً.</p>`;
      return;
    }
    arr.forEach((txt) => {
      const box = create("div", { class: "name-box" });
      box.textContent = txt;
      refs.nameResults.appendChild(box);
    });
  }

  if (refs.nameInput) {
    refs.nameInput.addEventListener(
      "input",
      debounce((e) => renderNameResults(e.target.value), 160)
    );
  }

  /* ---------------------------
     إدارة الصور الخاصة بالتواصل (Contact images)
     --------------------------- */
  function setupContactImagesUploader() {
    const inp = refs.contactImagesInput;
    if (!inp) return;
    inp.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      for (const f of files) {
        try {
          const data = await fileToDataURL(f);
          const id = "c_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
          state.contactImages.unshift({ id, src: data, link: "" });
        } catch (err) {
          console.warn("contact image read err", err);
        }
      }
      saveState();
      renderContactGallery();
    });
  }

  function renderContactGallery() {
    if (!refs.contactImagesContainer) return;
    refs.contactImagesContainer.innerHTML = "";
    const arr = state.contactImages || [];
    if (!arr.length) {
      refs.contactImagesContainer.innerHTML = `<p class="small" style="opacity:.8">لا توجد صور تواصل مضافة.</p>`;
      return;
    }
    arr.forEach((it) => {
      const wrapper = create("div", { class: "contact-item" });
      const img = create("img", { src: it.src });
      img.className = "contact-img";
      const input = create("input", { type: "url" });
      input.placeholder = "رابط الصورة (اختياري)";
      input.value = it.link || "";
      input.addEventListener("input", (e) => {
        it.link = e.target.value;
        saveState();
      });
      wrapper.appendChild(img);
      wrapper.appendChild(input);
      wrapper.addEventListener("click", () => {
        if (it.link) window.open(it.link, "_blank");
      });
      refs.contactImagesContainer.appendChild(wrapper);
    });
  }

  /* ---------------------------
     Overlays (تلبيسات) ورفعها من لوحة التحكم
     --------------------------- */
  function setupOverlaysUploader() {
    const input = $("#colorOverlaysInput");
    if (!input) return;
    input.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      for (const f of files) {
        try {
          const data = await fileToDataURL(f);
          state.overlays.unshift(data);
        } catch (err) {
          console.warn("overlay read err", err);
        }
      }
      if (state.overlays.length > 300) state.overlays.length = 300;
      saveState();
      renderOverlayGallery();
    });
  }

  function renderOverlayGallery() {
    const container = refs.overlayGallery;
    if (!container) return;
    container.innerHTML = "";
    const arr = state.overlays || [];
    if (!arr.length) {
      container.innerHTML = `<p class="small" style="opacity:.8">لا توجد تلبيسات مضافة.</p>`;
      return;
    }
    arr.forEach((src, i) => {
      const wrap = create("div", { class: "overlay-sample" });
      const img = create("img", { src });
      img.style.width = "100%";
      img.style.height = "72px";
      img.style.objectFit = "cover";
      img.addEventListener("click", () => {
        // عند النقر نُعلم جزء الزخرفة (الجزء الثاني) أن هذه التلبيسة اخترت
        // نستخدم حدث مخصص لإبلاغ الجزء الثاني
        window.dispatchEvent(new CustomEvent("zkh-overlay-selected", { detail: { index: i, src } }));
      });
      wrap.appendChild(img);
      container.appendChild(wrap);
    });
  }

  /* ---------------------------
     Fonts upload (رفع خطوط من admin)
     --------------------------- */
  function setupFontsUploader() {
    const input = $("#proFontsInput");
    if (!input) return;
    input.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      for (const f of files) {
        try {
          const name = f.name.replace(/\.[^/.]+$/, "");
          // نحافظ على اسم الخط في الحالة، ونحاول تحميله كرابط مؤقت للعرض
          const url = URL.createObjectURL(f);
          const id = "f_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
          // إضافة FontFace لتحميل الخط محليًا
          try {
            const fontFace = new FontFace(name, `url(${url})`);
            await fontFace.load();
            document.fonts.add(fontFace);
            state.proFonts.unshift({ id, name });
            saveState();
            renderDecorFontsIntoSelect();
            alert(`تمت إضافة الخط: ${name}`);
          } catch (err) {
            console.warn("FontFace load err", err);
            // حتى لو فشل تحميل FontFace، نخزن الاسم للاختيار لاحقًا
            state.proFonts.unshift({ id, name });
            saveState();
            renderDecorFontsIntoSelect();
          }
        } catch (err) {
          console.warn("font upload err", err);
        }
      }
    });
  }

  function renderDecorFontsIntoSelect() {
    const sel = refs.decorFontSelect;
    if (!sel) return;
    const defaults = ["Amiri", "Cairo", "Reem Kufi", "Tajawal", "Changa"];
    sel.innerHTML = `<option value="">اختيار الخط</option>`;
    defaults.forEach((f) => {
      const opt = create("option", { value: f, text: f });
      sel.appendChild(opt);
    });
    (state.proFonts || []).forEach((f) => {
      const opt = create("option", { value: f.name, text: f.name });
      sel.appendChild(opt);
    });
  }

  /* ---------------------------
     تحميل ستايلات الزخرفة (css/js/json) من admin
     --------------------------- */
  function setupProStylesUploader() {
    const input = $("#proStylesInput");
    if (!input) return;
    input.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      for (const f of files) {
        try {
          const txt = await fileToText(f);
          // لو كان json -> نفحص ونخزنه؛ لو js -> نخزنه كملف لتفسير لاحق
          const id = "ps_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
          // نميز نوعية الملف حسب الامتداد
          const obj = { id, name: f.name, content: txt };
          // نحفظ كستائل عام ضمن nameStyles أو proStyles حسب الامتداد
          if (f.name.endsWith(".json") || f.name.endsWith(".js")) {
            state.nameStyles.unshift(obj); // يمكن استخدامه لاحقاً لزخرفة الأسماء أيضاً
          } else {
            // css أو غيره يمكن حفظه في proStyles في المستقبل - هنا نحتفظ كاحتياط
            state.proStyles = state.proStyles || [];
            state.proStyles.unshift(obj);
          }
          saveState();
          alert(`تمت إضافة الملف: ${f.name}`);
        } catch (err) {
          console.warn("pro style upload err", err);
        }
      }
    });
  }

  /* ---------------------------
     Helpers / init / keyboard shortcuts
     --------------------------- */
  function init() {
    collectRefs();
    loadState();
    applyAppearance();
    setupWelcome();
    setupSideMenu();
    setupAdminPanel();
    setupHomeControls();
    setupNameStylesUploader();
    setupContactImagesUploader();
    setupOverlaysUploader();
    setupFontsUploader();
    setupProStylesUploader();
    // رندر أولي
    renderHomeGallery();
    renderOverlayGallery();
    renderDecorFontsIntoSelect();
    renderContactGallery();
    // about/contact default content
    if (refs.aboutText) refs.aboutText.textContent = state.aboutText || "";
    if (refs.contactText) refs.contactText.textContent = state.contactText || "";

    // اختصار: Esc يغلق القائمة وOverlay
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        refs.sideMenu && refs.sideMenu.classList.remove("active");
        refs.adminOverlay && refs.adminOverlay.classList.add("hidden");
      }
    });
  }

  // Apply appearance (backgrounds, logo)
  function applyAppearance() {
    try {
      if (refs.backgroundImg && state.appearance && state.appearance.bgImage) {
        refs.backgroundImg.src = state.appearance.bgImage;
      }
      const icons = $$(".app-icon");
      icons.forEach((el) => {
        if (el && state.appearance && state.appearance.appIcon) el.src = state.appearance.appIcon;
      });
      const topBar = $(".top-bar");
      if (topBar && state.appearance && state.appearance.topbarImage) {
        topBar.style.backgroundImage = `url(${state.appearance.topbarImage})`;
        topBar.style.backgroundSize = "cover";
      }
      if (state.appearance && state.appearance.font) {
        document.body.style.fontFamily = state.appearance.font;
      }
    } catch (e) {
      console.warn("applyAppearance error", e);
    }
  }

  // تشغيل init عند جاهزية الـ DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // واجهة تصحيح صغيرة للوصول للحالة من الكونصول إن لزم
  window._zakhrafa_state = state;
  window._zakhrafa_save = saveState;
  window._zakhrafa_render = () => {
    renderHomeGallery();
    renderOverlayGallery();
    renderContactGallery();
    renderDecorFontsIntoSelect();
  };

  /* ==========================
     نهاية الجزء الأول
     ========================== */
})();
  /* ============================================================
   script.js - الجزء الثاني (زخرفة احترافية: رسم الكانڤاس،
   ألوان ثابتة/متدرج/تلبيس، تحميل، وقراءة ستايلات)
   دمجه بعد الجزء الأول ليكون الملف مكتملًا.
   ============================================================ */

(function () {
  "use strict";

  const $ = (sel, ctx = document) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx = document) =>
    Array.from((ctx || document).querySelectorAll(sel));

  const STORAGE_KEY = "zakhrafa_v1_state_v2";

  // helper: get latest state (الجزء الأول يخزن الحالة في localStorage)
  function getState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("getState parse error", e);
      return null;
    }
  }

  // ---------- عناصر DOM المستخدمة في هذا الجزء ----------
  let decor = {
    canvas: null,
    ctx: null,
    nameInput: null,
    fontSelect: null,
    colorTypeSelect: null,
    solidColorInput: null,
    gradientGallery: null,
    overlayGallery: null,
    downloadBtn: null,
    imageInput: null,
    bgBtn: null,
  };

  function collectDecorRefs() {
    decor.canvas = $("#decorPreview");
    decor.ctx = decor.canvas ? decor.canvas.getContext("2d") : null;
    decor.nameInput = $("#decorNameInput");
    decor.fontSelect = $("#decorFontSelect");
    decor.colorTypeSelect = $("#colorTypeSelect");
    decor.solidColorInput = $("#solidColor");
    decor.gradientGallery = $("#gradientGallery");
    decor.overlayGallery = $("#overlayGallery");
    decor.downloadBtn = $("#downloadDecorBtn");
    decor.imageInput = $("#decorImageInput");
    decor.bgBtn = $("#decorBgBtn");
  }

  // ---------- إعدادات افتراضية ----------
  const DEFAULT_CANVAS_W = 1200;
  const DEFAULT_CANVAS_H = 600;
  const DEFAULT_FONT = "Amiri";
  let currentOverlaySrc = null; // dataURL
  let currentGradient = null; // {from,to} or css gradient string
  let currentSolidColor = "#111111";
  let currentBgImage = null; // dataURL or URL
  let currentFont = DEFAULT_FONT;
  let currentColorType = "solid"; // solid | gradient | overlay

  // مجموعة تدرجات افتراضية (يمكن استبدالها من state.gradients لاحقًا)
  const defaultGradients = (() => {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const h1 = (i * 18) % 360;
      const h2 = (h1 + 60) % 360;
      arr.push({ id: "g" + i, css: `linear-gradient(90deg,hsl(${h1},75%,55%),hsl(${h2},75%,45%))`, from: `hsl(${h1},75%,55%)`, to: `hsl(${h2},75%,45%)` });
    }
    return arr;
  })();

  // ---------- مساعدة: تحميل صورة من ملف وإرجاع dataURL ----------
  function fileToDataURL(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  }

  // ---------- رسم النص على الكانڤاس مع الدعم للأنماط ----------
  function drawDecorPreviewOnCanvas() {
    if (!decor.canvas || !decor.ctx) return;
    const ctx = decor.ctx;
    // canvas dimensions ثابتة داخل HTML (960x420 أو حسب index)
    const cw = decor.canvas.width || DEFAULT_CANVAS_W;
    const ch = decor.canvas.height || DEFAULT_CANVAS_H;

    // مسح
    ctx.clearRect(0, 0, cw, ch);

    // تخطيط الخلفية: إذا كان هناك background image، نرسمها مكيفة كـ cover
    if (currentBgImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        drawImageCover(ctx, img, 0, 0, cw, ch);
        drawTextLayer(ctx, cw, ch);
      };
      img.onerror = () => {
        // fallback إلى رسم النص مباشرة
        drawTextLayer(ctx, cw, ch);
      };
      img.src = currentBgImage;
      return;
    }

    // بدون خلفية صورة: نرسم مباشرة النص
    drawTextLayer(ctx, cw, ch);
  }

  function drawTextLayer(ctx, cw, ch) {
    // تحديد النص
    const name = (decor.nameInput && decor.nameInput.value) ? decor.nameInput.value : "معاينة";
    // اختيار الخط والحجم
    const fontFamily = currentFont || DEFAULT_FONT;
    // تحسين حجم الخط اعتماداً على طول النص وطول الكانڤاس
    // قاعدة تقريبية:
    const baseSize = Math.max(40, Math.min(220, Math.floor(cw / Math.max(6, name.length))));
    ctx.font = `bold ${baseSize}px ${fontFamily}, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const x = cw / 2;
    const y = ch / 2;

    // نوع التلوين
    if (currentColorType === "solid") {
      ctx.fillStyle = currentSolidColor || "#111";
      ctx.fillText(name, x, y);
    } else if (currentColorType === "gradient") {
      // استخدم تدرج أفقى
      const g = ctx.createLinearGradient(0, 0, cw, 0);
      // currentGradient may be {from,to} or css string
      if (currentGradient && currentGradient.from && currentGradient.to) {
        g.addColorStop(0, currentGradient.from);
        g.addColorStop(1, currentGradient.to);
      } else {
        // fallback gradient
        g.addColorStop(0, "#ff4d4d");
        g.addColorStop(1, "#ffcc00");
      }
      ctx.fillStyle = g;
      ctx.fillText(name, x, y);
    } else if (currentColorType === "overlay") {
      // رسم تلبيسة (pattern) داخل نص: نرسم التلبيسة في كانڤاس مؤقت ثم نستخدم composite
      if (!currentOverlaySrc) {
        // fallback to solid
        ctx.fillStyle = currentSolidColor || "#111";
        ctx.fillText(name, x, y);
        return;
      }
      // إنشاء canvas مؤقت بنفس الأبعاد
      const tmp = document.createElement("canvas");
      tmp.width = cw;
      tmp.height = ch;
      const tctx = tmp.getContext("2d");
      // رسم التلبيسة كـ cover
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        drawImageCover(tctx, img, 0, 0, tmp.width, tmp.height);
        // رسم نص باللون الأسود على مؤقت كقناع
        tctx.globalCompositeOperation = "destination-in";
        tctx.fillStyle = "#000";
        tctx.font = ctx.font;
        tctx.textAlign = "center";
        tctx.textBaseline = "middle";
        tctx.fillText(name, x, y);
        // الآن ننسخ من tmp إلى ctx
        ctx.drawImage(tmp, 0, 0);
      };
      img.onerror = () => {
        // fallback
        ctx.fillStyle = currentSolidColor || "#111";
        ctx.fillText(name, x, y);
      };
      img.src = currentOverlaySrc;
    } else {
      // fallback
      ctx.fillStyle = currentSolidColor || "#111";
      ctx.fillText(name, x, y);
    }
  }

  // ---------- دالة لتعديل وضع الصورة بحيث تغطي (cover) المنطقة ----------
  function drawImageCover(ctx, img, dx, dy, dWidth, dHeight) {
    const iw = img.width, ih = img.height;
    if (iw === 0 || ih === 0) {
      ctx.drawImage(img, dx, dy, dWidth, dHeight);
      return;
    }
    const scale = Math.max(dWidth / iw, dHeight / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    const cx = (nw - dWidth) / 2;
    const cy = (nh - dHeight) / 2;
    ctx.drawImage(img, -cx, -cy, nw, nh);
  }

  // ---------- التعامل مع اختيار تلبيسة من المعرض (حدث مخصص) ----------
  window.addEventListener("zkh-overlay-selected", (e) => {
    try {
      const detail = e.detail || {};
      currentOverlaySrc = detail.src || null;
      // ضبط نوع اللون تلقائياً إلى overlay
      currentColorType = "overlay";
      if (decor.colorTypeSelect) decor.colorTypeSelect.value = "overlay";
      // اعادة رسم المعاينة
      drawDecorPreviewOnCanvas();
      // اجعل معرض التلبيسات ظاهرًا في الواجهة
      if (decor.overlayGallery) {
        // highlight selected (إن رغبت)
      }
    } catch (err) { console.warn(err); }
  });

  // ---------- ملء معرض التدرجات (UI) ----------
  function populateGradientGallery() {
    const container = decor.gradientGallery;
    if (!container) return;
    container.innerHTML = "";
    const state = getState();
    // إذا كانت هناك تدرجات محفوظة من لوحة التحكم نستخدمها، وإلا نستخدم defaultGradients
    const grads = (state && state.gradients) ? state.gradients : defaultGradients;
    grads.forEach((g, idx) => {
      const el = document.createElement("div");
      el.className = "grad-sample";
      // g may be object with .css or a string
      const css = typeof g === "string" ? g : (g.css || `linear-gradient(90deg, ${g.from}, ${g.to})`);
      el.style.background = css;
      el.title = (g.name || `تدرج ${idx+1}`);
      el.style.height = "48px";
      el.style.borderRadius = "8px";
      el.style.cursor = "pointer";
      el.style.border = "1px solid rgba(255,255,255,0.04)";
      el.addEventListener("click", () => {
        // set currentGradient
        if (typeof g === "string") {
          // we can't extract colors easily; just draw a CSS gradient in canvas by using two colors fallback
          // but state may include from/to, handle that
          currentGradient = { from: '#ff4d4d', to: '#ffcc00' };
        } else {
          currentGradient = { from: g.from, to: g.to };
        }
        currentColorType = "gradient";
        if (decor.colorTypeSelect) decor.colorTypeSelect.value = "gradient";
        drawDecorPreviewOnCanvas();
      });
      container.appendChild(el);
    });
  }

  // ---------- ملء معرض التلبيسات من state ---------- 
  function populateOverlayGalleryFromState() {
    const container = decor.overlayGallery;
    if (!container) return;
    container.innerHTML = "";
    const state = getState();
    const arr = (state && state.overlays) ? state.overlays : [];
    if (!arr.length) {
      container.innerHTML = `<p class="small" style="opacity:.8;color:rgba(255,255,255,0.7)">لا توجد تلبيسات مضافة.</p>`;
      return;
    }
    arr.forEach((src, idx) => {
      const wrap = document.createElement("div");
      wrap.className = "overlay-sample";
      const img = document.createElement("img");
      img.src = src;
      img.style.width = "100%";
      img.style.height = "72px";
      img.style.objectFit = "cover";
      img.style.cursor = "pointer";
      img.addEventListener("click", () => {
        // set overlay (same as custom event)
        currentOverlaySrc = src;
        currentColorType = "overlay";
        if (decor.colorTypeSelect) decor.colorTypeSelect.value = "overlay";
        drawDecorPreviewOnCanvas();
      });
      wrap.appendChild(img);
      container.appendChild(wrap);
    });
  }

  // ---------- تحميل/تصدير الصورة النهائية ----------
  function exportDecorImage(options = {}) {
    // options: { format: 'png'|'jpeg', width, height, filename }
    const format = (options.format || "png").toLowerCase();
    const w = options.width || decor.canvas.width || DEFAULT_CANVAS_W;
    const h = options.height || decor.canvas.height || DEFAULT_CANVAS_H;
    const filename = options.filename || `decor-result.${format === "jpeg" ? "jpg" : "png"}`;

    // نريد رسم نسخة بالحجم المطلوب: نستخدم canvas مؤقت ونرسم محتويات المعاينة عليه
    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    const tctx = tmp.getContext("2d");

    // نعيد رسم الخلفية إن كانت موجودة
    if (currentBgImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        drawImageCover(tctx, img, 0, 0, w, h);
        drawTextToContext(tctx, w, h, format, filename);
      };
      img.onerror = () => {
        // proceed to draw text
        drawTextToContext(tctx, w, h, format, filename);
      };
      img.src = currentBgImage;
    } else {
      // خلفية شفافة (أو يمكن تعيين لون خلفية هنا)
      tctx.clearRect(0, 0, w, h);
      drawTextToContext(tctx, w, h, format, filename);
    }
  }

  function drawTextToContext(tctx, w, h, format, filename) {
    const name = (decor.nameInput && decor.nameInput.value) ? decor.nameInput.value : "معاينة";
    const fontFamily = currentFont || DEFAULT_FONT;
    const size = Math.max(30, Math.min(240, Math.floor(w / Math.max(6, name.length))));
    tctx.font = `bold ${size}px ${fontFamily}, sans-serif`;
    tctx.textAlign = "center";
    tctx.textBaseline = "middle";

    if (currentColorType === "solid") {
      tctx.fillStyle = currentSolidColor || "#111";
      tctx.fillText(name, w / 2, h / 2);
      finishExport(tctx.canvas, format, filename);
    } else if (currentColorType === "gradient") {
      const g = tctx.createLinearGradient(0, 0, w, 0);
      if (currentGradient && currentGradient.from && currentGradient.to) {
        g.addColorStop(0, currentGradient.from);
        g.addColorStop(1, currentGradient.to);
      } else {
        g.addColorStop(0, "#ff4d4d");
        g.addColorStop(1, "#ffcc00");
      }
      tctx.fillStyle = g;
      tctx.fillText(name, w / 2, h / 2);
      finishExport(tctx.canvas, format, filename);
    } else if (currentColorType === "overlay") {
      if (!currentOverlaySrc) {
        tctx.fillStyle = currentSolidColor || "#111";
        tctx.fillText(name, w / 2, h / 2);
        finishExport(tctx.canvas, format, filename);
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // draw overlay cover to temp canvas
        const overlayCanvas = document.createElement("canvas");
        overlayCanvas.width = w;
        overlayCanvas.height = h;
        const octx = overlayCanvas.getContext("2d");
        drawImageCover(octx, img, 0, 0, w, h);
        // mask overlay with text
        octx.globalCompositeOperation = "destination-in";
        octx.fillStyle = "#000";
        octx.font = tctx.font;
        octx.textAlign = "center";
        octx.textBaseline = "middle";
        octx.fillText(name, w / 2, h / 2);
        // finally draw overlayCanvas onto tctx
        tctx.drawImage(overlayCanvas, 0, 0);
        finishExport(tctx.canvas, format, filename);
      };
      img.onerror = () => {
        tctx.fillStyle = currentSolidColor || "#111";
        tctx.fillText(name, w / 2, h / 2);
        finishExport(tctx.canvas, format, filename);
      };
      img.src = currentOverlaySrc;
    } else {
      tctx.fillStyle = currentSolidColor || "#111";
      tctx.fillText(name, w / 2, h / 2);
      finishExport(tctx.canvas, format, filename);
    }
  }

  function finishExport(canvasEl, format, filename) {
    if (format === "png") {
      const dataURL = canvasEl.toDataURL("image/png");
      downloadDataURL(dataURL, filename);
    } else if (format === "jpeg" || format === "jpg") {
      const dataURL = canvasEl.toDataURL("image/jpeg", 0.92);
      downloadDataURL(dataURL, filename);
    } else {
      // default PNG
      const dataURL = canvasEl.toDataURL("image/png");
      downloadDataURL(dataURL, filename);
    }
  }

  // ---------- التهيئة (ربط الأحداث والملء) ----------
  function initDecorModule() {
    collectDecorRefs();

    // set initial values from state
    const state = getState();
    if (state && state.appearance) {
      currentBgImage = state.appearance.bgImage || currentBgImage;
      currentFont = state.appearance.font || currentFont;
    }

    // populate font select (defaults + uploaded)
    populateFontSelect();

    // populate gradient gallery and overlay gallery
    populateGradientGallery();
    populateOverlayGalleryFromState();

    // handlers
    if (decor.nameInput) {
      decor.nameInput.addEventListener("input", debounce(() => {
        drawDecorPreviewOnCanvas();
      }, 120));
    }

    if (decor.fontSelect) {
      decor.fontSelect.addEventListener("change", (e) => {
        currentFont = e.target.value || currentFont;
        drawDecorPreviewOnCanvas();
      });
    }

    if (decor.colorTypeSelect) {
      decor.colorTypeSelect.addEventListener("change", (e) => {
        currentColorType = e.target.value || "solid";
        // show/hide UI parts (color picker / gradient / overlay gallery)
        if (decor.solidColorInput) {
          if (currentColorType === "solid") {
            decor.solidColorInput.parentElement.classList.remove("hidden");
          } else {
            decor.solidColorInput.parentElement.classList.add("hidden");
          }
        }
        if (decor.gradientGallery) {
          if (currentColorType === "gradient") {
            decor.gradientGallery.classList.remove("hidden");
          } else {
            decor.gradientGallery.classList.add("hidden");
          }
        }
        if (decor.overlayGallery) {
          if (currentColorType === "overlay") {
            decor.overlayGallery.classList.remove("hidden");
          } else {
            decor.overlayGallery.classList.add("hidden");
          }
        }
        drawDecorPreviewOnCanvas();
      });
    }

    if (decor.solidColorInput) {
      decor.solidColorInput.addEventListener("input", (e) => {
        currentSolidColor = e.target.value;
        if (currentColorType === "solid") drawDecorPreviewOnCanvas();
      });
    }

    // decor image input (user uploads an image of the name to preview)
    if (decor.imageInput) {
      decor.imageInput.addEventListener("change", async (e) => {
        // if user supplies an image of name, we set it as overlaySrc and set type=overlay
        const f = (e.target.files && e.target.files[0]) || null;
        if (!f) return;
        try {
          const data = await fileToDataURL(f);
          currentOverlaySrc = data;
          currentColorType = "overlay";
          if (decor.colorTypeSelect) decor.colorTypeSelect.value = "overlay";
          drawDecorPreviewOnCanvas();
        } catch (err) {
          console.warn("decor image upload err", err);
        }
      });
    }

    // background change button (يمكن فتح حوار لاختيار خلفية من home images)
    if (decor.bgBtn) {
      decor.bgBtn.addEventListener("click", () => {
        // نعرض نافذة اختيار: نأخذ أول صورة من home images إن وُجدت
        const st = getState();
        if (st && st.homeImages && st.homeImages.length) {
          currentBgImage = st.homeImages[0].src;
          drawDecorPreviewOnCanvas();
          alert("تم تعيين صورة الخلفية من أول صورة في الصفحة الرئيسية.");
        } else {
          alert("لا توجد صور في الصفحة الرئيسية. أضف صورًا من لوحة التحكم أولًا.");
        }
      });
    }

    // تحميل الصورة
    if (decor.downloadBtn) {
      decor.downloadBtn.addEventListener("click", () => {
        // نعرض خيارات بسيطة: الحجم / التنسيق
        const fmt = prompt("اختر الصيغة (png/jpg)", "png") || "png";
        const size = prompt("الحجم (small/medium/large/custom)", "medium") || "medium";
        let w = 1200, h = 600;
        if (size === "small") { w = 640; h = 360; }
        else if (size === "large") { w = 2400; h = 1200; }
        else if (size === "custom") {
          const wIn = parseInt(prompt("العرض px", "1200") || "1200", 10);
          const hIn = parseInt(prompt("الارتفاع px", "600") || "600", 10);
          if (!isNaN(wIn) && !isNaN(hIn)) { w = wIn; h = hIn; }
        }
        exportDecorImage({ format: fmt, width: w, height: h, filename: `decor-${Date.now()}.${fmt === "jpg" ? "jpg" : "png"}` });
      });
    }

    // رسم أولي
    drawDecorPreviewOnCanvas();
  }

  function populateFontSelect() {
    const sel = decor.fontSelect;
    if (!sel) return;
    const defaults = ["Amiri", "Cairo", "Tajawal", "Reem Kufi", "Changa"];
    sel.innerHTML = `<option value="">اختيار الخط</option>`;
    defaults.forEach(f => {
      const opt = document.createElement("option");
      opt.value = f; opt.textContent = f;
      sel.appendChild(opt);
    });
    // إضافة خطوط مرفوعة من state.proFonts
    const st = getState();
    if (st && st.proFonts && st.proFonts.length) {
      st.proFonts.forEach(ff => {
        const opt = document.createElement("option");
        opt.value = ff.name; opt.textContent = ff.name;
        sel.appendChild(opt);
      });
    }
    // تحديد القيمة الافتراضية
    sel.value = currentFont || "";
  }

  // ---------- استمع لحدث حفظ الحالة الخارجي لتحديث المعارض عند الحاجة ----------
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      populateOverlayGalleryFromState();
      populateGradientGallery();
      populateFontSelect();
      // إعادة رسم المعاينة
      drawDecorPreviewOnCanvas();
    }
  });

  // ---------- تهيئة عند جاهزية الـ DOM ----------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDecorModule);
  } else {
    initDecorModule();
  }

  // expose for debug
  window._zakhrafa_draw = drawDecorPreviewOnCanvas;
  window._zakhrafa_setOverlay = (src) => { currentOverlaySrc = src; currentColorType = "overlay"; drawDecorPreviewOnCanvas(); };

  /* ==========================
     نهاية الجزء الثاني
     ========================== */
})();
