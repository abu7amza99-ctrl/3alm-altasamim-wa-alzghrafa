// الرسالة الترحيبية
const startBtn = document.getElementById("startBtn");
const welcome = document.getElementById("welcome");
startBtn.onclick = () => {
  welcome.style.display = "none";
};

// اللوحة الجانبية
const openMenu = document.getElementById("openMenu");
const closeMenu = document.getElementById("closeMenu");
const sideMenu = document.getElementById("sideMenu");

openMenu.onclick = () => sideMenu.style.display = "block";
closeMenu.onclick = () => sideMenu.style.display = "none";

// لوحة التحكم
const openAdmin = document.getElementById("openAdmin");
const closeAdmin = document.getElementById("closeAdmin");
const adminPanel = document.getElementById("adminPanel");
const loginSection = document.getElementById("loginSection");
const settingsSection = document.getElementById("settingsSection");
const loginBtn = document.getElementById("loginBtn");
const adminPass = document.getElementById("adminPass");
const newPass = document.getElementById("newPass");
const changePassBtn = document.getElementById("changePassBtn");

let savedPass = "1234"; // كلمة المرور الافتراضية

openAdmin.onclick = () => {
  adminPanel.style.display = "flex";
  loginSection.style.display = "block";
  settingsSection.style.display = "none";
};

closeAdmin.onclick = () => {
  adminPanel.style.display = "none";
};

loginBtn.onclick = () => {
  if (adminPass.value === savedPass) {
    loginSection.style.display = "none";
    settingsSection.style.display = "block";
  } else {
    alert("كلمة المرور غير صحيحة!");
  }
};

changePassBtn.onclick = () => {
  if (newPass.value.trim() !== "") {
    savedPass = newPass.value.trim();
    alert("تم تغيير كلمة المرور بنجاح!");
    adminPanel.style.display = "none";
  } else {
    alert("أدخل كلمة مرور جديدة!");
  }
};
