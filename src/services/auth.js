import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js';
import { getAuth, signInWithCustomToken, signOut } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyCUhBo3u0fY0yTFZomxyenFtuTAWSL8UKA",
    authDomain: "eros-web-94e22.firebaseapp.com",
    projectId: "eros-web-94e22",
    storageBucket: "eros-web-94e22.firebasestorage.app",
    messagingSenderId: "525089541232",
    appId: "1:525089541232:web:9fe593008caad85df138b5",
    measurementId: "G-B4N281YVGX"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 檢查是否為開發環境
const isDevelopment = import.meta.env.DEV;

// 定義通用函數
const redirectToLogin = () => {
    if (isDevelopment) {
        const idToken = prompt('開發環境：請輸入 ID Token');
        if (idToken) {
            localStorage.setItem('idToken', idToken);
            // 從 JWT 中解析 user ID（假設 ID Token 是有效的 JWT）
            try {
                const payload = JSON.parse(atob(idToken.split('.')[1]));
                localStorage.setItem('userId', payload.user_id || payload.sub);
                return true;
            } catch (error) {
                console.error('解析 Token 失敗:', error);
            }
        }
    }
    alert('請先登入');
    window.location.href = '/login.html';
    return false;
};

export const authService = {
    isLoggedIn() {
        return !!localStorage.getItem('idToken');
    },

    async getIdToken() {
        if (!this.isLoggedIn()) {
            const success = redirectToLogin();
            if (success && isDevelopment) {
                return localStorage.getItem('idToken');
            }
            return null;
        }
        return localStorage.getItem('idToken');
    },

    getCurrentUserId() {
        return localStorage.getItem('userId');
    },

    // 初始化檢查
    initialize() {
        if (!this.isLoggedIn()) {
            redirectToLogin();
        }
    }
};

// 初始化時檢查登入狀態
authService.initialize();

// 監聽認證狀態變化
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const idToken = await user.getIdToken(true);
            localStorage.setItem('idToken', idToken);
            localStorage.setItem('userId', user.uid);
        } catch (error) {
            console.error('更新 ID Token 時發生錯誤:', error);
            localStorage.removeItem('idToken');
            localStorage.removeItem('userId');
            redirectToLogin();
        }
    } else {
        localStorage.removeItem('idToken');
        localStorage.removeItem('userId');
        redirectToLogin();
    }
}); 