
const APP_VERSION = "1.0.2";
const AUTO_BACKUP_KEY = "lastAutoBackupDate";

// 자동 백업 함수 ↓
async function autoBackupOnFirstTakenToday() {
  const todayKST = getTodayKST();

  // 저장된 todayTakenBackupDone 값 불러오기
  const doneKey = `todayTakenBackupDone_${todayKST}`;
  const done = localStorage.getItem(doneKey);

  // 이미 체크 복용 백업이 이루어진 날이면 종료
  if (done === "true") {
    console.log("자동 백업: 이미 오늘 복용 체크 백업 수행됨");
    return;
  }

  // 저장할 데이터가 없으면 종료
  if (!supplements || supplements.length === 0) {
    console.log("자동 백업: 백업할 데이터 없음");
    return;
  }

  // 백업 생성
  const blob = new Blob([JSON.stringify(supplements, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `supplements-auto-backup.json`;
  a.click();
  URL.revokeObjectURL(url);

  // 백업 완료 표시
  localStorage.setItem(doneKey, "true");
  alert("📦 자동 백업이 생성되었습니다!");
  console.log("자동 백업 수행:", todayKST);
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

function disableBackgroundScroll() {
  document.body.classList.add("modal-open");
}

function enableBackgroundScroll() {
  document.body.classList.remove("modal-open");
}

document.addEventListener("DOMContentLoaded", () => {
  // 저장된 dark-mode 값 불러오기
  const saved = localStorage.getItem("darkMode") === "true";
  if (saved) {
    document.body.classList.add("dark-mode");
    if (themeToggleBtn) themeToggleBtn.textContent = "🌕";
  } else {
    if (themeToggleBtn) themeToggleBtn.textContent = "🔆";
  }
});

// ====================
// DOM 요소
// ====================
const datesContainer = document.getElementById("dates");
const monthDisplay = document.getElementById("monthDisplay");
const todayBtn = document.getElementById("todayBtn");
const addBtn = document.getElementById("addBtn");
const themeToggleBtn = document.getElementById("themeToggle");
const modalOverlay = document.getElementById("modalOverlay");
const closeModalBtn = document.getElementById("closeModal");
const inputDate = document.getElementById("inputDate");
const inputProduct = document.getElementById("inputProduct");
const inputTotal = document.getElementById("inputTotal");
const inputDose = document.getElementById("inputDose");
const inputPrice = document.getElementById("inputPrice");
const inputColor = document.getElementById("inputColor");
const inputFamily = document.getElementsByClassName("inputFamily");
const inputTime = document.getElementsByClassName("inputTime");
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
  modalOverlay.classList.remove("hidden");
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
  deleteSupplementBtnModal.style.display = "block";
  for (let cb of inputFamily) {
    cb.checked = sup.family && sup.family.includes(cb.value);
  }
  for (let tb of inputTime) {
    tb.checked = sup.times && sup.times.includes(tb.value);
  }
  updateColorBar(sup.circleColor);
  
}

// ====================
// 상태
// ====================
let dt = new Date();
let supplements = [];
let selectedDateForList = "";
let currentEditId = null;

const colorList = [
  "#E84855", // Raspberry Red
  "#4ECDC4", // Turquoise
  "#FFD93D", // Vibrant Yellow
  "#1A535C", // Deep Teal
  "#FF9F1C", // Bright Orange
  "#118AB2", // Ocean Blue
  "#8E44AD", // Medium Purple
  "#16A085", // Sea Green
  "#fa7f66", // Soft Peach
  "#F4D35E", // Mustard Yellow
  "#06D6A0", // Mint Green
  "#97aa44", // Tomato Red
  "#3498DB", // Sky Blue
  "#c96a3f", // Coral Red
  "#2fb974", // Cyan Teal
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

  themeToggleBtn.textContent = isDark ? "🌕" : "🔆";
});

// ====================
// 월별 비용
// ====================
monthlyCostBtn.addEventListener("click", () => {
  const year = dt.getFullYear();
  const month = dt.getMonth() + 1;

  document.getElementById("monthlyCostTitle").innerText = `${year}.${String(month).padStart(2,"0")} 비용`;

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
    costHtml = "<p style='text-align:center; opacity:0.5; font-size:13px;'>이번 달 등록된 비용이 없습니다.</p>";
  }

  // 총액 표시 영역
  costHtml += `
    <div class="total-cost-wrapper">
      <span class="total-cost-label">총 합계</span>
      <span class="total-cost-amount">₩ ${Math.round(totalCost).toLocaleString()}</span>
    </div>
  `;

  monthlyCostContent.innerHTML = costHtml;
  monthlyCostModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
});

closeMonthlyCostModal.addEventListener("click", () => {
  monthlyCostModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
});

// ====================
// + 버튼 클릭
// ====================
addBtn.addEventListener("click", () => {
  currentEditId = null;
  modalOverlay.classList.remove("hidden");
  document.body.classList.add("modal-open");
  inputDate.value = selectedDateForList || getTodayKST();  inputProduct.value = "";
  inputProduct.value = "";
  inputTotal.value = "";
  const doseEl = document.getElementById("inputDose");
  if (doseEl) doseEl.value = "";
  inputPrice.value = "";
  updateColorBar("#000000");
  deleteSupplementBtnModal.style.display = "none"; // 새 추가 시 삭제 버튼 숨김
  for (let cb of inputFamily) cb.checked = false;
  for (let tb of inputTime) tb.checked = false;
});

const fabAddBtn = document.getElementById("fabAddBtn");

fabAddBtn.addEventListener("click", () => {
  // 기존 + 버튼 기능 그대로 실행
  addBtn.click();
});

closeModalBtn.addEventListener("click", () => {
  modalOverlay.classList.add("hidden");
  document.body.classList.remove("modal-open");
});

deleteSupplementBtnModal.addEventListener("click", async () => {
  if (currentEditId) {
    if (!confirm("이 영양제와 관련된 모든 복용 기록이 삭제됩니다. 삭제할까요?")) return;
    await deleteSupplementFromDB(currentEditId);
    supplements = supplements.filter(s => s.id !== currentEditId);
    
    modalOverlay.classList.add("hidden");
    document.body.classList.remove("modal-open");
    renderCalendar();
  } else {
    alert("삭제할 영양제가 선택되지 않았습니다.");
  }
});

// ====================
// 달력 렌더
// ====================
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
          const labelInBar = document.createElement("span");
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
  const family = [...inputFamily].filter(cb => cb.checked).map(cb => cb.value);
  const times = [...inputTime].filter(tb => tb.checked).map(tb => tb.value);

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

    modalOverlay.classList.add("hidden");
    document.body.classList.remove("modal-open");
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
  selectedDateForList = getTodayKST();
  renderCalendar();
}

todayBtn.addEventListener("click", () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

 selectedDateForList = `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
 dt = new Date(y, m, d, 0, 0, 0);

  renderCalendar();
});

// touchend와 click이 중복 실행되지 않도록 개선된 방식입니다.
todayBtn.addEventListener("touchend", (e) => {
  if (e.cancelable) e.preventDefault(); 
  todayBtn.click();
}, { passive: false });

loadSupplements();

function openTakenCheckUI(date) {
  const modal = document.getElementById("takenCheckModal");
  const title = document.getElementById("takenCheckTitle");
  const body = document.getElementById("takenCheckBody");

  title.innerText = `${date}`;
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
      extendBtn.innerText = "🔁";
      
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
          alert("📅 일정이 연장되었습니다!");
          // 연장 후 모달을 닫아주거나 새로고침 할 수 있습니다.
          modal.classList.add("hidden");
          document.body.classList.remove("modal-open");
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
            autoBackupOnFirstTakenToday();
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

    // 4. 하단 통합 닫기 버튼 (딱 한 번만 생성)
    const footer = document.createElement("div");
    footer.classList.add("modal-footer");

    const bottomCloseBtn = document.createElement("button");
    bottomCloseBtn.classList.add("modal-close-btn");
    bottomCloseBtn.innerText = "닫기";

    bottomCloseBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
      document.body.classList.remove("modal-open");
      renderCalendar(); // 체크 상태 반영을 위해 달력 리렌더링
    });

    footer.appendChild(bottomCloseBtn);
    body.appendChild(footer);
  }

  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

// ❌ 닫기 버튼 (X) — 누르면 저장 후 모달 닫기
document.getElementById("closeTakenCheckBtn")
  .addEventListener("click", async () => {
    // 개별 저장 로직이 이미 chk.addEventListener에 있으므로 전체 저장은 생략합니다.
    document.getElementById("takenCheckModal").classList.add("hidden");
    document.body.classList.remove("modal-open");
    renderCalendar();
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
  statsModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  // 기본 기간: 올해
  const year = new Date().getFullYear();
  document.getElementById("periodStart").value = `${year}-01`;
  document.getElementById("periodEnd").value = `${year}-12`;
  
  statsContent.innerHTML = "<p style='text-align:center; font-size:12px; opacity:0.6; margin-top:20px;'>가족 이름을 선택하면<br>올해의 복용 통계가 표시됩니다.</p>";
});

// 닫기
closeStatsModal.addEventListener("click", () => {
  statsModal.classList.add("hidden");
  document.body.classList.remove("modal-open");

  // 기간 초기화
  periodStart.value = "";
  periodEnd.value = "";

  // 버튼 활성 초기화
  familyBtns.forEach(b => b.classList.remove("selected"));

  // 통계 내용 초기화
  statsContent.innerHTML = "";
});

// 가족 버튼 누르면 통계 갱신
familyBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.name;

    // 모든 버튼에서 selected 제거
    familyBtns.forEach(b => b.classList.remove("selected"));

    // 현재 버튼에 selected 추가
    btn.classList.add("selected");

    // 통계 표시
    showStatsForFamily(name);
  });
});

// 통계 계산
function showStatsForFamily(name) {
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

    sup.schedule.forEach(dateStr => {
        if (dateStr >= startStr && dateStr <= endStr) {
        targetForPeriod += sup.dose;

        const dayStatus = sup.takenStatus?.[dateStr] || {};
        for (const key in dayStatus) {
          if (key.includes(`_${name}`) && dayStatus[key]) {
            takenForPeriod += (sup.dose / sup.times.length);
          }
        }
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
    html = "<p>기록이 없습니다.</p>";
  } else {
    for (const key in stats) {
      const info = stats[key];
      const percent = Math.round((info.taken / info.target) * 100);
      
      // 원형 그래프와 텍스트 조합
      html += `
        <div class="stats-item">
          <div class="pie-chart" style="background: conic-gradient(${info.color} ${percent}%, #e0e0e0 0)"></div>
          <div class="stats-info">
            <span class="stats-product-name">${key}</span>
            <span class="stats-count-text">${percent}% (${Math.round(info.taken)} / ${Math.round(info.target)}회)</span>
          </div>
        </div>
      `;
    }
  }
  statsContent.innerHTML = html;
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
  backupMenuModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
});

// 취소/닫기
closeBackupMenu.addEventListener("click", () => {
  backupMenuModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
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
  a.download = `supplements-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
  backupMenuModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
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

if (db) {
      db.close();
      db = null; 
    }
    
const deleteDatabaseAsync = () => {
  return new Promise((resolve, reject) => {
    // 1. 현재 열려있는 DB가 있다면 확실히 닫습니다.
    if (db) {
      db.close();
      db = null;
    }
    
    const deleteReq = indexedDB.deleteDatabase(DB_NAME);
    
    // iOS 대응: 삭제 작업이 성공적으로 완료되었을 때
    deleteReq.onsuccess = () => {
      console.log("DB 삭제 성공");
      resolve();
    };
    
    deleteReq.onerror = (e) => {
      console.error("DB 삭제 중 에러:", e);
      reject(new Error("DB 삭제 실패"));
    };
    
    // iOS 특이점: 다른 연결이 남아있을 때 호출됨
    deleteReq.onblocked = () => {
      alert("기존 데이터 연결이 남아있습니다. 앱을 완전히 껐다 켜주세요.");
      resolve(); // 일단 진행은 시도함
    };
  });
};

    await deleteDatabaseAsync();

    // ===== 메모리에 백업 데이터 적용 =====
    supplements = data;

    // ===== DB 재생성 및 저장 =====
    await openDatabase();
    await saveAllSupplements();

    backupMenuModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
    selectedDateForList = new Date().toISOString().slice(0,10);
    renderCalendar();

    alert("백업 데이터를 성공적으로 불러왔습니다!");
    location.reload();
  } catch (err) {
    // 4. 에러 발생 시 상세 이유를 콘솔에 찍어 확인하기 위함
    console.error("복원 에러 상세:", err);
    alert("복원 중 오류가 발생했습니다. (사유: " + err.message + ")");
  }
  e.target.value = "";
});

// ===========================================
// 📌 하단 버전 클릭 → 최신 버전 체크 & 리로드
// ===========================================

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

const datesWrapper = document.getElementById("dates-wrapper");

datesWrapper.addEventListener("touchstart", (e) => {
  const x = e.changedTouches[0].screenX;
  const screenWidth = window.innerWidth;

  // 화면 가장자리 20px 이내에서 시작하는 터치는 시스템 제스처(뒤로가기 등)를 위해 무시
  if (x < 20 || x > screenWidth - 20) {
    touchStartX = 0; // 스와이프 실행 안 되게 0으로 설정
    return;
  }

  touchStartX = x;
  touchStartY = e.changedTouches[0].screenY;
  touchEndX = touchStartX;
  touchEndY = touchStartY;
});

datesWrapper.addEventListener("touchmove",  (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    // 수평 스와이프라고 판단될 때
    if (absDiffX > minSwipeDistance && absDiffX > absDiffY * swipeRatio) {
      // 브라우저 기본 vertical scroll 막기
      e.preventDefault();
    }
  },
  { passive: false } // 반드시 필요
);

datesWrapper.addEventListener("touchend", () => {
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;

  const absDiffX = Math.abs(diffX);
  const absDiffY = Math.abs(diffY);

  // 최종 swipe 판단은 여전히 기존 기준으로
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
