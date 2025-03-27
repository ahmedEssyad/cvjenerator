document.addEventListener('DOMContentLoaded', () => {
    // Constants
    const FORM_SELECTOR = '#cv-form';
    const PREVIEW_SELECTOR = '#cv-content';
    const ZOOM_INCREMENT = 10;
    const MAX_ZOOM = 200;
    const MIN_ZOOM = 50;

    // State
    let currentZoom = 100;
    let isProcessing = false;

    // Cached DOM elements
    const form = document.querySelector(FORM_SELECTOR);
    const preview = document.querySelector(PREVIEW_SELECTOR);

    // Initialize Resume AI
    let resumeAI = null;

    // Initialize the AI system
    const initializeAI = async () => {
        if (!resumeAI) {
            resumeAI = new ResumeAI(DEFAULT_DATASET);
            await resumeAI.initialize();
        }
        return resumeAI;
    };

    // Debounce utility
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Initialize Bootstrap components
    const initializeBootstrapComponents = () => {
        try {
            document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => 
                new bootstrap.Tooltip(el)
            );
        } catch (error) {
            console.error('Bootstrap initialization failed:', error);
        }
    };

    // Toggle section (keep as regular function for proper 'this' binding)
    function toggleSection() {
        const targetId = this.getAttribute('data-toggle');
        const target = document.getElementById(targetId);
        const isCollapsed = target.classList.toggle('collapsed');
        this.classList.toggle('collapsed');
        this.setAttribute('aria-expanded', !isCollapsed);
    }

    // Add default experience entry
    const addDefaultExperience = () => {
        // Create a default experience entry from scratch
        const container = document.getElementById('experience-container');
        
        // Create a new experience entry
        const entry = document.createElement('div');
        entry.className = 'experience-entry entry-container';
        entry.innerHTML = `
            <div class="d-flex align-items-center mb-3">
                <i class="fas fa-grip-vertical drag-handle"></i>
                <h5 class="mb-0 me-auto">Experience Entry</h5>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary enhance-entry" type="button" data-target="experience">
                        <i class="fas fa-wand-magic-sparkles"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger remove-entry" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Company*</label>
                <input type="text" class="form-control required company" required>
                <div class="invalid-feedback">Please enter a company name</div>
            </div>
            <div class="mb-3">
                <label class="form-label">Role*</label>
                <input type="text" class="form-control required role" required>
                <div class="invalid-feedback">Please enter your role</div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <label class="form-label">Start Date*</label>
                    <input type="text" class="form-control required start-date" placeholder="MM/YYYY" required>
                    <div class="invalid-feedback">Required field</div>
                </div>
                <div class="col">
                    <label class="form-label">End Date</label>
                    <input type="text" class="form-control end-date" placeholder="MM/YYYY or Present">
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Location</label>
                <input type="text" class="form-control location" placeholder="City, Country">
            </div>
            <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea class="form-control description" rows="2"></textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">Key Achievements</label>
                <div class="achievement-container">
                    <div class="input-group mb-2">
                        <input type="text" class="form-control achievement-item" placeholder="e.g. Reduced system latency by 40%">
                        <button class="btn btn-outline-primary add-achievement" type="button" title="Add achievement" aria-label="Add achievement">
                            <i class="fas fa-plus" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
                <ul class="achievement-list list-group">
                    <!-- Achievements will be added here -->
                </ul>
            </div>
        `;
        
        container.appendChild(entry);
        setupEntryEventListeners(entry);
    };

    // Add experience
    const addExperience = () => {
        const container = document.getElementById('experience-container');
        const existingEntry = container.querySelector('.experience-entry');
        
        if (existingEntry) {
            // Clone the existing entry if there is one
            const template = existingEntry.cloneNode(true);
            template.querySelectorAll('input, textarea').forEach(input => input.value = '');
            template.querySelector('.achievement-list').innerHTML = '';
            setupEntryEventListeners(template);
            container.appendChild(template);
        } else {
            // Create a new entry if there isn't one to clone
            addDefaultExperience();
        }
        
        initializeDateFields();
        updateProgress();
    };

    // Initialize date fields
    const initializeDateFields = () => {
        // Format current date as MM/YYYY
        const today = new Date();
        const currentMonthYear = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        
        // Set default end date for new experience entries
        document.querySelectorAll('.end-date').forEach(field => {
            if (!field.value) {
                field.placeholder = 'Present';
            }
        });
        
        // Set default value for start date fields if empty
        document.querySelectorAll('.start-date').forEach(field => {
            if (!field.value) {
                field.placeholder = currentMonthYear;
            }
        });
        
        // Add date validation and formatting
        document.querySelectorAll('.start-date, .end-date').forEach(field => {
            field.addEventListener('blur', function() {
                if (this.value && !/^(0[1-9]|1[0-2])\/\d{4}$/.test(this.value) && this.value.toLowerCase() !== 'present') {
                    // Try to format the input as MM/YYYY
                    const dateMatch = this.value.match(/(\d{1,2})[\/\-](\d{4})/);
                    if (dateMatch) {
                        const month = dateMatch[1].padStart(2, '0');
                        this.value = `${month}/${dateMatch[2]}`;
                    } else {
                        this.classList.add('is-invalid');
                    }
                } else {
                    this.classList.remove('is-invalid');
                }
            });
        });
    };

    // Set up entry event listeners
    const setupEntryEventListeners = (entry) => {
        entry.querySelector('.remove-entry').addEventListener('click', () => {
            if (document.querySelectorAll('.experience-entry').length > 1) {
                entry.remove();
                updateProgress();
            } else {
                showToast('Cannot remove the last entry', 'warning');
            }
        });

        entry.querySelector('.add-achievement').addEventListener('click', () => addAchievement(entry));
        entry.querySelector('.achievement-item').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addAchievement(entry);
            }
        });

        // Enhanced version with AI
        entry.querySelector('.enhance-entry').addEventListener('click', async () => {
            showToast('AI enhancement in progress...', 'info');
            
            try {
                const ai = await initializeAI();
                
                // Enhance achievements
                const list = entry.querySelector('.achievement-list');
                const items = list.querySelectorAll('li');
                
                if (items.length > 0) {
                    // Enhance existing achievements
                    items.forEach(item => {
                        const achievementText = item.querySelector('.achievement-text');
                        if (achievementText) {
                            const originalText = achievementText.textContent;
                            achievementText.textContent = ai.enhanceAchievement(originalText);
                        }
                    });
                } else {
                    // If no achievements, suggest adding some based on the role and description
                    const role = entry.querySelector('.role').value;
                    const description = entry.querySelector('.description').value;
                    
                    if (role || description) {
                        // Generate a suggested achievement
                        const actionVerbs = ai.getActionVerbs();
                        const randomVerb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
                        
                        let achievementSuggestion = '';
                        if (role.includes('develop') || role.includes('engineer')) {
                            achievementSuggestion = `${randomVerb} new features that improved application performance`;
                        } else if (role.includes('manage') || role.includes('lead')) {
                            achievementSuggestion = `${randomVerb} team initiatives that increased productivity`;
                        } else {
                            achievementSuggestion = `${randomVerb} key projects that delivered business value`;
                        }
                        
                        // Add the suggested achievement
                        const enhancedAchievement = ai.enhanceAchievement(achievementSuggestion);
                        
                        // Create a new achievement item
                        const item = document.createElement('li');
                        item.innerHTML = `
                            <span class="achievement-text">${enhancedAchievement}</span>
                            <button class="btn btn-sm btn-link text-danger remove-achievement" title="Remove achievement" aria-label="Remove achievement">
                                <i class="fas fa-times" aria-hidden="true"></i>
                            </button>
                        `;
                        
                        item.querySelector('.remove-achievement').addEventListener('click', () => {
                            item.remove();
                            updateCV();
                        });
                        
                        list.appendChild(item);
                    }
                }
                
                updateCV();
                showToast('Experience entry enhanced!', 'success');
            } catch (error) {
                console.error('Enhancement failed:', error);
                showToast('Enhancement failed. Please try again.', 'danger');
            }
        });
    };

    // Add achievement
    const addAchievement = (entry) => {
        const input = entry.querySelector('.achievement-item');
        const text = input.value.trim();
        
        if (!text) return;
        
        const list = entry.querySelector('.achievement-list');
        const item = document.createElement('li');
        item.innerHTML = `
            <span class="achievement-text">${text}</span>
            <button class="btn btn-sm btn-link text-danger remove-achievement" title="Remove achievement" aria-label="Remove achievement">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        `;
        
        item.querySelector('.remove-achievement').addEventListener('click', () => {
            item.remove();
            updateCV();
        });
        
        list.appendChild(item);
        input.value = '';
        updateCV();
    };

    // Add skill
    const addSkill = () => {
        const input = document.getElementById('skill-input');
        const skill = input.value.trim();
        
        if (!skill) return;
        
        const skillTag = document.createElement('span');
        skillTag.className = 'skill-tag';
        skillTag.innerHTML = `
            ${skill}
            <i class="fas fa-times remove-skill"></i>
        `;
        
        skillTag.querySelector('.remove-skill').addEventListener('click', () => {
            skillTag.remove();
            updateCV();
        });
        
        document.getElementById('skill-tags').appendChild(skillTag);
        input.value = '';
        updateCV();
    };

    // AI-enhanced skill suggestion
    const suggestSkills = async () => {
        showToast('Analyzing your experience...', 'info');
        
        try {
            const ai = await initializeAI();
            
            // Get role from title
            const role = document.getElementById('title').value || 'Software Engineer';
            
            // Get AI suggestions
            const suggestedSkills = ai.suggestSkills(role);
            
            // Add suggested skills
            suggestedSkills.forEach(skill => {
                // Check if skill already exists
                let exists = false;
                document.querySelectorAll('#skill-tags .skill-tag').forEach(tag => {
                    if (tag.childNodes[0].textContent.trim().toLowerCase() === skill.toLowerCase()) {
                        exists = true;
                    }
                });
                
                if (!exists) {
                    const skillTag = document.createElement('span');
                    skillTag.className = 'skill-tag';
                    skillTag.innerHTML = `
                        ${skill}
                        <i class="fas fa-times remove-skill"></i>
                    `;
                    skillTag.querySelector('.remove-skill').addEventListener('click', () => {
                        skillTag.remove();
                        updateCV();
                    });
                    document.getElementById('skill-tags').appendChild(skillTag);
                }
            });
            
            updateCV();
            showToast('Skills suggested!', 'success');
        } catch (error) {
            console.error('Skill suggestion failed:', error);
            showToast('Skill suggestion failed. Please try again.', 'danger');
            
            // Fallback to hardcoded suggestions if AI fails
            const suggestedSkills = ['React', 'Node.js', 'JavaScript', 'TypeScript', 'Git', 'CI/CD'];
            suggestedSkills.forEach(skill => {
                const skillTag = document.createElement('span');
                skillTag.className = 'skill-tag';
                skillTag.innerHTML = `
                    ${skill}
                    <i class="fas fa-times remove-skill"></i>
                `;
                skillTag.querySelector('.remove-skill').addEventListener('click', () => {
                    skillTag.remove();
                    updateCV();
                });
                document.getElementById('skill-tags').appendChild(skillTag);
            });
            updateCV();
        }
    };

    // AI enhance all resume data
    const aiEnhance = async (formData) => {
        const ai = await initializeAI();
        
        const enhancedData = { ...formData };
        
        // Enhance professional title
        if (enhancedData.personalInfo && enhancedData.personalInfo.title) {
            enhancedData.personalInfo.title = ai.enhanceTitle(enhancedData.personalInfo.title);
        }
        
        // Generate professional summary if empty
        if (!enhancedData.summary || enhancedData.summary.length < 20) {
            // Gather user info for summary generation
            const userData = {
                role: enhancedData.personalInfo?.title || '',
                experience: '5+', // Default experience years
                skills: []
            };
            
            // Extract skills
            if (enhancedData.skills && enhancedData.skills.length > 0) {
                userData.skills = enhancedData.skills.slice(0, 3);
            }
            
            // Generate summary
            enhancedData.summary = ai.generateSummary(userData);
        }
        
        // Enhance achievements in experience entries
        if (enhancedData.experience && enhancedData.experience.length > 0) {
            enhancedData.experience = enhancedData.experience.map(exp => {
                if (exp.achievements && exp.achievements.length > 0) {
                    exp.achievements = exp.achievements.map(achievement => 
                        ai.enhanceAchievement(achievement)
                    );
                }
                return exp;
            });
        }
        
        // Suggest skills if few or none provided
        if (!enhancedData.skills || enhancedData.skills.length < 5) {
            const role = enhancedData.personalInfo?.title || 'Software Engineer';
            const suggestedSkills = ai.suggestSkills(role);
            
            if (!enhancedData.skills) {
                enhancedData.skills = [];
            }
            
            // Add suggested skills without duplicates
            for (const skill of suggestedSkills) {
                if (!enhancedData.skills.includes(skill)) {
                    enhancedData.skills.push(skill);
                }
            }
        }
        
        return enhancedData;
    };

    // Save progress
    const saveProgress = () => {
        try {
            const formData = collectFormData();
            localStorage.setItem('cvCraftData', JSON.stringify(formData));
            showToast('Progress saved successfully!', 'success');
        } catch (error) {
            showToast(`Error saving data: ${error.message}`, 'danger');
        }
    };

    // Load progress
    const loadProgress = () => {
        try {
            const savedData = localStorage.getItem('cvCraftData');
            if (savedData) {
                loadFormData(JSON.parse(savedData));
                showToast('Data loaded successfully!', 'success');
            } else {
                showToast('No saved data found', 'warning');
            }
        } catch (error) {
            showToast(`Error loading data: ${error.message}`, 'danger');
        }
    };

    // Clear form
    const clearForm = () => {
        if (!confirm('Are you sure you want to clear all data?')) return;
        
        document.querySelectorAll('input, textarea').forEach(input => input.value = '');
        const experienceContainer = document.getElementById('experience-container');
        experienceContainer.innerHTML = '';
        addDefaultExperience(); // Use the new function instead of addExperience
        document.getElementById('skill-tags').innerHTML = '';
        document.getElementById('categorize-skills').checked = false;
        document.getElementById('skill-categories').style.display = 'none';
        updateCV();
        showToast('Form cleared', 'info');
    };

    async function generatePDF() {
        if (isProcessing) return;

        isProcessing = true;
        showLoadingState(true);

        try {
            const element = document.getElementById('cv-content');
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            doc.save('resume.pdf');

            showToast('PDF generated successfully!', 'success');
        } catch (error) {
            showToast('PDF generation failed: ' + error.message, 'danger');
            console.error('PDF Error:', error);
        } finally {
            isProcessing = false;
            showLoadingState(false);
        }
    }

    function printCV() {
        const printContents = document.getElementById('cv-content').outerHTML;
        const originalContents = document.body.innerHTML;
        const printStyle = `
            <style>
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #cv-content, #cv-content * {
                        visibility: visible;
                    }
                    #cv-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0;
                        margin: 0;
                        border: none;
                        box-shadow: none;
                    }
                }
            </style>
        `;

        document.body.innerHTML = printStyle + printContents;
        window.print();
        document.body.innerHTML = originalContents;
        setupEventListeners();
    };

    // Download HTML
    const downloadHTML = () => {
        const content = preview.outerHTML;
        const blob = new Blob([wrapHtmlDocument(content)], { type: 'text/html' });
        downloadBlob(blob, 'resume.html');
    };

    // Download JSON
    const downloadJSON = () => {
        const formData = collectFormData();
        const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
        downloadBlob(blob, 'resume-data.json');
    };

    // Download Word
    const downloadWord = () => {
        const content = document.getElementById('cv-content').outerHTML;
        const styledContent = `
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Arial', sans-serif; padding: 20px; }
                    .cv-header h1 { color: #2c5282; font-size: 28pt; }
                    .cv-section-title { color: #2b6cb0; border-bottom: 2px solid #2b6cb0; }
                    .skill-item { display: inline-block; margin: 5px; padding: 5px 10px; background: #edf2f7; border-radius: 15px; }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `;

        const converted = htmlDocx.asBlob(styledContent);
        saveAs(converted, 'resume.docx');
        showToast('Word document downloaded!', 'success');
    };

    // Download Blob
    const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Wrap HTML document
    const wrapHtmlDocument = (content) => {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>My Resume</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { padding: 20px; max-width: 1000px; margin: 0 auto; }
            </style>
        </head>
        <body>${content}</body>
        </html>`;
    };

    // Update CV
    const updateCV = () => {
        if (validateForm()) {
            const formData = collectFormData();
            renderCV(formData);
            updateProgress();
        }
    };

    // Collect form data
    const collectFormData = () => {
        const personalInfo = {
            name: document.getElementById('name').value,
            title: document.getElementById('title').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            location: document.getElementById('location').value,
            linkedin: document.getElementById('linkedin').value,
            github: document.getElementById('github').value,
            portfolio: document.getElementById('portfolio').value
        };

        const summary = document.getElementById('summary').value;

        const experienceEntries = [];
        document.querySelectorAll('.experience-entry').forEach(entry => {
            const achievements = [];
            entry.querySelectorAll('.achievement-text').forEach(item => achievements.push(item.textContent.trim()));
            experienceEntries.push({
                company: entry.querySelector('.company').value,
                role: entry.querySelector('.role').value,
                startDate: entry.querySelector('.start-date').value,
                endDate: entry.querySelector('.end-date').value,
                location: entry.querySelector('.location').value,
                description: entry.querySelector('.description').value,
                achievements
            });
        });

        const skills = [];
        document.querySelectorAll('#skill-tags .skill-tag').forEach(skill => 
            skills.push(skill.childNodes[0].textContent.trim())
        );

        const categorizeSkills = document.getElementById('categorize-skills').checked;
        const skillCategories = categorizeSkills ? {
            languages: document.getElementById('languages').value,
            frameworks: document.getElementById('frameworks').value,
            tools: document.getElementById('tools').value,
            other: document.getElementById('other-skills').value
        } : null;

        return { personalInfo, summary, experience: experienceEntries, skills, categorizeSkills, skillCategories };
    };

    // Load form data
    const loadFormData = (data) => {
        // Load personal info
        Object.keys(data.personalInfo).forEach(key => {
            if (document.getElementById(key)) {
                document.getElementById(key).value = data.personalInfo[key] || '';
            }
        });

        // Load summary
        document.getElementById('summary').value = data.summary || '';

        // Load experience entries
        const experienceContainer = document.getElementById('experience-container');
        experienceContainer.innerHTML = '';
        
        if (data.experience && data.experience.length > 0) {
            data.experience.forEach(exp => {
                const template = document.querySelector('.experience-entry');
                let entry;
                
                if (template) {
                    entry = template.cloneNode(true);
                } else {
                    // Create a new entry if there's no template
                    entry = document.createElement('div');
                    entry.className = 'experience-entry entry-container';
                    entry.innerHTML = `
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-grip-vertical drag-handle"></i>
                            <h5 class="mb-0 me-auto">Experience Entry</h5>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-primary enhance-entry" type="button" data-target="experience">
                                    <i class="fas fa-wand-magic-sparkles"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger remove-entry" type="button">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Company*</label>
                            <input type="text" class="form-control required company" required>
                            <div class="invalid-feedback">Please enter a company name</div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Role*</label>
                            <input type="text" class="form-control required role" required>
                            <div class="invalid-feedback">Please enter your role</div>
                        </div>
                        <div class="row mb-3">
                            <div class="col">
                                <label class="form-label">Start Date*</label>
                                <input type="text" class="form-control required start-date" placeholder="MM/YYYY" required>
                                <div class="invalid-feedback">Required field</div>
                            </div>
                            <div class="col">
                                <label class="form-label">End Date</label>
                                <input type="text" class="form-control end-date" placeholder="MM/YYYY or Present">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Location</label>
                            <input type="text" class="form-control location" placeholder="City, Country">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Description</label>
                            <textarea class="form-control description" rows="2"></textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Key Achievements</label>
                            <div class="achievement-container">
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control achievement-item" placeholder="e.g. Reduced system latency by 40%">
                                    <button class="btn btn-outline-primary add-achievement" type="button" title="Add achievement" aria-label="Add achievement">
                                        <i class="fas fa-plus" aria-hidden="true"></i>
                                    </button>
                                </div>
                            </div>
                            <ul class="achievement-list list-group">
                                <!-- Achievements will be added here -->
                            </ul>
                        </div>
                    `;
                }
                
                // Populate entry fields
                entry.querySelector('.company').value = exp.company || '';
                entry.querySelector('.role').value = exp.role || '';
                entry.querySelector('.start-date').value = exp.startDate || '';
                entry.querySelector('.end-date').value = exp.endDate || '';
                entry.querySelector('.location').value = exp.location || '';
                entry.querySelector('.description').value = exp.description || '';
                
                // Populate achievements
                const list = entry.querySelector('.achievement-list');
                list.innerHTML = '';
                if (exp.achievements && exp.achievements.length > 0) {
                    exp.achievements.forEach(achievement => {
                        const item = document.createElement('li');
                        item.innerHTML = `
                            <span class="achievement-text">${achievement}</span>
                            <button class="btn btn-sm btn-link text-danger remove-achievement" title="Remove achievement" aria-label="Remove achievement">
                                <i class="fas fa-times" aria-hidden="true"></i>
                            </button>
                        `;
                        item.querySelector('.remove-achievement').addEventListener('click', () => {
                            item.remove();
                            updateCV();
                        });
                        list.appendChild(item);
                    });
                }
                
                setupEntryEventListeners(entry);
                experienceContainer.appendChild(entry);
            });
        } else {
            // Add a default experience entry if none exists
            addDefaultExperience();
        }

        // Load skills
        document.getElementById('skill-tags').innerHTML = '';
        if (data.skills && data.skills.length > 0) {
            data.skills.forEach(skill => {
                const skillTag = document.createElement('span');
                skillTag.className = 'skill-tag';
                skillTag.innerHTML = `
                    ${skill}
                    <i class="fas fa-times remove-skill"></i>
                `;
                skillTag.querySelector('.remove-skill').addEventListener('click', () => {
                    skillTag.remove();
                    updateCV();
                });
                document.getElementById('skill-tags').appendChild(skillTag);
            });
        }

        // Load skill categories
        if (data.categorizeSkills && data.skillCategories) {
            document.getElementById('categorize-skills').checked = true;
            document.getElementById('skill-categories').style.display = 'block';
            Object.keys(data.skillCategories).forEach(key => {
                if (document.getElementById(key)) {
                    document.getElementById(key).value = data.skillCategories[key] || '';
                }
            });
        } else {
            document.getElementById('categorize-skills').checked = false;
            document.getElementById('skill-categories').style.display = 'none';
        }

        renderCV(data);
        initializeDateFields();
    };

    // Render CV
    const renderCV = (data) => {
        if (!data.personalInfo.name) {
            preview.innerHTML = `
                <div class="preview-placeholder text-center py-5">
                    <i class="fas fa-file-alt fa-4x text-muted mb-3"></i>
                    <h3>Your CV Preview</h3>
                    <p>Fill in your details in the form to see your CV preview here.</p>
                </div>
            `;
            return;
        }

        // Check if the preview has the professional template class
        const isProfessionalTemplate = preview.classList.contains('cv-professional-template');

        let cvHtml = '';

        if (isProfessionalTemplate) {
            // Professional template layout
            cvHtml = `
                <div class="cv-header">
                    <h1>${data.personalInfo.name}</h1>
                    ${data.personalInfo.title ? `<h2>${data.personalInfo.title}</h2>` : ''}
                    <div class="contact-info">
                        ${data.personalInfo.email ? `<span><i class="fas fa-envelope"></i>${data.personalInfo.email}</span>` : ''}
                        ${data.personalInfo.phone ? `<span><i class="fas fa-phone"></i>${data.personalInfo.phone}</span>` : ''}
                        ${data.personalInfo.location ? `<span><i class="fas fa-map-marker-alt"></i>${data.personalInfo.location}</span>` : ''}
                        ${data.personalInfo.linkedin ? `<span><i class="fab fa-linkedin"></i>linkedin.com/in/${data.personalInfo.linkedin}</span>` : ''}
                        ${data.personalInfo.github ? `<span><i class="fab fa-github"></i>github.com/${data.personalInfo.github}</span>` : ''}
                        ${data.personalInfo.portfolio ? `<span><i class="fas fa-globe"></i>${data.personalInfo.portfolio}</span>` : ''}
                    </div>
                </div>
                <div class="cv-body">
            `;

            if (data.summary) {
                cvHtml += `
                    <div class="cv-section">
                        <h3 class="cv-section-title">Professional Summary</h3>
                        <p>${data.summary}</p>
                    </div>
                `;
            }

            if (data.experience.length > 0) {
                cvHtml += `
                    <div class="cv-section">
                        <h3 class="cv-section-title">Professional Experience</h3>
                        ${data.experience.map(exp => `
                            <div class="cv-experience-entry">
                                <h4>${exp.role || ''}</h4>
                                <h5>${exp.company || ''} | ${exp.location || ''} | ${exp.startDate || ''} - ${exp.endDate || 'Present'}</h5>
                                ${exp.description ? `<p>${exp.description}</p>` : ''}
                                ${exp.achievements.length > 0 ? `
                                    <ul class="achievement-bullets">
                                        ${exp.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                                    </ul>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            if (data.skills.length > 0) {
                cvHtml += `
                    <div class="cv-section">
                        <h3 class="cv-section-title">Technical Skills</h3>
                        ${data.categorizeSkills && data.skillCategories ? `
                            <div class="row">
                                ${data.skillCategories.languages ? `
                                    <div class="col-md-6 mb-3">
                                        <h5 class="fw-bold">Programming Languages</h5>
                                        <p>${data.skillCategories.languages}</p>
                                    </div>
                                ` : ''}
                                ${data.skillCategories.frameworks ? `
                                    <div class="col-md-6 mb-3">
                                        <h5 class="fw-bold">Frameworks & Libraries</h5>
                                        <p>${data.skillCategories.frameworks}</p>
                                    </div>
                                ` : ''}
                                ${data.skillCategories.tools ? `
                                    <div class="col-md-6 mb-3">
                                        <h5 class="fw-bold">Tools & Technologies</h5>
                                        <p>${data.skillCategories.tools}</p>
                                    </div>
                                ` : ''}
                                ${data.skillCategories.other ? `
                                    <div class="col-md-6 mb-3">
                                        <h5 class="fw-bold">Other Skills</h5>
                                        <p>${data.skillCategories.other}</p>
                                    </div>
                                ` : ''}
                            </div>
                        ` : `
                            <div class="skill-cloud">
                                ${data.skills.map(skill => `<span class="skill-item">${skill}</span>`).join('')}
                            </div>
                        `}
                    </div>
                `;
            }

            cvHtml += `</div>`; // Close the cv-body div
        } else {
            // Standard template layout
            cvHtml = `
                <div class="cv-header mb-4">
                    <h1 class="display-5 fw-bold">${data.personalInfo.name}</h1>
                    ${data.personalInfo.title ? `<h2 class="fs-4 text-muted">${data.personalInfo.title}</h2>` : ''}
                    <div class="contact-info mt-3">
                        <div class="row">
                            ${data.personalInfo.email ? `<div class="col-auto"><span><i class="fas fa-envelope me-2"></i>${data.personalInfo.email}</span></div>` : ''}
                            ${data.personalInfo.phone ? `<div class="col-auto"><span><i class="fas fa-phone me-2"></i>${data.personalInfo.phone}</span></div>` : ''}
                            ${data.personalInfo.location ? `<div class="col-auto"><span><i class="fas fa-map-marker-alt me-2"></i>${data.personalInfo.location}</span></div>` : ''}
                        </div>
                        <div class="row mt-2">
                            ${data.personalInfo.linkedin ? `<div class="col-auto"><span><i class="fab fa-linkedin me-2"></i>linkedin.com/in/${data.personalInfo.linkedin}</span></div>` : ''}
                            ${data.personalInfo.github ? `<div class="col-auto"><span><i class="fab fa-github me-2"></i>github.com/${data.personalInfo.github}</span></div>` : ''}
                            ${data.personalInfo.portfolio ? `<div class="col-auto"><span><i class="fas fa-globe me-2"></i>${data.personalInfo.portfolio}</span></div>` : ''}
                        </div>
                    </div>
                </div>
            `;

            if (data.summary) {
                cvHtml += `
                    <div class="cv-section mb-4">
                        <h3 class="cv-section-title">Professional Summary</h3>
                        <p>${data.summary}</p>
                    </div>
                `;
            }

            if (data.experience.length > 0) {
                cvHtml += `
                    <div class="cv-section mb-4">
                        <h3 class="cv-section-title">Professional Experience</h3>
                        ${data.experience.map(exp => `
                            <div class="cv-experience-entry mb-3">
                                <div class="d-flex justify-content-between">
                                    <h4 class="fw-bold mb-0">${exp.role || ''}</h4>
                                    <span class="text-muted">${exp.startDate || ''} - ${exp.endDate || 'Present'}</span>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <h5 class="text-muted">${exp.company || ''}</h5>
                                    <span class="text-muted">${exp.location || ''}</span>
                                </div>
                                ${exp.description ? `<p class="mt-2">${exp.description}</p>` : ''}
                                ${exp.achievements.length > 0 ? `
                                    <ul class="achievement-bullets mt-2">
                                        ${exp.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                                    </ul>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            if (data.skills.length > 0) {
                cvHtml += `
                    <div class="cv-section mb-4">
                        <h3 class="cv-section-title">Technical Skills</h3>
                        ${data.categorizeSkills && data.skillCategories ? `
                            <div class="row">
                                ${data.skillCategories.languages ? `
                                    <div class="col-md-6 mb-3">
                                        <h5 class="fw-bold">Programming Languages</h5>
                                        <p>${data.skillCategories.languages}</p>
                                    </div>
                                ` : ''}
                                ${data.skillCategories.frameworks ? `
                                    <div class="col-md-6 mb-3">
                                        <h5 class="fw-bold">Frameworks & Libraries</h5>
                                        <p>${data.skillCategories.frameworks}</p>
                                    </div>
                                ` : ''}
                                ${data.skillCategories.tools ? `
                                    <div class="col-md-6 mb-3">
                                        <h5 class="fw-bold">Tools & Technologies</h5>
                                        <p>${data.skillCategories.tools}</p>
                                    </div>
                                ` : ''}
                                ${data.skillCategories.other ? `
                                    <div class="col-md-6 mb-3">
                                        <h5 class="fw-bold">Other Skills</h5>
                                        <p>${data.skillCategories.other}</p>
                                    </div>
                                ` : ''}
                            </div>
                        ` : `
                            <div class="skill-cloud">
                                ${data.skills.map(skill => `<span class="skill-item">${skill}</span>`).join(' ')}
                            </div>
                        `}
                    </div>
                `;
            }
        }

        preview.innerHTML = cvHtml;
    };

    // Update progress
    const updateProgress = () => {
        const formElements = document.querySelectorAll('#cv-form input:not([type="button"]), #cv-form textarea');
        let filledFields = 0;
        
        formElements.forEach(el => {
            if (el.value.trim()) filledFields++;
        });
        
        filledFields += document.querySelectorAll('.achievement-list li').length;
        filledFields += document.querySelectorAll('#skill-tags .skill-tag').length;
        
        const totalFields = formElements.length + 5;
        const progressPercentage = Math.min(Math.round((filledFields / totalFields) * 100), 100);
        
        document.getElementById('progress-bar').style.width = `${progressPercentage}%`;
        document.getElementById('progress-status').textContent = getProgressStatus(progressPercentage);
    };

    // Get progress status
    const getProgressStatus = (percentage) => {
        if (percentage > 75) return 'Almost Complete';
        if (percentage > 50) return 'Halfway There';
        if (percentage > 25) return 'Getting There';
        return 'Just Started';
    };

    // Validate form
    const validateForm = () => {
        let isValid = true;
        form.querySelectorAll('.required').forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('is-invalid');
                isValid = false;
            } else {
                input.classList.remove('is-invalid');
            }
        });
        return isValid;
    };

    // Show toast
    const showToast = (message, type = 'info') => {
        const toastContainer = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast show bg-${type} text-white`;
        toast.innerHTML = `
            <div class="toast-header bg-${type} text-white">
                <strong class="me-auto">CV Craft Pro</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">${message}</div>
        `;
        
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
        toast.querySelector('.btn-close').addEventListener('click', () => toast.remove());
    };

    // Show loading state
    const showLoadingState = (show) => {
        let overlay = preview.querySelector('.loading-overlay');
        if (show && !overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<i class="fas fa-spinner fa-spin fa-2x"></i>';
            preview.style.position = 'relative';
            preview.appendChild(overlay);
        } else if (!show && overlay) {
            overlay.remove();
        }
    };

    // Enhanced AI Assistant
    const getAIResponse = async (message) => {
        try {
            const ai = await initializeAI();
            
            const msgLower = message.toLowerCase();
            
            // Handle different question types
            if (msgLower.includes('summary') || msgLower.includes('profile')) {
                return "A strong professional summary should be 3-4 sentences highlighting your expertise, experience, notable achievements, and career goals. Focus on quantifiable results and skills most relevant to your target role.";
            }
            
            if (msgLower.includes('skill')) {
                // Extract role from message or use form data
                let role = 'professional';
                const roleMatch = message.match(/for a ([a-z\s]+)/i);
                if (roleMatch && roleMatch[1]) {
                    role = roleMatch[1];
                } else {
                    const titleField = document.getElementById('title');
                    if (titleField && titleField.value) {
                        role = titleField.value;
                    }
                }
                
                // Get suggested skills for this role
                const suggestedSkills = ai.suggestSkills(role);
                return `For a ${role}, I recommend including these skills: ${suggestedSkills.slice(0, 8).join(', ')}. Remember to prioritize skills mentioned in the job description.`;
            }
            
            if (msgLower.includes('achievement') || msgLower.includes('bullet')) {
                const verbs = ai.getActionVerbs().slice(0, 10);
                return `Strong achievement bullets start with powerful action verbs like: ${verbs.join(', ')}. Make sure to quantify results with numbers and percentages whenever possible (e.g., "increased efficiency by 30%").`;
            }
            
            if (msgLower.includes('job title') || msgLower.includes('position')) {
                return "Your job title should accurately reflect your role and responsibilities. Consider using industry-standard titles that recruiters search for, and avoid company-specific titles that might not be recognized externally.";
            }
            
            if (msgLower.includes('format') || msgLower.includes('layout')) {
                return "Your resume should have a clean, consistent format with clear section headings. For technical roles, a chronological format works best. Keep to 1-2 pages, use bullet points for achievements, and ensure adequate white space for readability.";
            }
            
            return "I'm here to help with your resume. Ask me about optimizing your summary, enhancing your achievements, choosing the right skills to include, or any other resume-related questions!";
        } catch (error) {
            console.error('AI assistant error:', error);
            return "I'm here to help with your resume. Ask me anything!";
        }
    };

    // Send assistant message with AI enhancement
    const sendAssistantMessage = async () => {
        const input = document.getElementById('assistant-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        const messagesContainer = document.querySelector('.assistant-chat-messages');
        messagesContainer.innerHTML += `
            <div class="message user-message">
                <div class="message-avatar"><i class="fas fa-user"></i></div>
                <div class="message-content"><p>${message}</p></div>
            </div>
            <div class="message assistant-message">
                <div class="message-avatar"><i class="fas fa-robot"></i></div>
                <div class="message-content"><p><i class="fas fa-spinner fa-spin"></i> Thinking...</p></div>
            </div>
        `;
        
        input.value = '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Get AI-enhanced response
        try {
            const response = await getAIResponse(message);
            messagesContainer.lastElementChild.innerHTML = `
                <div class="message-avatar"><i class="fas fa-robot"></i></div>
                <div class="message-content"><p>${response}</p></div>
            `;
        } catch (error) {
            console.error('AI response error:', error);
            messagesContainer.lastElementChild.innerHTML = `
                <div class="message-avatar"><i class="fas fa-robot"></i></div>
                <div class="message-content"><p>I'm here to help with your resume. Ask me anything!</p></div>
            `;
        }
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    // Zoom in
    const zoomIn = () => {
        if (currentZoom < MAX_ZOOM) {
            currentZoom += ZOOM_INCREMENT;
            updateZoom();
        }
    };

    // Zoom out
    const zoomOut = () => {
        if (currentZoom > MIN_ZOOM) {
            currentZoom -= ZOOM_INCREMENT;
            updateZoom();
        }
    };

    // Reset zoom
    const resetZoom = () => {
        currentZoom = 100;
        updateZoom();
    };

    // Update zoom
    const updateZoom = () => {
        preview.style.transform = `scale(${currentZoom / 100})`;
        document.getElementById('zoom-level').textContent = `${currentZoom}%`;
    };

    // Set up AI Enhance button
    const setupAIEnhanceButton = () => {
        document.getElementById('ai-suggestions').addEventListener('click', async () => {
            showToast('AI enhancement in progress...', 'info');
            
            try {
                // Collect current form data
                const formData = collectFormData();
                
                // Run AI enhancement
                const enhancedData = await aiEnhance(formData);
                
                // Apply enhanced data
                loadFormData(enhancedData);
                
                showToast('AI enhancement completed successfully!', 'success');
            } catch (error) {
                console.error('AI enhancement failed:', error);
                showToast('AI enhancement failed. Please try again.', 'danger');
            }
        });

        // Connect field-specific enhance buttons
        document.querySelectorAll('.suggest-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const field = this.getAttribute('data-field');
                
                showToast(`Enhancing ${field}...`, 'info');
                
                try {
                    const ai = await initializeAI();
                    
                    switch (field) {
                        case 'title':
                            const currentTitle = document.getElementById('title').value;
                            if (currentTitle) {
                                document.getElementById('title').value = ai.enhanceTitle(currentTitle);
                            }
                            break;
                            
                        case 'summary':
                            const currentSummary = document.getElementById('summary').value;
                            const userData = {
                                role: document.getElementById('title').value || '',
                                skills: []
                            };
                            
                            // Extract skills
                            document.querySelectorAll('#skill-tags .skill-tag').forEach(tag => {
                                userData.skills.push(tag.childNodes[0].textContent.trim());
                            });
                            
                            // Only generate new summary if current one is empty or user confirms
                            if (!currentSummary || confirm('Replace your current summary with an AI-generated one?')) {
                                document.getElementById('summary').value = ai.generateSummary(userData);
                            }
                            break;
                    }
                    
                    updateCV();
                    showToast(`${field} enhanced!`, 'success');
                } catch (error) {
                    console.error('Enhancement failed:', error);
                    showToast('Enhancement failed. Please try again.', 'danger');
                }
            });
        });
    };

    // Set up event listeners
    const setupEventListeners = () => {
        document.querySelectorAll('.toggleable-section').forEach(el => {
            el.setAttribute('role', 'button');
            el.setAttribute('aria-expanded', 'true');
            el.addEventListener('click', toggleSection);
            el.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    toggleSection.call(el);
                }
            });
        });

        form.addEventListener('submit', (e) => e.preventDefault());

        const debouncedUpdate = debounce(updateCV, 300);
        form.querySelectorAll('input, textarea').forEach(el => {
            el.addEventListener('input', debouncedUpdate);
        });

        document.getElementById('add-experience').addEventListener('click', addExperience);
        document.querySelectorAll('.experience-entry').forEach(setupEntryEventListeners);

        document.getElementById('add-skill').addEventListener('click', addSkill);
        document.getElementById('skill-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
            }
        });

        document.getElementById('categorize-skills').addEventListener('change', function() {
            document.getElementById('skill-categories').style.display = this.checked ? 'block' : 'none';
        });

        document.getElementById('suggest-skills').addEventListener('click', suggestSkills);

        document.querySelectorAll('.template-selector').forEach(template => {
            template.addEventListener('click', (e) => {
                e.preventDefault();
                const templateClass = template.getAttribute('data-template');
                preview.className = templateClass;
                showToast(`Template changed to ${template.textContent}`, 'success');
            });
        });

        document.getElementById('save-progress').addEventListener('click', saveProgress);
        document.getElementById('load-progress').addEventListener('click', loadProgress);
        document.getElementById('clear-form').addEventListener('click', clearForm);

        document.getElementById('generate-pdf').addEventListener('click', generatePDF);
        document.getElementById('print-cv').addEventListener('click', printCV);
        document.getElementById('download-html').addEventListener('click', downloadHTML);
        document.getElementById('download-json').addEventListener('click', downloadJSON);
        document.getElementById('download-word').addEventListener('click', downloadWord);

        document.getElementById('ai-assistant-trigger').addEventListener('click', () => {
            new bootstrap.Modal(document.getElementById('aiAssistantModal')).show();
        });

        document.getElementById('send-assistant-message').addEventListener('click', sendAssistantMessage);
        document.getElementById('assistant-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendAssistantMessage();
        });

        document.getElementById('zoom-in').addEventListener('click', zoomIn);
        document.getElementById('zoom-out').addEventListener('click', zoomOut);
        document.getElementById('reset-zoom').addEventListener('click', resetZoom);
        
        // Set up AI enhance button
        setupAIEnhanceButton();
        
        // Initialize date fields
        initializeDateFields();
    };

    // Initialize app
    initializeBootstrapComponents();
    setupEventListeners();
    initializeAI(); // Pre-load AI system
});
