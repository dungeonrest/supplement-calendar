const APP_VERSION = "3.13e";
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
});

document.addEventListener("touchstart", function() {}, true);

const closeBottomSheet = (modalId) => {
  const modalElement = document.getElementById(modalId);
  if (!modalElement) return;
  modalElement.classList.remove("active");
  const scrollableElements = modalElement.querySelectorAll('div'); 
  scrollableElements.forEach(el => {
    if (el.scrollTop > 0) el.scrollTop = 0;
  });
  setTimeout(() => {
    modalElement.classList.add("hidden"); 
    
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
const themeToggleBtn = document.getElementById("themeToggle");
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
  const deleteContainer = document.querySelector(".delete-btn-container");
  if (deleteContainer) deleteContainer.style.display = "flex";
  modalOverlay.classList.add("active");
  document.body.classList.add("modal-open");
  inputDate.value = selectedDateForList || (sup.schedule && sup.schedule[0]) || "";
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
}

// 상태
let dt = new Date();
let supplements = [];
let familyMembers = JSON.parse(localStorage.getItem("familyMembers")) || ["도림", "뚜임", "진이", "쿤이"];
let selectedDateForList = "";
let currentEditId = null;

const colorList = [
  "#E84855",
  "#1976D2",
  "#ffD516",
  "#388E3C",
  "#8E44AD",
  "#F57C00",
  "#118AB2",
  "#D32F2F",
  "#97aa44",
  "#D700BB",
  "#FF9F1C",
  "#16A085",
  "#3498DB",
  "#c96a3f",
  ];

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
        alert("데이터베이스 버전이 변경되었습니다. 앱을 재실행합니다.");
        location.reload();
      };
      resolve(db); 
    };
    request.onerror = (e) => {
  console.error("DB 오픈 실패:", e.target.error);
  alert("데이터베이스를 열 수 없습니다.\nSafari 설정에서 '모든 쿠키 차단'이 켜져 있거나\n개인정보 보호 모드인지 확인해주세요.");
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
      alert("💾 저장 중 오류가 발생했습니다. 콘솔을 확인하세요.");
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
themeToggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", isDark);
});

// 월별 비용
monthlyCostBtn.addEventListener("click", () => {
  const year = dt.getFullYear();
  const month = dt.getMonth() + 1;

  initCostModalTabs();

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
          if (!familyCosts[member]) {
            familyCosts[member] = 0;
          }
          familyCosts[member] += perPersonCost;
        });
      }
    }
  });

  let costHtml = "";
  if (monthlyItems.length > 0) {
    monthlyItems.forEach(item => {
      const ratio = totalCost > 0 ? Math.round((item.cost / totalCost) * 100) : 0;
      
      costHtml += `
        <div class="cost-item">
          <div class="cost-item-header">
            <span>${item.name}</span>
            <span>${item.cost.toLocaleString()}원</span>
          </div>
          <div class="cost-bar-bg">
            <div class="cost-bar-fill" style="width: ${ratio}%; background-color: ${item.color};"></div>
          </div>
        </div>
      `;
    });
  } else {
    costHtml = "<p style='text-align:center; font-size:20px; font-weight:bold; margin-top:100px; padding-bottom:80px;'>비용 없음</p>";
  }

  let familySummaryHtml = "";
  const names = Object.keys(familyCosts);
  
  if (names.length > 0) {
    familySummaryHtml += `<div class="family-cost-container">`;
    names.forEach(name => {
        familySummaryHtml += `
            <div class="family-cost-card">
                <span class="family-cost-name">${name}</span>
                <span class="family-cost-amount">${familyCosts[name].toLocaleString()}원</span>
            </div>
        `;
    });
    familySummaryHtml += `</div>`;
    familySummaryHtml += `<div style="width: 100%; height: 1px; background: var(--calendar-line); margin: 0px 0 15px; opacity: 0.6;"></div>`;
}

  costHtml += `
    <div class="total-cost-wrapper">
      ${familySummaryHtml}
      <span class="total-cost-label">${month}월 한 달 치 비용</span>
      <span class="total-cost-amount">₩ ${Math.round(totalCost).toLocaleString()}</span>
    </div>
  `;

  document.getElementById("monthlyCostContent").innerHTML = costHtml;
  monthlyCostModal.classList.add("active");
  document.body.classList.add("modal-open");
});

closeMonthlyCostModal.addEventListener("click", () => {
  closeBottomSheet("monthlyCostModal");
  switchCostTab('cost');
});

// + 버튼 클릭 //
addBtn.addEventListener("click", () => {
  currentEditId = null;
  const deleteContainer = document.querySelector(".delete-btn-container");
  if (deleteContainer) deleteContainer.style.display = "none";
  renderFamilyCheckboxes();
  modalOverlay.classList.add("active");
  document.body.classList.add("modal-open");
  history.pushState({ modal: "add" }, "");

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

  document.getElementById("memoLine1").value = "";
  document.getElementById("memoLine2").value = "";
  document.getElementById("memoLine3").value = "";
});

const fabAddBtn = document.getElementById("fabAddBtn");

fabAddBtn.addEventListener("click", () => {
  addBtn.click();
});

closeModalBtn.addEventListener("click", () => {
  closeBottomSheet("modalOverlay");
  resetAccordions();
});

// 달력 렌더 //
function renderCalendar() {
  dt.setDate(1);
  const year = dt.getFullYear();
  const month = dt.getMonth();

  monthDisplay.innerText = `${year}. ${String(month+1).padStart(2,"0")}`;

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month+1,0).getDate();

  datesContainer.innerHTML = "";

  const todayStr = getTodayKST();

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
    const todayStr = getTodayKST();

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

        const isDark = document.body.classList.contains("dark-mode");
        bar.style.backgroundColor = `rgba(${hexToRgb(sup.circleColor)}, ${isDark ? 0.45 : 0.3})`;

        const fill = document.createElement("div");
        fill.classList.add("bar-fill");
        fill.style.backgroundColor = sup.circleColor;

        const dayStatus = sup.takenStatus?.[fullDate] || {};
        let takenSlots = 0;
        for (let t of sup.times) {
          for (let m of sup.family) {
            if (dayStatus[`${t}_${m}`]) takenSlots++;
          }
        }

        const totalSlots = sup.family.length * sup.times.length;
        const fillPercent = totalSlots > 0
          ? Math.floor((takenSlots / totalSlots) * 100)
          : 0;

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
  if (!start || !product || !totalCaps || !dose || family.length === 0 || times.length === 0) {
    alert("모든 정보를 입력해주세요.");
    return;
  }

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
        assignedColor = colorList[supplements.length % colorList.length];
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

// 이름 변경 처리 함수
function changeFamilyMemberName(index, newName) {
  const oldName = familyMembers[index];
  familyMembers[index] = newName;
  localStorage.setItem("familyMembers", JSON.stringify(familyMembers));

  supplements.forEach(sup => {

    if (sup.family.includes(oldName)) {
      sup.family = sup.family.map(f => f === oldName ? newName : f);
    }
    if (sup.takenStatus) {
      for (let date in sup.takenStatus) {
        for (let key in sup.takenStatus[date]) {
          if (key.includes(`_${oldName}`)) {
            const newKey = key.replace(`_${oldName}`, `_${newName}`);
            sup.takenStatus[date][newKey] = sup.takenStatus[date][key];
            delete sup.takenStatus[date][key];
          }
        }
      }
    }
    saveSupplementToDB(sup);
  });

  alert(`이름이 '${oldName}'에서 '${newName}'으로 변경되었습니다.`);
  renderCalendar()
  renderFamilyUI()
}

if (todayBtn) {
  todayBtn.addEventListener("click", () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    selectedDateForList = `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    dt = new Date(y, m, d, 0, 0, 0);

    renderCalendar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

  todayBtn.addEventListener("touchend", (e) => {
    if (e.cancelable) e.preventDefault(); 
    todayBtn.click();
  }, { passive: false });

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

function openTakenCheckUI(date) {
  const modal = document.getElementById("takenCheckModal");
  const title = document.getElementById("takenCheckTitle");
  const body = document.getElementById("takenCheckBody");

  if (body) {
    body.style.overflowY = "auto";
    body.style.maxHeight = "80vh";
    body.scrollTop = 0;
  }

  title.innerText = date.replaceAll('-', '.');
  body.innerHTML = "";

  const matchedSupps = supplements.filter(s => s.schedule.includes(date));

  if (matchedSupps.length === 0) {
    body.innerHTML = "<p>해당 날짜의 영양제가 없습니다.</p>";
  } else {
    matchedSupps.forEach(sup => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("taken-sup-wrapper");

      const section = document.createElement("div");
      section.classList.add("taken-sup-section");

      const titleContainer = document.createElement("div");
      titleContainer.classList.add("taken-sup-title");

      const dot = document.createElement("span");
      dot.classList.add("sup-dot");
      dot.style.backgroundColor = sup.circleColor;
      titleContainer.appendChild(dot);

      const nameText = document.createElement("span");
      nameText.classList.add("sup-name-text");
      nameText.innerText = sup.productName;
      titleContainer.appendChild(nameText);

      const extendBtn = document.createElement("button");
      extendBtn.classList.add("extend-btn");
      extendBtn.innerText = "연장";
      
      extendBtn.addEventListener("click", async () => {
        const baseDate = date;
        const leftUnTakenSlots = calculateLeftUnTakenSlotsBefore(sup, baseDate);
        const additionalDays = calculateAdditionalDays(sup, baseDate, leftUnTakenSlots);
        const formattedDate = baseDate.replaceAll('-', '.');

        if (additionalDays === 0) {
          alert("📍 연장할 일정이 없습니다.");
          return;
        }

        let confirmMsg = `📍 ${formattedDate}\n\n` +
          `미복용 체크 슬롯: ${leftUnTakenSlots}개\n` +
          `예상 추가 일정: ${additionalDays}일\n\n` +
          `이대로 연장할까요?`;

        if (confirm(confirmMsg)) {
          extendScheduleFromDate(sup, baseDate, additionalDays);
          const takenStatus = sup.takenStatus || {};
          sup.schedule.forEach(dateStr => {
        if (dateStr < baseDate) {
        if (!takenStatus[dateStr]) takenStatus[dateStr] = {};
        
          sup.times.forEach(time => {
          sup.family.forEach(member => {
            const key = `${time}_${member}`;
          
            if (!takenStatus[dateStr][key]) {
              takenStatus[dateStr][key + "_extended"] = true;
            }
          });
        });
      }
    });    

          await saveAllSupplements(sup); 
          renderCalendar();
          alert("일정이 연장되었습니다!");
          modal.classList.remove("active");
          document.body.classList.remove("modal-open");
        }
      });
      
      titleContainer.appendChild(extendBtn);
      wrapper.appendChild(titleContainer);

      const table = document.createElement("table");
      table.classList.add("taken-table");

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

      const times = sup.times || [];
      if (!sup.takenStatus) sup.takenStatus = {};
      if (!sup.takenStatus[date]) sup.takenStatus[date] = {};

      times.forEach(time => {
        const row = document.createElement("tr");
        const tdTime = document.createElement("td");
        tdTime.innerText = time;
        row.appendChild(tdTime);

        sup.family.forEach(member => {
          const td = document.createElement("td");
          const chk = document.createElement("input");
          chk.type = "checkbox";
          chk.checked = sup.takenStatus[date][`${time}_${member}`] || false;
          chk.style.margin = "2px";

          chk.addEventListener("change", async () => {
            sup.takenStatus[date][`${time}_${member}`] = chk.checked;
            if (!chk.checked) {
             delete sup.takenStatus[date][`${time}_${member}_extended`];
            }
            await saveSupplementToDB(sup);
            renderCalendar();
            td.style.backgroundColor = chk.checked ? "rgba(78, 205, 196, 0.2)" : "rgba(128, 128, 128, 0.05)";
          });

          td.style.backgroundColor = chk.checked ? "rgba(78, 205, 196, 0.2)" : "rgba(128, 128, 128, 0.05)";
          td.style.transition = "background-color 0.3s";
          td.style.padding = "2px";

          td.appendChild(chk);
          row.appendChild(td);
        });
        table.appendChild(row);
      });

      section.appendChild(table);
      wrapper.appendChild(section);
      body.appendChild(wrapper);
    });
  }

  modal.classList.add("active");
  document.body.classList.add("modal-open");
}

// 복용체크모달 닫기 버튼 (X) — 누르면 저장 후 모달 닫기
document.getElementById("closeTakenCheckBtn").addEventListener("click", async () => {
  renderCalendar();
  closeBottomSheet("takenCheckModal");
});

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

  statsContent.innerHTML = "<p style='text-align:center; font-size:15px; opacity:0.6; margin-top:180px;'>이름을 길게 누르면 변경/삭제가 가능합니다.</p>";
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

  const start = document.getElementById("periodStart").value; // 예: "2026-01"
  const end = document.getElementById("periodEnd").value;     // 예: "2026-03"
  
  if (!start || !end) return;

  const startStr = `${start}-01`; 
  const endArr = end.split("-");
  const lastDay = new Date(parseInt(endArr[0]), parseInt(endArr[1]), 0).getDate();
  const endStr = `${end}-${String(lastDay).padStart(2, '0')}`;

  const stats = {};

  supplements.forEach(sup => {
    // 1. 해당 가족 구성원이 포함되어 있는지 확인
    if (!sup.family || !sup.family.includes(name)) return;

    // 2. 선택한 기간 내에 이 영양제의 스케줄이 하루라도 있는지 확인 (핵심 필터)
    const hasScheduleInPeriod = sup.schedule.some(date => date >= startStr && date <= endStr);
    if (!hasScheduleInPeriod) return; // 기간 내 스케줄 없으면 아예 건너뜀

    const initialTotal = parseFloat(sup.totalCapsules) || 0;
    if (initialTotal <= 0) return;

    // 해당 기간 동안 이 사람이 먹어야 했던 총 횟수 계산 (목표치)
    // 전체 기간 대비가 아니라, '선택한 기간' 내의 스케줄 개수 기준
    const periodScheduleCount = sup.schedule.filter(date => date >= startStr && date <= endStr).length;
    const targetForPeriod = periodScheduleCount * (sup.times.length); 

    let actualTakenCount = 0;
    if (sup.takenStatus) {
      Object.keys(sup.takenStatus).forEach(dateStr => {
        if (dateStr >= startStr && dateStr <= endStr) {
          const dayStatus = sup.takenStatus[dateStr];
          for (const key in dayStatus) {
            // 해당 구성원(name)의 체크 여부 확인
            if (key.includes(`_${name}`) && dayStatus[key] === true && !key.includes("_extended")) {
              actualTakenCount++;
            }
          }
        }
      });
    }

    stats[sup.productName] = {
      taken: actualTakenCount,
      target: targetForPeriod,
      color: sup.circleColor
    };
  });

  let html = "";
  const keys = Object.keys(stats);
  if (keys.length === 0) {
    html = "<p style='text-align:center; font-size:16px; opacity:0.5; margin-top:150px;'>해당 기간에 복용 기록이 없습니다.</p>";
  } else {
    keys.forEach(key => {
      const info = stats[key];
      let percent = info.target > 0 ? Math.round((info.taken / info.target) * 100) : 0;
      if (percent > 100) percent = 100;
      
      html += `
        <div class="stats-item">
          <div class="pie-chart" style="background: conic-gradient(${info.color} ${percent}%, ${trackColor} 0)">
            <div class="pie-inner" style="background-color: ${innerBg}">
              <span class="pie-percent">${percent}%</span>
            </div>
          </div>
          <div class="stats-info">
            <span class="stats-product-name">${key}</span>
            <span class="stats-count-text">${info.taken} / ${info.target}회 복용</span>
          </div>
        </div>`;
    });
  }
  const content = document.getElementById("statsContent");
  content.innerHTML = html;
  content.scrollTop = 0;
}

function renderFamilyUI() {
  const statsFamilyContainer = document.querySelector(".family-buttons");
  if (statsFamilyContainer) {
    statsFamilyContainer.innerHTML = ""; 
    familyMembers.forEach((name, index) => {
      const btn = document.createElement("button");
      btn.className = "family-btn";
      btn.dataset.name = name;
      btn.innerText = name;
      
      let timer;
      let isLongPress = false;

      const startPress = () => {
        isLongPress = false;
        timer = setTimeout(async () => {
          isLongPress = true; 
          const newName = prompt(`'${name}' 님의 이름을 변경하세요.\n(빈칸으로 두면 삭제됩니다.)`, name);
          if (newName === null) return;
          const trimmed = newName.trim();
          if (trimmed === "") {
            if (confirm(`'${name}' 님을 삭제할까요?\n복용 데이터도 사라집니다.`)) {
              await deleteFamilyMemberFromDB(name);
              familyMembers.splice(index, 1);
              localStorage.setItem("familyMembers", JSON.stringify(familyMembers));
              location.reload();
            }
          } else if (trimmed !== name) {
            await updateSupplementFamilyName(name, trimmed);
            familyMembers[index] = trimmed;
            localStorage.setItem("familyMembers", JSON.stringify(familyMembers));
            alert(`'${name}' 님이 '${trimmed}' 님으로 변경되었습니다.`);
            location.reload();
          }
        }, 900);
      };
      const endPress = () => clearTimeout(timer);

      btn.addEventListener("click", () => {
        if (!isLongPress) {
          document.querySelectorAll(".family-btn").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");
          showStatsForFamily(name);
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
      
      addBtn.addEventListener("click", async () => {
        const n = prompt("새로운 이름을 입력하세요.");
        if (n && n.trim()) {
          const newName = n.trim();
          familyMembers.push(newName);
          localStorage.setItem("familyMembers", JSON.stringify(familyMembers));

          const transaction = db.transaction(["supplements"], "readwrite");
          const store = transaction.objectStore("supplements");
          
          transaction.oncomplete = () => {
            alert(`'${newName}' 님이 추가되었습니다.`);
            location.reload(); 
          };
        }
      });
      statsFamilyContainer.appendChild(addBtn);
    }
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
}

// 탭 전환 함수 수정
function switchStatsTab(tab) {
    const familyWrapper = document.getElementById('familyBtnsWrapper');
    const periodWrapper = document.getElementById('periodWrapper');
    const statsContent = document.getElementById('statsContent');
    const btns = document.querySelectorAll('#statsTabContainer .tab-btn');
    const slider = document.querySelector('#statsTabContainer .tab-slider');

    // 1. 초기화: 모든 내용을 비우고 탭 설정
    statsContent.innerHTML = ""; 

    if (tab === 'stats') {
        slider.style.transform = 'translateX(0%)';
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
        
        familyWrapper.style.display = 'flex';
        periodWrapper.style.display = 'flex';
        
        // 이전에 선택된 가족이 있다면 바로 통계 표시
        const selectedBtn = familyWrapper.querySelector('.family-btn.selected');
        if (selectedBtn) {
            showStatsForFamily(selectedBtn.dataset.name);
        } else {
            statsContent.innerHTML = "<p style='text-align:center; font-size:14px; opacity:0.5; margin-top:100px;'>가족 구성원을 선택해주세요.</p>";
        }
    } else {
        slider.style.transform = 'translateX(100%)';
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
        
        familyWrapper.style.display = 'none';
        periodWrapper.style.display = 'none';
        
        renderAnalysisTab(); // 분석 데이터 렌더링
    }
}

// 기간 선택 시 실시간 업데이트 (이벤트 리스너에 추가 필요)
[periodStart, periodEnd].forEach(el => {
    el.addEventListener('change', () => {
        const selectedBtn = document.querySelector('.family-btn.selected');
        if (selectedBtn && document.querySelector('#statsTabContainer .tab-btn.active').innerText === '통계') {
            showStatsForFamily(selectedBtn.dataset.name);
        }
    });
});

// 분석 탭 렌더링 (실제 데이터 계산)
function renderAnalysisTab() {
  const statsContent = document.getElementById('statsContent');
  
  // 1. 데이터 분석용 변수 초기화
  let totalChecks = 0;
  let timeStats = { "아침": 0, "점심": 0, "저녁": 0, "공복": 0 };
  let dayStats = [0, 0, 0, 0, 0, 0, 0]; // 일~토
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  
  let bestProduct = { name: "기록 없음", rate: 0 };
  let refillList = [];

  // 2. 전체 영양제 순회 분석
  supplements.forEach(sup => {
    let supTotal = 0;
    let supTaken = 0;

    if (sup.takenStatus) {
      Object.keys(sup.takenStatus).forEach(dateStr => {
        const dayData = sup.takenStatus[dateStr];
        const dateObj = new Date(dateStr);
        const dayIdx = dateObj.getDay();

        Object.keys(dayData).forEach(key => {
          // 순수 복용 체크(true)만 집계 (연장 데이터 제외)
          if (dayData[key] === true && !key.includes("_extended")) {
            totalChecks++;
            supTaken++;
            dayStats[dayIdx]++;
            
            if (key.includes("아침")) timeStats["아침"]++;
            else if (key.includes("점심")) timeStats["점심"]++;
            else if (key.includes("저녁")) timeStats["저녁"]++;
            else if (key.includes("공복")) timeStats["공복"]++;
          }
        });
      });
    }

    // 복용 성실도 계산 (스케줄 대비 실제 복용량)
    const scheduleCount = sup.schedule ? sup.schedule.length : 0;
    const targetCount = scheduleCount * sup.family.length * sup.times.length;
    let rate = targetCount > 0 ? (supTaken / targetCount) * 100 : 0;
    
    if (rate > bestProduct.rate) {
      bestProduct = { name: sup.productName, rate: Math.round(rate) };
    }

    // 재구매 알림 계산 (남은 알약 수 기반)
    const dailyDose = parseFloat(sup.dose) || 0; 
    const totalProvision = parseFloat(sup.totalCapsules) || 0;
    // 실제 소모량 = (체크된 총 횟수 * 1회 분량) / (가족 수 * 시간대 수) 로직 보정
    const consumedAmount = (supTaken * (dailyDose / sup.times.length));
    const remains = totalProvision - consumedAmount;
    const daysLeft = dailyDose > 0 ? Math.floor(remains / dailyDose) : 999;

    if (daysLeft <= 7 && daysLeft >= 0) {
      refillList.push({ name: sup.productName, days: daysLeft });
    }
  });

  // 요일 및 시간대 최댓값 추출
  const bestDayIdx = dayStats.indexOf(Math.max(...dayStats));
  const bestDayName = totalChecks > 0 ? dayNames[bestDayIdx] : "-";
  const bestTime = Object.keys(timeStats).reduce((a, b) => timeStats[a] > timeStats[b] ? a : b);

  // 3. UI 렌더링
  statsContent.innerHTML = `
    <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px; padding-bottom:100px;">
      
      <div style="background: var(--bg-paper); padding: 20px; border-radius: 20px; display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
        <div style="border-right: 1px solid rgba(128,128,128,0.15);">
          <p style="font-size:11px; opacity:0.6; margin:0;">복용 성실도 1위</p>
          <h4 style="margin:5px 0 0 0; font-size:15px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${bestProduct.name}</h4>
          <span style="color:#05d339; font-size:12px; font-weight:bold;">${bestProduct.rate}%</span>
        </div>
        <div style="padding-left:10px;">
          <p style="font-size:11px; opacity:0.6; margin:0;">가장 성실한 요일</p>
          <h4 style="margin:5px 0 0 0; font-size:15px;">${bestDayName}요일</h4>
          <span style="font-size:12px; opacity:0.5;">주로 ${bestTime} 복용</span>
        </div>
      </div>

      <div style="background: var(--bg-paper); padding: 20px; border-radius: 20px;">
        <p style="font-size:13px; opacity:0.6; margin:0 0 15px 0;">시간대별 복용 비중</p>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${Object.entries(timeStats).map(([time, count]) => {
            const ratio = totalChecks > 0 ? (count / totalChecks * 100).toFixed(1) : 0;
            return `
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="width:30px; font-size:11px; opacity:0.8;">${time}</span>
                <div style="flex:1; height:6px; background:rgba(128,128,128,0.1); border-radius:3px; overflow:hidden;">
                  <div style="width:${ratio}%; height:100%; background:#007aff; border-radius:3px;"></div>
                </div>
                <span style="width:35px; font-size:10px; text-align:right; opacity:0.6;">${ratio}%</span>
              </div>`;
          }).join('')}
        </div>
      </div>

      <div style="background: var(--bg-paper); padding: 20px; border-radius: 20px;">
        <p style="font-size:13px; opacity:0.6; margin:0 0 10px 0;">재구매 및 관리</p>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${refillList.length > 0 
            ? refillList.map(item => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,77,77,0.05); padding:10px; border-radius:12px; border:1px solid rgba(255,77,77,0.1);">
                  <span style="font-size:13px; font-weight:500;">⚠️ ${item.name}</span>
                  <span style="font-size:12px; color:#ff4d4d; font-weight:bold;">약 ${item.days}일분 남음</span>
                </div>`).join('')
            : `<p style="font-size:13px; margin:5px 0; text-align:center; opacity:0.5;">✅ 모든 영양제가 넉넉합니다.</p>`}
        </div>
      </div>

    </div>
  `;
}

const originalCloseStatsModal = document.getElementById("closeStatsModal").onclick;
document.getElementById("closeStatsModal").onclick = function() {
    originalCloseStatsModal();
    switchStatsTab('stats');
};

function renderFamilyCheckboxes() {
  const familyGroup = document.querySelector(".input-group.family-group");
  if (!familyGroup) return;

  familyGroup.innerHTML = "<label>복용 가족</label>"; 

  familyMembers.forEach(name => {
    const label = document.createElement("label");
    label.className = "check-label";
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.className = "inputFamily";
    chk.value = name;
    chk.checked = false; 

    label.appendChild(chk);
    label.appendChild(document.createTextNode(` ${name}`));
    familyGroup.appendChild(label);
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
      
      sup.times.forEach(time => {
        sup.family.forEach(member => {
          const key = `${time}_${member}`;
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

function calculateAdditionalDays(sup, baseDate, leftSlots) {
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

const footerYear = document.getElementById("footerYear");
const footerBackupLink = document.getElementById("footerBackupLink");
const backupMenuModal = document.getElementById("backupMenuModal");
const exportBtn = document.getElementById("exportBtn");
const triggerImportBtn = document.getElementById("triggerImportBtn");
const closeBackupMenu = document.getElementById("closeBackupMenu");
const importFileInput = document.getElementById("importFileInput");

footerYear.innerText = new Date().getFullYear();
footerBackupLink.addEventListener("click", () => {
  backupMenuModal.classList.add("active");
  document.body.classList.add("modal-open");
  history.pushState({ modal: "backup" }, "");
});

closeBackupMenu.addEventListener("click", () => {
  closeBottomSheet("backupMenuModal");
});

// 백업 동작
exportBtn.addEventListener("click", () => {
  if (supplements.length === 0) {
    alert("백업할 데이터가 없습니다.");
    return;
  }

  const blob = new Blob([JSON.stringify(supplements, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `supplements-auto-backup.json`;
  a.click();

  URL.revokeObjectURL(url);
  closeBottomSheet("backupMenuModal");
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
      alert("올바른 백업 파일이 아닙니다.");
      return;
    }

    if (!confirm("기존 기록이 삭제되고\n백업 내용으로 덮어씌워집니다.\n계속할까요?")) {
      return;
    }
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
          alert("기존 데이터 연결이 남아있습니다. 앱을 완전히 껐다 켜주세요.");
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

    closeBottomSheet("backupMenuModal");
    alert("백업 데이터를 성공적으로 불러왔습니다!");
    location.reload();

  } catch (err) {

    console.error("복원 에러 상세:", err);
    alert("복원 중 오류가 발생했습니다. (사유: " + err.message + ")");
  }
  e.target.value = "";
});

const footerVersionEl = document.getElementById("footerVersion");
document.getElementById("footerAppVersion").innerText = APP_VERSION;
footerVersionEl.addEventListener("click", async () => {
  try {
    const res = await fetch("./version.json?" + Date.now());
    if (!res.ok) throw new Error();
    const data = await res.json();

    const latestVersion = data.version;
    const currentVersion = APP_VERSION;

    if (latestVersion !== currentVersion) {
      if (confirm(`새로운 버전이 있습니다!\n업데이트하려면 확인을 누르세요.`)) {
        location.reload();
      }
    } else {
      alert(`💊 최신 버전입니다!`);
    }
  } catch (err) {
    console.log("버전 확인 불가 (오프라인 상태 등)");
  }
});

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

const minSwipeDistance = 70;
const swipeRatio = 1.5;
const datesWrapper = document.getElementById("dates-wrapper");

datesWrapper.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;

  touchEndX = touchStartX;
  touchEndY = touchStartY;
}, { passive: true });

datesWrapper.addEventListener("touchmove", (e) => {
  if (e.touches.length > 1) return;

  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;

  const diffX = touchEndX - touchStartX;
  const absDiffX = Math.abs(diffX);
  const absDiffY = Math.abs(touchEndY - touchStartY);

  if (absDiffX > 5 && absDiffX > absDiffY) { 
    if (e.cancelable) e.preventDefault();
  }
}, { passive: false });

datesWrapper.addEventListener("touchend", (e) => {
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;
  const absDiffX = Math.abs(diffX);
  const absDiffY = Math.abs(diffY);

  if (absDiffX > minSwipeDistance && absDiffX > absDiffY * swipeRatio) {
    if (diffX < 0) {
      changeMonthWithDay(1);
    } else if (diffX > 0) {
      changeMonthWithDay(-1);
    }
  }

  touchStartX = 0;
  touchStartY = 0;
  touchEndX = 0;
  touchEndY = 0;
});

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
    if (!value) return alert("이름을 입력해주세요.");

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

window.addEventListener("popstate", () => {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  const allModals = [
    modalOverlay,
    statsModal, 
    backupMenuModal, 
    document.getElementById("familyConfigModal"),
    document.getElementById("takenCheckModal"),
    monthlyCostModal
  ];
  
  allModals.forEach(modal => {
    if (modal) modal.classList.remove("active");
    document.body.classList.remove("modal-open");
  });
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
    alert("이미 설치되어 있거나 지원하지 않는 환경입니다.");
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

  // 집계용 변수
  let countComplete = 0; // 완복
  let countPartial = 0;  // 부분
  let countNone = 0;     // 미복

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
          style = "background-color: #ff4d4d; color: #fff;"; // 미복용
          countNone++;
        } else if (takenSlots < totalSlots) {
          style = "background-color: #ffbb00; color: #fff;"; // 부분
          countPartial++;
        } else {
          style = "background-color: #02bb30; color: #fff;"; // 완료
          countComplete++;
        }
      }
      daysGrid.innerHTML += `<div class="mini-day" style="${style}">${d}</div>`;
    }
    monthDiv.appendChild(daysGrid);
    container.appendChild(monthDiv);
  }

  // 집계 카드 추가 (그리드 내부 맨 마지막에 3컬럼을 차지하도록 추가)
  const summaryDiv = document.createElement("div");
  summaryDiv.style = "grid-column: 1 / span 3; margin-top: 5px; padding: 20px; background: var(--bg-paper); border-radius: 20px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 10px;";
  summaryDiv.innerHTML = `
    <h4 style="margin:0; font-size:16px; opacity:0.8;">${year}년 리포트</h4>
    <div style="display:flex; justify-content: space-between; align-items: center;">
      <div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; background:#02bb30; border-radius:50%;"></div> 완전 복용</div>
      <span style="font-weight:bold;">${countComplete}일</span>
    </div>
    <div style="display:flex; justify-content: space-between; align-items: center;">
      <div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; background:#ffbb00; border-radius:50%;"></div> 부분 복용</div>
      <span style="font-weight:bold;">${countPartial}일</span>
    </div>
    <div style="display:flex; justify-content: space-between; align-items: center;">
      <div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; background:#ff4d4d; border-radius:50%;"></div> 미복용 날짜</div>
      <span style="font-weight:bold;">${countNone}일</span>
    </div>
  `;
  container.appendChild(summaryDiv);
}

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
    } else {
        slider.style.transform = 'translateX(100%)';
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
        costContent.style.display = 'none';
        calcContent.style.display = 'flex';
        
        renderCalcTab(); 
    }
}

function updateCalcSum() {
    if (event && event.target && event.target.classList.contains('calc-check')) {
        const target = event.target;
    }
    const checkboxes = document.querySelectorAll('.calc-check');
    let newSum = 0;
    
    checkboxes.forEach(cb => {
        if (cb.checked) {
            newSum += parseInt(cb.dataset.price || 0);
        }
    });
    
    const sumDisplay = document.getElementById('selectedSumDisplay');
    if (sumDisplay) {
        sumDisplay.innerText = `선택 제품 합계: ${newSum.toLocaleString()}원`;
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
            <div style="flex:1; display:flex; align-items:center; justify-content:center;">
                <p style="opacity:0.6;">이번 달 등록된 제품이 없습니다.</p>
            </div>`;
        return;
    }

    let totalOriginal = 0;
    let listHtml = `<h4 class="calc-main-title">${month}월 구매가</h4>`;
    
    thisMonthSups.forEach(sup => {
        const price = (sup.price || 0);
        totalOriginal += price;
        listHtml += `
            <div class="calc-list-item">
                <div style="display:flex; align-items:center; gap:12px;">
                    <input type="checkbox" class="calc-check" 
                           data-id="${sup.id}" 
                           data-price="${price}" 
                           onchange="updateCalcSum()" 
                           checked>
                    <span class="calc-product-name">${sup.productName}</span>
                </div>
                <span class="calc-product-price">${price.toLocaleString()}원</span>
            </div>
        `;
    });

    listHtml += `<div id="selectedSumDisplay" class="selected-sum-display">선택 제품 합계: ${totalOriginal.toLocaleString()}원</div>`;

    calcDiv.innerHTML = `
        <div class="calc-inner-wrapper" style="display:flex; flex-direction:column; width:100%;">
            ${listHtml}
            
            <div class="calc-input-box">
                <label class="calc-input-label">실제 총 결제 금액</label>
                <div style="display:flex; align-items:center; gap:5px;">
                    <span style="font-size:18px;">₩</span>
                    <input type="number" id="actualPaidInput" class="actual-paid-input" 
                           placeholder="할인 적용된 금액 입력" inputmode="numeric">
                </div>
            </div>

            <div class="delete-btn-container">
                <button onclick="processDiscount()" class="delete-glass-btn">
                    할인율 적용
                </button>
            </div>
            
            <div id="calcStatusMsg" class="calc-status-msg"></div>
        </div>
    `;
}

async function processDiscount() {
    const actualPaid = parseInt(document.getElementById('actualPaidInput').value);
    if (!actualPaid || actualPaid <= 0) return alert("금액을 입력하세요.");

    const checkboxes = document.querySelectorAll('.calc-check:checked');
    const selectedIds = Array.from(checkboxes).map(cb => Number(cb.dataset.id));
    const selectedSups = supplements.filter(s => selectedIds.includes(s.id));
    const originalSum = selectedSups.reduce((acc, cur) => acc + (cur.price || 0), 0);

    if (originalSum === 0) return;
    const rate = actualPaid / originalSum;

    for (let sup of selectedSups) {
        sup.price = Math.round(sup.price * rate);
        await saveSupplementToDB(sup);
    }

    document.getElementById('calcStatusMsg').innerText = "저장 완료! 잠시 후 업데이트됩니다.";
    renderCalendar();
    setTimeout(() => { monthlyCostBtn.click(); }, 1200);
}

function applyIOSButtonEffect() {
    const selectors = [
        'button',
        '.tab-btn',
        '.fab-today-btn', 
        '.fab-add-btn', 
        '.family-btn', 
        '.menu-btn', 
        '.primary-btn', 
        '.close-btn', 
        '.check-btn', 
        '.extend-btn',
        '.delete-glass-btn',
        '.month-display'
    ];

    const targetElements = document.querySelectorAll(selectors.join(', '));

    targetElements.forEach(el => {
        setupIOSButtonAutomated(el);
    });
}

function setupIOSButtonAutomated(element) {
    if (!element || element.dataset.iosApplied === "true") return;
    element.dataset.iosApplied = "true";

    let isPressed = false;

    const getEffectTarget = (el) => {
        if (el.classList.contains('tab-btn')) {
            return el.closest('.tab-container').querySelector('.tab-slider');
        }
        return el;
    };

    element.addEventListener('pointerdown', (e) => {
        isPressed = true;
        const target = getEffectTarget(element);
        if (target) target.classList.add('ios-active');
        
        element.setPointerCapture(e.pointerId);
    });

    element.addEventListener('pointerup', (e) => {
        if (!isPressed) return;
        isPressed = false;

        const target = getEffectTarget(element);
        if (target) target.classList.remove('ios-active');
        
        element.releasePointerCapture(e.pointerId);

        const rect = element.getBoundingClientRect();
        const isInside = (
            e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom
        );

        if (isInside) {
            element.dispatchEvent(new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            }));
        }
    });

    element.addEventListener('click', (e) => {
        if (e.isTrusted) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    element.addEventListener('pointercancel', () => {
        isPressed = false;
        const target = getEffectTarget(element);
        if (target) target.classList.remove('ios-active');
    });
}


window.addEventListener('DOMContentLoaded', applyIOSButtonEffect);

// 아코디언 토글 및 텍스트 표시 제어
function toggleAccordion(id) {
  const el = document.getElementById(id);
  const isActive = el.classList.contains('active');
  const displayId = id === 'familyAccordion' ? 'selectedFamilyText' : 'selectedTimeText';
  const inputClass = id === 'familyAccordion' ? 'inputFamily' : 'inputTime';

  if (isActive) {

    updateSelectedDisplay(inputClass, displayId);
    el.classList.remove('active');
  } else {

    resetAccordions();
    el.classList.add('active');
  }
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
            openActionSheet();
        } else {
            alert("삭제할 항목을 선택할 수 없습니다.");
        }
    };
}

function openActionSheet() {
    const overlay = document.getElementById('actionSheetOverlay');
    if (overlay) {
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
            alert("삭제에 실패했습니다. 다시 시도해주세요.");
        }
    }
};