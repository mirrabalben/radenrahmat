// Quick Access System for Super Admin
// Ctrl+Shift+L to access dashboard from any page

(function () {
    'use strict';

    // Check if already in superadmin dashboard
    if (window.location.pathname.includes('/superadmin')) {
        return; // Don't run on dashboard itself
    }

    // Keyboard shortcut listener
    document.addEventListener('keydown', function (e) {
        // Ctrl+Shift+L
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
            e.preventDefault();
            showQuickLogin();
        }
    });

    // Show login modal
    function showQuickLogin() {
        // Check if modal already exists
        if (document.getElementById('quick-login-modal')) {
            document.getElementById('quick-login-modal').style.display = 'flex';
            return;
        }

        // Create modal HTML
        const modalHTML = `
            <div id="quick-login-modal" style="
                display: flex;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 99999;
                justify-content: center;
                align-items: center;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    width: 350px;
                    max-width: 90%;
                ">
                    <h3 style="margin: 0 0 20px 0; color: #333; text-align: center;">
                        🔐 Super Admin Login
                    </h3>
                    <form id="quick-login-form">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; color: #555; font-weight: 600;">Username</label>
                            <input type="text" id="quick-username" required style="
                                width: 100%;
                                padding: 10px;
                                border: 2px solid #ddd;
                                border-radius: 6px;
                                font-size: 14px;
                                box-sizing: border-box;
                            ">
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; color: #555; font-weight: 600;">Password</label>
                            <input type="password" id="quick-password" required style="
                                width: 100%;
                                padding: 10px;
                                border: 2px solid #ddd;
                                border-radius: 6px;
                                font-size: 14px;
                                box-sizing: border-box;
                            ">
                        </div>
                        <div id="quick-login-error" style="
                            color: #dc3545;
                            font-size: 13px;
                            margin-bottom: 15px;
                            display: none;
                            text-align: center;
                        "></div>
                        <div style="display: flex; gap: 10px;">
                            <button type="submit" style="
                                flex: 1;
                                padding: 12px;
                                background: #007bff;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-size: 14px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: background 0.3s;
                            " onmouseover="this.style.background='#0056b3'" onmouseout="this.style.background='#007bff'">
                                Login
                            </button>
                            <button type="button" onclick="document.getElementById('quick-login-modal').style.display='none'" style="
                                flex: 1;
                                padding: 12px;
                                background: #6c757d;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-size: 14px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: background 0.3s;
                            " onmouseover="this.style.background='#545b62'" onmouseout="this.style.background='#6c757d'">
                                Batal
                            </button>
                        </div>
                    </form>
                    <p style="
                        margin: 15px 0 0 0;
                        font-size: 12px;
                        color: #999;
                        text-align: center;
                    ">
                        Tekan <kbd style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">Ctrl+Shift+L</kbd> untuk membuka
                    </p>
                </div>
            </div>
        `;

        // Insert modal into page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Handle form submission
        document.getElementById('quick-login-form').addEventListener('submit', async function (e) {
            e.preventDefault();

            const username = document.getElementById('quick-username').value;
            const password = document.getElementById('quick-password').value;
            const errorDiv = document.getElementById('quick-login-error');

            try {
                // Determine path to API based on current location
                const pathPrefix = window.location.pathname.includes('/mi/') || window.location.pathname.includes('/smp/') ? '../' : '';

                const response = await fetch(`${pathPrefix}api/auth.php?action=login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: username, pass: password })
                });

                const data = await response.json();

                if (data.success) {
                    // Store session
                    sessionStorage.setItem('superadmin_logged_in', 'true');
                    sessionStorage.setItem('superadmin_user', username);

                    // Redirect to dashboard
                    window.location.href = `${pathPrefix}superadmin/index.html`;
                } else {
                    errorDiv.textContent = 'Username atau password salah!';
                    errorDiv.style.display = 'block';
                }
            } catch (error) {
                errorDiv.textContent = 'Terjadi kesalahan. Coba lagi.';
                errorDiv.style.display = 'block';
            }
        });

        // Focus username field
        document.getElementById('quick-username').focus();
    }

    // Close modal on ESC key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('quick-login-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
    });

})();
