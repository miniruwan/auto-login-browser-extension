// Logic to manage url substring to login_hint mapping

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

// Render mappings in the table, with edit/save buttons
function renderMappings(mappings) {
	tableBody.innerHTML = '';
	mappings.forEach((mapping, idx) => {
		const row = document.createElement('tr');
		row.innerHTML = `
			<td><span class="display">${mapping.redirectUriSubstring}</span><input class="edit edit-redirect" type="text" value="${mapping.redirectUriSubstring}" style="display:none;width:90%"></td>
			<td><span class="display">${mapping.loginHint}</span><input class="edit edit-login" type="text" value="${mapping.loginHint}" style="display:none;width:90%"></td>
			<td>
				<button data-idx="${idx}" class="edit-btn">Edit</button>
				<button data-idx="${idx}" class="save-btn" style="display:none">Save</button>
				<button data-idx="${idx}" class="cancel-btn" style="display:none">Cancel</button>
				<button data-idx="${idx}" class="remove-btn">Remove</button>
			</td>
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
			alert(`Mapping for this redirect URI substring already exists. ${redirectUriSubstring}`);
			return;
		}
		mappings.push({ redirectUriSubstring, loginHint });
		chrome.storage.sync.set({ mappings }, loadMappings);
		form.reset();
	});
});

// Table event delegation for edit, save, cancel, remove
tableBody.addEventListener('click', (e) => {
	const idx = parseInt(e.target.getAttribute('data-idx'), 10);
	if (e.target.classList.contains('remove-btn')) {
		chrome.storage.sync.get({ mappings: [] }, (data) => {
			const mappings = data.mappings;
			mappings.splice(idx, 1);
			chrome.storage.sync.set({ mappings }, loadMappings);
		});
	} else if (e.target.classList.contains('edit-btn')) {
		// Switch to edit mode
		const row = e.target.closest('tr');
		row.querySelectorAll('.display').forEach(el => el.style.display = 'none');
		row.querySelectorAll('.edit').forEach(el => el.style.display = 'inline-block');
		row.querySelector('.edit-btn').style.display = 'none';
		row.querySelector('.remove-btn').style.display = 'none';
		row.querySelector('.save-btn').style.display = 'inline-block';
		row.querySelector('.cancel-btn').style.display = 'inline-block';
	} else if (e.target.classList.contains('cancel-btn')) {
		// Cancel edit
		loadMappings();
	} else if (e.target.classList.contains('save-btn')) {
		// Save edit
		const row = e.target.closest('tr');
		const newRedirect = row.querySelector('.edit-redirect').value.trim();
		const newLogin = row.querySelector('.edit-login').value.trim();
		if (!newRedirect || !newLogin) {
			alert('Both fields are required.');
			return;
		}
		chrome.storage.sync.get({ mappings: [] }, (data) => {
			const mappings = data.mappings;
			// Prevent duplicate redirectUriSubstring except for this row
			if (mappings.some((m, i) => i !== idx && m.redirectUriSubstring === newRedirect)) {
				alert(`Mapping for this redirect URI substring already exists. ${newRedirect}`);
				return;
			}
			mappings[idx] = { redirectUriSubstring: newRedirect, loginHint: newLogin };
			chrome.storage.sync.set({ mappings }, loadMappings);
		});
	}
});

// Initial load
loadMappings();
