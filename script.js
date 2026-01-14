// CONFIG: Replace with your Cloudflare Worker URL
const API_BASE = 'https://your-worker.your-subdomain.workers.dev';

let MODERATOR_TOKEN = '';

// DOM Elements
const tokenInput = document.getElementById('token-input');
const loginBtn = document.getElementById('login-btn');
const mainContent = document.getElementById('main-content');
const worldsList = document.getElementById('worlds-list');
const refreshBtn = document.getElementById('refresh-btn');
const statusEl = document.getElementById('status');

// Auth
loginBtn.addEventListener('click', () => {
  MODERATOR_TOKEN = tokenInput.value.trim();
  if (MODERATOR_TOKEN) {
    document.getElementById('auth-section').style.display = 'none';
    mainContent.style.display = 'block';
    loadWorlds();
  }
});

// Load worlds
async function loadWorlds() {
  try {
    const res = await fetch(`${API_BASE}/api/worlds`, {
      headers: { 'Authorization': `Bearer ${MODERATOR_TOKEN}` }
    });
    
    if (!res.ok) throw new Error('Failed to fetch worlds');
    
    const worlds = await res.json();
    renderWorlds(worlds);
    showStatus('✅ Loaded successfully');
  } catch (err) {
    showError(err.message);
  }
}

// Render worlds
function renderWorlds(worlds) {
  worldsList.innerHTML = '';
  
  if (worlds.length === 0) {
    worldsList.innerHTML = '<p>No worlds to moderate.</p>';
    return;
  }

  worlds.forEach(world => {
    const card = document.createElement('div');
    card.className = 'world-card';
    card.innerHTML = `
      <img class="thumbnail" src="${world.thumbnail_url || 'https://via.placeholder.com/300x180?text=No+Thumbnail'}" 
           onerror="this.src='https://via.placeholder.com/300x180?text=Invalid+Image'">
      <div class="card-body">
        <h3>${escapeHtml(world.title)}</h3>
        <p>${escapeHtml(world.description || 'No description')}</p>
      </div>
      <div class="card-footer">
        <span>by ${escapeHtml(world.author)}</span>
        <span>${new Date(world.created_at).toLocaleDateString()}</span>
      </div>
      <div class="actions">
        <button class="delete-btn" data-id="${world.id}">🗑️ Delete</button>
      </div>
    `;
    worldsList.appendChild(card);
  });

  // Add delete listeners
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Delete this world permanently?')) {
        await deleteWorld(btn.dataset.id);
      }
    });
  });
}

// Delete world
async function deleteWorld(releaseId) {
  try {
    const res = await fetch(`${API_BASE}/api/moderate/${releaseId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MODERATOR_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'delete' })
    });

    if (res.ok) {
      showStatus('✅ Deleted successfully');
      loadWorlds(); // Refresh
    } else {
      throw new Error('Delete failed');
    }
  } catch (err) {
    showError(err.message);
  }
}

// Helpers
function showStatus(msg) {
  statusEl.textContent = msg;
  setTimeout(() => statusEl.textContent = '', 3000);
}

function showError(msg) {
  document.getElementById('error-message').textContent = msg;
  document.getElementById('error-modal').style.display = 'flex';
}

document.querySelector('.close').addEventListener('click', () => {
  document.getElementById('error-modal').style.display = 'none';
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Refresh
refreshBtn.addEventListener('click', loadWorlds);