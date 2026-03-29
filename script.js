const APP_VERSION = "26.3.291";
let deferredPrompt;
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const koreaHolidays2026 = [
  "2026-01-01",
  "2026-02-16","2026-02-17","2026-02-18",
  "2026-03-01", "2026-03-02",
  "2026-05-05",
  "2026-05-24","2026-05-25",
  "2026-06-03","2026-06-06",
  "2026-07-17",
  "2026-08-15","2026-08-17",
  "2026-09-24","2026-09-25","2026-09-26","2026-09-27",
  "2026-10-03","2026-10-05","2026-10-09",
  "2026-12-25"
];

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("darkMode") === "true";
  if (saved) {
    document.body.classList.add("dark-mode");
  }

  const splitContainer = document.querySelector(".info-row.split");
  const cols = splitContainer.querySelectorAll(".info-col");

  cols[0].addEventListener("click", () => {
    splitContainer.classList.remove("select-color");
  });

  cols[1].addEventListener("click", () => {
    splitContainer.classList.add("select-color");
  });
});

document.addEventListener("touchstart", function() {}, true);

const closeBottomSheet = (modalId) => {
  const modalElement = document.getElementById(modalId);
  if (!modalElement) return;
  modalElement.classList.remove("active");
  setTimeout(() => {
    modalElement.classList.add("hidden");
  const scrollableElements = modalElement.querySelectorAll('div'); 
  scrollableElements.forEach(el => {
    if (el.scrollTop > 0) el.scrollTop = 0;
  });
    const anyActive = document.querySelector('.modal-overlay.active, .modal.active');
    if (!anyActive) {
      document.body.classList.remove("modal-open", "stop-scroll");
    }
  }, 400);
};

// DOM 요소
const datesContainer = document.getElementById("dates");
const monthDisplay = document.getElementById("monthDisplay");
const todayBtn = document.getElementById("fabTodayBtn");
const addBtn = document.getElementById("fabAddBtn");
const modalOverlay = document.getElementById("modalOverlay");
const closeModalBtn = document.getElementById("closeModal");
const inputDate = document.getElementById("inputDate");
const inputProduct = document.getElementById("inputProduct");
const inputTotal = document.getElementById("inputTotal");
const inputDose = document.getElementById("inputDose");
const inputPrice = document.getElementById("inputPrice");
const inputColor = document.getElementById("inputColor");
const saveInfoBtn = document.getElementById("saveInfo");
const monthlyCostBtn = document.getElementById("monthlyCostBtn");
const monthlyCostModal = document.getElementById("monthlyCostModal");
const monthlyCostContent = document.getElementById("monthlyCostContent");
const closeMonthlyCostModal = document.getElementById("closeMonthlyCostModal");

document.addEventListener("change", (e) => {
  if (e.target.id === "inputUnit") {
    const unitDisplay = document.getElementById("unitDisplay");
    if (unitDisplay) unitDisplay.innerText = e.target.value;
  }
});

function openSupplementModal(sup) {
  currentEditId = sup.id;
  if (typeof renderFamilyCheckboxes === 'function') {
    renderFamilyCheckboxes();
  } else if (typeof renderFamilyUI === 'function') {
    renderFamilyUI();
  }
  const deleteContainer = document.querySelector(".delete-btn-container");
  if (deleteContainer) deleteContainer.style.display = "flex";
  modalOverlay.classList.add("active");
  document.body.classList.add("modal-open");

  inputDate.value = (sup.schedule && sup.schedule[0]) || selectedDateForList || "";
  inputProduct.value = sup.productName;
  inputTotal.value = sup.totalCapsules;
  
  const doseInput = document.getElementById("inputDose");
  if (doseInput) doseInput.value = sup.dose ?? "";
  
  inputPrice.value = sup.price ? sup.price.toLocaleString() : "";
  
  const unitVal = sup.unit || "캡슐";
  const unitSelect = document.getElementById("inputUnit");
  const unitDisplay = document.getElementById("unitDisplay");
  if (unitSelect) unitSelect.value = unitVal;
  if (unitDisplay) unitDisplay.innerText = unitVal;

  const currentFamilyCheckboxes = document.querySelectorAll(".inputFamily");
  currentFamilyCheckboxes.forEach(cb => {
    cb.checked = sup.family && sup.family.includes(cb.value);
  });

  const currentTimeCheckboxes = document.querySelectorAll(".inputTime");
  currentTimeCheckboxes.forEach(tb => {
    tb.checked = sup.times && sup.times.includes(tb.value);
    });
    
  const memos = sup.memos || ["", "", ""];
  document.getElementById("memoLine1").value = memos[0] || "";
  document.getElementById("memoLine2").value = memos[1] || "";
  document.getElementById("memoLine3").value = memos[2] || "";
  
  updateColorBar(sup.circleColor);

  updateSelectedDisplay('inputFamily', 'selectedFamilyText');
  updateSelectedDisplay('inputTime', 'selectedTimeText');
  document.querySelector(".info-row.split").classList.remove("select-color");
  validateInputs();

  if (typeof updateTimeCheckboxes === 'function') {
    updateTimeCheckboxes();
  }
  setTimeout(() => initClearButtons(), 100);
  setTimeout(() => setupInputAlignment(), 50);
}

// 상태
let dt = new Date();
let supplements = [];
let familyMembers = JSON.parse(localStorage.getItem("familyMembers")) || [];
let selectedDateForList = "";
let currentEditId = null;

const colorList = [
  "#E84855",
  "#16A085",
  "#F57C00",
  "#ffD516",
  "#388E3C",
  "#1976D2",
  "#c96a3f",
  "#118AB2",
  "#8E44AD",
  "#D32F2F",
  "#FF9F1C",
  "#97aa44",
  "#00cddd",
  "#D700BB",
  "#3498DB",
  ];

  // 랜덤 HEX 색상을 생성하는 함수
  const getRandomColor = () => {
  const r = Math.floor(Math.random() * 181).toString(16).padStart(2, '0');
  const g = Math.floor(Math.random() * 181).toString(16).padStart(2, '0');
  const b = Math.floor(Math.random() * 181).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
};

// 한국 시간 기준 오늘 날짜 문자열 (YYYY-MM-DD)
function getTodayKST() {
  const options = { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('ko-KR', options);
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;  
  return `${year}-${month}-${day}`;
}

// IndexedDB
const DB_NAME = "supplementCalendarDB";
const DB_VERSION = 1;
const STORE_NAME = "supplements";
let db = null;

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => { 
      db = request.result; 
      db.onversionchange = () => {
        db.close();
        openCustomActionSheet(null, "데이터베이스 버전이 변경되었습니다. 앱을 재실행합니다.", true);
        location.reload();
      };
      resolve(db); 
    };
    request.onerror = (e) => {
  console.error("DB 오픈 실패:", e.target.error);
  openCustomActionSheet(
    null, "데이터베이스를 열 수 없습니다.\nSafari 설정이나 개인정보 보호 모드를 확인해주세요.", true);
  reject(request.error);
};
  });
}

function getAllSupplements() {
  return new Promise(async (resolve, reject) => {
    await openDatabase();
    const tx = db.transaction([STORE_NAME], "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function saveSupplementToDB(sup) {
  return new Promise(async (resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(sup);
    req.onsuccess = () => resolve();
       req.onerror = (event) => {
      console.error("[DB 저장 에러]", event.target.error);
      openCustomActionSheet(null, "저장 중 오류가 발생했습니다. 콘솔을 확인하세요.", true);
      reject(event.target.error);
    };
  });
}

function deleteSupplementFromDB(id) {
  return new Promise(async (resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// 테마
const themeToggleBtn = document.getElementById("themeToggle");
const metaThemeColor = document.getElementById("themeColorMeta");

themeToggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", isDark);

  const color = isDark ? "#000000" : "#ffffff";
  metaThemeColor.setAttribute("content", color);
});

document.addEventListener("DOMContentLoaded", () => {
  const isDark = localStorage.getItem("darkMode") === "true";
  if (isDark) {
    document.body.classList.add("dark-mode");
    metaThemeColor.setAttribute("content", "#000000");
  } else {
    metaThemeColor.setAttribute("content", "#ffffff");
  }
});


// + 버튼 클릭 //
addBtn.addEventListener("click", () => {
  currentEditId = null;
  const deleteContainer = document.querySelector(".delete-btn-container");
  if (deleteContainer) deleteContainer.style.display = "none";
  renderFamilyCheckboxes();
  modalOverlay.classList.add("active");
  document.getElementById('saveInfo').classList.remove('ready');
  document.body.classList.add("modal-open");
  history.pushState({ modal: "add" }, "");

  const unitSelect = document.getElementById("inputUnit");
  const unitDisplay = document.getElementById("unitDisplay");
  
  if (unitSelect) unitSelect.value = "캡슐";
  if (unitDisplay) unitDisplay.innerText = "캡슐";

  inputDate.value = selectedDateForList || getTodayKST();
  inputProduct.value = "";
  inputTotal.value = "";
  const doseEl = document.getElementById("inputDose");
  if (doseEl) doseEl.value = "";
  inputPrice.value = "";
  updateColorBar("#000000");

  document.querySelectorAll(".inputFamily").forEach(tb => tb.checked = false);
  document.querySelectorAll(".inputTime").forEach(tb => tb.checked = false);

  document.getElementById("selectedFamilyText").textContent = "";
  document.getElementById("selectedTimeText").textContent = "";
  document.getElementById("selectedFamilyText").style.opacity = 1;
  document.getElementById("selectedTimeText").style.opacity = 1;
  resetAccordions();

  document.querySelector(".info-row.split").classList.remove("select-color");
  document.getElementById("memoLine1").value = "";
  document.getElementById("memoLine2").value = "";
  document.getElementById("memoLine3").value = "";

  document.querySelectorAll(".inputTime").forEach(cb => {
    cb.disabled = false;
    cb.parentElement.style.opacity = "1";
    cb.parentElement.style.pointerEvents = "auto";
  });
  setTimeout(() => initClearButtons(), 100);
  setTimeout(() => setupInputAlignment(), 50);
});

closeModalBtn.addEventListener("click", () => {
  closeBottomSheet("modalOverlay");
  resetAccordions();
  document.getElementById('saveInfo').classList.remove('ready');
  validateInputs();
});

// 달력 렌더 //
function renderCalendar() {
  dt.setDate(1);
  const year = dt.getFullYear();
  const month = dt.getMonth();

  monthDisplay.innerText = `${year}. ${String(month+1).padStart(2,"0")}`;

  const todayStr = getTodayKST();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month+1,0).getDate();

  datesContainer.innerHTML = "";

  const prevLastDate = new Date(year, month, 0).getDate();
  for (let x = firstDay; x > 0; x--) {
    const dayNum = prevLastDate - x + 1;
    const div = document.createElement("div");
    div.classList.add("date", "inactive");

    const prevDateObj = new Date(year, month - 1, dayNum);
    const pY = prevDateObj.getFullYear();
    const pM = String(prevDateObj.getMonth() + 1).padStart(2, "0");
    const pD = String(prevDateObj.getDate()).padStart(2, "0");
    const dow = prevDateObj.getDay();
    if (dow === 0) div.classList.add("sun");
    if (dow === 6) div.classList.add("sat");

    const fullDatePrev = `${pY}-${pM}-${pD}`;
    
    if (koreaHolidays2026.includes(fullDatePrev)) {
      div.classList.add("holiday");
    }
    if (fullDatePrev === getTodayKST()) div.classList.add("today-date");

    div.innerHTML = `<span class="number">${dayNum}</span>`;
    datesContainer.appendChild(div);
  }

  for (let i = 1; i <= lastDate; i++) {
    const div = document.createElement("div");
    div.classList.add("date");

    const dayOfWeek = new Date(year, month, i).getDay();
    if (dayOfWeek === 0) div.classList.add("sun");
    if (dayOfWeek === 6) div.classList.add("sat");

    const fullDate = `${year}-${String(month+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;
    
    if (koreaHolidays2026.includes(fullDate)) {
      div.classList.add("holiday");
    }

    if (fullDate === todayStr) {
        div.classList.add("today-date");
    }

    if (fullDate === selectedDateForList) {
        div.classList.add("selected");
    }

    const spanNumber = document.createElement("span");
    spanNumber.classList.add("number");
    spanNumber.innerText = i;
    div.appendChild(spanNumber);

    div.addEventListener("click", () => {
      selectedDateForList = fullDate;
      inputDate.value = fullDate;
      renderCalendar();
      });

      spanNumber.addEventListener("click", (e) => {
        e.stopPropagation();

        selectedDateForList = fullDate;
        renderCalendar();

    const hasSupps = supplements.some(sup => sup.schedule.includes(fullDate));
    if (hasSupps) {
      openTakenCheckUI(fullDate);
      }
    });

    let listArea = div.querySelector(".supplement-list");
    if (!listArea) {
      listArea = document.createElement("div");
      listArea.classList.add("supplement-list");
      div.appendChild(listArea);
    }

    supplements.forEach(sup => {
      if (sup.schedule.includes(fullDate)) {

        const bar = document.createElement("div");
        bar.classList.add("supplement-bar");

        const endDateStr = sup.schedule[sup.schedule.length - 1];
        const endDateObj = new Date(endDateStr);
        
        const endSun = new Date(endDateObj);
        endSun.setDate(endDateObj.getDate() - endDateObj.getDay());
        const endSat = new Date(endSun);
        endSat.setDate(endSun.getDate() + 6);

        const currDateObj = new Date(fullDate);
        if (currDateObj >= endSun && currDateObj <= endSat) {
          bar.classList.add("last-week-bar");
        }

        const rgb = hexToRgb(sup.circleColor);
        bar.style.backgroundColor = `rgba(${rgb}, var(--bar-opacity))`;

        const fill = document.createElement("div");
        fill.classList.add("bar-fill");
        fill.style.backgroundColor = sup.circleColor;

        const dayStatus = sup.takenStatus?.[fullDate] || {};
        let takenSlots = 0;
        sup.times.forEach((t, idx) => {
          for (let m of sup.family) {
            if (dayStatus[`${idx}_${m}`]) {
              takenSlots++;
            }
          }
        });

const totalCaps = Number(sup.totalCapsules) || 0;
const dailyDosePerPerson = Number(sup.dose) || 1;
const dateIndex = sup.schedule.indexOf(fullDate);
const slotsPerDay = (sup.times?.length || 0) * (sup.family?.length || 0); 
const dosePerSlot = dailyDosePerPerson / (sup.times?.length || 1);
const totalDosePerDay = slotsPerDay * dosePerSlot;
const capsAvailableToday = Math.max(0, totalCaps - (dateIndex * totalDosePerDay));

let actualTotalSlotsToday = slotsPerDay;
if (dosePerSlot > 0) {
    actualTotalSlotsToday = Math.min(slotsPerDay, Math.floor(capsAvailableToday / dosePerSlot));
}

let fillPercent = 0;
if (actualTotalSlotsToday > 0) {
    fillPercent = Math.min(100, Math.floor((takenSlots / actualTotalSlotsToday) * 100));
} else if (totalCaps > 0 && capsAvailableToday <= 0) {
    fillPercent = takenSlots > 0 ? 100 : 0;
}

        fill.style.width = `${fillPercent}%`;

        const labelInBar = document.createElement("span");
        labelInBar.classList.add("supplement-bar-label");
        labelInBar.innerText = sup.productName;

        bar.appendChild(fill);

        const currDateObjForLabel = new Date(fullDate);
        const dayNum = currDateObjForLabel.getDay();
        const dateNum = currDateObjForLabel.getDate();

        if (dayNum === 0 || sup.schedule[0] === fullDate || dateNum === 1) {

          if (fillPercent === 0) {
            labelInBar.classList.add("unTaken");
          }

          labelInBar.innerText = sup.productName;
          bar.appendChild(labelInBar);
        }

// 클릭 이벤트 유지
bar.addEventListener("click", (e) => {
  e.stopPropagation();
  selectedDateForList = fullDate;
  openSupplementModal(sup);
});

listArea.appendChild(bar);

      }
    });

    datesContainer.appendChild(div);
  }

  const totalCells = firstDay + lastDate;
  const nextSlots = 42 - totalCells;
  for (let j = 1; j <= nextSlots; j++) {
    const div = document.createElement("div");
    div.classList.add("date", "inactive");

    const dowNext = new Date(year, month+1, j).getDay();
    if (dowNext === 0) div.classList.add("sun");
    if (dowNext === 6) div.classList.add("sat");

    const nextDateObj = new Date(year, month + 1, j);
    const nY = nextDateObj.getFullYear();
    const nM = String(nextDateObj.getMonth() + 1).padStart(2, "0");
    const nD = String(nextDateObj.getDate()).padStart(2, "0");
    const fullDateNext = `${nY}-${nM}-${nD}`;
    if (koreaHolidays2026.includes(fullDateNext)) {
      div.classList.add("holiday");
    }
    if (fullDateNext === getTodayKST()) div.classList.add("today-date");

    div.innerHTML = `<span class="number">${j}</span>`;
    datesContainer.appendChild(div);
  }
  if (typeof applyIOSButtonEffect === 'function') {
      applyIOSButtonEffect();
  }
}

// 저장
saveInfoBtn.addEventListener("click", async (e) => {
  if (!saveInfoBtn.classList.contains('ready')) return;
  const start = inputDate.value;
  const product = inputProduct.value.trim();
  const totalCaps = parseInt(inputTotal.value) || 0;
  const dose = parseInt(inputDose.value) || 0;
  const unit = document.getElementById("inputUnit").value;
  const price = parseInt(inputPrice.value.toString().replace(/,/g, "")) || 0;
  const family = [...document.querySelectorAll(".inputFamily")].filter(cb => cb.checked).map(cb => cb.value);
  const times = [...document.querySelectorAll(".inputTime")].filter(tb => tb.checked).map(tb => tb.value);
  const memo1 = document.getElementById("memoLine1").value;
  const memo2 = document.getElementById("memoLine2").value;
  const memo3 = document.getElementById("memoLine3").value;
  const totalPerDay = dose * family.length;
  const totalDays = Math.ceil(totalCaps / totalPerDay);

  let schedule = [];
  let d = new Date(start);
  for (let k = 0; k < totalDays; k++){
    schedule.push(d.toISOString().slice(0,10));
    d.setDate(d.getDate()+1);
  }

 if (currentEditId) {
    const found = supplements.find(s => s.id === currentEditId);
    Object.assign(found, {
      productName: product,
      totalCapsules: totalCaps,
      unit: unit,
      dose,
      price,
      family,
      times,
      schedule,
      memos: [memo1, memo2, memo3],
      circleColor: document.getElementById('inputColor').value
    });
    await saveSupplementToDB(found);
  } else {

    const usedColors = supplements.map(s => s.circleColor?.toLowerCase().trim());
    let assignedColor;
    const selectedColor = document.getElementById('inputColor').value?.toLowerCase().trim();
    
    if (selectedColor && selectedColor !== "#000000" && !usedColors.includes(selectedColor)) {
  assignedColor = selectedColor;
} else {
  assignedColor = colorList.find(c => !usedColors.includes(c.toLowerCase().trim()));
  
  if (!assignedColor) {
    let newRandomColor;
    let isDuplicate = true;
    let attempts = 0;

    while (isDuplicate && attempts < 10) {
      newRandomColor = getRandomDarkColor();
      isDuplicate = usedColors.includes(newRandomColor.toLowerCase());
      attempts++;
    }
    assignedColor = newRandomColor;
  }
}

    const newSup = {
      id: Date.now(),
      productName: product,
      totalCapsules: totalCaps,
      unit: unit,
      dose,
      price,
      family,
      times,
      schedule,
      memos: [memo1, memo2, memo3],
      circleColor: assignedColor,
      takenStatus: {}
    };
    supplements.push(newSup);
    await saveSupplementToDB(newSup);
  }

  resetAccordions();
  document.getElementById('selectedFamilyText').textContent = '';
  document.getElementById('selectedTimeText').textContent = '';
  document.getElementById('selectedFamilyText').style.opacity = 1;
  document.getElementById('selectedTimeText').style.opacity = 1;
    
    modalOverlay.classList.remove("active");
    selectedDateForList = start;
    renderCalendar();
});

async function saveAllSupplements(targetSup) {
  if (targetSup) {
    await saveSupplementToDB(targetSup);
  } else {
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (let sup of supplements) {
      store.put(sup);
    }
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
  }
}

async function loadSupplements() {
  supplements = await getAllSupplements();
  checkInitialSetup();
  selectedDateForList = getTodayKST();
  renderCalendar();
  renderFamilyUI();
}

if (todayBtn) {
  todayBtn.addEventListener("click", () => {
    const now = new Date();
    const targetY = now.getFullYear();
    const targetM = now.getMonth();
    const targetD = now.getDate();

    const currentY = dt.getFullYear();
    const currentM = dt.getMonth();

    if (currentY === targetY && currentM === targetM) {
      selectedDateForList = `${targetY}-${String(targetM + 1).padStart(2, "0")}-${String(targetD).padStart(2, "0")}`;
      renderCalendar();
      datesWrapper.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (isAnimating) return;
    isAnimating = true;

    const currentScroll = datesWrapper.scrollTop;
    const clone = datesContainer.cloneNode(true);
    clone.classList.add("calendar-animating-clone");
    clone.style.transform = `translateY(${-currentScroll}px)`;
    datesWrapper.appendChild(clone);

    dt = new Date(targetY, targetM, 1); 
    selectedDateForList = `${targetY}-${String(targetM + 1).padStart(2, "0")}-${String(targetD).padStart(2, "0")}`;
    renderCalendar();
    datesWrapper.scrollTop = 0;
    const isFuture = new Date(targetY, targetM) > new Date(currentY, currentM);
    datesContainer.style.transition = 'none';
    datesContainer.style.transform = isFuture ? 'translateY(100%)' : 'translateY(-100%)';

    requestAnimationFrame(() => {
      setTimeout(() => {
        const transitionStyle = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
        datesContainer.style.transition = transitionStyle;
        clone.style.transition = transitionStyle;

        datesContainer.style.transform = 'translateY(0)';
        clone.style.transform = isFuture ? `translateY(${-currentScroll - datesWrapper.clientHeight}px)` : `translateY(${-currentScroll + datesWrapper.clientHeight}px)`;
      }, 20);
    });

    setTimeout(() => {
      if (clone.parentNode) clone.remove();
      datesContainer.style.transition = 'none';
      isAnimating = false;
    }, 650);
  });
}

loadSupplements();

function checkInitialSetup() {
  const overlay = document.getElementById("initialOverlay");
  const configModal = document.getElementById("familyConfigModal");
  const mainContainer = document.querySelector(".container");
  const isNoSupplements = supplements.length === 0;
  const isNoFamily = !localStorage.getItem("familyMembers");

  if (isNoSupplements && isNoFamily) {

    if (overlay) overlay.classList.add("active");
    if (configModal) configModal.classList.add("active");
    if (mainContainer) mainContainer.style.display = "none";
  } else {

    if (overlay) overlay.classList.remove("active");
    if (configModal) configModal.classList.remove("active");
    if (mainContainer) mainContainer.style.display = "block";
  }
}
/*-------------------------------------섭취체크모달 시작-------------------------------------*/
function openTakenCheckUI(date) {
  const modal = document.getElementById("takenCheckModal");
  const title = document.getElementById("takenCheckTitle");
  const body = document.getElementById("takenCheckBody");

  if (body) {
    body.style.overflowY = "auto";
    body.scrollTop = 0;
  }

  const formattedDate = date.replaceAll('-', '.');
  title.innerHTML = `
    <span>섭취 체크</span>
    <span class="sub-date">${formattedDate}</span>
  `;
  body.innerHTML = "";

  const matchedSupps = supplements.filter(s => s.schedule.includes(date));

  if (matchedSupps.length === 0) {
    body.innerHTML = "<p style='padding:20px; text-align:center;'>해당 날짜의 영양제가 없습니다.</p>";
  } else {
    // 1. 전체 체크된 개수를 구하는 헬퍼 함수
    const getTotalCheckedCount = (s) => {
      let count = 0;
      if (!s.takenStatus) return 0;
      Object.values(s.takenStatus).forEach(dayStatus => {
        Object.entries(dayStatus).forEach(([key, value]) => {
          if (!key.endsWith("_extended") && value === true) {
            count++;
          }
        });
      });
      return count;
    };

    matchedSupps.forEach(sup => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("taken-sup-wrapper");

      const section = document.createElement("div");
      section.classList.add("taken-sup-section");

      const titleContainer = document.createElement("div");
      titleContainer.classList.add("taken-sup-title");

      // 도트 색상
      const dot = document.createElement("span");
      dot.classList.add("sup-dot");
      dot.style.backgroundColor = sup.circleColor;
      titleContainer.appendChild(dot);

      // 이름
      const nameText = document.createElement("span");
      nameText.classList.add("sup-name-text");
      nameText.innerText = sup.productName;
      titleContainer.appendChild(nameText);

      // 연장 버튼
      const extendBtn = document.createElement("button");
      extendBtn.classList.add("extend-btn");
      extendBtn.innerText = "연장";
      attachIOSStyle(extendBtn);

      extendBtn.addEventListener("click", async () => {
    const baseDate = date;
    const leftUnTakenSlots = calculateLeftUnTakenSlotsBefore(sup, baseDate);
    const additionalDays = calculateAdditionalDays(sup, leftUnTakenSlots);

    if (additionalDays === 0) {
        openCustomActionSheet(null, "연장할 일정이 없습니다.", true);
        return;
    }

    let confirmMsg = `${sup.productName}\n\n` +
          `미섭취 체크 슬롯: ${leftUnTakenSlots}개\n` +
          `예상 추가 일정: ${additionalDays}일\n\n` +
          `이대로 연장하겠습니까?`;

    openCustomActionSheet(null, confirmMsg, false, async () => {
        extendScheduleFromDate(sup, baseDate, additionalDays);
        const takenStatus = sup.takenStatus || {};
        
        sup.schedule.forEach(dateStr => {
            if (dateStr < baseDate) {
                if (!takenStatus[dateStr]) takenStatus[dateStr] = {};
                sup.times.forEach((_, tIdx) => {
                    sup.family.forEach(member => {
                        const key = `${tIdx}_${member}`;
                        if (!takenStatus[dateStr][key]) {
                            takenStatus[dateStr][key + "_extended"] = true;
                        }
                    });
                });
            }
        });

        await saveAllSupplements(sup);
        
        if (typeof renderCalendar === 'function') renderCalendar();

        setTimeout(() => {
            openCustomActionSheet(null, "일정이 연장되었습니다!", true);
            const modal = document.getElementById("takenCheckModal");
            if (modal) modal.classList.remove("active");
            document.body.classList.remove("modal-open");
        }, 300);
    });
});

      titleContainer.appendChild(extendBtn);
      wrapper.appendChild(titleContainer);

      // 테이블 생성
      const table = document.createElement("table");
      table.classList.add("taken-table");

      // 헤더 (시간, 가족이름들)
      const headerRow = document.createElement("tr");
      const thTime = document.createElement("th");
      thTime.innerText = "시간";
      headerRow.appendChild(thTime);
      sup.family.forEach(member => {
        const th = document.createElement("th");
        th.innerText = member;
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow);

      const currentSupTimes = sup.times || [];
      const totalCaps = Number(sup.totalCapsules) || 0;
      const dose = Number(sup.dose) || 0;
      const timesCount = currentSupTimes.length || 1;
      const dosagePerTime = dose / timesCount; // 한 칸당 소모량 (예: 2알 / 2회 = 1알)

  // [핵심] 실시간 비활성화 함수
  const refreshCheckboxes = () => {
  const currentTotalChecked = getTotalCheckedCount(sup);
  const totalConsumed = currentTotalChecked * dosagePerTime;
  const remaining = totalCaps - totalConsumed;
  
  const allCheckboxes = table.querySelectorAll('input[type="checkbox"]');

  allCheckboxes.forEach(chk => {
    if (!chk.checked) {
      // 남은 양이 '한 번 먹을 분량'보다 적으면 비활성화
      if (totalCaps > 0 && remaining < dosagePerTime) {
        chk.disabled = true;
        chk.parentElement.style.opacity = "0.2";
        chk.parentElement.style.pointerEvents = "none";
      } else {
        chk.disabled = false;
        chk.parentElement.style.opacity = "1";
        chk.parentElement.style.pointerEvents = "auto";
      }
    }
  });
};

      // 행(Row) 생성
      currentSupTimes.forEach(time => {
        const row = document.createElement("tr");
        const tdTime = document.createElement("td");
        tdTime.innerText = time;
        row.appendChild(tdTime);

        sup.family.forEach((member) => {
          const td = document.createElement("td");
          const chk = document.createElement("input");
          chk.type = "checkbox";
          const timeIndex = currentSupTimes.indexOf(time);
          const statusKey = `${timeIndex}_${member}`;

          chk.checked = (sup.takenStatus[date] && sup.takenStatus[date][statusKey]) || false;

          chk.addEventListener("change", async () => {
            if (!sup.takenStatus[date]) sup.takenStatus[date] = {};
            sup.takenStatus[date][statusKey] = chk.checked;

            if (!chk.checked) {
              delete sup.takenStatus[date][statusKey + "_extended"];
            }

            await saveSupplementToDB(sup);
            renderCalendar();
            refreshCheckboxes();

            td.style.backgroundColor = chk.checked ? "rgba(78, 205, 196, 0.2)" : "rgba(128, 128, 128, 0.05)";
          });

          td.style.backgroundColor = chk.checked ? "rgba(78, 205, 196, 0.2)" : "rgba(128, 128, 128, 0.05)";
          td.appendChild(chk);
          row.appendChild(td);
        });
        table.appendChild(row);
      });

      refreshCheckboxes();

      section.appendChild(table);
      wrapper.appendChild(section);
      body.appendChild(wrapper);
    });
  }

  modal.classList.add("active");
  document.body.classList.add("modal-open");
}

document.getElementById("closeTakenCheckBtn").addEventListener("click", async () => {
  renderCalendar();
  closeBottomSheet("takenCheckModal");
  document.body.classList.remove("modal-open");
});
/*-------------------------------------섭취체크모달 끝-------------------------------------*/
const statsBtn = document.getElementById("statsBtn");
const statsModal = document.getElementById("statsModal");
const closeStatsModal = document.getElementById("closeStatsModal");
const statsContent = document.getElementById("statsContent");
const familyBtns = document.querySelectorAll(".family-btn");
const periodStart = document.getElementById("periodStart");
const periodEnd = document.getElementById("periodEnd");

// 통계 모달 열기
statsBtn.addEventListener("click", () => {
  statsModal.classList.add("active");
  document.body.classList.add("modal-open");
  history.pushState({ modal: "stats" }, "");

  const year = new Date().getFullYear();
  document.getElementById("periodStart").value = `${year}-01`;
  document.getElementById("periodEnd").value = `${year}-12`;

  renderFamilyUI();

  statsContent.innerHTML = `
  <div style="text-align:center; margin-top:180px; line-height: 1.2;">
    <p style="font-size:20px; font-weight:bold; margin-bottom: 10px;">구성원 선택</p>
    <p style="font-size:10px; opacity:0.5; margin: 0;">이름을 길게 누르면 변경/삭제가 가능합니다.</p>
  </div>
`;
  setTimeout(() => {
        applyIOSButtonEffect();
    }, 50);
});

// 2. 통계 모달 닫기
document.getElementById("closeStatsModal").onclick = function() {
  closeBottomSheet("statsModal");
  if (periodStart) periodStart.value = "";
  if (periodEnd) periodEnd.value = "";
    document.querySelectorAll(".family-btn").forEach(btn => {
    btn.classList.remove("selected");
  });
  statsContent.innerHTML = "";
};

familyBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.name;

    document.querySelectorAll(".family-btn").forEach(b => b.classList.remove("selected"));

    btn.classList.add("selected");

    showStatsForFamily(name);
  });
});

// 통계 계산
function showStatsForFamily(name) {
  const isDark = document.body.classList.contains("dark-mode");
  const innerBg = isDark ? "#1c1c1e" : "#ffffff";
  const trackColor = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)";

  const start = document.getElementById("periodStart").value;
  const end = document.getElementById("periodEnd").value;
  
  if (!start || !end) return;

  const startStr = `${start}-01`; 
  const endArr = end.split("-");
  const lastDay = new Date(parseInt(endArr[0]), parseInt(endArr[1]), 0).getDate();
  const endStr = `${end}-${String(lastDay).padStart(2, '0')}`;

  const stats = {};

  // 영양제 루프 시작
  supplements.forEach(sup => {
    if (!sup.family || !sup.family.includes(name)) return;

    const totalCaps = parseFloat(sup.totalCapsules) || 0;
    const dailyDoseInput = parseFloat(sup.dose) || 1;
    const timesPerDay = sup.times?.length || 1;
    const dosePerSlot = dailyDoseInput / timesPerDay;
    const capsPerPerson = totalCaps / (sup.family.length || 1);
    const maxTotalTakesPerPerson = Math.floor(capsPerPerson / dosePerSlot);

    let actualTakenCount = 0;
    let targetTotalCount = 0;
    let globalTotalTaken = 0;
    
    if (sup.takenStatus) {
      Object.values(sup.takenStatus).forEach(day => {
        Object.entries(day).forEach(([k, v]) => {
          if (!k.endsWith("_extended") && v === true) {
            globalTotalTaken += dosePerSlot; 
          }
        });
      });
    }

    const myTotalTakenOverall = globalTotalTaken / (sup.family.length || 1);
    const myCurrentStockInTakes = Math.max(0, maxTotalTakesPerPerson - Math.floor(myTotalTakenOverall / dosePerSlot));

    sup.schedule.forEach((date) => {
      if (date >= startStr && date <= endStr) { 
        for (let tIdx = 0; tIdx < timesPerDay; tIdx++) {
          const dayStatus = sup.takenStatus?.[date] || {};
          const myKey = `${tIdx}_${name}`;
          
          if (dayStatus[myKey] === true) {
            actualTakenCount++;
            targetTotalCount++;
          } else {
            const isPast = date < getTodayKST();
            if (isPast || myCurrentStockInTakes > 0) {
              targetTotalCount++;
            }
          }
        }
      }
    });

    const realisticMaxTarget = actualTakenCount + myCurrentStockInTakes;
    targetTotalCount = Math.min(targetTotalCount, realisticMaxTarget);

    if (targetTotalCount > 0) {
      stats[sup.productName] = {
        taken: actualTakenCount,
        target: targetTotalCount,
        color: sup.circleColor
      };
    }
  });

  const content = document.getElementById("statsContent");
  const keys = Object.keys(stats);

  if (keys.length === 0) {
    content.classList.remove('grid-mode');
    content.innerHTML = "<p style='text-align:center; font-size:15px; opacity:0.6; margin-top:180px;'>해당 기간에 섭취 기록이 없습니다.</p>";
  } else {
    content.classList.add('grid-mode');

    let html = "";
    keys.forEach(key => {
      const info = stats[key];
      let percent = info.target > 0 ? Math.round((info.taken / info.target) * 100) : 0;
      if (percent > 100) percent = 100;

      const isSingle = keys.length === 1;
            const itemStyle = isSingle ? 'grid-column: 1 / span 2; width: 100%; box-sizing: border-box;' : '';

            html += `
                <div class="stats-item" style="${itemStyle}">
                    <div class="pie-chart" style="background: conic-gradient(${info.color} ${percent}%, ${trackColor} 0)">
                        <div class="pie-inner" style="background-color: ${innerBg}">
                            <span class="pie-percent">${percent}%</span>
                        </div>
                    </div>
                    <div class="stats-info" style="${isSingle ? 'align-items: center;' : ''}">
                        <span class="stats-product-name">${key}</span>
                        <span class="stats-count-text">${info.taken} / ${info.target}회</span>
                    </div>
                </div>`;
    });
    content.innerHTML = html;
  }
  content.scrollTop = 0;
}

function renderFamilyUI() {
  const statsFamilyContainer = document.querySelector(".family-buttons");
  if (!statsFamilyContainer) return;

  statsFamilyContainer.innerHTML = ""; 
  const slider = document.createElement("div");
  slider.className = "family-slider";
  statsFamilyContainer.appendChild(slider);

  familyMembers.forEach((name, index) => {
    const btn = document.createElement("button");
    btn.className = "family-btn";
    btn.dataset.name = name;
    btn.innerText = name;
    
    let timer;
    let isLongPress = false;

    const startPress = () => {
      isLongPress = false;
      timer = setTimeout(() => {
        isLongPress = true; 
        
        openCustomActionSheet(null, `${name} 님의 이름을 변경하겠습니까?<br><span style="font-size: 10px; opacity: 0.5; display: block; margin-top: 2px;">(빈칸으로 두면 삭제됩니다.)</span>`, false, async (newName) => {
          if (newName === null) return;
          const trimmed = newName.trim();

          if (trimmed === "") {
            setTimeout(() => {
              openCustomActionSheet(null, `${name} 님을 삭제합니다.<br><span style="font-size: 10px; opacity: 0.5; display: block; margin-top: 5px;">(데이터가 모두 사라지며 확인을 누르면 되돌릴 수 없습니다.)`, false, async () => {
                await deleteFamilyMemberFromDB(name);
                familyMembers.splice(index, 1);
                localStorage.setItem("familyMembers", JSON.stringify(familyMembers));
                renderFamilyUI();
              });
            }, 300);
          } else if (trimmed !== name) {
            await updateSupplementFamilyName(name, trimmed);

            supplements.forEach(sup => {
        if (sup.family && Array.isArray(sup.family)) {
            const familyIndex = sup.family.indexOf(name);
            if (familyIndex !== -1) {
                sup.family[familyIndex] = trimmed;
            }
        }
        
        if (sup.takenStatus) {
            Object.keys(sup.takenStatus).forEach(dateKey => {
                const dayStatus = sup.takenStatus[dateKey];
                Object.keys(dayStatus).forEach(statusKey => {
                    if (statusKey.includes(`_${name}`)) {
                        const newStatusKey = statusKey.replace(`_${name}`, `_${trimmed}`);
                        dayStatus[newStatusKey] = dayStatus[statusKey];
                        delete dayStatus[statusKey];
                    }
                });
            });
        }
    });

            familyMembers[index] = trimmed;
            localStorage.setItem("familyMembers", JSON.stringify(familyMembers));
            renderFamilyUI();
            openCustomActionSheet(null, `${trimmed} 님으로 변경되었습니다.`, true, () => {
            });
    }
        }, 87, true, name);
      }, 900);
    };
    const endPress = () => clearTimeout(timer);

    btn.addEventListener("click", () => {
      if (!isLongPress) {
        document.querySelectorAll(".family-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        showStatsForFamily(name);
        updateSliderPosition();
      }
    });

    btn.addEventListener("touchstart", startPress, { passive: true });
    btn.addEventListener("touchend", endPress);
    btn.addEventListener("mousedown", startPress);
    btn.addEventListener("mouseup", endPress);
    btn.addEventListener("mouseleave", endPress);
    statsFamilyContainer.appendChild(btn);
  });

  if (familyMembers.length < 4) {
    const addBtn = document.createElement("button");
    addBtn.className = "family-btn";
    addBtn.innerText = "추가";
    addBtn.addEventListener("click", () => {
      openCustomActionSheet(null, "새로운 이름을 입력 하십시오.", false, async (newName) => {
        if (newName && newName.trim()) {
          const trimmed = newName.trim();
          familyMembers.push(trimmed);
          localStorage.setItem("familyMembers", JSON.stringify(familyMembers));
          renderFamilyUI();
        }
        else {
        setTimeout(() => {
          openCustomActionSheet(null, "입력하지 않았습니다.", true, null, 87);
        }, 300);
      }
      }, 87, true);
    });
    statsFamilyContainer.appendChild(addBtn);
  }

  function updateSliderPosition() {
  const statsFamilyContainer = document.querySelector(".family-buttons");
  const slider = statsFamilyContainer.querySelector(".family-slider");
  const buttons = statsFamilyContainer.querySelectorAll(".family-btn");
  const selectedBtn = statsFamilyContainer.querySelector(".family-btn.selected");
  const selectedIndex = Array.from(buttons).indexOf(selectedBtn);

  if (buttons.length > 0 && slider) {
    const btnWidth = (statsFamilyContainer.offsetWidth - 4) / buttons.length;
    slider.style.width = `${btnWidth}px`;

    if (selectedIndex !== -1) {
      const moveX = selectedIndex * btnWidth;
      slider.style.transform = `translateX(${moveX}px)`;
    }
  }
}
  setTimeout(updateSliderPosition, 100);
}

  const inputFamilyContainer = document.querySelector(".checkbox-group .checkbox-line-row:first-child");
  if (inputFamilyContainer) {
    inputFamilyContainer.innerHTML = ""; 
    familyMembers.forEach(name => {
      const label = document.createElement("label");
      label.className = "checkbox-item";
      
      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.className = "inputFamily";
      chk.value = name;
      chk.checked = false; 

      const span = document.createElement("span");
      span.className = "checkbox-label-text";
      span.innerText = name;

      label.appendChild(chk);
      label.appendChild(span);
      inputFamilyContainer.appendChild(label);
    });
  }

function switchStatsTab(tab) {
    const familyWrapper = document.getElementById('familyBtnsWrapper');
    const periodWrapper = document.getElementById('periodWrapper');
    const statsContent = document.getElementById('statsContent');
    const btns = document.querySelectorAll('#statsTabContainer .tab-btn');
    const slider = document.querySelector('#statsTabContainer .tab-slider');

    statsContent.innerHTML = "";

    if (tab === 'stats') {
        slider.style.transform = 'translateX(0%)';
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
        familyWrapper.style.display = 'flex';
        periodWrapper.style.display = 'flex';
        
        const selectedBtn = familyWrapper.querySelector('.family-btn.selected');
        if (selectedBtn) {
            showStatsForFamily(selectedBtn.dataset.name);
        } else {
            statsContent.classList.remove('grid-mode');
            statsContent.innerHTML = `
                <div style="width: 100%; text-align: center; margin-top: 180px; line-height: 1.2;">
                    <p style="font-size: 20px; font-weight: bold; margin: 0 0 10px 0;">구성원 선택</p>
                    <p style="font-size: 10px; opacity: 0.5; margin: 0;">이름을 길게 누르면 변경/삭제가 가능합니다.</p>
                </div>
            `;
        }

        setTimeout(() => {
            const statsFamilyContainer = document.querySelector(".family-buttons");
            const slider = statsFamilyContainer?.querySelector('.family-slider');
            const buttons = statsFamilyContainer?.querySelectorAll('.family-btn');
            const selectedBtn = statsFamilyContainer?.querySelector('.family-btn.selected');

            if (slider && buttons.length > 0 && selectedBtn) {
                
                const containerWidth = statsFamilyContainer.offsetWidth - 4;
                const btnWidth = containerWidth / buttons.length;
                const selectedIndex = Array.from(buttons).indexOf(selectedBtn);

                slider.style.width = `${btnWidth}px`;
                slider.style.transform = `translateX(${selectedIndex * btnWidth}px)`;
            }
        }, 50);

    } else {
        statsContent.classList.remove('grid-mode');
        statsContent.style.display = "";
        slider.style.transform = 'translateX(100%)';
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
        familyWrapper.style.display = 'none';
        periodWrapper.style.display = 'none';
        renderAnalysisTab();
    }
}

[periodStart, periodEnd].forEach(el => {
    el.addEventListener('change', () => {
        const selectedBtn = document.querySelector('.family-btn.selected');
        if (selectedBtn && document.querySelector('#statsTabContainer .tab-btn.active').innerText === '통계') {
            showStatsForFamily(selectedBtn.dataset.name);
        }
    });
});

function renderAnalysisTab() {
    const statsContent = document.getElementById('statsContent');
    if (!statsContent) return;
    statsContent.scrollTop = 0;

    const baseDate = selectedDateForList ? new Date(selectedDateForList) : new Date();
    const targetMonth = baseDate.getMonth();
    const targetYear = baseDate.getFullYear();
    const monthTitle = `${targetMonth + 1}월`;

    // 최근 5개월 데이터 계산
const startDate = new Date(targetYear, targetMonth - 4, 1);
const monthlyTotals = {};

supplements.forEach(sup => {
    if (sup.schedule && sup.schedule[0]) {
        const pDate = new Date(sup.schedule[0]);
        
        if (pDate >= startDate) {
            const key = `${pDate.getFullYear()}-${pDate.getMonth()}`;
            const price = parseInt(sup.price) || 0;
            monthlyTotals[key] = (monthlyTotals[key] || 0) + price;
        }
    }
});

const monthlyData = [];
for (let i = 4; i >= 0; i--) {
    const d = new Date(targetYear, targetMonth - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const key = `${y}-${m}`;
    
    monthlyData.push({ 
        month: (m + 1) + '월', 
        cost: monthlyTotals[key] || 0 
    });
}

    const prevMonthCost = monthlyData[monthlyData.length - 2].cost;
    const targetMonthCost = monthlyData[monthlyData.length - 1].cost;
    const maxCost = Math.max(...monthlyData.map(d => d.cost), 1);
    const diff = targetMonthCost - prevMonthCost;

    let costAnalysisText = "";
    if (targetMonthCost === 0 && prevMonthCost === 0) {
        costAnalysisText = `${monthTitle} 이전 지출 기록이 없습니다.`;
    } else if (prevMonthCost === 0 && targetMonthCost > 0) {
        costAnalysisText = `지난 달 지출 기록이 없습니다.`;
    } else if (diff !== 0) {
        const status = diff > 0 ? "더" : "덜";
        costAnalysisText = `지난 달보다 ${Math.abs(diff).toLocaleString()}원 ${status} 지출했습니다.`;
    } else {
        costAnalysisText = `지난 달과 동일하게 지출했습니다.`;
    }

    const routine = { "아침": [], "점심": [], "저녁": [], "공복": [] };
    let refillList = [];
    const todayStr = new Date().toISOString().slice(0, 10);

    supplements.forEach(sup => {
        let supTaken = 0;
        if (sup.takenStatus) {
            Object.values(sup.takenStatus).forEach(dayData => {
                Object.keys(dayData).forEach(key => {
                    if (dayData[key] === true && !key.includes("_extended")) supTaken++;
                });
            });
        }
        const totalCaps = parseFloat(sup.totalCapsules) || 0;
        const remains = totalCaps - supTaken;
        const dailyDose = parseFloat(sup.dose) || 0;
        const daysLeft = dailyDose > 0 ? Math.floor(remains / dailyDose) : 0;
        const lastScheduleDate = sup.schedule && sup.schedule.length > 0 ? sup.schedule[sup.schedule.length - 1] : null;
        
        if (totalCaps > 0 && lastScheduleDate >= todayStr) {
            if (daysLeft >= 0 && daysLeft <= 14) {
                refillList.push({ name: sup.productName, days: daysLeft });
            }
        }

        if (remains > 0 && sup.times && Array.isArray(sup.times)) {
            const timeCount = sup.times.length;
            const dosePerTime = timeCount > 0 ? (dailyDose / timeCount) : dailyDose;
            sup.times.forEach(time => {
                if (routine[time]) {
                    routine[time].push({ 
                        ...sup, 
                        displayDose: dosePerTime,
                        color: sup.circleColor || "#4e73df" 
                    });
                }
            });
        }
    });

    let html = `<div class="analysis-container">`;

    // [섹션 1] 스마트 알림
    let statusText = "양호";
    let statusClass = "status-normal";
    if (supplements.length === 0) {
        statusText = "없음";
        statusClass = "status-none";
    } else if (refillList.length > 0) {
        statusText = "부족";
        statusClass = "status-low";
    }

    html += `
    <div class="analysis-accordion-section">
        <div class="analysis-card slim">
            <div class="status-row" onclick="${statusText === '부족' ? "this.closest('.analysis-accordion-section').classList.toggle('active')" : ""}">
                <span class="row-label">영양제 재고 상황</span>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="analysis-accordion-content">
                <div class="accordion-inner">
                    <div class="analysis-divider"></div>
                    <div class="refill-item-container">
                        ${refillList.sort((a, b) => a.days - b.days).map((item) => `
                            <div class="refill-item">
                                <span class="refill-name">${item.name}</span>
                                <span class="refill-days">${item.days === 0 ? '오늘 완료' : item.days + '일분'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    // [섹션 2] 소비 분석
    html += `
    <div>
      <label class="analysis-label">${monthTitle} 소비 분석</label>
      <div class="analysis-card standard">
        <div class="cost-result" style="padding: 0 16px 8px 16px;">${costAnalysisText}</div>
        <div style="padding: 0 16px;"><div class="analysis-divider"></div></div>
        <div class="analysis-cost-box" style="padding: 15px 16px 0 16px;">
            ${(targetMonthCost > 0 || prevMonthCost > 0) ? `
                <div class="comparison-stats">
                    <div class="stat-item">
                        <span class="stat-label">${monthlyData[monthlyData.length - 2].month}</span>
                        <span class="stat-value prev">${prevMonthCost.toLocaleString()}원</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label current">${monthlyData[monthlyData.length - 1].month}</span>
                        <span class="stat-value current">${targetMonthCost.toLocaleString()}원</span>
                    </div>
                </div>
                <div class="bar-chart-container">
                    ${monthlyData.map((data, idx) => {
                        const isCurrent = (idx === monthlyData.length - 1);
                        const barHeight = data.cost > 0 ? (data.cost / maxCost * 100) : 0;
                        const barClass = isCurrent ? 'current-month' : (data.cost > 0 ? 'prev-month' : '');
                        return `
        <div class="bar-group">
            <div class="bar-wrapper">
                <div class="bar-fill ${barClass}" style="height: ${barHeight}%;"></div>
            </div>
            <span class="bar-label ${isCurrent ? 'current-month-text' : ''}">${data.month}</span>
        </div>`;
}).join('')}
                </div>
            ` : ` <div style="text-align: center; opacity: 0.5; font-size: 14px; padding: 20px 0;">데이터 부족</div> `}
        </div>
      </div>
    </div>`;

    // [섹션 3] 영양제 리스트
    html += `<div><label class="analysis-label">섭취 중인 영양제</label><div class="analysis-card supplement-list-wrapper" style="padding-bottom: 0;">`;
    const activeTimes = Object.keys(routine).filter(t => routine[t].length > 0);
    activeTimes.forEach((time, timeIdx) => {
        html += `<div class="routine-time-label"><span>${time}</span></div>`;
        const items = routine[time];
        for (let i = 0; i < items.length; i += 2) {
            const item1 = items[i];
            const item2 = items[i + 1];
            html += `<div class="supplement-grid">
                <div class="supplement-item">
                    <div class="color-dot" style="background: ${item1.color}; width:15px; height:15px; border-radius:50%;"></div>
                    <div class="sup-info">
                        <span class="sup-name">${item1.productName}</span>
                        <span class="sup-dose">${item1.displayDose}${item1.unit || '캡슐'}</span>
                    </div>
                </div>`;
            if (item2) {
                html += `
                <div class="supplement-item">
                    <div class="color-dot" style="background: ${item2.color}; width:15px; height:15px; border-radius:50%;"></div>
                    <div class="sup-info">
                        <span class="sup-name">${item2.productName}</span>
                        <span class="sup-dose">${item2.displayDose}${item2.unit || '캡슐'}</span>
                    </div>
                </div>`;
            } else { html += `<div></div>`; }
            html += `</div>`;
            if (i + 2 < items.length) {
                html += `<div style="padding: 0 16px;"></div>`;
            }
        }
        if (timeIdx !== activeTimes.length - 1) {
            html += `<div style="margin-bottom: 5px;"></div>`;
        }
    });

    if (activeTimes.length === 0) {
        html += `<div style="padding: 30px; text-align: center; opacity: 0.5; font-size: 14px;">기록된 루틴이 없습니다.</div>`;
    }

    html += `</div></div></div>`;
    statsContent.innerHTML = html;
}

const originalCloseStatsModal = document.getElementById("closeStatsModal").onclick;
document.getElementById("closeStatsModal").onclick = function() {
    originalCloseStatsModal();
    switchStatsTab('stats');
};

function renderFamilyCheckboxes() {
  const container = document.getElementById('familyListContainer');
  if (!container) return;

  container.innerHTML = ''; 

  familyMembers.forEach(name => {
    const div = document.createElement("div");
    div.className = "checkbox-wrapper-line";

    div.innerHTML = `
      <label class="checkbox-item">
        <input type="checkbox" class="inputFamily" value="${name}">
        <span class="checkbox-label-text">${name}</span>
      </label>
    `;
    container.appendChild(div);
  });
}

async function deleteFamilyMemberFromDB(targetName) {
  if (!db) await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["supplements"], "readwrite");
    const store = transaction.objectStore("supplements");
    const request = store.getAll();

    request.onsuccess = () => {
      const allSups = request.result;
      allSups.forEach(sup => {
        let changed = false;

        if (sup.family && sup.family.includes(targetName)) {
          sup.family = sup.family.filter(n => n !== targetName);
          changed = true;
        }

        if (sup.takenStatus) {
          for (let date in sup.takenStatus) {
            const dayData = sup.takenStatus[date];
            for (let key in dayData) {
              if (key.endsWith(`_${targetName}`)) {
                delete dayData[key];
                changed = true;
              }
            }
          }
        }

        if (changed) store.put(sup);
      });
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject();
  });
}

function calculateLeftUnTakenSlotsBefore(sup, baseDate) {
  const takenStatus = sup.takenStatus || {};
  let totalLeftSlots = 0;

  sup.schedule.forEach(dateStr => {
    if (dateStr < baseDate) { 
      const dayStatus = takenStatus[dateStr] || {};
      
      sup.times.forEach((_, tIdx) => {
        sup.family.forEach(member => {
          const key = `${tIdx}_${member}`;
          const isTaken = dayStatus[key] === true;
          const isAlreadyExtended = dayStatus[key + "_extended"] === true;

          if (!isTaken && !isAlreadyExtended) {
            totalLeftSlots++;
          }
        });
      });
    }
  });

  return totalLeftSlots;
}

function calculateAdditionalDays(sup, leftSlots) {
  const perDaySlots = sup.family.length * sup.times.length;

  if (leftSlots <= 0) return 0;

  return Math.ceil(leftSlots / perDaySlots);
}

function extendScheduleFromDate(sup, baseDate, additionalDays) {
  const beforeDates = sup.schedule.filter(d => d < baseDate);
  const afterDates = sup.schedule.filter(d => d >= baseDate);

  let lastDateStr = afterDates.length > 0
    ? afterDates[afterDates.length - 1]
    : baseDate;

  let d = new Date(lastDateStr);
  d.setDate(d.getDate() + 1);

  const newDates = [];
  for (let i = 0; i < additionalDays; i++) {
    newDates.push(d.toISOString().slice(0,10));
    d.setDate(d.getDate() + 1);
  }

  sup.schedule = beforeDates.concat(afterDates, newDates);
}

const backupMenuModal = document.getElementById("backupMenuModal");
const exportBtn = document.getElementById("exportBtn");
const triggerImportBtn = document.getElementById("triggerImportBtn");
const closeBackupMenu = document.getElementById("closeBackupMenu");
const importFileInput = document.getElementById("importFileInput");
const fabSettingsBtn = document.getElementById("fabSettingsBtn"); 

document.getElementById("displayAppVersion").innerText = APP_VERSION;

const savedBackupDate = localStorage.getItem("lastBackupDate");
if (savedBackupDate) {
  document.getElementById("lastBackupDate").innerText = savedBackupDate;
}

function updateLastBackupDate() {
    const now = new Date();
    const dateString = `최근 저장일: ${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${now.getHours()}시 ${now.getMinutes()}분`;
    
    document.getElementById("lastBackupDate").innerText = dateString;
    localStorage.setItem("lastBackupDate", dateString);
}

if (fabSettingsBtn) {
  fabSettingsBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("./version.json?" + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (data.version !== APP_VERSION) {
          openCustomActionSheet(
            null, `새로운 버전이 있습니다!\n업데이트하겠습니까?`, false,
            () => { location.reload(); }
          );
            return;
        }
      }
    } catch (err) { 
      console.log("버전 확인 불가"); 
    }

    backupMenuModal.classList.add("active");
    document.body.classList.add("modal-open");
    history.pushState({ modal: "backup" }, "");
  });
}

closeBackupMenu.addEventListener("click", () => {
  closeBottomSheet("backupMenuModal");
});

// 백업 동작
exportBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (supplements.length === 0) {
    openCustomActionSheet(null, "백업할 데이터가 없습니다.", true);
    return;
  }

  const blob = new Blob([JSON.stringify(supplements, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  document.body.appendChild(a);
  a.href = url;
  a.download = `supplements-backup.json`;
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  closeBottomSheet("backupMenuModal");
  }, 100);
  updateLastBackupDate();
});

// 복원 트리거
triggerImportBtn.addEventListener("click", () => {
  importFileInput.click();
});

// 복원 파일 선택
importFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();

    try {
        const data = JSON.parse(text);

        if (!Array.isArray(data)) {
            openCustomActionSheet(null, "올바른 백업 파일이 아닙니다.", true);
            return;
        }

        openCustomActionSheet(
            null, 
            "기존 기록이 삭제되고\n백업 내용으로 덮어 씌워집니다.", 
            false, 
            async () => {
                await proceedRestore(data);
            }
        );

    } catch (err) {
        console.error("복원 에러 상세:", err);
        openCustomActionSheet(null, "복원 중 오류가 발생했습니다.\n(사유: " + err.message + ")", true);
    }
    e.target.value = "";
});

async function proceedRestore(data) {
    const deleteDatabaseAsync = () => {
        return new Promise((resolve, reject) => {
            if (db) {
                db.close();
                db = null;
            }
            const deleteReq = indexedDB.deleteDatabase(DB_NAME);
            deleteReq.onsuccess = () => resolve();
            deleteReq.onerror = (e) => reject(new Error("DB 삭제 실패"));
            deleteReq.onblocked = () => {
                openCustomActionSheet(null, "기존 데이터 연결이 남아있습니다.\n앱을 완전히 껐다 켜주세요.", true);
                resolve();
            };
        });
    };

    const newFamilySet = new Set();
    data.forEach(sup => {
        if (sup.family && Array.isArray(sup.family)) {
            sup.family.forEach(name => newFamilySet.add(name));
        }
    });

    if (newFamilySet.size > 0) {
        const newFamilyList = Array.from(newFamilySet);
        localStorage.setItem("familyMembers", JSON.stringify(newFamilyList));
        familyMembers = newFamilyList;
    }

    await deleteDatabaseAsync();
    supplements = data;
    await openDatabase();
    await saveAllSupplements();

    if (typeof renderFamilyUI === 'function') renderFamilyUI();
    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof renderCalcTab === 'function') renderCalcTab();

    closeBottomSheet("backupMenuModal");
    
    openCustomActionSheet(null, "백업 데이터를 성공적으로 불러왔습니다!", true);
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

let isAnimating = false;
let touchStartY = 0;
let touchStartX = 0;

const swipeThreshold = 80;
const datesWrapper = document.getElementById("dates-wrapper");

datesWrapper.addEventListener("touchstart", (e) => {
  if (isAnimating) return;
  
  touchStartY = e.changedTouches[0].screenY;
  touchStartX = e.changedTouches[0].screenX;

}, { passive: true });

datesWrapper.addEventListener("touchmove", (e) => {
  if (isAnimating) return;

  const currentX = e.changedTouches[0].screenX;
  const currentY = e.changedTouches[0].screenY;
  
  const diffX = Math.abs(currentX - touchStartX);
  const diffY = Math.abs(currentY - touchStartY);

  if (diffX > diffY && diffX > 5) {
    if (e.cancelable) e.preventDefault();
  }
}, { passive: false });

datesWrapper.addEventListener("touchend", (e) => {
  if (isAnimating) return;

  const touchEndY = e.changedTouches[0].screenY;
  const diffY = touchEndY - touchStartY;
  const absDiffY = Math.abs(diffY);
  const scrollTop = datesWrapper.scrollTop;
  const scrollHeight = datesWrapper.scrollHeight;
  const clientHeight = datesWrapper.clientHeight;
  
  const isAtTop = scrollTop <= 2;
  const isAtBottom = scrollHeight - scrollTop <= clientHeight + 2;

  if (absDiffY > swipeThreshold) {
    if (diffY > 0 && isAtTop) {
      startVerticalSlide(-1);
    } else if (diffY < 0 && isAtBottom) {
      startVerticalSlide(1);
    }
  }
});

// 슬라이드 애니메이션 함수
function startVerticalSlide(direction) {
  if (isAnimating) return;
  isAnimating = true;

  const viewHeight = datesWrapper.clientHeight;
  const currentScroll = datesWrapper.scrollTop;
  const clone = datesContainer.cloneNode(true);
  clone.classList.add("calendar-animating-clone");
  clone.style.transform = `translateY(${-currentScroll}px)`;
  datesWrapper.appendChild(clone);
  datesWrapper.classList.add('is-animating');
  
  changeMonthWithDay(direction);
  
  datesWrapper.scrollTop = 0;
  datesContainer.style.transition = 'none';
  const startPos = direction > 0 ? viewHeight : -viewHeight;
  datesContainer.style.transform = `translateY(${startPos}px)`;
  datesContainer.style.zIndex = "5";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const transitionStyle = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
      datesContainer.style.transition = transitionStyle;
      clone.style.transition = transitionStyle;
      datesContainer.style.transform = 'translateY(0)';
      const endPos = direction > 0 ? -viewHeight : viewHeight;
      clone.style.transform = `translateY(${endPos - currentScroll}px)`;
    });
  });

  setTimeout(() => {
    if (clone.parentNode) clone.remove();
    datesContainer.style.transition = 'none';
    datesWrapper.classList.remove('is-animating');
    isAnimating = false;
  }, 550);
}

function changeMonthWithDay(direction) {

  let year, month, day;
  if (selectedDateForList) {
    const parts = selectedDateForList.split("-");
    year  = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1;
    day   = parseInt(parts[2]);
  } else {
    const today = new Date();
    year  = today.getFullYear();
    month = today.getMonth();
    day   = today.getDate();
  }

  const newDate = new Date(year, month + direction, day);
  const lastDayOfNewMonth = new Date(
    newDate.getFullYear(),
    newDate.getMonth() + 1,
    0
  ).getDate();

  const adjustedDay = day > lastDayOfNewMonth ? lastDayOfNewMonth : day;

  selectedDateForList = `${newDate.getFullYear()}-${String(
    newDate.getMonth() + 1
  ).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;

  dt = new Date(
    newDate.getFullYear(),
    newDate.getMonth(),
    adjustedDay
  );

  renderCalendar();
}

const realColorInput = document.getElementById('inputColor');
const colorDot = document.getElementById('colorDot');
const colorHexText = document.getElementById('colorHexText');

if (realColorInput) {
  realColorInput.addEventListener('input', (e) => {
    const newColor = e.target.value.toUpperCase();
    if (colorDot) colorDot.style.backgroundColor = newColor;
    if (colorHexText) colorHexText.innerText = newColor;
  });
}

const inputPriceEl = document.getElementById("inputPrice");

if (inputPriceEl) {
  inputPriceEl.addEventListener("input", (e) => {

    let value = e.target.value.replace(/[^0-9]/g, "");
    
    if (value) {
      e.target.value = Number(value).toLocaleString();
    } else {
      e.target.value = "";
    }
  });
}

function updateColorBar(color) {
  const isAuto = !color || color === "#000000" || color === "";
  const displayColor = isAuto ? "#000000" : color;
  
  if (realColorInput) realColorInput.value = displayColor;
  if (colorDot) colorDot.style.backgroundColor = displayColor;
  if (colorHexText) {
    colorHexText.innerText = isAuto ? "자동 색상" : displayColor.toUpperCase();
  }
}

const saveFamilyConfigBtn = document.getElementById("saveFamilyConfig");
if (saveFamilyConfigBtn) {
  saveFamilyConfigBtn.addEventListener("click", () => {
    const input = document.getElementById("familyInput");
    const value = input.value.trim();
    if (!value) return openCustomActionSheet(null, "이름을 입력해주세요.", true);

    const names = value.split(",").map(n => n.trim()).filter(n => n !== "").slice(0, 4);
    familyMembers = names;
    localStorage.setItem("familyMembers", JSON.stringify(familyMembers));

    document.getElementById("familyConfigModal").classList.add("hidden");
    document.body.classList.remove("modal-open");

    renderFamilyUI();
    location.reload(); 
  });
}

async function updateSupplementFamilyName(oldName, newName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["supplements"], "readwrite");
    const store = transaction.objectStore("supplements");
    const request = store.getAll();

    request.onsuccess = () => {
      const allSups = request.result;
      allSups.forEach(sup => {
        let changed = false;
        
        if (sup.family && sup.family.includes(oldName)) {
          sup.family = sup.family.map(n => n === oldName ? newName : n);
          changed = true;
        }

        if (sup.takenStatus) {
          for (let date in sup.takenStatus) {
            const dayData = sup.takenStatus[date];
            for (let key in dayData) {

              if (key.endsWith(`_${oldName}`)) {
                const timePart = key.split(`_${oldName}`)[0];
                const newKey = `${timePart}_${newName}`;
                
                dayData[newKey] = dayData[key];
                delete dayData[key];
                changed = true;
              }
            }
          }
        }

        if (changed) store.put(sup);
      });
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject();
  });
}

history.pushState({ page: 'calendar' }, null, location.href);

window.addEventListener("popstate", (event) => {
  history.pushState({ page: 'calendar' }, null, location.href);

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  const activeModals = document.querySelectorAll('.active');
  if (activeModals.length > 0) {
    activeModals.forEach(modal => {
      modal.classList.remove("active");
    });
    document.body.classList.remove("modal-open");
    console.log("모달 닫기 완료");
  } else {
    console.log("뒤로가기 차단됨 (모달 없음)");
  }
});

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log("설치 준비 완료");
});

async function triggerInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') console.log('설치 완료');
    deferredPrompt = null;
  } else {
    openCustomActionSheet(null, "이미 설치되어 있거나 지원하지 않는 환경입니다.", true);
  }
}

document.querySelectorAll(".close-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const activeOverlay = document.querySelector(".modal-overlay.active");
    const activeModal = document.querySelector(".modal.active, .stats-modal.active, .backup-menu-modal.active, .yearly-modal.active");

    if (activeOverlay) activeOverlay.classList.remove("active");
    if (activeModal) activeModal.classList.remove("active");

    setTimeout(() => {
      document.body.classList.remove("modal-open");
      
      const yearlyModal = document.getElementById("yearlyModal");
      if (yearlyModal) {
        yearlyModal.classList.add("hidden");
        document.body.classList.remove("stop-scroll");
      }

      if (window.history.state && window.history.state.modal) {
        window.history.back();
      }
    }, 400);
  });
});
/*--------------------------------------연간 달력 모달 시작-----------------------------------*/
const yearlyModal = document.getElementById("yearlyModal");
const closeYearlyModal = document.getElementById("closeYearlyModal");

if (monthDisplay) {
  monthDisplay.style.cursor = "pointer";
  monthDisplay.onclick = () => {
    const year = dt.getFullYear(); 
    document.getElementById("yearlyTitle").innerText = `${year}년`;
    renderYearlyCalendar(year);
    const container = document.getElementById("yearlyContent");
    if (container) {
      container.scrollTop = 0; 
    }
    yearlyModal.classList.remove("hidden");
  setTimeout(() => {
    yearlyModal.classList.add("active");
    document.body.classList.add("modal-open");
  }, 10);
}
}

if (closeYearlyModal) {
  closeYearlyModal.onclick = () => {
    closeBottomSheet("yearlyModal");
  };
}

function renderYearlyCalendar(year) {
  const container = document.getElementById("yearlyContent");
  if (!container) return;
  container.innerHTML = "";
  
  const now = new Date();
  const currentMonthIdx = (now.getFullYear() === year) ? now.getMonth() : -1;

  let countComplete = 0;
  let countPartial = 0;
  let countNone = 0;
  let totalYearlyCost = 0;

  supplements.forEach(sup => {
    const firstDate = sup.schedule?.[0] || "";
    const [y] = firstDate.split("-").map(Number);
    if (y === year) {
      totalYearlyCost += (Number(sup.price) || 0);
    }
  });

  for (let m = 0; m < 12; m++) {
    const monthDiv = document.createElement("div");
    monthDiv.className = "mini-month-container";
    if (m === currentMonthIdx) monthDiv.classList.add("current-month");
    monthDiv.innerHTML = `<div class="mini-month-title">${m + 1}월</div>`;
    
    const daysGrid = document.createElement("div");
    daysGrid.className = "mini-days-grid";

    const firstDay = new Date(year, m, 1).getDay();
    const lastDate = new Date(year, m + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) daysGrid.innerHTML += `<div></div>`;

    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const todaySups = supplements.filter(s => s.schedule && s.schedule.includes(dateStr));
      
      let style = "";
      if (todaySups.length > 0) {
        let totalSlots = 0;
        let takenSlots = 0;

        todaySups.forEach(sup => {
          const dayStatus = (sup.takenStatus && sup.takenStatus[dateStr]) || {};
          totalSlots += (sup.family.length * sup.times.length);
          Object.values(dayStatus).forEach(val => { if (val === true) takenSlots++; });
        });

        if (takenSlots === 0) {
          style = "background-color: #ff4d4d; color: #fff;";
          countNone++;
        } else if (takenSlots < totalSlots) {
          style = "background-color: #ffbb00; color: #fff;";
          countPartial++;
        } else {
          style = "background-color: #02bb30; color: #fff;";
          countComplete++;
        }
      }
      daysGrid.innerHTML += `<div class="mini-day" style="${style}">${d}</div>`;
    }
    monthDiv.appendChild(daysGrid);
    container.appendChild(monthDiv);
  }

  // 집계 카드
  const summaryDiv = document.createElement("div");
  summaryDiv.className = "yearly-summary-card";
  summaryDiv.innerHTML = `
    <h4 style="margin:2px; font-size:15px;">${year}년 리포트</h4>
    <div class="summary-row">
      <div><span class="summary-dot" style="background:#02bb30;"></span>완전 섭취</div>
      <span>${countComplete}일</span>
    </div>
    <div class="summary-row">
      <div><span class="summary-dot" style="background:#ffbb00;"></span>부분 섭취</div>
      <span>${countPartial}일</span>
    </div>
    <div class="summary-row">
      <div><span class="summary-dot" style="background:#ff4d4d;"></span>미섭취 날짜</div>
      <span>${countNone}일</span>
    </div>
    <div class="summary-divider"></div>
    <div class="summary-row summary-total">
      <span>총 구매 금액</span>
      <span>${totalYearlyCost.toLocaleString()}원</span>
    </div>
  `;
  container.appendChild(summaryDiv);
}
/*--------------------------------------연간 달력 모달 끝-----------------------------------*/
/*--------------------------------------월별 비용 시작-----------------------------------*/
monthlyCostBtn.addEventListener("click", () => {
    initCostModalTabs();

    const picker = document.getElementById('costMonthPicker');
    if (picker) {
        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, '0');
        picker.value = `${year}-${month}`;
    }

    renderMonthlyCostData();

    monthlyCostModal.classList.add("active");
    document.body.classList.add("modal-open");
});

document.getElementById('costMonthPicker')?.addEventListener('change', (e) => {
    if (!e.target.value) return;
    
    const [y, m] = e.target.value.split("-").map(Number);
    dt.setFullYear(y);
    dt.setMonth(m - 1);
    
    const activeTabBtn = document.querySelector('#costTabContainer .tab-btn.active');
    const activeTabText = activeTabBtn ? activeTabBtn.innerText : '비용';
    
    if (activeTabText === '비용') {
        renderMonthlyCostData();
    } else {
        renderCalcTab();
    }
});

function renderMonthlyCostData() {
    const year = dt.getFullYear();
    const month = dt.getMonth() + 1;
    
    let totalCost = 0;
    const monthlyItems = [];
    const familyCosts = {};

    supplements.forEach(sup => {
        const supInputDate = sup.schedule?.[0] ?? "";
        const [y, m] = supInputDate.split("-").map(x => parseInt(x));

        if (y === year && m === month) {
            const totalDays = sup.schedule.length;
            const monthsCount = Math.ceil(totalDays / 30);
            const monthlyPart = sup.price ? Math.round(sup.price / monthsCount) : 0;
            
            totalCost += monthlyPart;
            monthlyItems.push({
                name: sup.productName,
                cost: monthlyPart,
                color: sup.circleColor
            });

            if (sup.family && Array.isArray(sup.family) && sup.family.length > 0) {
                const perPersonCost = Math.round(monthlyPart / sup.family.length);
                sup.family.forEach(member => {
                    if (!familyCosts[member]) familyCosts[member] = 0;
                    familyCosts[member] += perPersonCost;
                });
            }
        }
    });

    // --- HTML 생성 부분 ---
    let itemsHtml = "";
    if (monthlyItems.length > 0) {
        monthlyItems.forEach(item => {
            const ratio = totalCost > 0 ? Math.round((item.cost / totalCost) * 100) : 0;
            itemsHtml += `
                <div class="cost-item">
                    <div class="cost-item-header">
                        <span>${item.name}</span>
                        <span>${item.cost.toLocaleString()}원</span>
                    </div>
                    <div class="cost-bar-bg">
                        <div class="cost-bar-fill" style="width: ${ratio}%;"></div>
                    </div>
                </div>`;
        });
    }
    
    let costContentHtml = totalCost > 0 ? `
        <div class="cost-summary-box">
            <div class="summary-box-items">${itemsHtml}</div>
            <div class="summary-box-divider"></div>
            <div class="total-cost-row">
                <span class="total-cost-label">합계</span>
                <span class="total-cost-amount">${Math.round(totalCost).toLocaleString()}원</span>
            </div>
        </div>
        <p class="cost-notice-text">구매한 영양제의 한 달 치 비용입니다. 각 구성원에 할당된 비용은 아래와 같습니다.</p>
    ` : `<p style='text-align:center; font-size:20px; font-weight:bold; margin-top:230px; padding-bottom:80px;'>비용 없음</p>`;

    let familySummaryHtml = "";
    const names = Object.keys(familyCosts);
    if (names.length > 0) {
        familySummaryHtml += `<div class="family-cost-container">`;
        names.forEach(name => {
            familySummaryHtml += `
                <div class="family-cost-card">
                    <span class="family-cost-name">${name}</span>
                    <span class="family-cost-amount">${familyCosts[name].toLocaleString()}원</span>
                </div>`;
        });
        familySummaryHtml += `</div>`;
    }

    document.getElementById("monthlyCostContent").innerHTML = costContentHtml + familySummaryHtml;
}

document.getElementById("closeMonthlyCostModal").addEventListener("click", () => {
    closeBottomSheet("monthlyCostModal");
    switchCostTab('cost');
});
/*--------------------------------------월별 비용 끝-----------------------------------*/
function initCostModalTabs() {
    const costDiv = document.getElementById('monthlyCostContent');
    const calcDiv = document.getElementById('calcTabContent');
    const slider = document.querySelector('#costTabContainer .tab-slider');
    const btns = document.querySelectorAll('#costTabContainer .tab-btn');

    if(slider) slider.style.transform = 'translateX(0)';
    btns[0].classList.add('active');
    btns[1].classList.remove('active');
    costDiv.style.display = 'flex';
    calcDiv.style.display = 'none';
}

function switchCostTab(tab) {
    const container = document.getElementById('costTabContainer');
    const costContent = document.getElementById('monthlyCostContent');
    const calcContent = document.getElementById('calcTabContent');
    const slider = container.querySelector('.tab-slider');
    const btns = container.querySelectorAll('.tab-btn');

    if (tab === 'cost') {
        slider.style.transform = 'translateX(0%)';
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
        costContent.style.display = 'flex';
        calcContent.style.display = 'none';

        renderMonthlyCostData();
        
    } else {
        slider.style.transform = 'translateX(100%)';
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
        costContent.style.display = 'none';
        calcContent.style.display = 'flex';
        
        renderCalcTab(); 
    }
}
/*-----------------------------------비용 모달 계산 탭 시작--------------------------------*/
function updateCalcSum() {
    const checkboxes = document.querySelectorAll('.calc-check');
    let newSum = 0;
    
    checkboxes.forEach(cb => {
        if (cb.checked) {
            newSum += parseInt(cb.dataset.price || 0);
        }
    });
    
    const sumAmountDisplay = document.querySelector('.selected-sum-amount');
    if (sumAmountDisplay) {
        sumAmountDisplay.innerText = `${newSum.toLocaleString()}원`;
    }
}

function renderCalcTab() {
    const year = dt.getFullYear();
    const month = dt.getMonth() + 1;
    const calcDiv = document.getElementById('calcTabContent');
    
    const thisMonthSups = supplements.filter(sup => {
        const firstDate = sup.schedule?.[0] || "";
        const [y, m] = firstDate.split("-").map(Number);
        return y === year && m === month;
    });

    if (thisMonthSups.length === 0) {
        calcDiv.innerHTML = `
            <div style="flex:1; display:flex; align-items:center; justify-content:center; padding-top:215px;">
                <p style="opacity:0.6;">이번 달 등록된 제품이 없습니다.</p>
            </div>`;
        return;
    }

    let totalOriginal = 0;
    let listHtml = ``;
    
    // 제품들을 감싸는 큰 상자 시작
    listHtml += `<div class="calc-list-container">`;

    thisMonthSups.forEach(sup => {
        const price = (sup.price || 0);
        totalOriginal += price;
        listHtml += `
            <div class="calc-row" onclick="toggleCalcRow(this)">
                <input type="checkbox" class="calc-check" 
                       data-id="${sup.id}" 
                       data-price="${price}" 
                       onchange="updateCalcSum(); event.stopPropagation();" 
                       onclick="event.stopPropagation();"
                       checked>
                <span class="calc-product-name" style="margin-left:12px;">${sup.productName}</span>
                <span class="calc-product-price">${price.toLocaleString()}원</span>
            </div>
        `;
    });

    // 상자 내부 마지막에 합계 표시
    listHtml += `
        <div id="selectedSumDisplay" class="selected-sum-display">
            <span>합계</span>
            <span class="selected-sum-amount">${totalOriginal.toLocaleString()}원</span>
        </div>
    </div>`;

    // 상자 아래 안내 텍스트
    listHtml += `<p class="calc-notice-text">영양제를 구매할 때 할인을 받았다면 각 제품의 가격을 할인된 가격으로 계산하여 반영할 수 있습니다.</p>`;

    calcDiv.innerHTML = `
        <div class="calc-inner-wrapper">
            ${listHtml}
            
            <div class="calc-bottom-group">
            <div class="calc-input-box">
                <div style="display:flex; align-items:center; gap:5px; width: 100%;">
                    <span style="font-size:15px; color:defualt;">₩</span>

                    <div class="input-wrapper" style="flex: 1; position: relative;">
                    <input type="text" id="actualPaidInput" class="actual-paid-input" 
                           placeholder="할인이 적용된 결제 금액 입력" inputmode="numeric" oninput="formatCurrencyInput(this)">
                    <button type="button" class="clear-btn" id="clearActualPaid"><span></span></button>
                  </div>
                </div>
            </div>

            <div class="delete-btn-container">
                <button onclick="processDiscount(event)" class="delete-glass-btn">
                    할인율 적용
                </button>
            </div>
        </div>
    `;
    initClearButtons(calcDiv);
    applyIOSButtonEffect();
}

// 입력 시 실시간으로 쉼표를 넣어주는 함수
function formatCurrencyInput(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    
    if (value) {
        input.value = Number(value).toLocaleString();
    } else {
        input.value = '';
    }
}

function getActualPaidValue() {
    const input = document.getElementById('actualPaidInput');
    // 쉼표를 제거하고 숫자로 변환
    return parseInt(input.value.replace(/,/g, '')) || 0;
}

// 행 전체 클릭 시 체크박스 토글 함수
function toggleCalcRow(rowEl) {
    const checkbox = rowEl.querySelector('.calc-check');
    checkbox.checked = !checkbox.checked;
    updateCalcSum();
}

async function processDiscount(event) {
    const targetBtn = event.currentTarget;
    const actualPaid = getActualPaidValue(); 
    
    if (!actualPaid || actualPaid <= 0) {
        return openCustomActionSheet(targetBtn, "금액을 입력하십시오.", true, null, 65);
    }

    const checkboxes = document.querySelectorAll('.calc-check:checked');
    if (checkboxes.length === 0) {
        return openCustomActionSheet(targetBtn, "제품을 선택하십시오.", true, null, 65);
    }

    let originalSum = 0;
    checkboxes.forEach(cb => {
        originalSum += parseInt(cb.dataset.price || 0);
    });

    if (originalSum === 0) {
        return openCustomActionSheet(targetBtn, "선택된 제품의 가격 합계가 0원입니다.", true, null, 65);
    }
    
    const rate = actualPaid / originalSum;
    let allocatedTotal = 0;
    const checkedBoxes = Array.from(checkboxes);

    for (let i = 0; i < checkedBoxes.length; i++) {
        const cb = checkedBoxes[i];
        const id = Number(cb.dataset.id);
        const originalPrice = parseInt(cb.dataset.price || 0);
        const targetSup = supplements.find(s => s.id === id);

        if (targetSup) {
            let newPrice;
            if (i === checkedBoxes.length - 1) {
                newPrice = actualPaid - allocatedTotal;
            } else {
                newPrice = Math.round(originalPrice * rate);
                allocatedTotal += newPrice;
            }
            targetSup.price = newPrice;
            await saveSupplementToDB(targetSup);
        }
    }

    openCustomActionSheet(targetBtn, "할인이 적용되었습니다!", true, null, 65);
    
    setTimeout(() => {
        renderCalcTab();
        if (typeof renderCalendar === 'function') renderCalendar();
    }, 1000);
}
/*-----------------------------------비용 모달 계산 탭 끝--------------------------------*/
function applyIOSButtonEffect() {
    const selectors = [
        '.fab-today-btn',
        '.back-btn',
        '.close-btn',
        '.check-btn',
        '.extend-btn',
        '.delete-glass-btn',
        '.primary-btn',
        '.header-right-group',
        '.fab-combined-container',
        '.month-display'
    ];

    document.querySelectorAll(selectors.join(', ')).forEach(el => {
        attachIOSStyle(el);
    });
}

function attachIOSStyle(el) {
    if (!el) return;
    if (el.dataset.iosApplied === "true") return;

    const isInsideGroup = el.closest('.header-right-group') || el.closest('.fab-combined-container');
    if (isInsideGroup && el.tagName === 'BUTTON') return;

    setupIOSContainerEffect(el);
}

function setupIOSContainerEffect(element) {
    if (!element || element.dataset.iosApplied === "true") return;
    element.dataset.iosApplied = "true";

    let isPressed = false;

    element.addEventListener('pointerdown', (e) => {
        isPressed = true;
        element.setPointerCapture(e.pointerId);
        element.classList.remove('ios-release');
        element.classList.add('ios-active');
    });

    element.addEventListener('pointerup', (e) => {
        if (!isPressed) return;
        isPressed = false;
        element.releasePointerCapture(e.pointerId);

        element.classList.remove('ios-active');
        element.classList.add('ios-release');
        setTimeout(() => element.classList.remove('ios-release'), 550);

        const rect = element.getBoundingClientRect();
        const isInside = (
            e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom
        );

        if (isInside) {
            e.preventDefault(); 
            const targetBtn = document.elementFromPoint(e.clientX, e.clientY)?.closest('button');
            
            if (targetBtn) {
                targetBtn.click();
            } else {
                element.click();
            }
        }
    });

    element.addEventListener('pointercancel', (e) => {
        isPressed = false;
        if (element.hasPointerCapture(e.pointerId)) {
            element.releasePointerCapture(e.pointerId);
        }
        element.classList.remove('ios-active');
    });

    element.addEventListener('click', (e) => {
        if (e.isTrusted && isInsideAnyManagedContainer(e.target)) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);
}

function isInsideAnyManagedContainer(target) {
    const managedSelectors = ['.header-right-group', '.fab-combined-container', '.close-btn', '.check-btn'];
    return managedSelectors.some(sel => target.closest(sel));
}

window.addEventListener('DOMContentLoaded', applyIOSButtonEffect);

// 아코디언 토글 및 텍스트 표시 제어
function toggleAccordion(id) {
  const el = document.getElementById(id);
  const isActive = el.classList.contains('active');

  if (isActive) {
    const displayId = id === 'familyAccordion' ? 'selectedFamilyText' : 'selectedTimeText';
    const inputClass = id === 'familyAccordion' ? 'inputFamily' : 'inputTime';
    updateSelectedDisplay(inputClass, displayId);
    el.classList.remove('active');
  } else {
    syncAllAccordionTexts();
    resetAccordions();
    el.classList.add('active');
  }
}

function syncAllAccordionTexts() {
  updateSelectedDisplay('inputFamily', 'selectedFamilyText');
  updateSelectedDisplay('inputTime', 'selectedTimeText');
}

function resetAccordions() {
  document.querySelectorAll('.accordion-section').forEach(section => {
    section.classList.remove('active');
  });
}

function updateSelectedDisplay(inputClass, displayId) {
  const checkboxes = document.querySelectorAll(`.${inputClass}:checked`);
  const selectedValues = Array.from(checkboxes).map(cb => cb.value);
  const displayElement = document.getElementById(displayId);
  
  if (selectedValues.length > 0) {
    displayElement.textContent = selectedValues.join(', ');
  } else {
    displayElement.textContent = '';
  }
}

function resetAccordions() {
  document.querySelectorAll('.accordion-section').forEach(section => {
    section.classList.remove('active');
  });
}

//액션 시트
const deleteBtnInModal = document.getElementById('deleteInfoBtn');

if (deleteBtnInModal) {
    deleteBtnInModal.onclick = function() {
        if (typeof currentEditId !== 'undefined' && currentEditId) {
            openCustomActionSheet(this, "이 영양제를 삭제 하겠습니까?", false); 
        } else {
            openCustomActionSheet(this, "삭제할 항목을 선택할 수 없습니다.", true);
        }
    };
}

function openActionSheet(targetBtn) {
    const overlay = document.getElementById('actionSheetOverlay');
    const container = overlay.querySelector('.action-sheet-container');
    
    if (overlay && container && targetBtn) {
        const rect = targetBtn.getBoundingClientRect();
  
        container.style.left = `${rect.left + (rect.width / 2)}px`;

        const gap = 5;
        container.style.top = `${rect.top - 87}px`;

        overlay.style.visibility = 'visible';
        overlay.classList.add('active');
    }
}

function closeActionSheet() {
    const overlay = document.getElementById('actionSheetOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.visibility = 'hidden';
        }, 150);
    }
}

document.getElementById('actionSheetOverlay').onclick = function(e) {
    if (e.target === this) closeActionSheet();
};

document.getElementById('confirmDeleteBtn').onclick = async function() {
    if (typeof currentEditId !== 'undefined' && currentEditId) {
        try {
            await deleteSupplementFromDB(currentEditId);
            supplements = supplements.filter(s => s.id !== currentEditId);
            closeActionSheet();
            
            const modalOverlay = document.getElementById("modalOverlay");
            if (modalOverlay) modalOverlay.classList.remove("active");
            document.body.classList.remove("modal-open");

            if (typeof renderCalendar === 'function') renderCalendar();
            
            console.log("삭제 성공:", currentEditId);
            currentEditId = null;
            
        } catch (error) {
            console.error("삭제 중 오류 발생:", error);
            openCustomActionSheet(null, "삭제에 실패했습니다. 다시 시도해주세요.", true);
        }
    }
};

window.originalDeleteHandler = document.getElementById('confirmDeleteBtn').onclick;

/**
 * @param {HTMLElement} targetBtn
 * @param {String} message
 * @param {Boolean} isAlertOnly
 */
function openCustomActionSheet(targetBtn, message, isAlertOnly = false, confirmCallback = null, offset = 87, isInputMode = false, defaultValue = "") {
    const overlay = document.getElementById('actionSheetOverlay');
    const container = overlay.querySelector('.action-sheet-container');
    const title = document.getElementById('actionSheetTitle');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    if (!overlay || !container) return;

    const oldInput = container.querySelector('.action-sheet-input');
    if (oldInput) oldInput.remove();

    title.innerHTML = message.replace(/\n/g, '<br>');

    let inputEl = null;
    if (isInputMode) {
        inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.className = 'action-sheet-input';
        inputEl.value = defaultValue;
        inputEl.placeholder = "";
        title.after(inputEl);
        
        setTimeout(() => {
            inputEl.focus();
            inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
        }, 300);
    }

    title.style.textAlign = "left";
    title.style.fontSize = "15px";
    title.style.whiteSpace = "normal";
    title.style.wordBreak = "keep-all";
    confirmBtn.className = 'action-sheet-btn';
    title.style.margin = "3px 10px 13px 10px";

    confirmBtn.onclick = null;
    confirmBtn.onclick = async function(e) {
        if(e) { e.preventDefault(); e.stopPropagation(); }

        const finalValue = inputEl ? inputEl.value.trim() : null;

        if (isAlertOnly) {
            closeActionSheet();
            if (confirmCallback) await confirmCallback();
        } else if (confirmCallback) {
            await confirmCallback(finalValue);
            closeActionSheet();
        } else {
            if (window.originalDeleteHandler) await window.originalDeleteHandler();
            closeActionSheet();
        }
    };

    if (isAlertOnly) {
        confirmBtn.innerText = "확인";
        confirmBtn.style.color = "#ff3b30"; 
    } else if (confirmCallback) {
        confirmBtn.innerText = "확인";
        confirmBtn.style.color = "#007AFF"; 
    } else {
        confirmBtn.innerText = "영양제 삭제";
        confirmBtn.classList.add('delete-text');
        confirmBtn.style.color = ""; 
    }

    if (targetBtn) {
        const rect = targetBtn.getBoundingClientRect();
        container.style.left = `${rect.left + (rect.width / 2)}px`;
        container.style.top = `${rect.top - offset}px`;
        container.style.transform = "translate(-50%, 0)";
    } else {
        container.style.left = "50%";
        container.style.top = "50%";
        container.style.transform = "translate(-50%, -50%)";
    }

    overlay.style.visibility = 'visible';
    overlay.classList.add('active');
}

function validateInputs() {
    const product = document.getElementById('inputProduct').value.trim();
    const totalCaps = document.getElementById('inputTotal').value.trim();
    const dose = document.getElementById('inputDose').value.trim();
    
    const familyChecked = document.querySelectorAll(".inputFamily:checked").length > 0;
    const timeChecked = document.querySelectorAll(".inputTime:checked").length > 0;
    
    const saveBtn = document.getElementById('saveInfo');

    if (product && totalCaps && dose && familyChecked && timeChecked) {
        saveBtn.classList.add('ready');
    } else {
        saveBtn.classList.remove('ready');
    }
}

document.getElementById('inputProduct').addEventListener('input', validateInputs);
document.getElementById('inputTotal').addEventListener('input', validateInputs);
document.getElementById('inputDose').addEventListener('input', validateInputs);
document.getElementById('familyListContainer').addEventListener('change', validateInputs);
document.querySelector('.checkbox-group').addEventListener('change', validateInputs);

function updateTimeCheckboxes() {
  const doseValue = parseInt(document.getElementById("inputDose").value) || 0;
  const timeCheckboxes = document.querySelectorAll(".inputTime");
  const checkedCount = [...timeCheckboxes].filter(cb => cb.checked).length;

  timeCheckboxes.forEach(cb => {

    if (!cb.checked) {
      cb.disabled = (doseValue > 0 && checkedCount >= doseValue);
      cb.parentElement.style.opacity = cb.disabled ? "0.3" : "1";
      cb.parentElement.style.pointerEvents = cb.disabled ? "none" : "auto";
    } else {
      cb.disabled = false;
      cb.parentElement.style.opacity = "1";
      cb.parentElement.style.pointerEvents = "auto";
    }
  });
}

document.getElementById("inputDose").addEventListener("input", updateTimeCheckboxes);
document.addEventListener("change", (e) => {
  if (e.target.classList.contains("inputTime")) {
    updateTimeCheckboxes();
  }
});

function initClearButtons(container = document) {
    const wrappers = container.querySelectorAll('.input-wrapper');
    
    wrappers.forEach(wrapper => {
        if (wrapper.dataset.clearApplied === "true" || wrapper.classList.contains('no-clear')) {
            return;
        }
        wrapper.dataset.clearApplied = "true";

        const input = wrapper.querySelector('input');
        const btn = wrapper.querySelector('.clear-btn');
        if (!input || !btn) return;

        const toggleBtn = () => {
            if (input.value.length > 0) {
                wrapper.classList.add('show-clear');
            } else {
                wrapper.classList.remove('show-clear');
            }
        };

        input.addEventListener('input', toggleBtn);
        input.addEventListener('focus', toggleBtn);
        input.addEventListener('blur', () => {
            setTimeout(() => {
                wrapper.classList.remove('show-clear');
            }, 30);
        });

        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            input.value = '';
            if (typeof validateInputs === 'function') validateInputs();
            input.focus();
            toggleBtn();
            if (typeof updateCalcSum === 'function') updateCalcSum();
        });
    });
}

window.addEventListener('DOMContentLoaded', () => {
    initClearButtons(document);
});

function setupInputAlignment() {
    const allInputs = document.querySelectorAll('#inputProduct, #inputPrice, #inputTotal, #inputDose');

    const updateAlignment = (input) => {
        if (document.activeElement === input) {
            input.style.textAlign = 'left';
        } else {
            input.style.textAlign = input.value.length > 0 ? 'right' : 'left';
        }
    };

    allInputs.forEach(input => {
        updateAlignment(input);

        input.addEventListener('focus', () => {
            input.style.textAlign = 'left';
        });

        input.addEventListener('blur', () => {
            updateAlignment(input);
        });

        input.addEventListener('input', () => {
            if (document.activeElement !== input) updateAlignment(input);
        });
    });
}

window.addEventListener('DOMContentLoaded', setupInputAlignment);

const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
const backHelpModal = document.getElementById("backHelpModal");

helpBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  helpModal.classList.add("active");

  document.body.classList.add("modal-open");
});

backHelpModal.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  helpModal.classList.remove("active");

  if (!document.getElementById("modalOverlay").classList.contains("active")) {
    document.body.classList.remove("modal-open");
  }
});