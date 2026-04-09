document.addEventListener('DOMContentLoaded', () => {
  const socket = window.location.port === '3001' ? io('http://localhost:3001') : null;

  const contentDiv = document.getElementById('app-content');
  const homeBtn = document.getElementById('home-btn');
  const aboutBtn = document.getElementById('about-btn');

  const PUBLIC_VAPID_KEY = 'BHu84QPn79zBMdQI61nzHdi77Aa1z5b9MaCNAaKDSGz_YKzX0fKXuuaD21T7DqWZB-Bmbj2douL4PE1mmr8DyIM';

  if (!contentDiv || !homeBtn || !aboutBtn) {
    console.error('Не найдены элементы App Shell');
    return;
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  function setActiveButton(activeId) {
    [homeBtn, aboutBtn].forEach((btn) => btn.classList.remove('active'));
    document.getElementById(activeId).classList.add('active');
  }

  function showToast(message) {
    const notification = document.createElement('div');
    notification.className = 'live-toast';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });
      }

      await fetch('http://localhost:3001/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      console.log('Подписка на push отправлена');
      return subscription;
    } catch (error) {
      console.error('Ошибка подписки на push:', error);
    }
  }

  async function unsubscribeFromPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch('http://localhost:3001/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });

        await subscription.unsubscribe();
        console.log('Отписка выполнена');
      }
    } catch (error) {
      console.error('Ошибка отписки от push:', error);
    }
  }

  async function updatePushButtons() {
    const enableBtn = document.getElementById('enable-push');
    const disableBtn = document.getElementById('disable-push');

    if (!enableBtn || !disableBtn || !('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      enableBtn.style.display = 'none';
      disableBtn.style.display = 'inline-block';
    } else {
      enableBtn.style.display = 'inline-block';
      disableBtn.style.display = 'none';
    }
  }

  function bindPushButtons() {
    const enableBtn = document.getElementById('enable-push');
    const disableBtn = document.getElementById('disable-push');

    if (enableBtn && !enableBtn.dataset.bound) {
      enableBtn.dataset.bound = 'true';
      enableBtn.addEventListener('click', async () => {
        if (Notification.permission === 'denied') {
          alert('Уведомления запрещены. Разрешите их в настройках браузера.');
          return;
        }

        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            alert('Необходимо разрешить уведомления.');
            return;
          }
        }

        await subscribeToPush();
        await updatePushButtons();
      });
    }

    if (disableBtn && !disableBtn.dataset.bound) {
      disableBtn.dataset.bound = 'true';
      disableBtn.addEventListener('click', async () => {
        await unsubscribeFromPush();
        await updatePushButtons();
      });
    }
  }

  async function loadContent(page) {
    try {
      const response = await fetch(`/content/${page}.html`);

      if (!response.ok) {
        throw new Error(`Не удалось загрузить страницу: ${page}`);
      }

      const html = await response.text();
      contentDiv.innerHTML = html;

      if (page === 'home') {
        initNotes();
        bindPushButtons();
        await updatePushButtons();
      }
    } catch (error) {
      contentDiv.innerHTML = `<p class="about-text">Ошибка загрузки страницы.</p>`;
      console.error('Ошибка loadContent:', error);
    }
  }

  homeBtn.addEventListener('click', () => {
    setActiveButton('home-btn');
    loadContent('home');
  });

  aboutBtn.addEventListener('click', () => {
    setActiveButton('about-btn');
    loadContent('about');
  });

  function initNotes() {
    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');

    const reminderForm = document.getElementById('reminder-form');
    const reminderText = document.getElementById('reminder-text');
    const reminderTime = document.getElementById('reminder-time');

    const list = document.getElementById('notes-list');

    if (!form || !input || !reminderForm || !reminderText || !reminderTime || !list) {
      console.error('Элементы заметок не найдены');
      return;
    }

    function getNotes() {
      return JSON.parse(localStorage.getItem('notes') || '[]');
    }

    function saveNotes(notes) {
      localStorage.setItem('notes', JSON.stringify(notes));
    }

    function renderNotes() {
      const notes = getNotes();
      list.innerHTML = '';

      notes.forEach((note) => {
        const li = document.createElement('li');

        let reminderInfo = '';
        if (note.reminder) {
          const date = new Date(note.reminder);
          reminderInfo = `\nНапоминание: ${date.toLocaleString()}`;
        }

        li.textContent = `${note.text}${reminderInfo}`;
        list.appendChild(li);
      });
    }

    function addNote(text, reminderTimestamp = null) {
      const notes = getNotes();
      const newNote = {
        id: Date.now(),
        text,
        reminder: reminderTimestamp
      };

      notes.push(newNote);
      saveNotes(notes);
      renderNotes();

      if (socket) {
        if (reminderTimestamp) {
          socket.emit('newReminder', {
            id: newNote.id,
            text: newNote.text,
            reminderTime: reminderTimestamp
          });
        } else {
          socket.emit('newTask', {
            text: newNote.text,
            timestamp: Date.now()
          });
        }
      }
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const text = input.value.trim();
      if (!text) return;

      addNote(text);
      input.value = '';
      input.focus();
    });

    reminderForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const text = reminderText.value.trim();
      const datetime = reminderTime.value;

      if (!text || !datetime) return;

      const timestamp = new Date(datetime).getTime();

      if (timestamp <= Date.now()) {
        alert('Дата напоминания должна быть в будущем');
        return;
      }

      addNote(text, timestamp);
      reminderText.value = '';
      reminderTime.value = '';
    });

    renderNotes();
  }

  if (socket) {
    socket.on('taskAdded', (task) => {
      console.log('Задача от другого клиента:', task);
      showToast(`Новая задача: ${task.text}`);
    });
  }

  loadContent('home');

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker зарегистрирован:', registration.scope);
      } catch (error) {
        console.error('Ошибка регистрации Service Worker:', error);
      }
    });
  }
});