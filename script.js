
const APP_VERSION = "03.06g";
let deferredPrompt;
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
// 공휴일 리스트 (예: 2026년)
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
  // 저장된 dark-mode 값 불러오기
  const saved = localStorage.getItem("darkMode") === "true";
  if (saved) {
    document.body.classList.add("dark-mode");
  }
});

// ====================
// DOM 요소
// ====================
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
const deleteSupplementBtnModal = document.getElementById("deleteSupplement");
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
  modalOverlay.classList.add("active");

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
  
  deleteSupplementBtnModal.style.display = "block";

  // [수정 핵심] 실시간 객체인 inputFamily 대신 
  // 현재 모달에 새로 생성된 체크박스들을 직접 쿼리해서 대조합니다.
  const currentFamilyCheckboxes = document.querySelectorAll(".inputFamily");
  currentFamilyCheckboxes.forEach(cb => {
    // 해당 영양제(sup.family)에 이름이 있을 때만 체크되도록 명시적 설정
    cb.checked = sup.family && sup.family.includes(cb.value);
  });

  const currentTimeCheckboxes = document.querySelectorAll(".inputTime");
  currentTimeCheckboxes.forEach(tb => {
    tb.checked = sup.times && sup.times.includes(tb.value);
  });

  updateColorBar(sup.circleColor);
}

// ====================
// 상태
// ====================
let dt = new Date();
let supplements = [];
let familyMembers = JSON.parse(localStorage.getItem("familyMembers")) || ["도림", "뚜임", "진이", "쿤이"];
let selectedDateForList = "";
let currentEditId = null;

const colorList = [
  "#E84855",
  "#1976D2",
  "#ceaa1a",
  "#388E3C",
  "#8E44AD",
  "#F57C00",
  "#118AB2",
  "#D32F2F",
  "#97aa44",
  "#8E24AA",
  "#FF9F1C",
  "#16A085",
  "#3498DB",
  "#c96a3f",
  ];

// ====================
// 한국 시간 기준 오늘 날짜 문자열 (YYYY-MM-DD)
function getTodayKST() {
  const options = { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('ko-KR', options);
  const parts = formatter.formatToParts(new Date());
  
  // parts 배열에서 각각의 유형(type)에 맞는 값을 찾습니다.
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;  
  return `${year}-${month}-${day}`;
}

// ====================
// IndexedDB
// ====================
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
      // 연결이 예기치 않게 끊겼을 때 처리
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
    // await openDatabase();
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
    // await openDatabase();
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ====================
// 테마
// ====================
themeToggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", isDark);
});

// ====================
// 월별 비용
// ====================
monthlyCostBtn.addEventListener("click", () => {
  const year = dt.getFullYear();
  const month = dt.getMonth() + 1;

  document.getElementById("monthlyCostTitle").innerText = `${year}.${String(month).padStart(2,"0")}`;

  let totalCost = 0;
  const monthlyItems = [];

  // 1. 해당 월에 입력된 데이터 계산
  supplements.forEach(sup => {
    const supInputDate = sup.schedule?.[0] ?? "";
    const [y, m] = supInputDate.split("-").map(x => parseInt(x));

    if (y === year && m === month) {
      const totalDays = sup.schedule.length;
      const monthsCount = Math.ceil(totalDays / 30);
      // ... 내부 로직 중
const monthlyPart = sup.price ? Math.round(sup.price / monthsCount) : 0;
      
      totalCost += monthlyPart;
      monthlyItems.push({
        name: sup.productName,
        cost: monthlyPart,
        color: sup.circleColor
      });
    }
  });

  // 2. HTML 생성
  let costHtml = "";
  if (monthlyItems.length > 0) {
    monthlyItems.forEach(item => {
      // 해당 제품이 이번 달 전체 비용에서 차지하는 비율 계산
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
    costHtml = "<p style='text-align:center; font-size:15px; font-weight:600; opacity:0.6; margin-top:80px; padding-bottom:80px;'>이번 달 등록된 비용이 없습니다.</p>";
  }

  // 총액 표시 영역
  costHtml += `
    <div class="total-cost-wrapper">
      <span class="total-cost-label">총 합계</span>
      <span class="total-cost-amount">₩ ${Math.round(totalCost).toLocaleString()}</span>
    </div>
  `;

  monthlyCostContent.innerHTML = costHtml;
  monthlyCostModal.classList.add("active");
});

closeMonthlyCostModal.addEventListener("click", () => {
  monthlyCostModal.classList.remove("active");
});

// + 버튼 클릭 //
addBtn.addEventListener("click", () => {
  currentEditId = null;
  renderFamilyCheckboxes();
  modalOverlay.classList.add("active");
  history.pushState({ modal: "add" }, "");
  inputDate.value = selectedDateForList || getTodayKST();
  inputProduct.value = "";
  inputTotal.value = "";
  const doseEl = document.getElementById("inputDose");
  if (doseEl) doseEl.value = "";
  inputPrice.value = "";
  updateColorBar("#000000");
  deleteSupplementBtnModal.style.display = "none";
  document.querySelectorAll(".inputFamily").forEach(tb => {
    tb.checked = false;
  });
  document.querySelectorAll(".inputTime").forEach(tb => {
    tb.checked = false;
  });
});

const fabAddBtn = document.getElementById("fabAddBtn");

fabAddBtn.addEventListener("click", () => {
  addBtn.click();
});

closeModalBtn.addEventListener("click", () => {
  modalOverlay.classList.remove("active");
});

deleteSupplementBtnModal.addEventListener("click", async () => {
  if (currentEditId) {
    if (!confirm("복용 기록도 모두 사라집니다.\n삭제할까요?")) return;
    await deleteSupplementFromDB(currentEditId);
    supplements = supplements.filter(s => s.id !== currentEditId);
    
    modalOverlay.classList.remove("active");
    renderCalendar();
  } else {
    alert("삭제할 영양제가 선택되지 않았습니다.");
  }
});

// 달력 렌더 //
function renderCalendar() {
  dt.setDate(1);
  const year = dt.getFullYear();
  const month = dt.getMonth();

  monthDisplay.innerText = `${year}. ${String(month+1).padStart(2,"0")}월`;

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month+1,0).getDate();

  datesContainer.innerHTML = "";

  const todayStr = getTodayKST();

  const prevLastDate = new Date(year, month, 0).getDate();
  for (let x = firstDay; x > 0; x--) {
    const dayNum = prevLastDate - x + 1;
    const div = document.createElement("div");
    div.classList.add("date", "inactive");

    // 1. 이전 달의 정확한 날짜 객체를 먼저 만듭니다. (자바스크립트가 연도/월 전환을 알아서 계산함)
    const prevDateObj = new Date(year, month - 1, dayNum);
    const pY = prevDateObj.getFullYear();
    const pM = String(prevDateObj.getMonth() + 1).padStart(2, "0");
    const pD = String(prevDateObj.getDate()).padStart(2, "0");
    
    // 2. 요일(Day of Week) 계산
    const dow = prevDateObj.getDay();
    if (dow === 0) div.classList.add("sun");
    if (dow === 6) div.classList.add("sat");

    // 3. YYYY-MM-DD 형식의 문자열 생성
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
   if (fullDate === getTodayKST()) {
      div.classList.add("today-date");
    }

    div.innerHTML = `<span class="number">${i}</span>`;
    
    if (fullDate === selectedDateForList) {
      div.classList.add("selected");
    }


    div.addEventListener("click", () => {
      selectedDateForList = fullDate;
      inputDate.value = fullDate;
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
      // 해당 날짜 일정이 있을 때만 bar 추가
      if (sup.schedule.includes(fullDate)) {

        const bar = document.createElement("div");
        bar.classList.add("supplement-bar");

        // 1. 이 영양제가 끝나는 날(마지막 날짜) 가져오기
        const endDateStr = sup.schedule[sup.schedule.length - 1];
        const endDateObj = new Date(endDateStr);
        
        // 2. 해당 종료일이 포함된 주의 일요일과 토요일 계산
        const endSun = new Date(endDateObj);
        endSun.setDate(endDateObj.getDate() - endDateObj.getDay()); // 종료 주 일요일
        const endSat = new Date(endSun);
        endSat.setDate(endSun.getDate() + 6); // 종료 주 토요일

        // 3. 현재 렌더링 중인 날짜(fullDate)가 이 범위 안에 있는지 확인
        const currDateObj = new Date(fullDate);
        if (currDateObj >= endSun && currDateObj <= endSat) {
          bar.classList.add("last-week-bar"); // 사선 패턴 클래스 추가
        }

       // 기존 투명도를 약간 높여서 사선이 잘 보이게 배경을 진하게 설정
        const isDark = document.body.classList.contains("dark-mode");
        bar.style.backgroundColor = `rgba(${hexToRgb(sup.circleColor)}, ${isDark ? 0.45 : 0.3})`;

        // 채워진 부분
        const fill = document.createElement("div");
        fill.classList.add("bar-fill");
        fill.style.backgroundColor = sup.circleColor;

        // 복용 체크 상태 읽기
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

        // 채운 넓이 설정
        fill.style.width = `${fillPercent}%`;

        // 라벨 텍스트
        const labelInBar = document.createElement("span");
        labelInBar.classList.add("supplement-bar-label");
        labelInBar.innerText = sup.productName;

        bar.appendChild(fill);

        // 현재 날짜의 요일 (0:일, 1:월...)
        const currDateObjForLabel = new Date(fullDate);
        const dayNum = currDateObjForLabel.getDay();
        const dateNum = currDateObjForLabel.getDate();

        // 1. 해당 날짜가 일요일(0)이거나, 
        // 2. 일정의 시작일(`sup.schedule[0]`)인 경우에만 라벨 표시
        if (dayNum === 0 || sup.schedule[0] === fullDate || dateNum === 1) {
          labelInBar.classList.add("supplement-bar-label");

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

// 날짜셀에 추가
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

    // 다음 달 날짜 객체 생성 (자바스크립트가 연도/월 전환 자동 계산)
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
}

// ====================
// 저장
// ====================
saveInfoBtn.addEventListener("click", async () => {
  const start = inputDate.value;
  const product = inputProduct.value.trim();
  const totalCaps = parseInt(inputTotal.value) || 0;
  const dose = parseInt(inputDose.value) || 0;
  const unit = document.getElementById("inputUnit").value;
  const price = parseInt(inputPrice.value.toString().replace(/,/g, "")) || 0;
  const family = [...document.querySelectorAll(".inputFamily")].filter(cb => cb.checked).map(cb => cb.value);
  const times = [...document.querySelectorAll(".inputTime")].filter(tb => tb.checked).map(tb => tb.value);

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
      circleColor: document.getElementById('inputColor').value
    });
    await saveSupplementToDB(found);
  } else {
    // [복구] 사용자님의 원래 색상 순차 부여 로직
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
      circleColor: assignedColor,
      takenStatus: {}
    };
    supplements.push(newSup);
    await saveSupplementToDB(newSup);
  }

    modalOverlay.classList.remove("active");
    selectedDateForList = start;
    renderCalendar();
});

// 인자가 있으면 해당 데이터만 저장, 없으면 전체 저장 (복원 시 대비)
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

// [추가] 이름 변경 처리 함수
function changeFamilyMemberName(index, newName) {
  const oldName = familyMembers[index];
  familyMembers[index] = newName;
  localStorage.setItem("familyMembers", JSON.stringify(familyMembers));

  // 기존 데이터(supplements) 내의 이름들도 한꺼번에 교체해줘야 통계가 깨지지 않습니다.
  supplements.forEach(sup => {
    // 1. 가족 명단 수정
    if (sup.family.includes(oldName)) {
      sup.family = sup.family.map(f => f === oldName ? newName : f);
    }
    // 2. 복용 기록(takenStatus) 수정
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
    saveSupplementToDB(sup); // DB 저장
  });

  alert(`이름이 '${oldName}'에서 '${newName}'으로 변경되었습니다.`);
  location.reload(); // 전체 반영을 위해 리로드
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

// [교체] script.js 하단부
function checkInitialSetup() {
  const overlay = document.getElementById("initialOverlay");
  const configModal = document.getElementById("familyConfigModal");
  const mainContainer = document.querySelector(".container");

  // 조건 1: 등록된 영양제가 하나도 없음
  // 조건 2: 그리고 아직 가족 이름도 설정한 적이 없음 (localStorage가 비어있음)
  const isNoSupplements = supplements.length === 0;
  const isNoFamily = !localStorage.getItem("familyMembers");

  if (isNoSupplements && isNoFamily) {
    // 두 조건 모두 만족할 때만 (완전 처음 방문일 때만) 온보딩 표시
    if (overlay) overlay.classList.add("active");
    if (configModal) configModal.classList.add("active");
    if (mainContainer) mainContainer.style.display = "none";
  } else {
    // 영양제가 있거나, 혹은 영양제는 없어도 이름 설정은 이미 마친 경우
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
  body.innerHTML = ""; // 기존 내용 초기화

  // 해당 날짜 영양제들 필터링
  const matchedSupps = supplements.filter(s => s.schedule.includes(date));

  if (matchedSupps.length === 0) {
    body.innerHTML = "<p>해당 날짜의 영양제가 없습니다.</p>";
  } else {
    matchedSupps.forEach(sup => {
      // 1. 섹션 카드 생성
      const section = document.createElement("div");
      section.classList.add("taken-sup-section");

      // 2. 제목 컨테이너 (Dot + 이름 + 연장버튼)
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
      
      // [중요!] 연장 버튼 클릭 이벤트 (함수 내부로 이동)
      extendBtn.addEventListener("click", async () => {
        const baseDate = date;
        const leftUnTakenSlots = calculateLeftUnTakenSlotsBefore(sup, baseDate);
        const additionalDays = calculateAdditionalDays(sup, baseDate, leftUnTakenSlots);

        if (additionalDays === 0) {
          alert("📍 연장할 일정이 없습니다.");
          return;
        }

        let confirmMsg = `📍 ${baseDate}\n\n` +
          `미복용 체크 슬롯: ${leftUnTakenSlots}개\n` +
          `예상 추가 일정: ${additionalDays}일\n\n` +
          `이대로 연장할까요?`;

        if (confirm(confirmMsg)) {
          extendScheduleFromDate(sup, baseDate, additionalDays);
          await saveAllSupplements(sup); 
          renderCalendar();
          alert("일정이 연장되었습니다!");
          // 연장 후 모달을 닫아주거나 새로고침 할 수 있습니다.
          modal.classList.remove("active");
        }
      });
      
      titleContainer.appendChild(extendBtn);
      section.appendChild(titleContainer);

      // 3. 복용 체크 테이블 생성
      const table = document.createElement("table");
      table.classList.add("taken-table");

      // 헤더 행
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

      // 시간별 체크박스 행
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
            await saveSupplementToDB(sup);
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
      body.appendChild(section);
    }); // 루프 끝
  }

  modal.classList.add("active");
}

// ❌ 닫기 버튼 (X) — 누르면 저장 후 모달 닫기
document.getElementById("closeTakenCheckBtn")
  .addEventListener("click", async () => {
    // 개별 저장 로직이 이미 chk.addEventListener에 있으므로 전체 저장은 생략합니다.
    document.getElementById("takenCheckModal").classList.remove("active");
  });

  // ===== 통계 모달 요소
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
  history.pushState({ modal: "stats" }, "");
  // 기본 기간: 올해
  const year = new Date().getFullYear();
  document.getElementById("periodStart").value = `${year}-01`;
  document.getElementById("periodEnd").value = `${year}-12`;

  renderFamilyUI();

  statsContent.innerHTML = "<p style='text-align:center; font-size:15px; opacity:0.6; margin-top:150px;'>가족 이름을 선택하면<br>올해의 복용 통계가 표시됩니다.</p>";
});

// 2. 통계 모달 닫기
document.getElementById("closeStatsModal").onclick = function() {
  statsModal.classList.remove("active");

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
  
  const startStr = `${start}-01`; 
  const endArr = end.split("-");
  const lastDay = new Date(parseInt(endArr[0]), parseInt(endArr[1]), 0).getDate();
  const endStr = `${end}-${String(lastDay).padStart(2, '0')}`;

  const stats = {};

  supplements.forEach(sup => {
    if (!sup.family.includes(name) || !sup.takenStatus) return;

    // 해당 기간 내 총 복용해야 할 횟수(Target)와 실제 복용 횟수(Taken) 계산
    let targetForPeriod = 0;
    let takenForPeriod = 0;

    // 수정 방식: 1번 + 1번 + 1번 한 뒤 마지막에 복용량 계산 (정확함)
sup.schedule.forEach(dateStr => {
  if (dateStr >= startStr && dateStr <= endStr) {
    targetForPeriod += sup.dose;
    const dayStatus = sup.takenStatus?.[dateStr] || {};
    
    let takenSlots = 0; // 이 영양제의 해당 날짜 복용 횟수 카운트
    for (const key in dayStatus) {
      if (key.includes(`_${name}`) && dayStatus[key]) {
        takenSlots++; 
      }
    }
    // 해당 날짜에 먹은 횟수만큼의 용량을 계산해서 더함
    takenForPeriod += (takenSlots * (sup.dose / sup.times.length));
  }
});

    if (targetForPeriod > 0) {
      stats[sup.productName] = {
        taken: takenForPeriod,
        target: targetForPeriod,
        color: sup.circleColor
      };
    }
  });

  let html = "";
  if (Object.keys(stats).length === 0) {
    html = "<p style='text-align:center; font-size:15px; opacity:0.6; margin-top:150px;'>기록이 없습니다.</p>";
  } else {
    for (const key in stats) {
      const info = stats[key];
      const percent = Math.round((info.taken / info.target) * 100);
      
      // 원형 그래프와 텍스트 조합
      html += `
  <div class="stats-item">
    <div class="pie-chart" style="background: conic-gradient(${info.color} ${percent}%, ${trackColor} 0)">
      <div class="pie-inner" style="background-color: ${innerBg}">
        <span class="pie-percent">${percent}%</span>
      </div>
    </div>
    <div class="stats-info">
      <span class="stats-product-name">${key}</span>
      <span class="stats-count-text">${Math.round(info.taken)} / ${Math.round(info.target)}회</span>
    </div>
  </div>
`;
    }
  }
  statsContent.innerHTML = html;
}

function renderFamilyUI() {
  // 1. 통계 모달의 버튼들 교체
  const statsFamilyContainer = document.querySelector(".family-buttons");
  if (statsFamilyContainer) {
    statsFamilyContainer.innerHTML = ""; 
    familyMembers.forEach((name, index) => {
      const btn = document.createElement("button");
      btn.className = "family-btn";
      btn.dataset.name = name;
      btn.innerText = name;
      
      let timer;
      let isLongPress = false; // 롱 프레스 상태 확인

      // [수정된 롱 프레스 로직]
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
        }, 500);
      };
      
      const endPress = () => clearTimeout(timer);

      // [기존 클릭 로직] 롱 프레스가 아닐 때만 실행
      btn.addEventListener("click", () => {
        if (!isLongPress) {
          document.querySelectorAll(".family-btn").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");
          showStatsForFamily(name);
        }
      });

      // 이벤트 대응
      btn.addEventListener("touchstart", startPress, { passive: true });
      btn.addEventListener("touchend", endPress);
      btn.addEventListener("mousedown", startPress);
      btn.addEventListener("mouseup", endPress);
      btn.addEventListener("mouseleave", endPress);

      statsFamilyContainer.appendChild(btn);
    });

    // [복구] 사용자님의 가족 추가 로직 (4명 미만일 때)
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

          // [기존 DB 갱신 로직 그대로 유지]
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

  // 2. [복구] 영양제 입력 모달의 체크박스 교체 (기존 로직 유지)
  const inputFamilyContainer = document.querySelector(".checkbox-line");
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
    
    // [중요] 초기화 시 무조건 false 부여
    chk.checked = false; 

    label.appendChild(chk);
    label.appendChild(document.createTextNode(` ${name}`));
    familyGroup.appendChild(label);
  });
}

// 사용자님의 DB 구조를 기반으로 특정 가족 구성원 데이터를 완전히 삭제하는 함수
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

        // 1. 영양제 주인 명단(family)에서 이름 삭제
        if (sup.family && sup.family.includes(targetName)) {
          sup.family = sup.family.filter(n => n !== targetName);
          changed = true;
        }

        // 2. 복용 기록(takenStatus)에서 해당 이름이 포함된 키 삭제
        if (sup.takenStatus) {
          for (let date in sup.takenStatus) {
            const dayData = sup.takenStatus[date];
            for (let key in dayData) {
              // "시간_이름" 형식의 키에서 이름이 일치하면 삭제
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

// ================================
// 1) 기준 날짜 이전의 미복용 체크 슬롯 계산
function calculateLeftUnTakenSlotsBefore(sup, baseDate) {
  const takenStatus = sup.takenStatus || {};
  let totalSlotsBefore = 0;
  let takenSlotsBefore = 0;

  sup.schedule.forEach(dateStr => {
    // 기준 날짜 이전만 계산
    if (dateStr < baseDate) {
      // 해당 날짜의 총 체크 슬롯 수
      totalSlotsBefore += sup.family.length * sup.times.length;

      // 이미 체크된 것만 카운트
      const dayStatus = takenStatus[dateStr] || {};
      for (const key in dayStatus) {
        if (dayStatus[key]) takenSlotsBefore++;
      }
    }
  });

  // 미복용 = 전체 slots – 체크된 slots
  return totalSlotsBefore - takenSlotsBefore;
}

// ================================
// 2) 연장할 날짜 수 계산
function calculateAdditionalDays(sup, baseDate, leftSlots) {
  const perDaySlots = sup.family.length * sup.times.length;

  // 미복용 슬롯이 없다면 추가 안 함
  if (leftSlots <= 0) return 0;

  return Math.ceil(leftSlots / perDaySlots);
}

// ================================
// 3) 기준 날짜 이후의 일정 재생성
function extendScheduleFromDate(sup, baseDate, additionalDays) {
  // 기준날짜 이전까지는 그대로 유지
  const beforeDates = sup.schedule.filter(d => d < baseDate);

  // 기준 날짜 포함 이후의 기존 schedule 유지
  const afterDates = sup.schedule.filter(d => d >= baseDate);

  // 연장을 추가할 날짜 (기준날 이후 가장 마지막 날부터)
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

// ===== 하단 백업/복원 안내 =====
const footerYear = document.getElementById("footerYear");
const footerBackupLink = document.getElementById("footerBackupLink");
const backupMenuModal = document.getElementById("backupMenuModal");
const exportBtn = document.getElementById("exportBtn");
const triggerImportBtn = document.getElementById("triggerImportBtn");
const closeBackupMenu = document.getElementById("closeBackupMenu");
const importFileInput = document.getElementById("importFileInput");

// 현재 연도 표시
footerYear.innerText = new Date().getFullYear();

// 백업/복원 메뉴 열기
footerBackupLink.addEventListener("click", () => {
  backupMenuModal.classList.add("active");
  history.pushState({ modal: "backup" }, "");
});

// 취소/닫기
closeBackupMenu.addEventListener("click", () => {
  backupMenuModal.classList.remove("active");
});

// ====================
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
  backupMenuModal.classList.remove("active");
});

// ====================
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

    // [중요 2] 가족 명단(familyMembers) 추출 및 갱신
    // 백업 데이터(data)에 들어있는 가족 이름들을 싹 모아서 localStorage에 넣습니다.
    const newFamilySet = new Set();
    data.forEach(sup => {
      if (sup.family && Array.isArray(sup.family)) {
        sup.family.forEach(name => newFamilySet.add(name));
      }
    });

    if (newFamilySet.size > 0) {
      const newFamilyList = Array.from(newFamilySet);
      localStorage.setItem("familyMembers", JSON.stringify(newFamilyList));
      familyMembers = newFamilyList; // 메모리 변수도 즉시 교체
    }

    await deleteDatabaseAsync();

    // ===== 메모리에 백업 데이터 적용 =====
    supplements = data;

    // ===== DB 재생성 및 저장 =====
    await openDatabase();
    await saveAllSupplements();

    backupMenuModal.classList.remove("active");
    
    alert("백업 데이터를 성공적으로 불러왔습니다!");
    location.reload();

  } catch (err) {
    // 4. 에러 발생 시 상세 이유를 콘솔에 찍어 확인하기 위함
    console.error("복원 에러 상세:", err);
    alert("복원 중 오류가 발생했습니다. (사유: " + err.message + ")");
  }
  e.target.value = "";
});

// 하단 텍스트 요소
const footerVersionEl = document.getElementById("footerVersion");

// 앱 내부 버전 표시 (기존 v6처럼)
document.getElementById("footerAppVersion").innerText = APP_VERSION;

// 클릭 이벤트
footerVersionEl.addEventListener("click", async () => {
  try {
    const res = await fetch("./version.json?" + Date.now());
    if (!res.ok) throw new Error();
    const data = await res.json();

    const latestVersion = data.version;
    const currentVersion = APP_VERSION;

    if (latestVersion !== currentVersion) {
      // 최신 버전이 다르면 리로드 묻기
      if (confirm(`🔄 새로운 버전이 있습니다!\n업데이트하려면 확인을 누르세요.`)) {
        location.reload();  // 페이지 새로고침
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

// ―――――――――――――――――――
// 스와이프 제스처로 좌우 월 이동 처리 (개선)
// ―――――――――――――――――――
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

const minSwipeDistance = 70;
const swipeRatio = 1.5;

// ―――――――――――――――――――
// 스와이프 및 가장자리 터치 충돌 개선 로직
// ―――――――――――――――――――
const datesWrapper = document.getElementById("dates-wrapper");

datesWrapper.addEventListener("touchstart", (e) => {
  // 시작 좌표 저장 (터치 차단 안 함 -> 일요일/토요일 터치 가능)
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
  // 초기화
  touchEndX = touchStartX;
  touchEndY = touchStartY;
}, { passive: true });

datesWrapper.addEventListener("touchmove", (e) => {
  if (e.touches.length > 1) return;

  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;

  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;
  const absDiffX = Math.abs(diffX);
  const absDiffY = Math.abs(diffY);

  // 핵심: 가로 움직임이 감지되는 순간 시스템 제스처(앞으로가기)보다 먼저 점유
  if (absDiffX > 5 && absDiffX > absDiffY) {
    // 가로 스와이프 의도가 확실하면 브라우저의 기본 제스처를 즉시 차단
    if (e.cancelable) e.preventDefault();
  }
}, { passive: false });

datesWrapper.addEventListener("touchend", (e) => {
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;
  const absDiffX = Math.abs(diffX);
  const absDiffY = Math.abs(diffY);

  // 사용자님의 기존 기준(minSwipeDistance=70, swipeRatio=1.5) 적용
  if (absDiffX > minSwipeDistance && absDiffX > absDiffY * swipeRatio) {
    if (diffX < 0) {
      changeMonthWithDay(1);  // 다음 달
    } else if (diffX > 0) {
      changeMonthWithDay(-1); // 이전 달
    }
  }

  // 좌표 리셋
  touchStartX = 0;
  touchStartY = 0;
  touchEndX = 0;
  touchEndY = 0;
});

// ―――――――――――――――――――
// 월 변경 함수 (날짜 유지 & 보정)
// ―――――――――――――――――――
function changeMonthWithDay(direction) {
  // 현재 선택된 날짜가 없다면 오늘 날짜 기준으로 처리
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

  // 새로운 달 계산
  const newDate = new Date(year, month + direction, day);

  // 그 달의 마지막 날짜 구하기
  const lastDayOfNewMonth = new Date(
    newDate.getFullYear(),
    newDate.getMonth() + 1,
    0
  ).getDate();

  // 만약 날짜(day)가 그 달의 마지막보다 크면 보정
  const adjustedDay = day > lastDayOfNewMonth ? lastDayOfNewMonth : day;

  // 선택 날짜 업데이트
  selectedDateForList = `${newDate.getFullYear()}-${String(
    newDate.getMonth() + 1
  ).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;

  // dt 객체도 보정된 날짜로 맞춤
  dt = new Date(
    newDate.getFullYear(),
    newDate.getMonth(),
    adjustedDay
  );

  renderCalendar();
}

// 요소 가져오기
const realColorInput = document.getElementById('inputColor');
const colorDot = document.getElementById('colorDot');
const colorHexText = document.getElementById('colorHexText');

// 값이 변경될 때 UI 업데이트 (사용자가 색을 고른 직후 실행됨)
if (realColorInput) {
  realColorInput.addEventListener('input', (e) => {
    const newColor = e.target.value.toUpperCase();
    if (colorDot) colorDot.style.backgroundColor = newColor;
    if (colorHexText) colorHexText.innerText = newColor;
  });
}

// 가격 입력 시 실시간 쉼표 추가 로직
const inputPriceEl = document.getElementById("inputPrice");

if (inputPriceEl) {
  inputPriceEl.addEventListener("input", (e) => {
    // 1. 숫자 이외의 문자를 모두 제거 (쉼표 포함)
    let value = e.target.value.replace(/[^0-9]/g, "");
    
    // 2. 숫자가 있을 때만 천 단위 쉼표를 찍어서 다시 노출
    if (value) {
      e.target.value = Number(value).toLocaleString();
    } else {
      e.target.value = "";
    }
  });
}

// 모달 열 때 UI를 동기화해주는 함수
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
    
    localStorage.setItem("familyMembers", JSON.stringify(names));
    familyMembers = names; // 메모리 갱신

    // 모달 닫기
    document.getElementById("familyConfigModal").classList.remove("active");

    // UI 즉시 반영 후 새로고침
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
        
        // 1. 가족 명단 배열 업데이트
        if (sup.family && sup.family.includes(oldName)) {
          sup.family = sup.family.map(n => n === oldName ? newName : n);
          changed = true;
        }

        // 2. [중요] 사용자님의 takenStatus 키값 변경 (시간_이름 형식)
        if (sup.takenStatus) {
          for (let date in sup.takenStatus) {
            const dayData = sup.takenStatus[date];
            for (let key in dayData) {
              // key가 "아침_도림" 형태인지 확인
              if (key.endsWith(`_${oldName}`)) {
                const timePart = key.split(`_${oldName}`)[0];
                const newKey = `${timePart}_${newName}`;
                
                // 새로운 이름의 키로 값 복사 후 기존 키 삭제
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
    const modals = [modalOverlay, statsModal, backupMenuModal, 
                    document.getElementById("takenCheckModal"), 
                    document.getElementById("familyConfigModal")];
                    
    modals.forEach(m => {
      if(m) m.classList.remove("active");
    });

    // 3. 브라우저 히스토리 관리 (아이폰의 '뒤로가기'와 연동)
    if (window.history.state && window.history.state.modal) {
      window.history.back();
    }
  });
});