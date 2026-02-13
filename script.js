// 공휴일 리스트 (예: 2026년)
const koreaHolidays2026 = [
  "2026-01-01",
  "2026-02-16","2026-02-17","2026-02-18",
  "2026-03-01", "20260-03-02",
  "2026-05-05",
  "2026-05-24","2026-05-25",
  "2026-06-03","2026-06-06",
  "2026-07-17",
  "2026-08-15","2026-08-17",
  "2026-09-24","2026-09-25","2026-09-26","2026-09-27",
  "2026-10-03","2026-10-05","2026-10-09",
  "2026-12-25"
];

// ====================
// DOM 요소
// ====================
const datesContainer = document.getElementById("dates");
const monthDisplay = document.getElementById("monthDisplay");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const todayBtn = document.getElementById("todayBtn");
const addBtn = document.getElementById("addBtn");
const themeToggleBtn = document.getElementById("themeToggle");
const modalOverlay = document.getElementById("modalOverlay");
const closeModalBtn = document.getElementById("closeModal");
const inputDate = document.getElementById("inputDate");
const inputProduct = document.getElementById("inputProduct");
const inputTotal = document.getElementById("inputTotal");
const inputPrice = document.getElementById("inputPrice");
const inputFamily = document.getElementsByClassName("inputFamily");
const inputTime = document.getElementsByClassName("inputTime");
const saveInfoBtn = document.getElementById("saveInfo");
const deleteSupplementBtnModal = document.getElementById("deleteSupplement");
const monthlyCostBtn = document.getElementById("monthlyCostBtn");
const monthlyCostModal = document.getElementById("monthlyCostModal");
const monthlyCostContent = document.getElementById("monthlyCostContent");
const closeMonthlyCostModal = document.getElementById("closeMonthlyCostModal");


function openSupplementModal(sup) {
  currentEditId = sup.id;

  modalOverlay.classList.remove("hidden");

  inputDate.value = sup.schedule[0] || "";
  inputProduct.value = sup.productName;
  inputTotal.value = sup.totalCapsules;
  inputPrice.value = sup.price;

  for (let cb of inputFamily) cb.checked = sup.family.includes(cb.value);
  for (let tb of inputTime) tb.checked = sup.times.includes(tb.value);
}

// ====================
// 상태
// ====================
let dt = new Date();
let supplements = [];
let selectedDateForList = "";
let currentEditId = null;

const colorList = [
  "#E63946", // 강렬한 레드
  "#0077B6", // 선명한 블루
  "#F77F00", // 따뜻한 오렌지
  "#023047", // 딥 네이비
  "#2A9D8F", // 청록
  "#D62828", // 진한 레드
  "#007F5F", // 다크 그린
  "#9D4EDD", // 바이올렛
  "#DC2F02", // 브릭 레드
  "#1D3557", // 딥 블루
  "#E76F51", // 테라코타
  "#588157", // 올리브
  "#6A4C93", // 퍼플
  "#FF7F11", // 브라이트 오렌지
  "#0A9396"  // 틸
];


// ====================
// IndexedDB
// ====================
const DB_NAME = "supplementCalendarDB";
const DB_VERSION = 1;
const STORE_NAME = "supplements";
let db;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => { db = request.result; resolve(db); };
    request.onerror = () => reject(request.error);
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
    await openDatabase();
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(sup);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function deleteSupplementFromDB(id) {
  return new Promise(async (resolve, reject) => {
    await openDatabase();
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
  document.body.classList.toggle("dark-mode");
});

// ====================
// 월별 비용
// ====================
monthlyCostBtn.addEventListener("click", () => {
  const year = dt.getFullYear();
  const month = dt.getMonth() + 1;

  document.getElementById("monthlyCostTitle").innerText = `${year}.${String(month).padStart(2,"0")} 비용`;

  let totalCost = 0;
  let costHtml = "";
  const supNamesThisMonth = [];

  // 해당 월(입력월)에 입력된 영양제만 선택
  supplements.forEach(sup => {
    const supInputDate = sup.schedule?.[0] ?? ""; // 일정 첫 날짜 (입력 날짜)
    const [y, m] = supInputDate.split("-").map(x => parseInt(x));

    if (y === year && m === month) {
      supNamesThisMonth.push(sup.productName);

      // 1달 비용 = price ÷ 전체개월수 (기존 로직 그대로)
      const totalDays = sup.schedule.length;
      const monthsCount = Math.ceil(totalDays / 30);
      const monthlyPart = sup.price / monthsCount;
      totalCost += monthlyPart;
    }
  });

  // 이름 리스트 그리기
  if (supNamesThisMonth.length > 0) {
    costHtml += "<div class='monthly-sup-list'>";
    supNamesThisMonth.forEach(name => {
      costHtml += `<div class='sup-name'>${name}</div>`;
    });
    costHtml += "</div>";
  } else {
    costHtml += "<div class='sup-name none'></div>";
  }

  costHtml += `<p><strong>￦ ${Math.round(totalCost).toLocaleString()}</strong></p>`;

  monthlyCostContent.innerHTML = costHtml;
  monthlyCostModal.classList.remove("hidden");
});

closeMonthlyCostModal.addEventListener("click", () => {
  monthlyCostModal.classList.add("hidden");
});

// ====================
// + 버튼 클릭
// ====================
addBtn.addEventListener("click", () => {
  currentEditId = null;
  modalOverlay.classList.remove("hidden");
  inputDate.valueAsDate = new Date(selectedDateForList ? selectedDateForList : new Date());
  inputProduct.value = "";
  inputTotal.value = "";
  inputPrice.value = "";
  for (let cb of inputFamily) cb.checked = false;
  for (let tb of inputTime) tb.checked = false;
});

closeModalBtn.addEventListener("click", () => {
  modalOverlay.classList.add("hidden");
});

deleteSupplementBtnModal.addEventListener("click", async () => {
  if (currentEditId) {
    await deleteSupplementFromDB(currentEditId);
    supplements = supplements.filter(s => s.id !== currentEditId);
    modalOverlay.classList.add("hidden");
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

  const prevLastDate = new Date(year, month, 0).getDate();
  for (let x = firstDay; x > 0; x--) {
    const dayNum = prevLastDate - x + 1;
    const div = document.createElement("div");
    div.classList.add("date", "inactive");

    const dow = new Date(year, month-1, dayNum).getDay();
    if (dow === 0) div.classList.add("sun");
    if (dow === 6) div.classList.add("sat");

    const fullDatePrev = `${year}-${String(month).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`;
    if (koreaHolidays2026.includes(fullDatePrev)) {
      div.classList.add("holiday");
    }

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

    div.innerHTML = `<span class="number">${i}</span>`;
    
    if (fullDate === selectedDateForList) {
      div.classList.add("selected");
    }


    div.addEventListener("click", () => {
      selectedDateForList = fullDate;
      renderCalendar();
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
bar.style.backgroundColor = sup.circleColor;

// ============ 라벨 표시 조건 ============

// 현재 날짜 fullDate
const currDateObj = new Date(fullDate);

// 이번 주 시작/끝 계산 (일요일 기준)
const startOfWeek = new Date(currDateObj);
startOfWeek.setDate(currDateObj.getDate() - currDateObj.getDay());

const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 6);

// 이번 주에 해당하는 sup.schedule 날짜들만 필터
const weekScheds = sup.schedule
  .map(d => new Date(d))
  .filter(d => d >= startOfWeek && d <= endOfWeek);

// 이번 주 일정 중 가장 빠른 날짜 문자열
let firstInWeek = null;
if (weekScheds.length > 0) {
  weekScheds.sort((a,b) => a - b);
  firstInWeek = weekScheds[0].toISOString().slice(0,10);
}

// 만약 this fullDate가 해당 주에서 최초 등장 날짜라면
if (firstInWeek === fullDate) {
  const labelInBar = document.createElement("span");
  labelInBar.classList.add("supplement-bar-label");
  labelInBar.innerText = sup.productName;
  bar.appendChild(labelInBar);
}

// 클릭 이벤트 유지
bar.addEventListener("click", (e) => {
  e.stopPropagation();
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

    const fullDateNext = `${year}-${String(month+2).padStart(2,"0")}-${String(j).padStart(2,"00")}`;
    if (koreaHolidays2026.includes(fullDateNext)) {
      div.classList.add("holiday");
    }

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
  const totalCaps = parseInt(inputTotal.value);
  const price = parseInt(inputPrice.value);
  const family = [...inputFamily].filter(cb => cb.checked).map(cb => cb.value);
  const times = [...inputTime].filter(tb => tb.checked).map(tb => tb.value);

  if (!start || !product || !totalCaps || family.length === 0 || times.length === 0) {
    alert("모든 정보를 입력해주세요.");
    return;
  }

  const daily = family.length * times.length;
  const totalDays = Math.ceil(totalCaps / daily);

  let schedule = [];
  let d = new Date(start);
  for (let k = 0; k < totalDays; k++){
    schedule.push(d.toISOString().slice(0,10));
    d = new Date(d);
    d.setDate(d.getDate()+1);
  }

 if (currentEditId) {
  const found = supplements.find(s => s.id === currentEditId);
  Object.assign(found, {
    productName: product,
    totalCapsules: totalCaps,
    price,
    family,
    times,
    schedule
  });
} else {
  // **새 색상 할당 방식**
  let assignedColor;

  // 1) 이미 사용 중인 색 불러오기
  const usedColors = supplements.map(s => s.circleColor);

  // 2) 아직 사용 안 된 색 찾기
  assignedColor = colorList.find(c => !usedColors.includes(c));

  // 3) 만약 전부 사용 중이면 순환
  if (!assignedColor) {
    assignedColor = colorList[supplements.length % colorList.length];
  }

  supplements.push({
    id: Date.now(),
    productName: product,
    totalCapsules: totalCaps,
    price,
    family,
    times,
    schedule,
    circleColor: assignedColor
  });
}


  await saveAllSupplements();
  modalOverlay.classList.add("hidden");
  selectedDateForList = start;
  renderCalendar();
});

async function saveAllSupplements() { for (let sup of supplements) await saveSupplementToDB(sup); }

async function loadSupplements() {
  supplements = await getAllSupplements();
  selectedDateForList = new Date().toISOString().slice(0,10);
  renderCalendar();
}

prevMonthBtn.addEventListener("click", () => {
  const day = selectedDateForList.split("-")[2];
  dt.setMonth(dt.getMonth()-1);
  selectedDateForList = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${day}`;
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  const day = selectedDateForList.split("-")[2];
  dt.setMonth(dt.getMonth()+1);
  selectedDateForList = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${day}`;
  renderCalendar();
});

todayBtn.addEventListener("click", () => {
  selectedDateForList = new Date().toISOString().slice(0,10);
  dt = new Date();
  renderCalendar();
});

loadSupplements();
