// StorageService.js
class StorageService {
    constructor() {
        this.storageKey = 'maintainIQ_data';
        this.initializeData();
    }

    // 1. Core Data Retrieval
    getData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : { assets: [], issues: [], history: [], schedules: [], technicians: [] };
    }

    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // 2. Asset Management
    getAssets() {
        return this.getData().assets;
    }

    addAsset(assetObj) {
        const data = this.getData();
        
        // Business Rule: Reject duplicate asset codes
        const exists = data.assets.some(a => a.code.toLowerCase() === assetObj.code.toLowerCase());
        if (exists) {
            throw new Error(`Asset code ${assetObj.code} already exists!`);
        }

        // Add ID and generate QR URL (using a free API for vanilla JS)
        const newAsset = {
            ...assetObj,
            id: 'AST-' + Date.now(),
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(assetObj.code)}`
        };

        data.assets.push(newAsset);
        this.saveData(data);
        
        // Auto-generate history entry
        this.addHistoryRecord(newAsset.id, "Asset Registered", "Initial asset onboarding into MaintainIQ.");
        
        return newAsset;
    }

    // 3. Issue Reporting & Status Workflow
    getIssues() {
        return this.getData().issues;
    }

    addIssue(issueObj) {
        const data = this.getData();
        const newIssue = {
            ...issueObj,
            id: 'ISS-' + Date.now(),
            status: 'Reported',
            reportedTime: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        data.issues.push(newIssue);
        this.saveData(data);

        // Update asset status and add history
        this.updateAssetStatus(newIssue.assetId, 'Issue Reported');
        this.addHistoryRecord(newIssue.assetId, "Issue Reported", `Issue #${newIssue.id}: ${newIssue.title} logged.`);
        
        return newIssue;
    }

    resolveIssue(issueId, resolutionNote) {
        if (!resolutionNote || resolutionNote.trim() === '') {
            throw new Error("A maintenance note is strictly required to resolve an issue.");
        }

        const data = this.getData();
        const issueIndex = data.issues.findIndex(i => i.id === issueId);
        
        if (issueIndex === -1) return false;

        data.issues[issueIndex].status = 'Resolved';
        data.issues[issueIndex].resolutionNote = resolutionNote;
        data.issues[issueIndex].lastUpdated = new Date().toISOString();
        
        this.saveData(data);

        this.updateAssetStatus(data.issues[issueIndex].assetId, 'Operational');
        this.addHistoryRecord(data.issues[issueIndex].assetId, "Issue Resolved", `Resolution Note: ${resolutionNote}`);
        
        return true;
    }

    // 4. Asset History Timeline
    addHistoryRecord(assetId, action, description) {
        const data = this.getData();
        const record = {
            id: 'HIST-' + Date.now(),
            assetId,
            action,
            description,
            timestamp: new Date().toISOString()
        };
        data.history.push(record);
        this.saveData(data);
    }

    updateAssetStatus(assetId, newStatus) {
        const data = this.getData();
        const asset = data.assets.find(a => a.id === assetId);
        if (asset) {
            asset.status = newStatus;
            this.saveData(data);
        }
    }

    // 5. Preloaded Data Injection
    initializeData() {
        if (!localStorage.getItem(this.storageKey)) {
            this.resetDemoData();
        }
    }

    resetDemoData() {
        const mockData = {
            assets: [
                { id: 'AST-1', code: 'GEN-HQ-002', name: 'Backup Generator', category: 'Generator', location: 'Server Room', condition: 'Poor', status: 'Out of Service', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GEN-HQ-002' },
                { id: 'AST-2', code: 'PTR-LAB-002', name: 'IT Lab Printer 02', category: 'Printer', location: 'IT Lab', condition: 'Good', status: 'Issue Reported', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PTR-LAB-002' },
                { id: 'AST-3', code: 'AC-KHI-003', name: 'Main Office AC 03', category: 'Air Conditioner', location: 'Main Office', condition: 'Fair', status: 'Under Maintenance', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AC-KHI-003' },
                { id: 'AST-4', code: 'LTP-REC-004', name: 'Reception Laptop 04', category: 'Laptop', location: 'Reception', condition: 'Good', status: 'Operational', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=LTP-REC-004' },
                { id: 'AST-5', code: 'WTR-CAF-005', name: 'Water Dispenser 05', category: 'Water Dispenser', location: 'Cafeteria', condition: 'Fair', status: 'Operational', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=WTR-CAF-005' }
            ],
            issues: [
                { id: 'ISS-2026-0048', assetId: 'AST-1', title: 'Fuel level sensor fault', reporter: 'Imran Javaid', priority: 'Critical', status: 'Assigned', assignedTechnician: 'Bilal Khan', reportedTime: '2026-07-10T16:20:00Z', lastUpdated: '2026-07-10T16:40:00Z' },
                { id: 'ISS-2026-0043', assetId: 'AST-2', title: 'Printer pulling multiple sheets', reporter: 'Faraz Iqbal', priority: 'Medium', status: 'Reported', assignedTechnician: 'Unassigned', reportedTime: '2026-07-10T11:10:00Z', lastUpdated: '2026-07-10T11:10:00Z' }
            ],
            history: [],
            schedules: [],
            technicians: [
                { id: 'TECH-1', name: 'Bilal Khan', role: 'Mechanical Technician' },
                { id: 'TECH-2', name: 'Ahmed Raza', role: 'Senior Maintenance Technician' }
            ]
        };
        this.saveData(mockData);
        console.log("MaintainIQ: Demo data injected into LocalStorage.");
    }
}

// Instantiate globally for the frontend to use
const db = new StorageService();