// app.js
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. AUTHENTICATION GUARD & ROLE SETUP
    const sessionStr = localStorage.getItem('maintainIQ_session');
    if (!sessionStr) {
        window.location.href = 'login.html';
        return; 
    }
    
    const session = JSON.parse(sessionStr);
    const isTech = session.userRole === 'technician';

    // Update Topbar Text based on role
    if (isTech) {
        document.getElementById('topbarUserName').textContent = 'Ahmed Raza (Demo)';
        document.getElementById('topbarUserRole').textContent = 'technician@assetcare.demo • tech';
        document.getElementById('userMenuBtn').textContent = 'Tech Menu';
        document.querySelector('.admin-badge span').textContent = 'Technician view';
    }

    // 2. USER MENU DROPDOWN LOGIC
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    
    userMenuBtn.addEventListener('click', () => {
        userMenuDropdown.classList.toggle('active');
    });

    // Logout Logic
    document.getElementById('menuLogoutBtn').addEventListener('click', () => {
        localStorage.removeItem('maintainIQ_session');
        window.location.href = 'login.html';
    });

    // Reset Data Logic (Inside Menu and Sidebar)
    const handleReset = () => {
        if(confirm("Are you sure you want to restore the original sample data? All current records will be wiped.")) {
            db.resetDemoData();
            location.reload();
        }
    };
    document.getElementById('menuResetBtn').addEventListener('click', handleReset);
    if(document.getElementById('resetDataBtn')) {
        document.getElementById('resetDataBtn').addEventListener('click', handleReset);
    }

    // 3. GLOBAL SEARCH LOGIC
    document.getElementById('globalSearch').addEventListener('keypress', (e) => {
        if(e.key === 'Enter') {
            const query = e.target.value;
            // Force navigate to assets view
            const assetNavLink = document.querySelector('[data-view="assets"]');
            if (assetNavLink) assetNavLink.click();
            
            // Wait 100ms for DOM to render, then apply search
            setTimeout(() => {
                const localSearch = document.getElementById('filterSearch');
                if(localSearch) {
                    localSearch.value = query;
                    localSearch.dispatchEvent(new Event('input')); // Trigger the filter logic
                }
            }, 100);
        }
    });

    // 4. ROUTER LOGIC
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(n => n.classList.remove('active'));
            e.target.classList.add('active');
            
            const view = e.target.getAttribute('data-view');
            loadView(view);
        });
    });

    function loadView(viewName) {
        const container = document.getElementById('app-container');
        container.innerHTML = ''; 

        if (viewName === 'dashboard') {
            if (isTech && typeof renderTechDashboard === 'function') {
                renderTechDashboard();
            } else if (typeof renderDashboard === 'function') {
                renderDashboard();
            }
        } else if (viewName === 'assets') {
            if (typeof renderAssets === 'function') renderAssets();
            
            // SECURITY REQUIREMENT: Hide Register Button if user is a Technician
            if (isTech && document.getElementById('openRegisterModalBtn')) {
                document.getElementById('openRegisterModalBtn').style.display = 'none';
            }
            
        } else if (viewName === 'issues') {
            if (typeof renderIssues === 'function') renderIssues();
        } else if (viewName === 'schedules') {
            if (typeof renderSchedules === 'function') renderSchedules();
        } else if (viewName === 'technicians') {
            if (typeof renderTechnicians === 'function') renderTechnicians();
        } else if (viewName === 'analytics') {
            if (typeof renderAnalytics === 'function') renderAnalytics();
        } else if (viewName === 'notifications') {
            if (typeof renderNotifications === 'function') renderNotifications();
        } else {
            container.innerHTML = `<h2>${viewName} UI coming soon...</h2>`;
        }
    }

    // Load initial view
    loadView('dashboard');
});


// =====================================
// TECHNICIAN DASHBOARD RENDERER
// =====================================
function renderTechDashboard() {
    const container = document.getElementById('app-container');
    const allIssues = db.getIssues();
    
    // Assume logged in tech is "Ahmed Raza" for demo purposes
    const techName = "Ahmed Raza"; 
    
    const assignedIssues = allIssues.filter(i => i.assignedTechnician === techName && i.status !== 'Resolved');
    const highPriority = assignedIssues.filter(i => i.priority === 'Critical' || i.priority === 'High').length;

    let queueHTML = '';
    assignedIssues.forEach(issue => {
        queueHTML += `
            <div class="list-item-card ${issue.priority.toLowerCase()}">
                <div class="list-item-header">
                    <h4>${issue.title}</h4>
                    <span class="badge badge-${issue.priority.toLowerCase()}">${issue.priority}</span>
                </div>
                <div class="list-item-meta">${issue.id}</div>
                <div class="list-item-footer">
                    <span class="badge badge-assigned">${issue.status}</span>
                </div>
            </div>
        `;
    });

    if(queueHTML === '') queueHTML = '<p class="metric-desc">No issues assigned.</p>';

    container.innerHTML = `
        <div class="dashboard-title-bar">
            <div>
                <h2>Technician Dashboard</h2>
                <p>Focus on your assigned work, due schedules, and active maintenance tasks.</p>
            </div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card total">
                <div class="metric-label">Assigned issues</div>
                <div class="metric-value">${assignedIssues.length}</div>
                <div class="metric-desc">All issues currently visible to you</div>
            </div>
            <div class="metric-card maintenance">
                <div class="metric-label" style="color: var(--warning);">High priority</div>
                <div class="metric-value">${highPriority}</div>
                <div class="metric-desc">High and critical work items</div>
            </div>
            <div class="metric-card open">
                <div class="metric-label" style="color: var(--danger);">Due today</div>
                <div class="metric-value">0</div>
                <div class="metric-desc">Scheduled maintenance needing attention</div>
            </div>
        </div>

        <div class="dashboard-three-col" style="grid-template-columns: 2fr 1fr;">
            <div class="section-card">
                <h3>Work queue</h3>
                <div class="section-subtitle">Assigned Issues</div>
                <div>${queueHTML}</div>
            </div>
            <div class="section-card">
                <h3>Priority mix</h3>
                <div class="section-subtitle">Maintenance Status</div>
                <div class="donut-chart-container" style="padding-top: 2rem;">
                     <div class="donut-chart" style="background: conic-gradient(#3182ce 0deg 360deg); width: 120px; height: 120px;">
                        <div class="donut-hole" style="width: 80px; height: 80px;">
                            <div class="donut-hole-value">${assignedIssues.length}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// =====================================
// ADMIN DASHBOARD RENDERER
// =====================================
function renderDashboard() {
    const container = document.getElementById('app-container');
    
    const assets = db.getAssets();
    const issues = db.getIssues();
    
    const totalAssets = assets.length;
    const operationalAssets = assets.filter(a => a.status === 'Operational').length;
    const underMaintenance = assets.filter(a => a.status === 'Under Maintenance' || a.status === 'Under Inspection').length;
    const openIssues = issues.filter(i => i.status !== 'Resolved').length;
    const overdueMaintenance = assets.filter(a => a.condition === 'Poor' && a.status === 'Out of Service').length; 
    const resolvedThisMonth = issues.filter(i => i.status === 'Resolved').length;

    container.innerHTML = `
        <div class="dashboard-title-bar">
            <div>
                <h2>Maintenance Dashboard</h2>
                <p>Monitor asset health, incoming issues, technician execution, and service history across the campus.</p>
            </div>
            <button class="btn-primary" id="dashRegisterAssetBtn">Register New Asset</button>
        </div>

        <div class="metrics-grid">
            <div class="metric-card total">
                <div class="metric-label">Total assets</div>
                <div class="metric-value">${totalAssets}</div>
                <div class="metric-desc">Registered assets across campus</div>
            </div>
            <div class="metric-card operational">
                <div class="metric-label">Operational assets</div>
                <div class="metric-value">${operationalAssets}</div>
                <div class="metric-desc">Currently available for normal use</div>
            </div>
            <div class="metric-card maintenance">
                <div class="metric-label">Assets under maintenance</div>
                <div class="metric-value">${underMaintenance}</div>
                <div class="metric-desc">Assets under inspection or repair</div>
            </div>
            <div class="metric-card open">
                <div class="metric-label">Open Issues</div>
                <div class="metric-value">${openIssues}</div>
                <div class="metric-desc">Reported, assigned, or in-progress</div>
            </div>
            <div class="metric-card open" style="border-top: 3px solid var(--danger);">
                <div class="metric-label" style="color: var(--danger);">Overdue maintenance</div>
                <div class="metric-value">${overdueMaintenance}</div>
                <div class="metric-desc">Schedules that missed target dates</div>
            </div>
            <div class="metric-card operational" style="border-top: 3px solid var(--success);">
                <div class="metric-label" style="color: var(--success);">Resolved this month</div>
                <div class="metric-value">${resolvedThisMonth}</div>
                <div class="metric-desc">Resolved or closed issues in demo</div>
            </div>
        </div>

        <div class="dashboard-three-col">
            <div class="section-card">
                <h3>Live Queue</h3>
                <div class="section-subtitle">Recently reported issues</div>
                <div id="liveQueueContainer"></div>
            </div>

            <div class="section-card">
                <h3>Planning</h3>
                <div class="section-subtitle">Upcoming maintenance</div>
                <div id="planningContainer"></div>
            </div>

            <div class="section-card">
                <h3>Repeat Work</h3>
                <div class="section-subtitle">Most frequently repaired assets</div>
                <div class="bar-chart-container" id="repeatWorkContainer"></div>
            </div>
        </div>
    `;

    const liveQueueContainer = document.getElementById('liveQueueContainer');
    const activeIssues = issues.filter(i => i.status !== 'Resolved').slice(0, 3);

    if(activeIssues.length === 0) {
        liveQueueContainer.innerHTML = `<p class="metric-desc">No active logs in queue.</p>`;
    } else {
        activeIssues.forEach(issue => {
            const correspondingAsset = assets.find(a => a.id === issue.assetId);
            const assetName = correspondingAsset ? correspondingAsset.name : 'Unknown Asset';
            
            liveQueueContainer.innerHTML += `
                <div class="list-item-card ${issue.priority.toLowerCase()}">
                    <div class="list-item-header">
                        <h4>${issue.title}</h4>
                        <span class="badge badge-${issue.priority.toLowerCase()}">${issue.priority}</span>
                    </div>
                    <div class="list-item-meta">${issue.id} • ${assetName}</div>
                    <div class="list-item-footer">
                        <span class="badge badge-assigned">${issue.status}</span>
                    </div>
                </div>
            `;
        });
    }

    const planningContainer = document.getElementById('planningContainer');
    const delayedAssets = assets.filter(a => a.status === 'Out of Service' || a.status === 'Under Maintenance');
    
    if(delayedAssets.length === 0) {
        planningContainer.innerHTML = `<p class="metric-desc">No immediate maintenance scheduling tasks required.</p>`;
    } else {
        delayedAssets.forEach(asset => {
            const isOverdue = asset.condition === 'Poor';
            planningContainer.innerHTML += `
                <div class="list-item-card" style="border-left-color: ${isOverdue ? 'var(--danger)' : 'var(--warning)'}">
                    <div class="list-item-header">
                        <h4>${asset.name}</h4>
                        <span class="badge ${isOverdue ? 'badge-overdue' : 'badge-upcoming'}">${isOverdue ? 'Overdue' : 'Upcoming'}</span>
                    </div>
                    <div class="list-item-meta">Condition: ${asset.condition} • Code: ${asset.code}</div>
                    <div class="list-item-footer">
                        <span class="metric-desc">Tech Assigned: Bilal Khan</span>
                    </div>
                </div>
            `;
        });
    }

    const repeatWorkContainer = document.getElementById('repeatWorkContainer');
    const sampleRepairs = [
        { name: 'Backup Generator', count: 2, max: 2 },
        { name: 'Water Dispenser', count: 2, max: 2 },
        { name: 'Reception Laptop', count: 1, max: 2 },
        { name: 'Main Office AC', count: 1, max: 2 }
    ];

    sampleRepairs.forEach(item => {
        const percentage = (item.count / item.max) * 100;
        repeatWorkContainer.innerHTML += `
            <div class="bar-row">
                <div class="bar-label" title="${item.name}">${item.name}</div>
                <div class="bar-wrapper">
                    <div class="bar-fill" style="width: ${percentage}%"></div>
                    <div class="bar-value">${item.count}</div>
                </div>
            </div>
        `;
    });

    document.getElementById('dashRegisterAssetBtn').addEventListener('click', () => {
        const assetNavLink = document.querySelector('[data-view="assets"]');
        if (assetNavLink) assetNavLink.click(); 
    });
}

// =====================================
// ASSETS RENDERER
// =====================================    
function renderAssets() {
    const container = document.getElementById('app-container');
    
    container.innerHTML = `
        <div class="dashboard-title-bar">
            <div>
                <h2>Asset Management</h2>
                <p>Search, filter, review service posture, and open QR-enabled asset records.</p>
            </div>
            <button class="btn-primary" id="openRegisterModalBtn">Register New Asset</button>
        </div>

        <div class="filter-bar">
            <div class="filter-group" style="flex-grow: 1;">
                <label>Search assets</label>
                <input type="text" id="filterSearch" class="filter-control" placeholder="Search by name, code, or location">
            </div>
            <div class="filter-group">
                <label>Category</label>
                <select id="filterCategory" class="filter-control">
                    <option value="All">All</option>
                    <option value="Generator">Generator</option>
                    <option value="Air Conditioner">Air Conditioner</option>
                    <option value="Printer">Printer</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Water Dispenser">Water Dispenser</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Status</label>
                <select id="filterStatus" class="filter-control">
                    <option value="All">All</option>
                    <option value="Operational">Operational</option>
                    <option value="Issue Reported">Issue Reported</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Sort</label>
                <select id="filterSort" class="filter-control">
                    <option value="Name">Name (A-Z)</option>
                    <option value="Condition">Condition</option>
                </select>
            </div>
            <button class="btn-secondary" id="clearFiltersBtn" style="margin-bottom: 2px;">Clear</button>
        </div>

        <div class="section-card" style="padding: 0; overflow: hidden;">
            <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-color);">
                <h3 id="assetCountLabel">Loading assets...</h3>
            </div>
            <div class="data-table-header">
                <div>Asset</div>
                <div>Category</div>
                <div>Location</div>
                <div>Condition</div>
                <div>Status</div>
                <div>Open Issues</div>
                <div>Actions</div>
            </div>
            <div id="assetListContainer"></div>
        </div>

        <div id="registerModal" class="modal-overlay hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Register New Asset</h3>
                    <button class="close-modal" id="closeRegisterModal">&times;</button>
                </div>
                <form id="registerAssetForm">
                    <div class="form-group">
                        <label>Asset Name</label>
                        <input type="text" id="newAssetName" required placeholder="e.g. IT Lab Projector">
                    </div>
                    <div class="form-group">
                        <label>Unique Asset Code (Must be unique)</label>
                        <input type="text" id="newAssetCode" required placeholder="e.g. PRJ-LAB-01">
                        <div id="assetCodeError" class="error-message"></div>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <select id="newAssetCategory">
                            <option value="Air Conditioner">Air Conditioner</option>
                            <option value="Generator">Generator</option>
                            <option value="Laptop">Laptop</option>
                            <option value="Printer">Printer</option>
                            <option value="Water Dispenser">Water Dispenser</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" id="newAssetLocation" required placeholder="e.g. Server Room">
                    </div>
                    <div class="form-group">
                        <label>Initial Condition</label>
                        <select id="newAssetCondition">
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem;">Save Asset</button>
                </form>
            </div>
        </div>

        <div id="qrModal" class="modal-overlay hidden">
            <div class="modal-content" style="text-align: center; max-width: 350px;">
                <div class="modal-header">
                    <h3>Asset QR Code</h3>
                    <button class="close-modal" id="closeQrModal">&times;</button>
                </div>
                <img id="qrModalImage" src="" alt="QR Code" style="margin: 1rem auto; display: block; width: 200px; height: 200px; border: 1px solid var(--border-color); padding: 10px;">
                <p id="qrModalCode" style="font-weight: bold; margin-top: 1rem;"></p>
                <p class="metric-desc">Scan to view history or report an issue.</p>
            </div>
        </div>
    `;

    const listContainer = document.getElementById('assetListContainer');
    const countLabel = document.getElementById('assetCountLabel');
    const searchInput = document.getElementById('filterSearch');
    const categorySelect = document.getElementById('filterCategory');
    const statusSelect = document.getElementById('filterStatus');
    const sortSelect = document.getElementById('filterSort');

    function applyFiltersAndRender() {
        let assets = db.getAssets();
        const issues = db.getIssues();
        
        const searchTerm = searchInput.value.toLowerCase();
        const category = categorySelect.value;
        const status = statusSelect.value;
        const sort = sortSelect.value;

        if (searchTerm) {
            assets = assets.filter(a => 
                a.name.toLowerCase().includes(searchTerm) || 
                a.code.toLowerCase().includes(searchTerm) || 
                a.location.toLowerCase().includes(searchTerm)
            );
        }
        if (category !== 'All') assets = assets.filter(a => a.category === category);
        if (status !== 'All') assets = assets.filter(a => a.status === status);

        assets.sort((a, b) => {
            if (sort === 'Name') return a.name.localeCompare(b.name);
            if (sort === 'Condition') return a.condition.localeCompare(b.condition);
            return 0;
        });

        countLabel.textContent = `${assets.length} assets`;
        listContainer.innerHTML = '';
        
        if (assets.length === 0) {
            listContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-light);">No assets match your search criteria.</div>`;
            return;
        }

        assets.forEach(asset => {
            const openIssuesCount = issues.filter(i => i.assetId === asset.id && i.status !== 'Resolved').length;
            
            let conditionBadge = 'low'; 
            if (asset.condition === 'Poor') conditionBadge = 'critical';
            if (asset.condition === 'Fair') conditionBadge = 'reported';
            if (asset.condition === 'Good' || asset.condition === 'Excellent') conditionBadge = 'upcoming';

            let statusBadge = 'low';
            if (asset.status === 'Out of Service') statusBadge = 'critical';
            if (asset.status === 'Under Maintenance' || asset.status === 'Issue Reported') statusBadge = 'assigned';
            if (asset.status === 'Operational') statusBadge = 'upcoming';

            const row = document.createElement('div');
            row.className = 'data-row';
            row.innerHTML = `
                <div class="asset-identity">
                    <div class="asset-icon">${asset.category.substring(0, 3).toUpperCase()}</div>
                    <div class="asset-details">
                        <h4>${asset.name}</h4>
                        <span>${asset.code}</span>
                    </div>
                </div>
                <div class="metric-desc">${asset.category}</div>
                <div class="metric-desc">${asset.location}</div>
                <div><span class="badge badge-${conditionBadge}">${asset.condition}</span></div>
                <div><span class="badge badge-${statusBadge}">${asset.status}</span></div>
                <div style="font-weight: 600;">${openIssuesCount}</div>
                <div class="row-actions">
                    <button class="btn-secondary open-asset-btn" data-id="${asset.id}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Open</button>
                    <button class="btn-secondary qr-btn" data-url="${asset.qrCodeUrl}" data-code="${asset.code}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; color: var(--primary-teal); border-color: #b2f5ea;">QR</button>
                </div>
            `;
            listContainer.appendChild(row);
        });

        document.querySelectorAll('.qr-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.getAttribute('data-url');
                const code = e.target.getAttribute('data-code');
                document.getElementById('qrModalImage').src = url;
                document.getElementById('qrModalCode').textContent = code;
                document.getElementById('qrModal').classList.remove('hidden');
            });
        });
    }

    searchInput.addEventListener('input', applyFiltersAndRender);
    categorySelect.addEventListener('change', applyFiltersAndRender);
    statusSelect.addEventListener('change', applyFiltersAndRender);
    sortSelect.addEventListener('change', applyFiltersAndRender);
    
    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        searchInput.value = ''; categorySelect.value = 'All'; statusSelect.value = 'All'; sortSelect.value = 'Name';
        applyFiltersAndRender();
    });

    const registerModal = document.getElementById('registerModal');
    
    if (document.getElementById('openRegisterModalBtn')) {
        document.getElementById('openRegisterModalBtn').addEventListener('click', () => {
            registerModal.classList.remove('hidden');
            document.getElementById('assetCodeError').style.display = 'none';
            document.getElementById('registerAssetForm').reset();
        });
    }

    document.getElementById('closeRegisterModal').addEventListener('click', () => {
        registerModal.classList.add('hidden');
    });

    document.getElementById('closeQrModal').addEventListener('click', () => {
        document.getElementById('qrModal').classList.add('hidden');
    });

    document.getElementById('registerAssetForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('assetCodeError');
        
        const newAsset = {
            name: document.getElementById('newAssetName').value,
            code: document.getElementById('newAssetCode').value,
            category: document.getElementById('newAssetCategory').value,
            location: document.getElementById('newAssetLocation').value,
            condition: document.getElementById('newAssetCondition').value, // <--- Added here
            status: 'Operational'   
        };

        try {
            db.addAsset(newAsset);
            registerModal.classList.add('hidden');
            applyFiltersAndRender(); 
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    });

    applyFiltersAndRender();
}

// =====================================
// ISSUES RENDERER
// =====================================
// =====================================
// ISSUES RENDERER (UPDATED)
// =====================================
function renderIssues() {
    const container = document.getElementById('app-container');
    const techs = db.getData().technicians;
    const assets = db.getAssets();

    const techOptions = techs.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    
    // NEW: Generate dropdown options for currently registered assets
    const assetOptions = assets.map(a => `<option value="${a.id}">${a.name} (${a.code})</option>`).join('');

    container.innerHTML = `
        <div class="dashboard-title-bar">
            <div>
                <h2>Issue Management</h2>
                <p>Review incoming reports, assign technicians, control status transitions, and preserve service history.</p>
            </div>
            <button class="btn-primary" id="openReportIssueBtn">Report New Issue</button>
        </div>

        <div class="filter-bar">
            <div class="filter-group" style="flex-grow: 1;">
                <label>Search issues</label>
                <input type="text" id="issueSearch" class="filter-control" placeholder="Search title or issue number...">
            </div>
            <div class="filter-group">
                <label>Priority</label>
                <select id="issuePriority" class="filter-control">
                    <option value="All">All</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Status</label>
                <select id="issueStatus" class="filter-control">
                    <option value="All">All</option>
                    <option value="Reported">Reported</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Technician</label>
                <select id="issueTech" class="filter-control">
                    <option value="All">All</option>
                    <option value="Unassigned">Unassigned</option>
                    ${techOptions}
                </select>
            </div>
            <button class="btn-secondary" id="clearIssueFiltersBtn" style="margin-bottom: 2px;">Clear</button>
        </div>

        <div class="section-card" style="padding: 0; overflow: hidden;">
            <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-color);">
                <h3 id="issueCountLabel">Loading issues...</h3>
            </div>
            <div class="issue-table-header">
                <div>Issue Number</div>
                <div>Asset</div>
                <div>Title</div>
                <div>Reporter</div>
                <div>Priority</div>
                <div>Status</div>
                <div>Assigned Technician</div>
                <div>Reported Time</div>
                <div>Action</div>
            </div>
            <div id="issueListContainer"></div>
        </div>

        <div id="reportIssueModal" class="modal-overlay hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Report New Issue</h3>
                    <button class="close-modal" id="closeReportIssueModal">&times;</button>
                </div>
                <form id="reportIssueForm">
                    <div class="form-group">
                        <label>Select Asset</label>
                        <select id="newIssueAssetId" required>
                            <option value="">-- Select an Asset --</option>
                            ${assetOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Issue Description / Title</label>
                        <input type="text" id="newIssueTitle" required placeholder="e.g. Strange noise coming from engine">
                    </div>
                    <div class="form-group">
                        <label>Reporter</label>
                        <input type="text" id="newIssueReporter" required value="Demo User">
                    </div>
                    <div class="form-group">
                        <label>Priority Level</label>
                        <select id="newIssuePriority">
                            <option value="Low">Low</option>
                            <option value="Medium" selected>Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Assign Technician (Optional)</label>
                        <select id="newIssueTech">
                            <option value="Unassigned">Unassigned</option>
                            ${techOptions}
                        </select>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem;">Submit Issue Report</button>
                </form>
            </div>
        </div>
    `;

    const listContainer = document.getElementById('issueListContainer');
    const searchInput = document.getElementById('issueSearch');
    const prioritySelect = document.getElementById('issuePriority');
    const statusSelect = document.getElementById('issueStatus');
    const techSelect = document.getElementById('issueTech');

    function applyIssueFilters() {
        let issues = db.getIssues();
        
        const search = searchInput.value.toLowerCase();
        const priority = prioritySelect.value;
        const status = statusSelect.value;
        const tech = techSelect.value;

        if (search) {
            issues = issues.filter(i => i.title.toLowerCase().includes(search) || i.id.toLowerCase().includes(search));
        }
        if (priority !== 'All') issues = issues.filter(i => i.priority === priority);
        if (status !== 'All') issues = issues.filter(i => i.status === status);
        if (tech !== 'All') issues = issues.filter(i => i.assignedTechnician === tech);

        issues.sort((a, b) => new Date(b.reportedTime) - new Date(a.reportedTime));

        document.getElementById('issueCountLabel').textContent = `${issues.length} issues visible`;
        listContainer.innerHTML = '';

        if(issues.length === 0) {
            listContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-light);">No issues match your criteria.</div>`;
            return;
        }

        issues.forEach(issue => {
            const asset = assets.find(a => a.id === issue.assetId) || { name: 'Unknown' };
            const dateObj = new Date(issue.reportedTime);
            const dateStr = `${dateObj.toLocaleString('default', { month: 'short' })} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
            const timeStr = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

            const row = document.createElement('div');
            row.className = 'issue-row';
            
            if (issue.priority === 'Critical') {
                row.style.borderLeft = '4px solid var(--danger)';
            }

            row.innerHTML = `
                <div class="issue-row-bold">${issue.id}</div>
                <div class="issue-text-wrap" title="${asset.name}">${asset.name}</div>
                <div class="issue-text-wrap" title="${issue.title}">${issue.title}</div>
                <div>${issue.reporter}</div>
                <div><span class="badge badge-${issue.priority.toLowerCase()}">${issue.priority}</span></div>
                <div><span class="badge badge-${issue.status === 'Resolved' ? 'upcoming' : 'assigned'}">${issue.status}</span></div>
                <div>${issue.assignedTechnician}</div>
                <div class="metric-desc">${dateStr}<br>${timeStr}</div>
                <div>
                    <button class="btn-secondary open-issue-btn" data-id="${issue.id}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Open</button>
                </div>
            `;
            listContainer.appendChild(row);
        });

        document.querySelectorAll('.open-issue-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const issueId = e.target.getAttribute('data-id');
                renderIssueDetail(issueId);
            });
        });
    }

    [searchInput, prioritySelect, statusSelect, techSelect].forEach(el => {
        el.addEventListener('input', applyIssueFilters);
    });

    document.getElementById('clearIssueFiltersBtn').addEventListener('click', () => {
        searchInput.value = ''; prioritySelect.value = 'All'; statusSelect.value = 'All'; techSelect.value = 'All';
        applyIssueFilters();
    });

    // NEW: Modal Management for Reporting Issues
    const reportModal = document.getElementById('reportIssueModal');

    // Make sure button exists (hidden for techs based on your logic needs, if desired)
    if (document.getElementById('openReportIssueBtn')) {
        document.getElementById('openReportIssueBtn').addEventListener('click', () => {
            reportModal.classList.remove('hidden');
            document.getElementById('reportIssueForm').reset();
        });
    }

    document.getElementById('closeReportIssueModal').addEventListener('click', () => {
        reportModal.classList.add('hidden');
    });

    document.getElementById('reportIssueForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Grab the assigned tech. If it's not "Unassigned", we need to change status.
        let tech = document.getElementById('newIssueTech').value;
        let finalStatus = (tech === 'Unassigned') ? 'Reported' : 'Assigned';

        const newIssue = {
            assetId: document.getElementById('newIssueAssetId').value,
            title: document.getElementById('newIssueTitle').value,
            reporter: document.getElementById('newIssueReporter').value,
            priority: document.getElementById('newIssuePriority').value,
            assignedTechnician: tech,
            status: finalStatus
        };

        try {
            // Because we wrote `StorageService.js` well, it handles adding this to history!
            db.addIssue(newIssue);
            reportModal.classList.add('hidden');
            applyIssueFilters(); // Refresh the grid
        } catch (error) {
            alert(error.message);
        }
    });

    applyIssueFilters();
}

function renderIssueDetail(issueId) {
    const container = document.getElementById('app-container');
    const issues = db.getIssues();
    const assets = db.getAssets();
    
    const issue = issues.find(i => i.id === issueId);
    if(!issue) return;
    const asset = assets.find(a => a.id === issue.assetId);

    const isResolved = issue.status === 'Resolved';
    const dateObj = new Date(issue.reportedTime);
    const dateStr = `${dateObj.toLocaleString('default', { month: 'short' })} ${dateObj.getDate()}, ${dateObj.getFullYear()}, ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

    container.innerHTML = `
        <div class="detail-header-bar">
            <div>
                <button class="btn-secondary" id="backToIssuesBtn" style="margin-right: 1rem;">&larr; Back to Issues</button>
            </div>
            <button class="btn-secondary" style="color: var(--primary-teal); border-color: #b2f5ea;">Open Asset</button>
        </div>

        <div class="detail-layout">
            <div class="section-card">
                <div class="issue-header-block">
                    <span class="metric-desc">${issue.id}</span>
                    <h2>
                        ${issue.title}
                        <span class="badge badge-${issue.priority.toLowerCase()}">${issue.priority}</span>
                        <span class="badge badge-${isResolved ? 'upcoming' : 'assigned'}">${issue.status}</span>
                    </h2>
                    <p class="metric-desc">${asset.name} • ${asset.location}</p>
                </div>
                
                <p class="issue-description">
                    ${isResolved && issue.resolutionNote ? 
                        `<strong>Resolution Note:</strong> ${issue.resolutionNote}` : 
                        `Control panel shows erratic readings which interrupts readiness checks. Reported for immediate review.`}
                </p>

                <div class="info-grid">
                    <div class="info-box">
                        <label>Reporter</label>
                        <div>${issue.reporter}</div>
                    </div>
                    <div class="info-box">
                        <label>Contact</label>
                        <div>${issue.reporter.split(' ')[0].toLowerCase()}.admin@smit.demo</div>
                    </div>
                    <div class="info-box">
                        <label>Category</label>
                        <div>${asset.category}</div>
                    </div>
                    <div class="info-box">
                        <label>Assigned Technician</label>
                        <div>${issue.assignedTechnician}</div>
                    </div>
                    <div class="info-box">
                        <label>Created Date</label>
                        <div>${dateStr}</div>
                    </div>
                    <div class="info-box">
                        <label>Resolution Date</label>
                        <div>${isResolved ? new Date(issue.lastUpdated).toLocaleDateString() : 'Pending'}</div>
                    </div>
                </div>
            </div>

            <div class="section-card">
                <h3>Role-Based Actions</h3>
                <p class="section-subtitle">Administrator controls</p>
                
                ${!isResolved ? `
                <div class="admin-controls">
                    <button class="btn-control primary">Assign Technician</button>
                    <button class="btn-control">Change Priority</button>
                    <button class="btn-control">Update Status</button>
                    <button class="btn-control">Add Internal Note</button>
                    <button class="btn-control" id="resolveIssueBtn" style="border-color: var(--success); color: var(--success);">Close Issue</button>
                </div>
                ` : `
                <div style="padding: 1rem; background: #f0fff4; color: var(--success); border-radius: 6px; font-weight: 600; text-align: center;">
                    Issue Successfully Closed
                </div>
                `}

                <div class="business-rules-note">
                    <strong>Business rules</strong><br>
                    Resolved issues require at least one work note. Closed issues must be reopened before editing. Critical issues visually escalate the record.
                </div>
            </div>
        </div>
    `;

    document.getElementById('backToIssuesBtn').addEventListener('click', renderIssues);

    if (!isResolved) {
        document.getElementById('resolveIssueBtn').addEventListener('click', () => {
            const note = prompt("MAINTENANCE REQUIREMENT:\nPlease enter a required maintenance/resolution note to close this issue:");
            if (note === null) return;
            if (note.trim() === '') {
                alert("Error: A resolution note is STRICTLY required to close an issue. Status not updated.");
                return;
            }
            try {
                db.resolveIssue(issue.id, note);
                renderIssueDetail(issue.id);
            } catch (error) {
                alert(error.message);
            }
        });
    }
}

// =====================================
// SCHEDULES RENDERER
// =====================================
function renderSchedules() {
    const container = document.getElementById('app-container');
    const data = db.getData();
    
    if (!data.schedules || data.schedules.length === 0) {
        data.schedules = [
            { id: 'SCH-1', category: 'Quarterly Inspection', assetName: 'Fire Extinguisher Block A', date: '2026-07-12', tech: 'Ahmed Raza', priority: 'Medium', status: 'Upcoming', desc: 'Compliance deadline this week.' },
            { id: 'SCH-2', category: 'Monthly Maintenance', assetName: 'Main Office AC 03', date: '2026-07-15', tech: 'Sara Ali', priority: 'High', status: 'Upcoming', desc: 'Cooling performance check after recent corrective work.' },
            { id: 'SCH-3', category: 'Emergency Repair', assetName: 'Backup Generator', date: '2026-07-09', tech: 'Bilal Khan', priority: 'Critical', status: 'Overdue', desc: 'Pending parts delivery. Escalate if further power interruptions occur.' },
            { id: 'SCH-4', category: 'Preventive Maintenance', assetName: 'Classroom Projector 01', date: '2026-08-05', tech: 'Ahmed Raza', priority: 'Medium', status: 'Upcoming', desc: 'Clean filter and inspect HDMI interface.' },
            { id: 'SCH-5', category: 'Cleaning', assetName: 'Water Dispenser 05', date: '2026-06-28', tech: 'Sara Ali', priority: 'Low', status: 'Completed', desc: 'Completed sanitation cycle.' }
        ];
        db.saveData(data);
    }

    const statusOrder = { 'Overdue': 1, 'Upcoming': 2, 'Completed': 3 };
    const sortedSchedules = [...data.schedules].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    container.innerHTML = `
        <div class="dashboard-title-bar">
            <div>
                <h2>Scheduled Maintenance</h2>
                <p>Plan one-time services, recurring maintenance, and overdue follow-up across all assets.</p>
            </div>
            <button class="btn-primary">Create Schedule</button>
        </div>
        <div class="schedule-grid" id="scheduleGridContainer"></div>
    `;

    const gridContainer = document.getElementById('scheduleGridContainer');

    sortedSchedules.forEach(sch => {
        let badgeClass = 'upcoming'; 
        if (sch.status === 'Overdue') badgeClass = 'overdue';
        if (sch.status === 'Completed') badgeClass = 'low'; 

        const isOverdue = sch.status === 'Overdue';

        const card = document.createElement('div');
        card.className = `schedule-card ${isOverdue ? 'overdue-card' : ''}`;
        
        card.innerHTML = `
            <div class="schedule-header">
                <div class="schedule-category">${sch.category}</div>
                <span class="badge badge-${badgeClass}">${sch.status}</span>
            </div>
            <div class="schedule-asset-name">${sch.assetName}</div>
            <div class="schedule-meta-grid">
                <div class="schedule-meta-box full-width">
                    <div class="meta-value">${sch.date}</div>
                    <div class="meta-label">Date</div>
                </div>
                <div class="schedule-meta-box">
                    <div class="meta-value">${sch.tech}</div>
                    <div class="meta-label">Technician</div>
                </div>
                <div class="schedule-meta-box">
                    <div class="meta-value">${sch.priority}</div>
                    <div class="meta-label">Priority</div>
                </div>
            </div>
            <div class="schedule-description">${sch.desc}</div>
        `;
        gridContainer.appendChild(card);
    });
}

// =====================================
// TECHNICIANS RENDERER
// =====================================
function renderTechnicians() {
    const container = document.getElementById('app-container');
    const data = db.getData();
    
    if (data.technicians.length < 3) {
        if (!data.technicians.find(t => t.name === 'Sara Ali')) {
            data.technicians.push({ id: 'TECH-3', name: 'Sara Ali', role: 'Electrical Technician' });
            db.saveData(data);
        }
    }

    const technicians = data.technicians;
    const allIssues = db.getIssues();

    container.innerHTML = `
        <div class="dashboard-title-bar">
            <div>
                <h2>Technician Coverage</h2>
                <p>Review technician workload, assigned issues, and due maintenance commitments.</p>
            </div>
        </div>
        <div class="tech-grid" id="techGridContainer"></div>
    `;

    const gridContainer = document.getElementById('techGridContainer');

    technicians.forEach(tech => {
        const assignedIssues = allIssues.filter(i => i.assignedTechnician === tech.name && i.status !== 'Resolved');
        const completedIssues = allIssues.filter(i => i.assignedTechnician === tech.name && i.status === 'Resolved');
        
        const initials = tech.name.split(' ').map(n => n[0]).join('').toUpperCase();

        const card = document.createElement('div');
        card.className = 'tech-card';

        let queueHTML = '';
        if (assignedIssues.length === 0) {
            queueHTML = `<div class="metric-desc" style="padding: 1rem 0;">No active assignments.</div>`;
        } else {
            assignedIssues.slice(0, 3).forEach(issue => {
                queueHTML += `
                    <div class="tech-issue-item">
                        <div class="tech-issue-id">${issue.id}</div>
                        <div class="tech-issue-desc" title="${issue.title}">${issue.title}</div>
                    </div>
                `;
            });
        }

        card.innerHTML = `
            <div class="tech-header">
                <div class="tech-identity">
                    <div class="tech-avatar">${initials}</div>
                    <div class="tech-info">
                        <h3>${tech.name}</h3>
                        <p>${tech.role}</p>
                    </div>
                </div>
                <span class="badge badge-upcoming">Operational</span>
            </div>
            <div class="tech-stats">
                <div class="tech-stat-box">
                    <div class="tech-stat-number">${assignedIssues.length}</div>
                    <div class="tech-stat-label">Assigned issues</div>
                </div>
                <div class="tech-stat-box">
                    <div class="tech-stat-number">0</div>
                    <div class="tech-stat-label">Due today</div>
                </div>
                <div class="tech-stat-box">
                    <div class="tech-stat-number">${completedIssues.length}</div>
                    <div class="tech-stat-label">Completed</div>
                </div>
            </div>
            <div class="tech-queue-title">Active Work Queue</div>
            <div>${queueHTML}</div>
        `;
        gridContainer.appendChild(card);
    });
}

// =====================================
// ANALYTICS RENDERER
// =====================================
function renderAnalytics() {
    const container = document.getElementById('app-container');
    const assets = db.getAssets();
    const issues = db.getIssues();

    const categoryCounts = {};
    assets.forEach(a => { categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1; });
    
    const allCategories = ['Projector', 'Air Conditioner', 'Generator', 'Printer', 'Water Dispenser', 'Safety Equipment', 'Power System', 'Laptop'];
    allCategories.forEach(c => { if(categoryCounts[c] === undefined) categoryCounts[c] = 0; });
    
    const maxAssetsInCat = Math.max(...Object.values(categoryCounts), 1); 

    let barChartHTML = '';
    allCategories.forEach(cat => {
        const count = categoryCounts[cat];
        const heightPct = (count / maxAssetsInCat) * 100;
        barChartHTML += `
            <div class="v-bar-group">
                <div class="v-bar-wrapper">
                    <div class="v-bar-value">${count > 0 ? count : ''}</div>
                    <div class="v-bar-fill" style="height: ${heightPct}%"></div>
                </div>
                <div class="v-bar-label">${cat.replace(' ', '<br>')}</div>
            </div>
        `;
    });

    const conditionColors = { 'Good': '#3182ce', 'Fair': '#d69e2e', 'Poor': '#e53e3e', 'Excellent': '#38a169' };
    const conditionCounts = { 'Good': 0, 'Fair': 0, 'Poor': 0, 'Excellent': 0 };
    assets.forEach(a => { if(conditionCounts[a.condition] !== undefined) conditionCounts[a.condition]++; });

    let conicString = '';
    let currentDegree = 0;
    const totalAssets = assets.length;
    let legendHTML = '';

    Object.entries(conditionCounts).forEach(([condition, count], index) => {
        if (count > 0) {
            const degrees = (count / totalAssets) * 360;
            const color = conditionColors[condition];
            conicString += `${color} ${currentDegree}deg ${currentDegree + degrees}deg${index < Object.keys(conditionCounts).length - 1 ? ',' : ''}`;
            currentDegree += degrees;
        }
        legendHTML += `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${conditionColors[condition]}"></div>
                <div style="width: 60px;">${condition}</div>
                <div style="font-weight: bold;">${count}</div>
            </div>
        `;
    });

    if(conicString.endsWith(',')) conicString = conicString.slice(0, -1);
    if(totalAssets === 0) conicString = '#e2e8f0 0deg 360deg';

    container.innerHTML = `
        <div class="dashboard-title-bar">
            <div>
                <h2>Analytics & Reports</h2>
                <p>Explore asset composition, issue load, repair frequency, and maintenance cost trends in the demo environment.</p>
            </div>
        </div>
        <div class="analytics-grid">
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-subtitle">Asset Mix</div>
                    <h3>Assets by category</h3>
                </div>
                <div class="v-bar-chart">${barChartHTML}</div>
            </div>
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-subtitle">Condition Spread</div>
                    <h3>Assets by condition</h3>
                </div>
                <div class="donut-chart-container">
                    <div class="donut-chart" style="background: conic-gradient(${conicString});">
                        <div class="donut-hole">
                            <div class="donut-hole-value">${totalAssets}</div>
                            <div class="donut-hole-label">Assets</div>
                        </div>
                    </div>
                    <div class="donut-legend">${legendHTML}</div>
                </div>
            </div>
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-subtitle">Issue Load</div>
                    <h3>Issues by status</h3>
                </div>
                <div class="donut-chart-container">
                     <div class="donut-chart" style="background: conic-gradient(#3182ce 0deg 180deg, #d69e2e 180deg 270deg, #e53e3e 270deg 360deg);">
                        <div class="donut-hole">
                            <div class="donut-hole-value">${issues.length}</div>
                            <div class="donut-hole-label">Total Logs</div>
                        </div>
                    </div>
                    <div class="donut-legend">
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: #3182ce"></div>
                            <div style="width: 140px;">Maintenance In Progress</div>
                            <div style="font-weight: bold;">${issues.filter(i => i.status === 'In Progress' || i.status === 'Assigned').length}</div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: #d69e2e"></div>
                            <div style="width: 140px;">Reported / Unassigned</div>
                            <div style="font-weight: bold;">${issues.filter(i => i.status === 'Reported').length}</div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: #e53e3e"></div>
                            <div style="width: 140px;">Waiting for Parts</div>
                            <div style="font-weight: bold;">0</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-subtitle">Resolution</div>
                    <h3>Operational report summary</h3>
                </div>
                <div class="resolution-grid">
                    <div class="res-metric">
                        <div class="res-metric-value">0 days</div>
                        <div class="res-metric-label">Average resolution time</div>
                    </div>
                    <div class="res-metric">
                        <div class="res-metric-value">${issues.filter(i => i.status === 'Resolved').length}</div>
                        <div class="res-metric-label">Resolved issues</div>
                    </div>
                    <div class="res-metric">
                        <div class="res-metric-value">${assets.filter(a => a.status === 'Operational').length}</div>
                        <div class="res-metric-label">Operational Assets</div>
                    </div>
                    <div class="res-metric" style="border-color: var(--danger); background-color: #fff5f5;">
                        <div class="res-metric-value" style="color: var(--danger);">${issues.filter(i => i.priority === 'Critical').length}</div>
                        <div class="res-metric-label">Critical Issues Open</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// =====================================
// NOTIFICATIONS RENDERER
// =====================================
function renderNotifications() {
    const container = document.getElementById('app-container');
    const history = db.getData().history.reverse(); 

    container.innerHTML = `
        <div class="dashboard-title-bar">
            <div>
                <h2>Notifications</h2>
                <p>Stay aware of new issues, critical assignments, overdue service, and status changes.</p>
            </div>
            <button class="btn-secondary" style="background-color: white;">Mark All as Read</button>
        </div>
        <div class="notification-list" id="notificationListContainer"></div>
    `;

    const listContainer = document.getElementById('notificationListContainer');

    if (history.length === 0) {
        listContainer.innerHTML = `<div class="section-card" style="text-align:center;">No recent notifications.</div>`;
        return;
    }

    history.forEach(log => {
        const dateObj = new Date(log.timestamp);
        const dateStr = `${dateObj.toLocaleString('default', { month: 'short' })} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
        const timeStr = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        let badgeType = 'low';
        if(log.action.includes('Reported')) badgeType = 'reported';
        if(log.action.includes('Resolved')) badgeType = 'upcoming';
        if(log.action.includes('Overdue') || log.action.includes('Critical')) badgeType = 'critical';

        listContainer.innerHTML += `
            <div class="notification-card">
                <div class="notif-content">
                    <div class="notif-title">
                        ${log.action}
                        <span class="badge badge-${badgeType}">${log.action.split(' ')[1] || 'System'}</span>
                    </div>
                    <div class="notif-desc">${log.description}</div>
                    <div class="notif-time">${dateStr}, ${timeStr}</div>
                </div>
                <div class="notif-actions">
                    <button class="btn-secondary" style="border: none; background: none; color: var(--text-light);">Mark read</button>
                    <button class="btn-secondary" style="color: var(--primary-teal); border-color: #b2f5ea; background: #e6fffa;">Open related</button>
                </div>
            </div>
        `;
    });
}