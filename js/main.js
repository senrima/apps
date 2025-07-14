// ===============================================================
//                       PENGATURAN PENTING
// ===============================================================
// ‼️ GANTI DENGAN ALAMAT CLOUDFLARE WORKER ANDA
const API_ENDPOINT = "https://wmalam.senrima-ms.workers.dev";

// ===============================================================
//                       FUNGSI UTAMA API
// ===============================================================

async function callApi(payload, btnId) {
    const btn = document.getElementById(btnId);
    const originalText = btn ? btn.textContent : '';
    const statusMessage = document.getElementById('status-message');

    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Memproses...';
    }
    if (statusMessage) statusMessage.textContent = '';

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        
        if (statusMessage) {
            statusMessage.textContent = result.message;
            statusMessage.style.color = result.status.includes('success') || result.status.includes('change_password_required') ? 'green' : 'red';
        }
        return result;

    } catch (error) {
        if (statusMessage) {
            statusMessage.textContent = `Error: Gagal terhubung ke server. ${error.message}`;
            statusMessage.style.color = 'red';
        }
        return { status: 'network_error', message: error.message };
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
}

// ===============================================================
//                   LOGIKA UNTUK SETIAP HALAMAN
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- Halaman Login (index.html) ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            // Simpan email untuk digunakan di halaman OTP
            sessionStorage.setItem('userEmailForOTP', email);

            const result = await callApi({ action: 'requestOTP', email, password }, 'login-btn');
            if (result.status === 'success') {
                window.location.href = 'otp.html';
            }
        });
    }

    // --- Halaman Daftar (daftar.html) ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nama = document.getElementById('register-nama').value;
            const email = document.getElementById('register-email').value;
            // Password tidak lagi diambil dari form
            const result = await callApi({ action: 'register', nama, email }, 'register-btn');
            if (result.status === 'success') {
                // Tampilkan pesan sukses, lalu arahkan ke login
                setTimeout(() => { window.location.href = 'index.html'; }, 3000);
            }
        });
    }

    // --- Halaman OTP (otp.html) ---
    const otpForm = document.getElementById('otp-form');
    if (otpForm) {
        const email = sessionStorage.getItem('userEmailForOTP');
        if (!email) {
            window.location.href = 'index.html'; // Jika tidak ada email, kembali ke login
            return;
        }

        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = document.getElementById('otp-code').value;
            const result = await callApi({ action: 'verifyOTP', email, otp }, 'otp-btn');
            
            if (result.status === 'success') {
                sessionStorage.setItem('loggedInUser', email);
                window.location.href = 'dashboard.html';
            } else if (result.status === 'change_password_required') {
                sessionStorage.setItem('loggedInUser', email);
                // Arahkan ke halaman ganti password khusus untuk pendaftar baru
                window.location.href = 'dashboard.html'; // Di dashboard akan ada form ganti password
            }
        });
    }

    // --- Halaman Lupa Password (lupa-password.html) ---
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value;
            await callApi({ action: 'forgotPassword', email }, 'forgot-btn');
            // Pesan sukses/error akan ditampilkan oleh callApi
        });
    }

    // --- Halaman Reset Password (reset.html) ---
    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            document.getElementById('reset-container').innerHTML = '<h1 class="text-2xl text-red-600">Token tidak valid atau tidak ditemukan.</h1>';
            return;
        }

        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('reset-password').value;
            const confirmPassword = document.getElementById('reset-confirm-password').value;

            if (newPassword !== confirmPassword) {
                document.getElementById('status-message').textContent = 'Password baru tidak cocok.';
                document.getElementById('status-message').style.color = 'red';
                return;
            }

            const result = await callApi({ action: 'resetPassword', token, newPassword }, 'reset-btn');
            if (result.status === 'success') {
                setTimeout(() => { window.location.href = 'index.html'; }, 2000);
            }
        });
    }

    // --- Halaman Dashboard (dashboard.html) ---
    const dashboardView = document.getElementById('logout-btn');
    if (dashboardView) {
        const email = sessionStorage.getItem('loggedInUser');
        if (!email) {
            window.location.href = 'index.html'; // Jika tidak login, tendang ke halaman login
            return;
        }

        document.getElementById('logout-btn').addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = 'index.html';
        });

        const changePasswordForm = document.getElementById('change-password-form');
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPassword = document.getElementById('old-password').value;
            const newPassword = document.getElementById('new-password').value;
            await callApi({ action: 'changePassword', email, oldPassword, newPassword }, 'change-password-btn');
            // Pesan sukses/error akan ditampilkan oleh callApi
        });
    }
});
