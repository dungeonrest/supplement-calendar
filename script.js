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
const deleteSupplementBtn = document.getElementById("deleteSupplement");

const monthlyCostBtn = document.getElementById("monthlyCostBtn");
const monthlyCostModal = document.getElementById("monthlyCostModal");
const monthlyCostContent = document.getElementById("monthlyCostContent");
const closeMonthlyCostModal = document.getElementById("closeMonthlyCostModal");

let dt = new Date();
let supplements = [];
let currentEditId = null;

// 색상 리스트 (15개 대비 좋은 색)
const colorList = [
  "#2D3748","#1E3A8A","#4A148C","#B71C1C","#AD1457",
  "#004D40","#0D47A1","#283593","#4E342E","#37474F",
  "#BF360C","#880E4F","#00695C","#4527A0","#0B3D91"
];

// ===== IndexedDB =====
const DB_NAME = "supplementCalendarDB";
const DB_VERSION = 1;
const STORE_NAME = "supplements";
let db;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onerror = () => reject(request.error);
  });
}

function getAllSupplements() {
  return new Promise(async (resolve, reject) => {
    await openDatabase();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveSupplementToDB(sup) {
  return new Promise(async (resolve, reject) => {  
    await openDatabase();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(sup);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteSupplementFromDB(id) {
  return new Promise(async (resolve, reject) => {
    await openDatabase();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ===== 테마 토글 =====
themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// ===== 월별 비용 계산 =====
monthlyCostBtn.addEventListener("click", () => {
  const year = dt.getFullYear();
  const month = dt.getMonth() + 1; // 1 ~ 12
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  let totalCost = 0;

  supplements.forEach(sup => {
    // 이 보충제 일정 중 해당 달 날짜가 하나라도 있으면
    const hasThisMonth = sup.schedule.some(d => d.startsWith(monthStr));

    if (hasThisMonth) {
      // 한 달 비용 = 전체 가격 ÷ 전체 개월
      const months = Math.ceil(sup.schedule.length / 30); 
      // (30일을 한 달로 계산, 필요하면 조정 가능)

      const monthlyPrice = sup.price / months;
      totalCost += monthlyPrice;
    }
  });

  // 소수점 문제 방지용 반올림
  totalCost = Math.round(totalCost);

  // 모달 내용 생성
  monthlyCostContent.innerHTML = `
       <p><strong>￦${totalCost.toLocaleString()}</strong></p>
  `;

  // 모달 열기
  monthlyCostModal.classList.remove("hidden");
});

// 모달 닫기
closeMonthlyCostModal.addEventListener("click", () => {
  monthlyCostModal.classList.add("hidden");
});


// ===== 달력 렌더 =====
function renderCalendar() {
  dt.setDate(1);
  const year = dt.getFullYear();
  const month = dt.getMonth();

  monthDisplay.innerText = `${year}. ${String(month + 1).padStart(2,"0")}`;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const prevLast = new Date(year, month, 0).getDate();

  datesContainer.innerHTML = "";

  for (let x = firstDayIndex; x > 0; x--) {
    const div = document.createElement("div");
    div.classList.add("date","inactive");
    const dayIndex = (firstDayIndex - x) % 7;
    if (dayIndex === 0) div.classList.add("sun");
    if (dayIndex === 6) div.classList.add("sat");
    div.innerText = prevLast - x + 1;
    datesContainer.appendChild(div);
  }

  for (let i = 1; i <= lastDay; i++) {
    const div = document.createElement("div");
    div.classList.add("date","current");
    const dayOfWeek = new Date(year, month, i).getDay();
    if (dayOfWeek === 0) div.classList.add("sun");
    if (dayOfWeek === 6) div.classList.add("sat");

    div.innerText = i;
    const fullDate = `${year}-${String(month+1).padStart(2,"0")}-${String(i).padStart(2,"00")}`;

    supplements.forEach(sup => {
      if (sup.schedule.includes(fullDate)) {
        const dot = document.createElement("div");
        dot.classList.add("supplement-dot");

        // ● 텍스트 + 컬러 적용, 배경 제거
        dot.innerHTML = `<span class="dot-symbol" style="color:${sup.circleColor}">●</span> <span class="dot-text" style="color:${sup.circleColor}">${sup.productName}</span>`;

        // ✅ dot 클릭 시 모달 열기
        dot.addEventListener("click", (e) => {
          e.stopPropagation();
          currentEditId = sup.id;
          modalOverlay.classList.remove("hidden");
          inputDate.value = sup.schedule[0];
          inputProduct.value = sup.productName;
          inputTotal.value = sup.totalCapsules;
          inputPrice.value = sup.price;

          for (let cb of inputFamily) cb.checked = sup.family.includes(cb.value);
          for (let tb of inputTime) tb.checked = sup.times.includes(tb.value);
        });

        div.appendChild(dot);
      }
    });

    datesContainer.appendChild(div);
  }

  const totalCells = firstDayIndex + lastDay;
  const nextDays = 42 - totalCells;
  for (let j = 1; j <= nextDays; j++) {
    const div = document.createElement("div");
    div.classList.add("date","inactive");
    const dayIndex = (lastDay + firstDayIndex + j - 1) % 7;
    if (dayIndex === 0) div.classList.add("sun");
    if (dayIndex === 6) div.classList.add("sat");
    div.innerText = j;
    datesContainer.appendChild(div);
  }
}

// ===== 모달 작업 =====
addBtn.addEventListener("click", () => {
  currentEditId = null;
  modalOverlay.classList.remove("hidden");
  inputDate.valueAsDate = new Date();
  inputProduct.value = "";
  inputTotal.value = "";
  inputPrice.value = "";
  for (let cb of inputFamily) cb.checked = false;
  for (let tb of inputTime) tb.checked = false;
});

closeModalBtn.addEventListener("click", () => {
  modalOverlay.classList.add("hidden");
});

// ===== 저장 =====
saveInfoBtn.addEventListener("click", () => {
  const startDate = inputDate.value;
  const productName = inputProduct.value.trim();
  const totalCapsules = parseInt(inputTotal.value);
  const price = parseInt(inputPrice.value);
  const family = [...inputFamily].filter(cb => cb.checked).map(cb => cb.value);
  const times = [...inputTime].filter(tb => tb.checked).map(tb => tb.value);

  if (!startDate || !productName || !totalCapsules || family.length===0 || times.length===0) {
    alert("모든 정보를 입력해주세요.");
    return;
  }

  const dailyConsumption = family.length * times.length;
  const totalDays = Math.ceil(totalCapsules / dailyConsumption);

  let schedule = [];
  const start = new Date(startDate);
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    schedule.push(d.toISOString().slice(0,10));
  }

  if (currentEditId) {
    // 기존 컬러 유지
    const sup = supplements.find(s => s.id === currentEditId);
    sup.productName = productName;
    sup.totalCapsules = totalCapsules;
    sup.price = price;
    sup.family = family;
    sup.times = times;
    sup.schedule = schedule;
    // 컬러는 그대로
  } else {
    const id = Date.now();
    const newSup = {
      id, productName, totalCapsules, price,
      family, times, schedule,
      circleColor: colorList[supplements.length % colorList.length]
    };
    supplements.push(newSup);
  }

  saveAllSupplements();
  modalOverlay.classList.add("hidden");
  renderCalendar();
});

// ===== 삭제 =====
deleteSupplementBtn.addEventListener("click", () => {
  if (!currentEditId) return;
  deleteSupplementFromDB(currentEditId).then(() => {
    supplements = supplements.filter(s => s.id !== currentEditId);
    currentEditId = null;
    modalOverlay.classList.add("hidden");
    renderCalendar();
  });
});

// ===== DB 저장 =====
async function saveAllSupplements() {
  for (let sup of supplements) {
    await saveSupplementToDB(sup);
  }
}

// ===== DB 불러오기 =====
async function loadSupplements() {
  supplements = await getAllSupplements();
  renderCalendar();
}

// ===== 월 이동 =====
prevMonthBtn.addEventListener("click", () => { dt.setMonth(dt.getMonth()-1); renderCalendar(); });
nextMonthBtn.addEventListener("click", () => { dt.setMonth(dt.getMonth()+1); renderCalendar(); });
todayBtn.addEventListener("click", () => { dt = new Date(); renderCalendar(); });

// ===== 초기 로드 =====
loadSupplements();
renderCalendar();
