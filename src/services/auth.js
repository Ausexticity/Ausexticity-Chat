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


// 只在初始化時執行一次自動登入
let Initialized = false;
if (!Initialized) {
    if (!isLoggedIn()) {
        alert('請先登入');
        window.location.href = 'https://www.ausexticity.com/login.html';
    }
    Initialized = true;
}

export const authService = {
    async getIdToken() {
        if (!isLoggedIn()) {
            alert('請先登入');
            window.location.href = 'https://www.ausexticity.com/login.html';
        }
        const idToken = localStorage.getItem('idToken');
        return idToken;
    },

    isLoggedIn() {
        return !!localStorage.getItem('idToken');
    },

    getCurrentUserId() {
        return localStorage.getItem('userId');
    }
};

// 監聽認證狀態變化
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const idToken = await user.getIdToken(true);
            localStorage.setItem('idToken', idToken);
        } catch (error) {
            console.error('更新 ID Token 時發生錯誤:', error);
        }
    } else {
        localStorage.removeItem('idToken');
        localStorage.removeItem('userId');
    }
}); 