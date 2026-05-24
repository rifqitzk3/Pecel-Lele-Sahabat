const WHATSAPP_NUMBER = "6281234567890";
const STORE_ADDRESS =
  "CR55+688, Jl. Malabar Ujung, RT.01/RW.07, Tegallega, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16129";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_ADDRESS)}`;

const menuPrices = {
  "Pecel Lele": 15000,
  "Ayam Goreng": 18000,
  "Nasi Uduk": 12000,
  "Tahu & Tempe": 5000,
  "Ati Ampela": 8000,
  Telor: 5000,
  "Es Teh Manis": 5000,
  "Es Jeruk": 6000,
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

navToggle.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  navLinks.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("nav-open", !isOpen);
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navToggle.setAttribute("aria-expanded", "false");
    navLinks.classList.remove("is-open");
    document.body.classList.remove("nav-open");
  });
});

document.querySelectorAll("[data-map-link]").forEach((button) => {
  button.addEventListener("click", () => {
    window.open(MAPS_URL, "_blank", "noopener,noreferrer");
  });
});

// MODAL
const modalBackdrop = document.querySelector("#orderModalBackdrop");
const openModalBtn = document.querySelector("#openOrderModal");
const closeModalBtn = document.querySelector("#closeOrderModal");

function openModal() {
  modalBackdrop.classList.add("is-open");
  modalBackdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  closeModalBtn.focus();
}

function closeModal() {
  modalBackdrop.classList.remove("is-open");
  modalBackdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  openModalBtn.focus();
}

openModalBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);

// Tutup saat klik backdrop (di luar modal)
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});

// Tutup dengan Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalBackdrop.classList.contains("is-open")) closeModal();
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

const form = document.querySelector("#orderForm");
const nameInput = document.querySelector("#customerName");
const menuPicker = document.querySelector("#menuPicker");
const menuCheckboxes = Array.from(document.querySelectorAll('input[name="orderMenu"]'));
const quantityInputs = Array.from(document.querySelectorAll(".menu-qty"));
const noteInput = document.querySelector("#orderNote");
const orderSummary = document.querySelector("#orderSummary");

function setError(field, message) {
  const wrapper = field.closest(".form-field");
  const messageElement = wrapper.querySelector(".error-message");
  wrapper.classList.toggle("has-error", Boolean(message));
  messageElement.textContent = message;
}

function clearErrors() {
  [nameInput, menuPicker, noteInput].forEach((field) => {
    setError(field, "");
  });
}

function getSelectedItems() {
  return menuCheckboxes
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => {
      const option = checkbox.closest(".menu-option");
      const quantityInput = option.querySelector(".menu-qty");
      const quantity = Number.parseInt(quantityInput.value, 10);
      const price = menuPrices[checkbox.value];

      return {
        name: checkbox.value,
        quantity,
        price,
        subtotal: price * quantity,
      };
    });
}

function updateSummary() {
  const selectedItems = getSelectedItems();

  if (selectedItems.length === 0) {
    orderSummary.textContent = "Pilih menu untuk melihat perkiraan total.";
    return;
  }

  const hasInvalidQuantity = selectedItems.some(
    (item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99
  );

  if (hasInvalidQuantity) {
    orderSummary.textContent = "Jumlah porsi tiap menu harus 1 sampai 99.";
    return;
  }

  const total = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  orderSummary.textContent = `Perkiraan total: ${currencyFormatter.format(total)} untuk ${itemCount} porsi dari ${selectedItems.length} menu.`;
}

function validateForm() {
  clearErrors();

  let isValid = true;
  const name = nameInput.value.trim();
  const selectedItems = getSelectedItems();

  if (name.length < 2) {
    setError(nameInput, "Nama minimal 2 huruf.");
    isValid = false;
  }

  if (selectedItems.length === 0) {
    setError(menuPicker, "Pilih minimal satu menu.");
    isValid = false;
  }

  const hasInvalidQuantity = selectedItems.some(
    (item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99
  );

  if (hasInvalidQuantity) {
    setError(menuPicker, "Jumlah porsi tiap menu harus 1 sampai 99.");
    isValid = false;
  }

  return isValid;
}

menuCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    const quantityInput = checkbox.closest(".menu-option").querySelector(".menu-qty");
    quantityInput.disabled = !checkbox.checked;

    if (checkbox.checked && (!quantityInput.value || Number.parseInt(quantityInput.value, 10) < 1)) {
      quantityInput.value = "1";
    }

    updateSummary();
  });
});

quantityInputs.forEach((field) => {
  field.addEventListener("input", updateSummary);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const name = nameInput.value.trim();
  const selectedItems = getSelectedItems();
  const note = noteInput.value.trim() || "-";
  const total = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const orderLines = selectedItems.map(
    (item, index) =>
      `${index + 1}. ${item.name} - ${item.quantity} porsi x ${currencyFormatter.format(item.price)} = ${currencyFormatter.format(item.subtotal)}`
  );

  const messageParts = [
    `Halo Pecel Lele Sahabat!`,
    ``,
    `Nama: ${name}`,
    ``,
    `Pesanan:`,
    ...orderLines,
  ];

  if (note) {
    messageParts.push(``, `Catatan: ${note}`);
  }

  const message = messageParts.join("\n");

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  closeModal();
});

updateSummary();
