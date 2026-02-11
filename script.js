// ====================
// DOM 요소
// ====================
const datesContainer = document.getElementById("dates");
const monthDisplay = document.getElementById("monthDisplay");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const todayBtn = document.getElementById("todayBtn");
const addBtn = document.getElementById("addBtn"); // 정확하게 가져옴
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

const supplementListArea = document.getElementById("supplementListArea");
const supplementListContent = document.getElementById("supplementListContent");

// ====================
// 상태
// ====================
let dt = new Date();
let supplements = [];
let selectedDateForList = "";
let currentEditId = null;

// dot 색상 리스트
const colorList = [
  "#2D3748","#1E3A8A","#4A148C","#B71C1C","#AD1457",
  "#004D40","#0D47A1","#283593","#4E342E","#37474F",
  "#BF360C","#880E4F","#00695C","#4527A0","#0B3D91"
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
  const monthStr = `${year}-${String(month).padStart(2,"0")}`;

  let totalCost = 0;
  supplements.forEach(sup => {
    if (sup.schedule.some(d => d.startsWith(monthStr))) {
      const months = Math.ceil(sup.schedule.length / 30);
      totalCost += sup.price / months;
    }
  });

  totalCost = Math.round(totalCost);
  monthlyCostContent.innerHTML = `<p><strong>￦${totalCost.toLocaleString()}</strong></p>`;
  monthlyCostModal.classList.remove("hidden");
});

closeMonthlyCostModal.addEventListener("click", () => {
  monthlyCostModal.classList.add("hidden");
});

// ====================
// + 버튼 클릭 (정상 작동)
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

// ⭕️ 모달 닫기 (X 버튼)
closeModalBtn.addEventListener("click", () => {
  modalOverlay.classList.add("hidden");
});

// ⭕️ 모달 내 삭제 버튼 (선택된 영양제 삭제)
deleteSupplementBtnModal.addEventListener("click", async () => {
  if (currentEditId) {
    // DB 삭제
    await deleteSupplementFromDB(currentEditId);
    // 배열에서도 삭제
    supplements = supplements.filter(s => s.id !== currentEditId);
    // 모달 닫기
    modalOverlay.classList.add("hidden");
    // 달력 + 리스트 갱신
    renderCalendar();
    updateSupplementList();
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

  // ==================================================
  // 이전 달 날짜
  // ==================================================
  const prevLastDate = new Date(year, month, 0).getDate();
  for (let x = firstDay; x > 0; x--) {
    const dayNum = prevLastDate - x + 1;
    const div = document.createElement("div");
    div.classList.add("date", "inactive");

    // 요일 계산
    const dow = new Date(year, month-1, dayNum).getDay();
    if (dow === 0) div.classList.add("sun");
    if (dow === 6) div.classList.add("sat");

    div.innerHTML = `<span class="number">${dayNum}</span>`;
    datesContainer.appendChild(div);
  }

  // ==================================================
  // 현재 달 날짜
  // ==================================================
  for (let i = 1; i <= lastDate; i++) {
    const div = document.createElement("div");
    div.classList.add("date");

    const dayOfWeek = new Date(year, month, i).getDay();
    if (dayOfWeek === 0) div.classList.add("sun");
    if (dayOfWeek === 6) div.classList.add("sat");

    div.innerHTML = `<span class="number">${i}</span>`;
    const fullDate = `${year}-${String(month+1).padStart(2,"0")}-${String(i).padStart(2,"00")}`;

    if (fullDate === selectedDateForList) {
      div.classList.add("selected");
    }

    div.addEventListener("click", () => {
      selectedDateForList = fullDate;
      renderCalendar();
      updateSupplementList();
    });

    supplements.forEach(sup => {
      if (sup.schedule.includes(fullDate)) {
        const dot = document.createElement("div");
        dot.classList.add("supplement-dot");
        dot.style.background = sup.circleColor;
        div.appendChild(dot);
      }
    });

    datesContainer.appendChild(div);
  }

  // ==================================================
  // 다음 달 날짜
  // ==================================================
  const totalCells = firstDay + lastDate;
  const nextSlots = 42 - totalCells;
  for (let j = 1; j <= nextSlots; j++) {
    const div = document.createElement("div");
    div.classList.add("date", "inactive");

    // 요일 계산
    const dowNext = new Date(year, month+1, j).getDay();
    if (dowNext === 0) div.classList.add("sun");
    if (dowNext === 6) div.classList.add("sat");

    div.innerHTML = `<span class="number">${j}</span>`;
    datesContainer.appendChild(div);
  }
}


// ====================
// 리스트 업데이트
// ====================
function updateSupplementList() {
  // 리스트 비우기
  supplementListContent.innerHTML = "";

  if (!selectedDateForList) return;

  const list = supplements.filter(sup => sup.schedule.includes(selectedDateForList));
  if (list.length === 0) return;

  list.forEach(sup => {
    const item = document.createElement("div");
    item.classList.add("supplement-list-item");

    const timesText = sup.times.join(" • ");

    item.innerHTML = `
      <div class="supplement-info">
        <span class="supplement-name">${sup.productName}</span>
        <span class="supplement-times">${timesText}</span>
      </div>
      <div class="supplement-detail">
        가족: ${sup.family.join(", ")} • 가격: ￦${sup.price.toLocaleString()}
      </div>
      <div class="supplement-actions">
        <button class="edit-btn">수정</button>
        <button class="delete-btn">삭제</button>
      </div>
    `;

    item.querySelector(".edit-btn").addEventListener("click", () => {
      currentEditId = sup.id;
      modalOverlay.classList.remove("hidden");
      inputDate.value = sup.schedule[0];
      inputProduct.value = sup.productName;
      inputTotal.value = sup.totalCapsules;
      inputPrice.value = sup.price;
      for (let cb of inputFamily) cb.checked = sup.family.includes(cb.value);
      for (let tb of inputTime) tb.checked = sup.times.includes(tb.value);
    });

    item.querySelector(".delete-btn").addEventListener("click", async () => {
      await deleteSupplementFromDB(sup.id);
      supplements = supplements.filter(s => s.id !== sup.id);
      updateSupplementList();
      renderCalendar();
    });

    supplementListContent.appendChild(item);
  });
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
  const sDate = new Date(start);
  for (let k=0; k<totalDays; k++){
    const d = new Date(sDate);
    d.setDate(sDate.getDate()+k);
    schedule.push(d.toISOString().slice(0,10));
  }

  if (currentEditId) {
    const found = supplements.find(s => s.id===currentEditId);
    Object.assign(found,{
      productName:product,
      totalCapsules:totalCaps,
      price,family,times,schedule
    });
  } else {
    supplements.push({
      id:Date.now(),
      productName:product,
      totalCapsules:totalCaps,
      price,family,times,schedule,
      circleColor: colorList[supplements.length % colorList.length]
    });
  }

  await saveAllSupplements();
  modalOverlay.classList.add("hidden");
  selectedDateForList = start; // 저장한 날짜로 선택 유지
  renderCalendar();
  updateSupplementList();
});

// ====================
// 나머지 DB 저장/로드 및 버튼
// ====================
async function saveAllSupplements() { for (let sup of supplements) await saveSupplementToDB(sup); }

async function loadSupplements() {
  supplements = await getAllSupplements();
  selectedDateForList = new Date().toISOString().slice(0,10);
  renderCalendar();
  updateSupplementList();
}

prevMonthBtn.addEventListener("click", () => {
  const day = selectedDateForList.split("-")[2];
  dt.setMonth(dt.getMonth()-1);
  selectedDateForList = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${day}`;
  renderCalendar();
  updateSupplementList();
});

nextMonthBtn.addEventListener("click", () => {
  const day = selectedDateForList.split("-")[2];
  dt.setMonth(dt.getMonth()+1);
  selectedDateForList = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${day}`;
  renderCalendar();
  updateSupplementList();
});

todayBtn.addEventListener("click", () => {
  selectedDateForList = new Date().toISOString().slice(0,10);
  dt = new Date();
  renderCalendar();
  updateSupplementList();
});

// 초기 실행
loadSupplements();
renderCalendar();
updateSupplementList();
