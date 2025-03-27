document.addEventListener('DOMContentLoaded', function() {
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

    // Debounce utility
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initialize Bootstrap components
    function initializeBootstrapComponents() {
        try {
            document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => 
                new bootstrap.Tooltip(el)
            );
        } catch (error) {
            console.error('Bootstrap initialization failed:', error);
        }
    }

    // Setup event listeners
    function setupEventListeners() {
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
    }

    function toggleSection() {
        const targetId = this.getAttribute('data-toggle');
        const target = document.getElementById(targetId);
        const isCollapsed = target.classList.toggle('collapsed');
        this.classList.toggle('collapsed');
        this.setAttribute('aria-expanded', !isCollapsed);
    }

    function addExperience() {
        const container = document.getElementById('experience-container');
        const template = container.querySelector('.experience-entry').cloneNode(true);
        
        template.querySelectorAll('input, textarea').forEach(input => input.value = '');
        template.querySelector('.achievement-list').innerHTML = '';
        
        setupEntryEventListeners(template);
        container.appendChild(template);
        updateProgress();
    }

    function setupEntryEventListeners(entry) {
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

        entry.querySelector('.enhance-entry').addEventListener('click', () => {
            showToast('AI enhancement in progress...', 'info');
            setTimeout(() => showToast('Experience entry enhanced!', 'success'), 1500);
        });
    }

    function addAchievement(entry) {
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
    }

    function addSkill() {
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
    }

    function suggestSkills() {
        showToast('Analyzing your experience...', 'info');
        setTimeout(() => {
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
            showToast('Skills suggested!', 'success');
        }, 1500);
    }

    function saveProgress() {
        try {
            const formData = collectFormData();
            localStorage.setItem('cvCraftData', JSON.stringify(formData));
            showToast('Progress saved successfully!', 'success');
        } catch (error) {
            showToast('Error saving data: ' + error.message, 'danger');
        }
    }

    function loadProgress() {
        try {
            const savedData = localStorage.getItem('cvCraftData');
            if (savedData) {
                loadFormData(JSON.parse(savedData));
                showToast('Data loaded successfully!', 'success');
            } else {
                showToast('No saved data found', 'warning');
            }
        } catch (error) {
            showToast('Error loading data: ' + error.message, 'danger');
        }
    }

    function clearForm() {
        if (!confirm('Are you sure you want to clear all data?')) return;
        
        document.querySelectorAll('input, textarea').forEach(input => input.value = '');
        const experienceContainer = document.getElementById('experience-container');
        experienceContainer.innerHTML = '';
        addExperience();
        document.getElementById('skill-tags').innerHTML = '';
        document.getElementById('categorize-skills').checked = false;
        document.getElementById('skill-categories').style.display = 'none';
        updateCV();
        showToast('Form cleared', 'info');
    }

    function generatePDF() {
    if (isProcessing) return;

    isProcessing = true;
    showLoadingState(true);

    try {
        const element = document.getElementById('cv-content');
        
        // Clone the element to avoid modifying the original
        const clonedElement = element.cloneNode(true);
        
        // Make sure the clone has the proper styles
        clonedElement.style.width = '210mm'; // A4 width
        clonedElement.style.padding = '10mm';
        clonedElement.style.backgroundColor = '#ffffff';
        
        // Create a temporary container
        const tempContainer = document.createElement('div');
        tempContainer.appendChild(clonedElement);
        document.body.appendChild(tempContainer);
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        
        // Configure html2pdf options
        const opt = {
            margin:       [10, 10, 10, 10],
            filename:     'resume.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        // Generate PDF
        html2pdf().from(clonedElement).set(opt).save()
            .then(() => {
                // Clean up
                document.body.removeChild(tempContainer);
                showToast('PDF generated successfully!', 'success');
                isProcessing = false;
                showLoadingState(false);
            });
            
    } catch (error) {
        showToast('PDF generation failed: ' + error.message, 'danger');
        console.error('PDF Error:', error);
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
    }

    function downloadHTML() {
        const content = preview.outerHTML;
        const blob = new Blob([wrapHtmlDocument(content)], { type: 'text/html' });
        downloadBlob(blob, 'resume.html');
    }

    function downloadJSON() {
        const formData = collectFormData();
        const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
        downloadBlob(blob, 'resume-data.json');
    }

    function downloadWord() {
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
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function wrapHtmlDocument(content) {
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
    }

    function updateCV() {
        if (validateForm()) {
            const formData = collectFormData();
            renderCV(formData);
            updateProgress();
        }
    }

    function collectFormData() {
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
        document.querySelectorAll('#skill-tags .skill-tag').forEach(skill => skills.push(skill.childNodes[0].textContent.trim()));

        const categorizeSkills = document.getElementById('categorize-skills').checked;
        const skillCategories = categorizeSkills ? {
            languages: document.getElementById('languages').value,
            frameworks: document.getElementById('frameworks').value,
            tools: document.getElementById('tools').value,
            other: document.getElementById('other-skills').value
        } : null;

        return { personalInfo, summary, experience: experienceEntries, skills, categorizeSkills, skillCategories };
    }

    function loadFormData(data) {
        Object.keys(data.personalInfo).forEach(key => {
            document.getElementById(key).value = data.personalInfo[key] || '';
        });

        document.getElementById('summary').value = data.summary || '';

        const experienceContainer = document.getElementById('experience-container');
        experienceContainer.innerHTML = '';
        data.experience.forEach(exp => {
            const template = document.querySelector('.experience-entry').cloneNode(true);
            template.querySelector('.company').value = exp.company || '';
            template.querySelector('.role').value = exp.role || '';
            template.querySelector('.start-date').value = exp.startDate || '';
            template.querySelector('.end-date').value = exp.endDate || '';
            template.querySelector('.location').value = exp.location || '';
            template.querySelector('.description').value = exp.description || '';
            const list = template.querySelector('.achievement-list');
            list.innerHTML = '';
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
            setupEntryEventListeners(template);
            experienceContainer.appendChild(template);
        });

        document.getElementById('skill-tags').innerHTML = '';
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

        if (data.categorizeSkills && data.skillCategories) {
            document.getElementById('categorize-skills').checked = true;
            document.getElementById('skill-categories').style.display = 'block';
            Object.keys(data.skillCategories).forEach(key => {
                document.getElementById(key).value = data.skillCategories[key] || '';
            });
        }

        renderCV(data);
    }

    function renderCV(data) {
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

        let cvHtml = `
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

        preview.innerHTML = cvHtml;
    }

    function updateProgress() {
        const formElements = document.querySelectorAll('#cv-form input:not([type="button"]), #cv-form textarea');
        let filledFields = 0;
        
        formElements.forEach(el => {
            if (el.value.trim()) filledFields++;
        });
        
        filledFields += document.querySelectorAll('.achievement-list li').length;
        filledFields += document.querySelectorAll('#skill-tags .skill-tag').length;
        
        const totalFields = formElements.length + 5;
        const progressPercentage = Math.min(Math.round((filledFields / totalFields) * 100), 100);
        
        document.getElementById('progress-bar').style.width = progressPercentage + '%';
        document.getElementById('progress-status').textContent = getProgressStatus(progressPercentage);
    }

    function getProgressStatus(percentage) {
        if (percentage > 75) return 'Almost Complete';
        if (percentage > 50) return 'Halfway There';
        if (percentage > 25) return 'Getting There';
        return 'Just Started';
    }

    function validateForm() {
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
    }

    function showToast(message, type = 'info') {
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
    }

    function showLoadingState(show) {
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
    }

    function sendAssistantMessage() {
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
        
        setTimeout(() => {
            messagesContainer.lastElementChild.innerHTML = `
                <div class="message-avatar"><i class="fas fa-robot"></i></div>
                <div class="message-content"><p>${getAIResponse(message)}</p></div>
            `;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 1500);
    }

    function getAIResponse(message) {
        const msgLower = message.toLowerCase();
        if (msgLower.includes('summary')) return "A strong summary highlights your key skills and experience in 3-4 sentences.";
        if (msgLower.includes('skill')) return "List relevant hard and soft skills, organized by category if possible.";
        return "I'm here to help with your resume. Ask me anything!";
    }

    function zoomIn() {
        if (currentZoom < MAX_ZOOM) {
            currentZoom += ZOOM_INCREMENT;
            updateZoom();
        }
    }

    function zoomOut() {
        if (currentZoom > MIN_ZOOM) {
            currentZoom -= ZOOM_INCREMENT;
            updateZoom();
        }
    }

    function resetZoom() {
        currentZoom = 100;
        updateZoom();
    }

    function updateZoom() {
        preview.style.transform = `scale(${currentZoom / 100})`;
        document.getElementById('zoom-level').textContent = `${currentZoom}%`;
    }

    initializeBootstrapComponents();
    setupEventListeners();
});
