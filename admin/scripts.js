// Toggle sidebar on mobile
(function () {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("mobile-toggle");
  const backdrop = document.getElementById("modal-backdrop");

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("sidebar--open");
    });
  }

  // Close sidebar when clicking outside on small screens (optional improvement)
  window.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 720 &&
      sidebar &&
      sidebar.classList.contains("sidebar--open")
    ) {
      const clickInsideSidebar = sidebar.contains(e.target);
      const clickOnToggle = toggleBtn && toggleBtn.contains(e.target);
      if (!clickInsideSidebar && !clickOnToggle) {
        sidebar.classList.remove("sidebar--open");
      }
    }
  });

  // Modal helpers
  const openButtons = document.querySelectorAll("[data-open-modal]");
  const closeButtons = document.querySelectorAll("[data-close-modal]");

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    // Hiển thị modal bằng style, tránh phụ thuộc vào thuộc tính hidden
    modal.style.display = "flex";
    modal.setAttribute("data-open", "true");
    if (backdrop) {
      backdrop.style.display = "block";
    }
  }

  function closeModals() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.style.display = "none";
      modal.removeAttribute("data-open");
    });
    if (backdrop) {
      backdrop.style.display = "none";
    }
  }

  openButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-open-modal");
      if (!id) return;
      const modal = document.getElementById(id);
      const isOpen = modal && modal.getAttribute("data-open") === "true";

      if (isOpen) {
        // Nếu đang mở rồi thì bấm lại sẽ tắt
        closeModals();
      } else {
        closeModals();
        openModal(id);
      }
    });
  });

  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      closeModals();
    });
  });

  if (backdrop) {
    backdrop.addEventListener("click", () => {
      closeModals();
    });
  }

  // Đóng modal khi bấm phím Escape
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModals();
    }
  });

  // Thêm/Sửa sản phẩm - lưu vào localStorage (tích hợp với web chính)
  const productForm = document.getElementById("quick-product-form");

  if (productForm) {
    productForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const idInput = document.getElementById("product-id");
      const nameInput = document.getElementById("quick-product-name");
      const priceInput = document.getElementById("quick-product-price");
      const stockInput = document.getElementById("quick-product-stock");
      const categorySelect = document.getElementById("quick-product-category");
      const imageInput = document.getElementById("quick-product-image");
      const descInput = document.getElementById("quick-product-desc");

      if (!nameInput || !priceInput) return;
      const name = nameInput.value.trim();
      if (!name) {
        alert("Vui lòng nhập tên sản phẩm.");
        return;
      }

      const editId = idInput ? idInput.value : "";
      const price = parseInt(priceInput.value, 10) || 0;
      const stock = stockInput ? (stockInput.value === "" ? undefined : parseInt(stockInput.value, 10)) : undefined;
      const category = (categorySelect && categorySelect.value) ? categorySelect.value : "cham-soc";
      const image = imageInput ? imageInput.value.trim() : "";
      const description = descInput ? descInput.value.trim() : "";

      if (!window.AdminData) {
        alert("Lỗi: Hệ thống chưa sẵn sàng. Vui lòng tải lại trang.");
        return;
      }

      try {
        const list = window.AdminData.getProducts().slice();
        const img = image || "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400";

        if (editId) {
          const idx = list.findIndex((p) => p.id === editId);
          if (idx >= 0) {
            list[idx] = Object.assign({}, list[idx], {
              name, price, stock, category, image: img,
              description: description || list[idx].description
            });
            window.AdminData.setProducts(list);
            alert("Đã cập nhật sản phẩm!");
          }
        } else {
          list.push({
            id: "p" + Date.now(),
            name, price, stock, category, image: img,
            description: description || "Thêm từ admin",
            slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
            rating: 4.5,
            bestSeller: false
          });
          window.AdminData.setProducts(list);
          alert("Đã thêm sản phẩm thành công!");
        }

        if (idInput) idInput.value = "";
        productForm.reset();
        if (stockInput) stockInput.value = "0";
        const titleEl = document.getElementById("product-modal-title");
        const submitBtn = document.getElementById("product-submit-btn");
        if (titleEl) titleEl.textContent = "Thêm sản phẩm mới";
        if (submitBtn) submitBtn.textContent = "Thêm sản phẩm";

        if (window.adminRenderProducts) {
          window.adminRenderProducts();
        } else {
          location.reload();
        }
        closeModals();
      } catch (err) {
        console.error(err);
        alert("Lỗi khi lưu sản phẩm: " + (err.message || "Vui lòng thử lại."));
      }
    });
  }

  // Reset product modal when opening for Add (tránh dữ liệu cũ khi bấm Thêm)
  document.querySelectorAll("[data-open-modal='product-modal']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idInput = document.getElementById("product-id");
      if (idInput) idInput.value = "";
      const titleEl = document.getElementById("product-modal-title");
      const submitBtn = document.getElementById("product-submit-btn");
      if (titleEl) titleEl.textContent = "Thêm sản phẩm mới";
      if (submitBtn) submitBtn.textContent = "Thêm sản phẩm";
    });
  });

  // Tạo lịch hẹn - lưu vào localStorage (tích hợp với booking của web)
  document.querySelectorAll('#appointment-modal form, .modal[id="appointment-modal"] form').forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var customer = document.getElementById("quick-customer-name");
      var pet = document.getElementById("quick-pet-type");
      var timeInput = document.getElementById("quick-time");
      var dateInput = document.getElementById("quick-date");
      var serviceSelect = document.getElementById("quick-service");
      if (!customer || !pet || !timeInput) return;
      var ownerName = customer.value.trim();
      var petName = pet.value.trim();
      var time = timeInput.value;
      var date = dateInput ? dateInput.value : new Date().toISOString().split("T")[0];
      var serviceName = serviceSelect ? serviceSelect.value : "Dịch vụ spa";
      if (!ownerName || !petName || !time) return;
      if (window.AdminData) {
        var list = window.AdminData.getBookings();
        list.push({
          id: "b" + Date.now(),
          ownerName: ownerName,
          petName: petName,
          date: date,
          time: time,
          serviceName: serviceName,
          status: "pending"
        });
        window.AdminData.setBookings(list);
      }
      form.reset();
      closeModals();
      if (window.adminRenderAppointments) window.adminRenderAppointments();
      if (typeof alert === "function") alert("Đã tạo lịch hẹn. Xem tại trang Lịch hẹn hoặc booking.html.");
    });
  });

  // Search filter for products page - xử lý trong products inline script
})();

