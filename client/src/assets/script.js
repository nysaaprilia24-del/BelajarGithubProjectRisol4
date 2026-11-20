const $ = (selector) => document.querySelector(selector);

const rupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(angka);

const simpan = (key, data) =>
    localStorage.setItem(key, JSON.stringify(data));

const baca = (key, fallback) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch {
        return fallback;
    }
};

// Data demo. Nantinya bisa diganti dengan data dari backend.
let products = baca("risolProducts", [
    { id: 1, name: "Risol Mayo", price: 3000, stock: 30,
      description: "Risol gurih dengan isian mayo yang creamy.", icon: "🥟" },
    { id: 2, name: "Risol Sayur", price: 2500, stock: 25,
      description: "Isian sayur yang lezat untuk teman bersantai.", icon: "🥬" },
    { id: 3, name: "Risol Ayam", price: 3500, stock: 20,
      description: "Risol dengan isian ayam yang gurih.", icon: "🍗" }
]);

let orders = baca("risolOrders", []);
let testimonials = baca("risolTestimonials", []);
let cart = [];

let nextProductId = Math.max(0, ...products.map(p => p.id)) + 1;
let nextOrderId = Math.max(1000, ...orders.map(o => o.id)) + 1;

// Navigasi halaman
document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".page").forEach(page =>
            page.classList.remove("active")
        );

        document.querySelectorAll(".nav-link").forEach(nav =>
            nav.classList.remove("active")
        );

        $("#" + button.dataset.page).classList.add("active");
        button.classList.add("active");

        if (button.dataset.page === "admin") {
            renderAdmin();
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    });
});

// Katalog produk
function renderProducts() {
    $("#productList").innerHTML = products.map(product => `
        <article class="product-card">
            <div class="product-icon">${product.icon || "🥟"}</div>
            <h3>${escapeHTML(product.name)}</h3>
            <p class="product-description">
                ${escapeHTML(product.description || "Risol lezat pilihan.")}
            </p>
            <span class="stock ${product.stock === 0 ? "empty" : ""}">
                ${product.stock > 0
                    ? "Stok: " + product.stock
                    : "Stok habis"}
            </span>
            <p class="product-price">${rupiah(product.price)}</p>
            <div class="quantity-control">
                <label for="qty-${product.id}">Jumlah</label>
                <input id="qty-${product.id}" type="number"
                    min="1" max="${product.stock}" value="1"
                    ${product.stock === 0 ? "disabled" : ""}>
            </div>
            <button class="primary-button full"
                data-add="${product.id}"
                ${product.stock === 0 ? "disabled" : ""}>
                Tambah ke Keranjang
            </button>
        </article>
    `).join("");

    document.querySelectorAll("[data-add]").forEach(button => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.add);
            const product = products.find(p => p.id === id);
            const quantity = Number($("#qty-" + id).value);
            const inCart = cart.find(item => item.id === id);
            const existingQuantity = inCart ? inCart.quantity : 0;

            if (!product || !Number.isInteger(quantity) || quantity < 1) {
                alert("Masukkan jumlah produk yang valid.");
                return;
            }

            if (existingQuantity + quantity > product.stock) {
                alert("Jumlah melebihi stok yang tersedia.");
                return;
            }

            if (inCart) {
                inCart.quantity += quantity;
            } else {
                cart.push({ id, quantity });
            }

            renderCart();
            alert(product.name + " berhasil ditambahkan ke keranjang.");
        });
    });
}

// Keranjang
function renderCart() {
    const totalItem = cart.reduce((sum, item) => sum + item.quantity, 0);
    $("#cartCount").textContent = totalItem;

    if (cart.length === 0) {
        $("#cartItems").innerHTML =
            '<p class="muted">Keranjang masih kosong.</p>';
        $("#cartTotal").textContent = rupiah(0);
        return;
    }

    $("#cartItems").innerHTML = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return "";

        return `
            <div class="cart-row">
                <div>
                    <strong>${escapeHTML(product.name)}</strong>
                    <p>${item.quantity} x ${rupiah(product.price)}</p>
                </div>
                <div>
                    <strong>${rupiah(item.quantity * product.price)}</strong>
                    <br>
                    <button type="button" data-remove="${item.id}">
                        Hapus
                    </button>
                </div>
            </div>
        `;
    }).join("");

    $("#cartTotal").textContent = rupiah(calculateTotal());

    document.querySelectorAll("[data-remove]").forEach(button => {
        button.addEventListener("click", () => {
            cart = cart.filter(item =>
                item.id !== Number(button.dataset.remove)
            );
            renderCart();
        });
    });
}

function calculateTotal() {
    return cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);
}

$("#showCart").addEventListener("click", () => {
    $("#shop").classList.add("active");
    document.querySelectorAll(".page").forEach(page => {
        if (page.id !== "shop") page.classList.remove("active");
    });

    $("#checkout").scrollIntoView({ behavior: "smooth" });
});

$("#clearCart").addEventListener("click", () => {
    cart = [];
    renderCart();
});

// Metode pengantaran atau ambil sendiri
function updateMethod() {
    const delivery = $("#method").value === "delivery";

    $("#addressGroup").hidden = !delivery;
    $("#pickupGroup").hidden = delivery;

    $("#address").required = delivery;
    $("#pickupTime").required = !delivery;
}

$("#method").addEventListener("change", updateMethod);

// Membuat pesanan
$("#orderForm").addEventListener("submit", event => {
    event.preventDefault();

    if (cart.length === 0) {
        alert("Keranjang masih kosong. Tambahkan produk dahulu.");
        return;
    }

    const method = $("#method").value;
    const pickupTime = $("#pickupTime").value;

    if (method === "pickup" && !pickupTime) {
        alert("Silakan tentukan waktu pengambilan.");
        return;
    }

    if (method === "pickup" && new Date(pickupTime) <= new Date()) {
        alert("Waktu pengambilan harus di masa mendatang.");
        return;
    }

    // Periksa ulang stok sebelum memproses pesanan.
    for (const item of cart) {
        const product = products.find(p => p.id === item.id);

        if (!product || item.quantity > product.stock) {
            alert("Stok berubah. Periksa kembali keranjang.");
            renderProducts();
            renderCart();
            return;
        }
    }

    const detail = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        return {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity
        };
    });

    const order = {
        id: nextOrderId++,
        name: $("#customerName").value.trim(),
        phone: $("#phone").value.trim(),
        method,
        address: method === "delivery" ? $("#address").value.trim() : "",
        pickupTime: method === "pickup" ? pickupTime : "",
        notes: $("#notes").value.trim(),
        items: detail,
        total: calculateTotal(),
        status: "Pesanan Masuk",
        createdAt: new Date().toISOString()
    };

    // Kurangi stok untuk simulasi.
    cart.forEach(item => {
        products.find(p => p.id === item.id).stock -= item.quantity;
    });

    orders.push(order);
    saveAll();

    cart = [];
    renderProducts();
    renderCart();
    renderAdmin();
    updateTestimonialOptions();

    $("#orderForm").reset();
    updateMethod();

    alert(
        "Pesanan #" + order.id + " berhasil dibuat!\n" +
        "Total: " + rupiah(order.total)
    );
});

// Login demo admin
$("#loginForm").addEventListener("submit", event => {
    event.preventDefault();

    const username = $("#adminUser").value.trim();
    const password = $("#adminPassword").value;

    // Hanya untuk demonstrasi tampilan frontend.
    if (username === "admin" && password === "risol123") {
        $("#adminLogin").hidden = true;
        $("#adminDashboard").hidden = false;
        $("#loginMessage").textContent = "";
        renderAdmin();
    } else {
        $("#loginMessage").textContent =
            "Username atau password demo tidak sesuai.";
    }
});

$("#logoutButton").addEventListener("click", () => {
    $("#adminDashboard").hidden = true;
    $("#adminLogin").hidden = false;
    $("#loginForm").reset();
});

// Pengelolaan produk dan stok
$("#productForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("#newProductName").value.trim();
    const price = Number($("#newProductPrice").value);
    const stock = Number($("#newProductStock").value);

    if (!name || price <= 0 || !Number.isInteger(stock) || stock < 0) {
        alert("Periksa nama, harga, dan stok produk.");
        return;
    }

    products.push({
        id: nextProductId++,
        name,
        price,
        stock,
        description: "Risol lezat pilihan.",
        icon: "🥟"
    });

    saveAll();
    $("#productForm").reset();
    renderProducts();
    renderAdmin();
});

function editStock(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const answer = prompt(
        "Masukkan stok baru untuk " + product.name,
        product.stock
    );

    if (answer === null) return;

    const stock = Number(answer);

    if (!Number.isInteger(stock) || stock < 0) {
        alert("Stok harus berupa angka bulat nol atau lebih.");
        return;
    }

    product.stock = stock;
    saveAll();
    renderProducts();
    renderAdmin();
}

function deleteProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    if (!confirm("Hapus produk " + product.name + "?")) return;

    products = products.filter(p => p.id !== id);
    cart = cart.filter(item => item.id !== id);

    saveAll();
    renderProducts();
    renderCart();
    renderAdmin();
}

// Pengelolaan status pesanan
function changeStatus(id, status) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const allowed = [
        "Pesanan Masuk",
        "Diproses",
        "Diantar",
        "Siap Diambil",
        "Selesai"
    ];

    if (!allowed.includes(status)) return;

    order.status = status;
    saveAll();
    renderAdmin();
    updateTestimonialOptions();
    renderTestimonials();
}

// Dashboard admin
function renderAdmin() {
    $("#orderStat").textContent = orders.length;
    $("#productStat").textContent = products.length;
    $("#testimonialStat").textContent = testimonials.length;

    $("#adminProductList").innerHTML = products.map(p => `
        <tr>
            <td>${escapeHTML(p.name)}</td>
            <td>${rupiah(p.price)}</td>
            <td>${p.stock}</td>
            <td>
                <button class="table-action" data-edit-stock="${p.id}">
                    Ubah Stok
                </button>
                <button class="table-action delete-action"
                    data-delete-product="${p.id}">
                    Hapus
                </button>
            </td>
        </tr>
    `).join("");

    document.querySelectorAll("[data-edit-stock]").forEach(button => {
        button.addEventListener("click", () =>
            editStock(Number(button.dataset.editStock))
        );
    });

    document.querySelectorAll("[data-delete-product]").forEach(button => {
        button.addEventListener("click", () =>
            deleteProduct(Number(button.dataset.deleteProduct))
        );
    });

    const statuses = [
        "Pesanan Masuk", "Diproses", "Diantar",
        "Siap Diambil", "Selesai"
    ];

    $("#adminOrderList").innerHTML = orders.length
        ? orders.map(order => `
            <tr>
                <td>
                    <strong>${escapeHTML(order.name)}</strong><br>
                    ${escapeHTML(order.phone)}<br>
                    <span class="muted">#${order.id}</span>
                </td>
                <td>${order.items.map(item =>
                    escapeHTML(item.name) + " x " + item.quantity
                ).join("<br>")}</td>
                <td>
                    ${order.method === "delivery" ? "Diantar" : "Ambil sendiri"}
                    <br>
                    ${escapeHTML(order.address || order.pickupTime || "-")}
                </td>
                <td>${rupiah(order.total)}</td>
                <td><span class="status-badge">
                    ${escapeHTML(order.status)}
                </span></td>
                <td>
                    <select data-order-status="${order.id}">
                        ${statuses.map(status => `
                            <option value="${status}"
                                ${order.status === status ? "selected" : ""}>
                                ${status}
                            </option>
                        `).join("")}
                    </select>
                </td>
            </tr>
        `).join("")
        : '<tr><td colspan="6">Belum ada pesanan.</td></tr>';

    document.querySelectorAll("[data-order-status]").forEach(select => {
        select.addEventListener("change", () => {
            changeStatus(Number(select.dataset.orderStatus), select.value);
        });
    });

    $("#adminTestimonialList").innerHTML = testimonials.length
        ? testimonials.map(t => `
            <div class="testimonial-card">
                <strong>${escapeHTML(t.name)}</strong>
                <p>${escapeHTML(t.text)}</p>
                <small>Pesanan #${t.orderId}</small>
            </div>
        `).join("")
        : '<p class="muted">Belum ada testimoni.</p>';
}

// Testimoni hanya untuk pesanan berstatus selesai
function updateTestimonialOptions() {
    const previous = $("#testimonialOrder").value;
    const eligible = orders.filter(order =>
        order.status === "Selesai" &&
        !testimonials.some(t => t.orderId === order.id)
    );

    $("#testimonialOrder").innerHTML =
        '<option value="">Pilih pesanan yang selesai</option>' +
        eligible.map(order => `
            <option value="${order.id}">
                Pesanan #${order.id} - ${escapeHTML(order.name)}
            </option>
        `).join("");

    if (eligible.some(order => String(order.id) === previous)) {
        $("#testimonialOrder").value = previous;
    }
}

$("#testimonialForm").addEventListener("submit", event => {
    event.preventDefault();

    const orderId = Number($("#testimonialOrder").value);
    const order = orders.find(o => o.id === orderId);
    const message = $("#testimonialText").value.trim();

    if (!order || order.status !== "Selesai") {
        alert("Testimoni hanya dapat diberikan setelah pesanan selesai.");
        return;
    }

    if (testimonials.some(t => t.orderId === orderId)) {
        alert("Pesanan ini sudah memiliki testimoni.");
        return;
    }

    if (!message) {
        alert("Testimoni tidak boleh kosong.");
        return;
    }

    testimonials.push({
        orderId,
        name: order.name,
        text: message
    });

    saveAll();
    $("#testimonialForm").reset();
    updateTestimonialOptions();
    renderTestimonials();
    renderAdmin();

    alert("Testimoni berhasil ditambahkan.");
});

function renderTestimonials() {
    $("#testimonialList").innerHTML = testimonials.length
        ? testimonials.map(t => `
            <article class="testimonial-card">
                <strong>${escapeHTML(t.name)}</strong>
                <p>“${escapeHTML(t.text)}”</p>
                <small>Pesanan #${t.orderId}</small>
            </article>
        `).join("")
        : '<p class="muted">Belum ada testimoni pelanggan.</p>';
}

function saveAll() {
    simpan("risolProducts", products);
    simpan("risolOrders", orders);
    simpan("risolTestimonials", testimonials);
}

// Mencegah teks dari input ditafsirkan sebagai HTML.
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Jalankan saat halaman pertama kali dibuka.
updateMethod();
renderProducts();
renderCart();
renderAdmin();
renderTestimonials();
updateTestimonialOptions();

function pesanProduk(namaProduk, harga, idStok) {
  const elemenStok = document.getElementById(idStok);
  const stok = Number(elemenStok.textContent);

  if (stok <= 0) {
    alert("Maaf, stok " + namaProduk + " sudah habis.");
    return;
  }

  const konfirmasi = confirm(
    "Pesan " + namaProduk +
    " seharga Rp" + harga.toLocaleString("id-ID") +
    " per pcs?"
  );

  if (!konfirmasi) return;

  elemenStok.textContent = stok - 1;

  if (stok - 1 === 0) {
    const tombol = elemenStok
      .closest(".produk-info")
      .querySelector(".tombol-pesan");

    tombol.disabled = true;
    tombol.textContent = "Stok Habis";

    const label = elemenStok
      .closest(".produk-card")
      .querySelector(".label-stok");

    label.textContent = "Stok habis";
    label.style.background = "#eeeeee";
    label.style.color = "#666666";
  }

  alert("Simulasi pemesanan " + namaProduk + " berhasil!");
}