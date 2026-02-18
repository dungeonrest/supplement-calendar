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
  inputDose.value = sup.dose ?? "";
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
  "#FF6B6B", // Coral Red
  "#4ECDC4", // Turquoise
  "#FFD93D", // Vibrant Yellow
  "#1A535C", // Deep Teal
  "#FF9F1C", // Bright Orange
  "#2EC4B6", // Cyan Teal
  "#E84855", // Raspberry Red
  "#FFB5A7", // Soft Peach
  "#06D6A0", // Mint Green
  "#118AB2", // Ocean Blue
  "#F4D35E", // Mustard Yellow
  "#8E44AD", // Medium Purple
  "#E74C3C", // Tomato Red
  "#3498DB", // Sky Blue
  "#16A085"  // Sea Green
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
  inputDose.value = ""; 
  inputPrice.value = "";
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

  const todayStr = new Date().toISOString().slice(0,10); // ★ 오늘 날짜 문자열

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
    if (fullDatePrev === todayStr) div.classList.add("today-date"); // ★ 오늘 표시

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
      div.classList.add("today-date"); // ★ 오늘 표시
    }

    div.innerHTML = `<span class="number">${i}</span>`;
    
    if (fullDate === selectedDateForList) {
      div.classList.add("selected");
    }


    div.addEventListener("click", () => {
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
    if (fullDateNext === todayStr) div.classList.add("today-date"); // ★ 오늘 표시

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
  const dose = parseInt(inputDose.value);
  const price = parseInt(inputPrice.value);
  const family = [...inputFamily].filter(cb => cb.checked).map(cb => cb.value);
  const times = [...inputTime].filter(tb => tb.checked).map(tb => tb.value);

  if (!start || !product || !totalCaps || !dose || !price || family.length === 0) {
    alert("모든 정보를 입력해주세요.");
    return;
  }

  const totalPerDay = dose * family.length;
  const totalDays = Math.ceil(totalCaps / totalPerDay);

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
    dose,
    price,
    family,
    times,
    schedule
  });
} else {
  let assignedColor;
  const usedColors = supplements.map(s => s.circleColor);
  assignedColor = colorList.find(c => !usedColors.includes(c));
  if (!assignedColor) {
    assignedColor = colorList[supplements.length % colorList.length];
  }

  supplements.push({
    id: Date.now(),
    productName: product,
    totalCapsules: totalCaps,
    dose,
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

function openTakenCheckUI(date) {
  const modal = document.getElementById("takenCheckModal");
  const title = document.getElementById("takenCheckTitle");
  const body = document.getElementById("takenCheckBody");

  title.innerText = `${date}`;
  body.innerHTML = ""; // 기존 내용 초기화

  // 해당 날짜 영양제들
  const matchedSupps = supplements.filter(s => s.schedule.includes(date));

  if (matchedSupps.length === 0) {
    body.innerHTML = "<p>해당 날짜의 영양제가 없습니다.</p>";
  } else {
    matchedSupps.forEach(sup => {
      // 섹션 구분
      const section = document.createElement("div");
      section.classList.add("taken-sup-section");

      // 영양제 제목
      const titleEl = document.createElement("div");
      titleEl.classList.add("taken-sup-title");
      titleEl.innerText = sup.productName;
      section.appendChild(titleEl);

      // 테이블
      const table = document.createElement("table");
      table.classList.add("taken-table");

      // 헤더: 가족명 열
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

      // 날짜 기준 기존 저장 상태
      if (!sup.takenStatus) sup.takenStatus = {};
      if (!sup.takenStatus[date]) sup.takenStatus[date] = {};

      // 각 시간대 행 만들기
      times.forEach(time => {
        const row = document.createElement("tr");

        const tdTime = document.createElement("td");
        tdTime.innerText = time;
        row.appendChild(tdTime);

        sup.family.forEach(member => {
          const td = document.createElement("td");
          const chk = document.createElement("input");
          chk.type = "checkbox";

          // 초기 체크 상태 불러오기
          chk.checked = sup.takenStatus[date][`${time}_${member}`] || false;

          chk.addEventListener("change", async () => {
            sup.takenStatus[date][`${time}_${member}`] = chk.checked;
            await saveAllSupplements();
          });

          td.appendChild(chk);
          row.appendChild(td);
        });

        table.appendChild(row);
      });

      section.appendChild(table);
      body.appendChild(section);
    });
  }

  modal.classList.remove("hidden");
}

// ❌ 닫기 버튼 (X) — 누르면 저장 후 모달 닫기
document.getElementById("closeTakenCheckBtn")
  .addEventListener("click", async () => {
    // IndexedDB에 자동 저장
    await saveAllSupplements();
    document.getElementById("takenCheckModal").classList.add("hidden");
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
  // 기본 기간: 올해
  const year = new Date().getFullYear();
  periodStart.value = `${String(year)}-01`;
  periodEnd.value = `${String(year)}-12`;
});

// 닫기
closeStatsModal.addEventListener("click", () => {
  statsModal.classList.add("hidden");

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
  const start = periodStart.value;
  const end = periodEnd.value;

  if (!start || !end) {
    statsContent.innerHTML = "<p>기간을 먼저 선택하세요.</p>";
    return;
  }

  // 시작 월 첫 날
  const startArr = start.split("-");
  const startDate = new Date(parseInt(startArr[0]), parseInt(startArr[1]) - 1, 1);

  // 종료 월 마지막 날
  const endArr = end.split("-");
  const endDate = new Date(parseInt(endArr[0]), parseInt(endArr[1]) - 1, 1);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);

  const result = {};

  supplements.forEach(sup => {
    if (!sup.family.includes(name)) return;

    // sup.takenStatus: 날짜별 체크 상태 객체
    if (!sup.takenStatus) return;

    for (let dateStr in sup.takenStatus) {
      const d = new Date(dateStr);
      if (d < startDate || d > endDate) continue;

      const dayStatus = sup.takenStatus[dateStr];

      for (const key in dayStatus) {
        // key: "아침_도림", "저녁_뚜임" 식
        const [time, member] = key.split("_");
        if (member !== name) continue;

        if (dayStatus[key]) {
          result[sup.productName] = (result[sup.productName] || 0) + sup.dose;
        }
      }
    }
  });

  let html = `<h4></h4>`;

  if (Object.keys(result).length === 0) {
    html += "<p>해당 기간 복용 데이터 없음.</p>";
  } else {
    html += "<ul>";
    for (const key in result) {
      html += `<li>${key}: ${result[key]}회</li>`;
    }
    html += "</ul>";
  }

  statsContent.innerHTML = html;
}