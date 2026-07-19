let swRegistration = null;

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

export const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return null;
  try {
    swRegistration = await navigator.serviceWorker.register("/sw.js");
    return swRegistration;
  } catch (error) {
    console.error("Service worker registration failed:", error);
    return null;
  }
};

export const showNotification = (title, body, data = {}) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  if (swRegistration) {
    swRegistration.showNotification(title, {
      body,
      icon: "/favicon.svg",
      tag: "chat-message",
      renotify: true,
      data,
    });
  } else {
    new Notification(title, { body, icon: "/favicon.svg", tag: "chat-message", data });
  }
};
