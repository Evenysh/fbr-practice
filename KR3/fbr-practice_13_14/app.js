const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const list = document.getElementById('notes-list');

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
    li.textContent = note;
    list.appendChild(li);
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  const notes = getNotes();
  notes.push(text);
  saveNotes(notes);
  renderNotes();

  input.value = '';
  input.focus();
});

renderNotes();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker зарегистрирован:', registration.scope);
    } catch (error) {
      console.error('Ошибка регистрации Service Worker:', error);
    }
  });
}