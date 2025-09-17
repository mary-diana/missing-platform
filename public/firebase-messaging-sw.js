// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyATbo7EWLh0omFbZYa3p9CUmnAib7_M46M",
  authDomain: "missing-reporting.firebaseapp.com",
  projectId: "missing-reporting",
  storageBucket: "missing-reporting.firebasestorage.app",
  messagingSenderId: "1017797620489",
  appId: "1:1017797620489:web:2fb8b52c949285c2bc99d8",
  measurementId: "G-9JDWJY34FX"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message: ", payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo192.png",
  });
});
