// Settings management functionality
class SettingsManager {
    constructor(api) {
        this.api = api;
        this.settings = {
            company: {
                name: 'Adams Family Household',
                email: 'jason.k.r.adams@gmail.com',
                phone: '(425) 879-9792',
                website: '',
                address: '16112 E 23rd Ct, Spokane Valley, WA 99037'
            },
            dataDirectory: 'data'
        };
        this.init();
    }

    init() {
        this.loadSettings();
        this.populateForm();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle && window.themeManager) {
            themeToggle.addEventListener('click', () => {
                window.themeManager.toggleTheme();
            });
        }

        // Directory picker
        this.setupDirectoryPicker();
    }

    setupDirectoryPicker() {
        const browseBtn = document.getElementById('browseDirectory');
        const dataDirectoryField = document.getElementById('dataDirectory');

        if (browseBtn && dataDirectoryField) {
            browseBtn.addEventListener('click', async () => {
                try {
                    // Use the File System Access API if available (Chrome/Edge)
                    if ('showDirectoryPicker' in window) {
                        const dirHandle = await window.showDirectoryPicker();
                        console.log('Directory handle:', dirHandle);
                        
                        // Create a temporary file in the selected directory to get the full path
                        let fullPath = '';
                        
                        try {
                            // Create a temporary file to extract the path
                            const tempFileName = '.temp_path_' + Date.now();
                            const tempFileHandle = await dirHandle.getFileHandle(tempFileName, { create: true });
                            const tempFile = await tempFileHandle.getFile();
                            
                            // Extract path from the webkitRelativePath or use other methods
                            if (tempFile.webkitRelativePath) {
                                const pathParts = tempFile.webkitRelativePath.split('/');
                                pathParts.pop(); // Remove the temp file name
                                fullPath = '/' + pathParts.join('/');
                            } else {
                                // Alternative: try to get path from file system
                                const fileSystemPath = await tempFileHandle.getFile().then(file => {
                                    // Try to extract path information
                                    return file.name ? file.name.replace(tempFileName, '') : '';
                                });
                                
                                if (fileSystemPath) {
                                    fullPath = fileSystemPath;
                                }
                            }
                            
                            // Clean up the temporary file
                            try {
                                await dirHandle.removeEntry(tempFileName);
                            } catch (cleanupError) {
                                console.log('Could not clean up temp file:', cleanupError);
                            }
                            
                        } catch (error) {
                            console.log('Could not create temp file for path extraction:', error);
                            
                            // Fallback: try to use the Origin Private File System API
                            try {
                                // Use the newer API methods if available
                                if (navigator.storage && navigator.storage.getDirectory) {
                                    const opfsRoot = await navigator.storage.getDirectory();
                                    // This is still limited but might give us more info
                                    console.log('OPFS available, but limited path info');
                                }
                            } catch (opfsError) {
                                console.log('OPFS not available:', opfsError);
                            }
                        }
                        
                        // If we still don't have a path, use just the directory name as a relative path
                        if (!fullPath && dirHandle.name) {
                            // Use directory name and show a helpful message
                            fullPath = dirHandle.name;
                            console.log('Using directory name as path:', fullPath);
                            
                            // Show a brief notification that the user should edit the path
                            setTimeout(() => {
                                const field = document.getElementById('dataDirectory');
                                if (field) {
                                    field.focus();
                                    field.select();
                                    // Show a temporary tooltip-like message
                                    const message = document.createElement('div');
                                    message.textContent = 'Please edit this to the full path (e.g., /Users/username/Google Drive/My Drive/Invoices/Adams Household)';
                                    message.style.cssText = 'position: absolute; background: #333; color: white; padding: 8px; border-radius: 4px; font-size: 12px; z-index: 1000; max-width: 300px; margin-top: 5px;';
                                    field.parentNode.appendChild(message);
                                    
                                    // Remove message after 5 seconds
                                    setTimeout(() => {
                                        if (message.parentNode) {
                                            message.parentNode.removeChild(message);
                                        }
                                    }, 5000);
                                }
                            }, 100);
                        }
                        
                        if (fullPath) {
                            console.log('Using path:', fullPath);
                            dataDirectoryField.value = fullPath;
                            this.settings.dataDirectory = fullPath;
                            console.log('Updated settings.dataDirectory to:', this.settings.dataDirectory);
                            this.saveSettings();
                        } else {
                            console.log('Could not determine path from directory picker');
                            alert('Could not determine the directory path. Please try using the text field directly.');
                        }
                    } else {
                        // Fallback: prompt user to manually enter absolute path
                        const userPath = prompt('Please enter the absolute directory path (e.g., /Users/username/Documents/invoices):', this.settings.dataDirectory);
                        if (userPath && userPath.trim()) {
                            dataDirectoryField.value = userPath.trim();
                            this.settings.dataDirectory = userPath.trim();
                            this.saveSettings();
                        }
                    }
                } catch (error) {
                    // User cancelled or error occurred
                    console.log('Directory selection cancelled or failed:', error);
                }
            });
        }
    }

    loadSettings() {
        // Load settings from localStorage
        const savedSettings = localStorage.getItem('invoiceSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                this.settings = { ...this.settings, ...parsed };
                console.log('Loaded settings from localStorage:', this.settings);
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        } else {
            console.log('No saved settings found, using defaults');
        }
    }

    populateForm() {
        // Populate company information
        DOMUtils.setElementValue('companyName', this.settings.company.name);
        DOMUtils.setElementValue('companyEmail', this.settings.company.email);
        DOMUtils.setElementValue('companyPhone', this.settings.company.phone);
        DOMUtils.setElementValue('companyWebsite', this.settings.company.website);
        DOMUtils.setElementValue('companyAddress', this.settings.company.address);
        
        // Populate data directory - debug logging
        console.log('Populating dataDirectory with:', this.settings.dataDirectory);
        DOMUtils.setElementValue('dataDirectory', this.settings.dataDirectory);
    }

    saveSettings() {
        try {
            // Collect form data
            this.settings.company.name = DOMUtils.getElementValue('companyName') || 'Adams Family Household';
            this.settings.company.email = DOMUtils.getElementValue('companyEmail') || 'jason.k.r.adams@gmail.com';
            this.settings.company.phone = DOMUtils.getElementValue('companyPhone') || '(425) 879-9792';
            this.settings.company.website = DOMUtils.getElementValue('companyWebsite') || '';
            this.settings.company.address = DOMUtils.getElementValue('companyAddress') || '16112 E 23rd Ct, Spokane Valley, WA 99037';
            
            // Don't override dataDirectory if it was set by directory picker
            const currentDataDir = DOMUtils.getElementValue('dataDirectory');
            if (currentDataDir && currentDataDir !== 'data') {
                this.settings.dataDirectory = currentDataDir;
            } else if (!this.settings.dataDirectory || this.settings.dataDirectory === 'data') {
                this.settings.dataDirectory = 'data';
            }

            console.log('Saving settings with dataDirectory:', this.settings.dataDirectory);

            // Save to localStorage
            localStorage.setItem('invoiceSettings', JSON.stringify(this.settings));

            // Send to backend if API endpoint exists
            this.sendSettingsToBackend();

            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings. Please try again.');
        }
    }

    async sendSettingsToBackend() {
        try {
            // Send settings to backend using the API client
            await this.api.updateSettings(this.settings);
        } catch (error) {
            console.warn('Failed to save settings to backend:', error);
        }
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
            // Reset to defaults
            this.settings = {
                company: {
                    name: 'Adams Family Household',
                    email: 'jason.k.r.adams@gmail.com',
                    phone: '(425) 879-9792',
                    website: '',
                    address: '16112 E 23rd Ct, Spokane Valley, WA 99037'
                },
                dataDirectory: 'data'
            };

            // Clear localStorage
            localStorage.removeItem('invoiceSettings');

            // Repopulate form
            this.populateForm();

            alert('Settings reset to defaults.');
        }
    }

    getCompanyInfo() {
        return this.settings.company;
    }

    getDataDirectory() {
        return this.settings.dataDirectory;
    }
}

// Global functions for HTML onclick handlers
function saveSettings() {
    if (window.settingsManager) {
        window.settingsManager.saveSettings();
    }
}

function resetSettings() {
    if (window.settingsManager) {
        window.settingsManager.resetSettings();
    }
}
