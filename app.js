const STORAGE_KEY = "vet-rx-medicine-library";

const starterMedicines = [
  { name: "Oxytetracycline 20%", dosage: "1 ml/10 kg", route: "IM", frequency: "Once daily", duration: "3 days" },
  { name: "Flunixin meglumine", dosage: "1.1 mg/kg", route: "IV/IM", frequency: "Once daily", duration: "3 days" },
  { name: "Ivermectin 1%", dosage: "1 ml/50 kg", route: "SC", frequency: "Single dose", duration: "Repeat after 14 days" },
  { name: "Albendazole suspension", dosage: "7.5 mg/kg", route: "Oral", frequency: "Single dose", duration: "As directed" },
  { name: "Calcium borogluconate", dosage: "Slowly as directed", route: "IV/SC", frequency: "As needed", duration: "Single treatment" },
  { name: "Vitamin B complex", dosage: "5-10 ml", route: "IM", frequency: "Once daily", duration: "3-5 days" }
];

let medicineLibrary = loadLibrary();
let rowId = 0;

const $ = (selector, root = document) => root.querySelector(selector);
const rows = $("#medicineRows");
const emptyState = $("#emptyState");
const routeOptions = ["পানিতে", "খাবারে", "মুখে", "মাংসে", "শিরাতে", "চামড়ার নিচে"];
const poultrySpecies = ["Chicken", "Duck"];

function loadLibrary() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) && saved.length ? saved : starterMedicines;
  } catch (error) {
    console.warn("Could not load medicine library.", error);
    return starterMedicines;
  }
}

function saveLibrary() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(medicineLibrary));
  renderDatabase();
}

function createMedicineRow(values = {}) {
  rowId += 1;
  const row = document.createElement("tr");
  row.dataset.rowId = rowId;
  row.classList.toggle("empty-row", rows.children.length > 0 && !values.name);
  row.innerHTML = `
    <td class="serial">${rows.children.length + 1}.</td>
    <td class="medicine-cell">
      <input class="medicine-name" type="text" placeholder="Type first two letters..." value="${escapeAttribute(values.name || "")}" autocomplete="off" />
      <div class="sig-line"><strong>Sig.</strong><textarea class="medicine-dose" rows="1" placeholder="Dose / preparation">${escapeHtml(values.dosage || "")}</textarea></div>
      <div class="suggestions" hidden></div>
    </td>
    <td class="medicine-cell">
      <div class="route-picker" role="group" aria-label="Medicine route">
        ${routeOptions.map((option) => `<button class="route-option" type="button" data-route="${option}">${option}</button>`).join("")}
      </div>
      <div class="poultry-picker" role="group" aria-label="Poultry directions">
        <button class="poultry-option" type="button" data-route="water"><input class="poultry-quantity" type="text" inputmode="decimal" aria-label="Water quantity" placeholder="-" /><span>লিটার পানিতে</span></button>
        <button class="poultry-option" type="button" data-route="feed"><input class="poultry-quantity" type="text" inputmode="decimal" aria-label="Feed quantity" placeholder="-" /><span>কেজি খাবারে</span></button>
      </div>
      <div class="route-selection">
        <input class="medicine-route" type="text" placeholder="Selected route" value="${escapeAttribute(values.route || "")}" aria-label="Selected route" />
      </div>
      <div class="duration-picker">
        <span class="frequency-mode"><span>দিনে</span><input class="medicine-frequency" list="frequency-options" type="text" inputmode="numeric" placeholder="-" value="${escapeAttribute(values.frequency || "")}" aria-label="Times per day" /><span>বার</span></span>
        <span class="mode-divider">/</span>
        <span class="interval-mode"><input class="medicine-duration" list="interval-options" type="text" inputmode="numeric" placeholder="-" value="${escapeAttribute(values.duration || "")}" aria-label="Every number of days" /><span>দিন পর পর</span></span>
        <span class="mode-divider">/</span>
        <span class="course-mode"><input class="medicine-course-duration" list="course-options" type="text" inputmode="numeric" placeholder="-" value="${escapeAttribute(values.courseDuration || "")}" aria-label="Course duration in days" /><span>দিন</span></span>
      </div>
      <button class="instruction-toggle no-print" type="button">${values.instructions ? "Edit note" : "+ Add note"}</button>
      <textarea class="medicine-instructions${values.instructions ? "" : " note-hidden"}" rows="1" placeholder="Additional instruction">${escapeHtml(values.instructions || "")}</textarea>
    </td>
    <td class="no-print action-column"><button class="remove-row" type="button" aria-label="Remove medicine">×</button></td>
  `;
  rows.appendChild(row);
  bindRow(row);
  updateRowNumbers();
  emptyState.classList.remove("visible");
  return row;
}

function bindRow(row) {
  const nameInput = $(".medicine-name", row);
  const suggestionBox = $(".suggestions", row);
  const routeInput = $(".medicine-route", row);
  nameInput.addEventListener("input", () => {
    row.classList.remove("empty-row");
    const query = nameInput.value.trim().toLowerCase();
    if (query.length < 2) {
      suggestionBox.hidden = true;
      suggestionBox.innerHTML = "";
      return;
    }
    const matches = medicineLibrary.filter((medicine) => medicine.name.toLowerCase().includes(query)).slice(0, 6);
    suggestionBox.innerHTML = matches.length
      ? matches.map((medicine, index) => `
        <button class="suggestion" type="button" data-index="${index}">
          <strong>${escapeHtml(medicine.name)}</strong>
          <span>${escapeHtml(medicine.dosage)} · ${escapeHtml(medicine.route)} · ${escapeHtml(medicine.frequency)}</span>
        </button>
      `).join("")
      : `<div class="suggestion"><span>No saved medicine matches yet.</span></div>`;
    suggestionBox.hidden = false;
    suggestionBox.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => applyMedicine(row, matches[Number(button.dataset.index)]));
    });
  });
  nameInput.addEventListener("blur", () => setTimeout(() => { suggestionBox.hidden = true; }, 150));
  row.querySelectorAll(".route-option").forEach((button) => {
    button.addEventListener("click", () => {
      row.querySelectorAll(".route-option").forEach((option) => option.classList.toggle("is-muted", option !== button));
      row.querySelectorAll(".route-option").forEach((option) => option.classList.toggle("is-selected", option === button));
      routeInput.value = button.dataset.route;
    });
  });
  row.querySelectorAll(".poultry-option").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (event.target.classList.contains("poultry-quantity")) return;
      row.querySelectorAll(".poultry-option").forEach((option) => option.classList.toggle("is-muted", option !== button));
      row.querySelectorAll(".poultry-option").forEach((option) => option.classList.toggle("is-selected", option === button));
      routeInput.value = button.dataset.route;
    });
    const quantity = $(".poultry-quantity", button);
    quantity.addEventListener("input", () => {
      const hasQuantity = quantity.value.trim().length > 0;
      row.querySelectorAll(".poultry-option").forEach((option) => {
        const isCurrent = option === button;
        option.classList.toggle("is-selected", isCurrent && hasQuantity);
        option.classList.toggle("is-muted", !isCurrent && hasQuantity);
      });
      if (hasQuantity) routeInput.value = button.dataset.route;
    });
  });
  const frequencyInput = $(".medicine-frequency", row);
  const durationInput = $(".medicine-duration", row);
  const courseDurationInput = $(".medicine-course-duration", row);
  const instructionToggle = $(".instruction-toggle", row);
  const instructionInput = $(".medicine-instructions", row);
  const updateDurationModes = () => {
    const hasFrequency = frequencyInput.value.trim().length > 0;
    const hasDuration = durationInput.value.trim().length > 0;
    $(".frequency-mode", row).classList.toggle("is-muted", hasDuration && !hasFrequency);
    $(".interval-mode", row).classList.toggle("is-muted", hasFrequency && !hasDuration);
  };
  frequencyInput.addEventListener("input", updateDurationModes);
  durationInput.addEventListener("input", updateDurationModes);
  courseDurationInput.addEventListener("input", () => {
    if (courseDurationInput.value.trim()) row.classList.remove("empty-row");
  });
  courseDurationInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const nextRow = [...rows.children].find((candidate) => candidate.classList.contains("empty-row"))
      || createMedicineRow();
    nextRow.classList.remove("empty-row");
    $(".medicine-name", nextRow).focus();
  });
  instructionToggle.addEventListener("click", () => {
    instructionInput.classList.remove("note-hidden");
    instructionToggle.textContent = "Hide note";
    instructionInput.focus();
  });
  instructionInput.addEventListener("input", () => {
    instructionInput.classList.remove("note-hidden");
    instructionToggle.textContent = instructionInput.value.trim() ? "Edit note" : "+ Add note";
  });
  instructionInput.addEventListener("blur", () => {
    if (!instructionInput.value.trim()) {
      instructionInput.classList.add("note-hidden");
      instructionToggle.textContent = "+ Add note";
    } else {
      instructionToggle.textContent = "Edit note";
    }
  });
  updateDurationModes();
  $(".remove-row", row).addEventListener("click", () => {
    row.remove();
    updateRowNumbers();
    emptyState.classList.toggle("visible", rows.children.length === 0);
  });
  updateDirectionMode(row);
}

function updateDirectionMode(row) {
  const isPoultry = poultrySpecies.includes($("#species").value);
  row.classList.toggle("poultry-row", isPoultry);
  if (!isPoultry) {
    row.querySelectorAll(".poultry-option").forEach((option) => option.classList.remove("is-selected", "is-muted"));
  }
}

function applyMedicine(row, medicine) {
  $(".medicine-name", row).value = medicine.name;
  $(".medicine-dose", row).value = medicine.dosage;
  $(".medicine-route", row).value = medicine.route;
  const frequencyMatch = String(medicine.frequency).match(/\d+/);
  $(".medicine-frequency", row).value = frequencyMatch && Number(frequencyMatch[0]) <= 4 ? frequencyMatch[0] : "";
  $(".medicine-duration", row).value = "";
  const durationMatch = String(medicine.duration).match(/\d+/);
  $(".medicine-course-duration", row).value = durationMatch && ["3", "5", "7", "10", "14"].includes(durationMatch[0]) ? durationMatch[0] : "";
  const routeAliases = {
    "পানিতে": ["water"],
    "খাবারে": ["feed", "food"],
    "মুখে": ["oral", "po"],
    "মাংসে": ["im", "intramuscular"],
    "শিরাতে": ["iv", "intravenous"],
    "চামড়ার নিচে": ["sc", "subcutaneous"]
  };
  const medicineRoute = medicine.route.toLowerCase();
  const matchingRoute = [...row.querySelectorAll(".route-option")].find((button) => {
    const label = button.dataset.route;
    return medicineRoute.includes(label.toLowerCase()) || (routeAliases[label] || []).some((alias) => medicineRoute.includes(alias));
  });
  if (matchingRoute) matchingRoute.click();
  $(".suggestions", row).hidden = true;
}

function updateRowNumbers() {
  [...rows.children].forEach((row, index) => {
    $(".serial", row).textContent = `${index + 1}.`;
  });
}

function renderDatabase() {
  const list = $("#databaseList");
  list.innerHTML = medicineLibrary.map((medicine, index) => `
    <div class="database-item">
      <div>
        <strong>${escapeHtml(medicine.name)}</strong>
        <small>${escapeHtml(medicine.dosage)} · ${escapeHtml(medicine.route)} · ${escapeHtml(medicine.frequency)} · ${escapeHtml(medicine.duration)}</small>
      </div>
      <button class="delete-db" type="button" data-index="${index}" aria-label="Delete ${escapeAttribute(medicine.name)}">×</button>
    </div>
  `).join("");
  list.querySelectorAll(".delete-db").forEach((button) => {
    button.addEventListener("click", () => {
      medicineLibrary.splice(Number(button.dataset.index), 1);
      saveLibrary();
    });
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

$("#addMedicine").addEventListener("click", () => {
  const hiddenRow = [...rows.children].find((row) => row.classList.contains("empty-row"));
  const row = hiddenRow || createMedicineRow();
  row.classList.remove("empty-row");
  $(".medicine-name", row).focus();
});
$("#printPrescription").addEventListener("click", () => window.print());
$("#toggleDatabase").addEventListener("click", () => {
  const content = $("#databaseContent");
  content.hidden = !content.hidden;
  $("#toggleDatabase").textContent = content.hidden ? "Manage medicines" : "Hide database";
});
$("#saveMedicine").addEventListener("click", () => {
  const medicine = {
    name: $("#dbName").value.trim(),
    dosage: $("#dbDosage").value.trim(),
    route: $("#dbRoute").value.trim(),
    frequency: $("#dbFrequency").value.trim(),
    duration: $("#dbDuration").value.trim()
  };
  if (!medicine.name) {
    $("#dbName").focus();
    return;
  }
  const existingIndex = medicineLibrary.findIndex((item) => item.name.toLowerCase() === medicine.name.toLowerCase());
  if (existingIndex >= 0) medicineLibrary[existingIndex] = medicine;
  else medicineLibrary.push(medicine);
  saveLibrary();
  ["dbName", "dbDosage", "dbRoute", "dbFrequency", "dbDuration"].forEach((id) => { $(`#${id}`).value = ""; });
});
$("#clearPrescription").addEventListener("click", () => {
  if (!window.confirm("Clear this prescription form?")) return;
  document.querySelectorAll("#prescription input, #prescription textarea").forEach((field) => {
    if (field.type !== "date") field.value = "";
  });
  $("#date").valueAsDate = new Date();
  rows.innerHTML = "";
  for (let index = 0; index < 10; index += 1) createMedicineRow();
});

$("#date").valueAsDate = new Date();
for (let index = 0; index < 10; index += 1) createMedicineRow();
renderDatabase();

["frequency-options", "interval-options", "course-options"].forEach((id) => {
  const values = id === "frequency-options" ? ["1", "2", "3", "4"] : id === "interval-options" ? ["1", "2", "3"] : ["3", "5", "7", "10", "14"];
  const datalist = document.createElement("datalist");
  datalist.id = id;
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    datalist.appendChild(option);
  });
  document.body.appendChild(datalist);
});

$("#species").addEventListener("change", () => {
  document.querySelectorAll("#medicineRows tr").forEach(updateDirectionMode);
});
