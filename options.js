// options.js
// Logic to manage redirect_uri substring to login_hint mapping

const form = document.getElementById('mappingForm');
const redirectUriInput = document.getElementById('redirectUriSubstring');
const loginHintInput = document.getElementById('loginHint');
const tableBody = document.querySelector('#mappingsTable tbody');

// Load mappings from storage and render
function loadMappings() {
	chrome.storage.sync.get({ mappings: [] }, (data) => {
		renderMappings(data.mappings);
	});
}

// Render mappings in the table
function renderMappings(mappings) {
	tableBody.innerHTML = '';
	mappings.forEach((mapping, idx) => {
		const row = document.createElement('tr');
		row.innerHTML = `
			<td>${mapping.redirectUriSubstring}</td>
			<td>${mapping.loginHint}</td>
			<td><button data-idx="${idx}" class="remove-btn">Remove</button></td>
		`;
		tableBody.appendChild(row);
	});
}

// Add mapping
form.addEventListener('submit', (e) => {
	e.preventDefault();
	const redirectUriSubstring = redirectUriInput.value.trim();
	const loginHint = loginHintInput.value.trim();
	if (!redirectUriSubstring || !loginHint) return;
	chrome.storage.sync.get({ mappings: [] }, (data) => {
		const mappings = data.mappings;
		// Prevent duplicates
		if (mappings.some(m => m.redirectUriSubstring === redirectUriSubstring)) {
			alert('Mapping for this redirect_uri substring already exists.');
			return;
		}
		mappings.push({ redirectUriSubstring, loginHint });
		chrome.storage.sync.set({ mappings }, loadMappings);
		form.reset();
	});
});

// Remove mapping
tableBody.addEventListener('click', (e) => {
	if (e.target.classList.contains('remove-btn')) {
		const idx = parseInt(e.target.getAttribute('data-idx'), 10);
		chrome.storage.sync.get({ mappings: [] }, (data) => {
			const mappings = data.mappings;
			mappings.splice(idx, 1);
			chrome.storage.sync.set({ mappings }, loadMappings);
		});
	}
});

// Initial load
loadMappings();
