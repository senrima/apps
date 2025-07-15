// ===============================================================
//                       PENGATURAN PENTING
// ===============================================================
// ‼️ GANTI DENGAN ALAMAT CLOUDFLARE WORKER ANDA
const API_ENDPOINT = "https://wmalam.senrima-ms.workers.dev";

// ===============================================================
//                       FUNGSI HELPER UI
// ===============================================================

/**
 * Menampilkan pesan status dengan gaya modern (ikon dan warna)
 * @param {string} message - Pesan yang akan ditampilkan.
 * @param {string} type - 'success' atau 'error'.
 */
function setStatusMessage(message, type) {
    const statusDiv = document.getElementById('status-message');
    if (!statusDiv) return;

    const isSuccess = type === 'success';
    const bgColor = isSuccess ? 'bg-green-100' : 'bg-red-100';
    const borderColor = isSuccess ? 'border-green-400' : 'border-red-400';
    const textColor = isSuccess ? 'text-green-800' : 'text-red-800';
    const icon = isSuccess ? 
        `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>` : 
        `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>`;

    statusDiv.innerHTML = `
        <div class="flex items-center p-4 rounded-lg border-l-4 ${bgColor} ${borderColor} ${textColor}" role="alert">
            <div class="mr-3">${icon}</div>
            <span class="font-medium">${message}</span>
        </div>
    `;
}

// ===============================================================
//                       FUNGSI UTAMA API
// ===============================================================

async function callApi(payload, btnId) {
    const btn = document.getElementById(btnId);
    const originalText = btn ? btn.textContent : '';
    const statusMessageDiv = document.getElementById('status-message');

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    }
    if (statusMessageDiv) statusMessageDiv.innerHTML = '';

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const result = await response.json();
        
        const messageType = result.status.includes('success') || result.status.includes('change_password_required') ? 'success' : 'error';
        setStatusMessage(result.message, messageType);
        
        return result;

    } catch (error) {
        setStatusMessage(`Error: Gagal terhubung ke server. ${error.message}`, 'error');
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
            const result = await callApi({ action: 'register', nama, email }, 'register-btn');
            if (result.status === 'success') {
                setTimeout(() => { window.location.href = 'index.html'; }, 3000);
            }
        });
    }

    // --- Halaman OTP (otp.html) ---
    const otpForm = document.getElementById('otp-form');
    if (otpForm) {
        const email = sessionStorage.getItem('userEmailForOTP');
        if (!email) {
            window.location.href = 'index.html';
            return;
        }

        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = document.getElementById('otp-code').value;
            const result = await callApi({ action: 'verifyOTP', email, otp }, 'otp-btn');
            
            if (result.status === 'success' || result.status === 'change_password_required') {
                sessionStorage.setItem('loggedInUser', email);
                sessionStorage.setItem('userStatus', result.status); // Simpan status untuk dashboard
                window.location.href = 'dashboard.html';
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
                setStatusMessage('Password baru tidak cocok.', 'error');
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
            window.location.href = 'index.html';
            return;
        }

        // Tampilkan info ganti password jika statusnya 'Wajib Ganti Password'
        if (sessionStorage.getItem('userStatus') === 'change_password_required') {
            document.getElementById('change-password-info').classList.remove('hidden');
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
            const result = await callApi({ action: 'changePassword', email, oldPassword, newPassword }, 'change-password-btn');
            if(result.status === 'success'){
                // Hapus status setelah berhasil ganti password
                sessionStorage.removeItem('userStatus');
                document.getElementById('change-password-info').classList.add('hidden');
            }
        });
    }
});
