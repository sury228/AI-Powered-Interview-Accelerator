/**
 * File Upload Component — Drag & drop file uploader
 */

const FileUpload = {
    /**
     * Create a file upload zone
     * @param {string} id - Unique ID for this upload zone
     * @param {Function} onFileSelected - Callback with file contents
     */
    create(id, onFileSelected) {
        return `
            <div class="upload-zone" id="${id}" 
                 ondragover="FileUpload.handleDragOver(event, '${id}')"
                 ondragleave="FileUpload.handleDragLeave(event, '${id}')"
                 ondrop="FileUpload.handleDrop(event, '${id}')"
                 onclick="document.getElementById('${id}-input').click()">
                <div class="upload-zone-text" style="font-weight: 600; font-size: 1rem; margin-bottom: 4px">
                    Drag & drop your file here or <span>browse</span>
                </div>
                <div class="upload-zone-text" style="font-size: 0.75rem; color: var(--text-muted)">
                    Supports PDF, DOCX, TXT
                </div>
                <input type="file" id="${id}-input" accept=".pdf,.docx,.doc,.txt" style="display: none"
                       onchange="FileUpload.handleFileInput(event, '${id}')">
            </div>
            <div id="${id}-status" class="hidden" style="margin-top: var(--space-3)">
                <div class="badge badge-success" id="${id}-filename"></div>
            </div>
        `;
    },

    handleDragOver(event, id) {
        event.preventDefault();
        document.getElementById(id).classList.add('dragover');
    },

    handleDragLeave(event, id) {
        event.preventDefault();
        document.getElementById(id).classList.remove('dragover');
    },

    async handleDrop(event, id) {
        event.preventDefault();
        document.getElementById(id).classList.remove('dragover');

        const file = event.dataTransfer.files[0];
        if (file) {
            await this.processFile(file, id);
        }
    },

    async handleFileInput(event, id) {
        const file = event.target.files[0];
        if (file) {
            await this.processFile(file, id);
        }
    },

    async processFile(file, id) {
        try {
            Helpers.showToast(`Uploading ${file.name}...`, 'info');

            const result = await API.uploadFile(file);

            // Update status
            const statusEl = document.getElementById(`${id}-status`);
            const filenameEl = document.getElementById(`${id}-filename`);
            statusEl.classList.remove('hidden');
            filenameEl.textContent = file.name;

            // Store extracted text
            if (this.onFileProcessed) {
                this.onFileProcessed(id, result.text);
            }

            // Dispatch custom event
            document.dispatchEvent(new CustomEvent('file-uploaded', {
                detail: { id, text: result.text, filename: file.name }
            }));

            Helpers.showToast(`${file.name} processed successfully!`, 'success');
        } catch (error) {
            Helpers.showToast(`Failed to process file: ${error.message}`, 'error');
        }
    }
};
