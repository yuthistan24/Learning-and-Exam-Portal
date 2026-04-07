class ProctoringSystem {
    constructor() {
        this.violations = 0;
        this.maxViolations = 3;
        this.isProctoring = false;
        this.videoStream = null;

        // Bind methods to keep `this` context
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.handleCopyPaste = this.handleCopyPaste.bind(this);
        this.handleKeyboard = this.handleKeyboard.bind(this);
    }

    async start() {
        if (this.isProctoring) return;
        this.isProctoring = true;
        this.violations = 0;

        // 1. Request Webcam Access
        try {
            this.videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            this.setupVideoOverlay();
        } catch (error) {
            alert('Webcam access is required to take this exam. Please enable it and try again.');
            throw new Error('Camera permission denied.');
        }

        // 2. Request Fullscreen
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch (e) {
            console.warn('Fullscreen request failed', e);
        }

        // 3. Attach Listeners
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        document.addEventListener('contextmenu', this.handleContextMenu);
        document.addEventListener('copy', this.handleCopyPaste);
        document.addEventListener('paste', this.handleCopyPaste);
        document.addEventListener('keydown', this.handleKeyboard);

        // Notify user
        this.showWarning('Proctoring Started. Do not leave this tab, copy/paste, or exit fullscreen.');
    }

    stop() {
        if (!this.isProctoring) return;
        this.isProctoring = false;

        // Remove Listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        document.removeEventListener('contextmenu', this.handleContextMenu);
        document.removeEventListener('copy', this.handleCopyPaste);
        document.removeEventListener('paste', this.handleCopyPaste);
        document.removeEventListener('keydown', this.handleKeyboard);

        // Stop Webcam
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }

        // Remove Video Element
        const overlay = document.getElementById('proctor-video-overlay');
        if (overlay) {
            overlay.remove();
        }

        // Exit Fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.warn(err));
        }
    }

    setupVideoOverlay() {
        const videoOverlay = document.createElement('div');
        videoOverlay.id = 'proctor-video-overlay';
        videoOverlay.style.position = 'fixed';
        videoOverlay.style.bottom = '20px';
        videoOverlay.style.right = '20px';
        videoOverlay.style.width = '150px';
        videoOverlay.style.height = '120px';
        videoOverlay.style.backgroundColor = '#000';
        videoOverlay.style.borderRadius = '8px';
        videoOverlay.style.overflow = 'hidden';
        videoOverlay.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
        videoOverlay.style.zIndex = '9999';

        const video = document.createElement('video');
        video.srcObject = this.videoStream;
        video.autoplay = true;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';

        videoOverlay.appendChild(video);
        document.body.appendChild(videoOverlay);
    }

    recordViolation(reason) {
        if (!this.isProctoring) return;
        this.violations++;
        
        const remaining = this.maxViolations - this.violations;
        if (remaining > 0) {
            this.showWarning(`WARNING: ${reason}. You have ${remaining} warnings left before auto-submission.`);
        } else {
            alert(`FINAL WARNING: ${reason}. Your exam is being automatically submitted due to rules violation.`);
            this.stop();
            // Assuming global `submitExam()` exists from app.js
            if (typeof submitExam === 'function') {
                submitExam(true); // pass true flag indicating force submission
            }
        }
    }

    showWarning(message) {
        // Create an on-screen warning banner
        const banner = document.createElement('div');
        banner.style.position = 'fixed';
        banner.style.top = '0';
        banner.style.left = '0';
        banner.style.width = '100%';
        banner.style.backgroundColor = '#e74c3c';
        banner.style.color = '#fff';
        banner.style.textAlign = 'center';
        banner.style.padding = '15px';
        banner.style.zIndex = '10000';
        banner.style.fontWeight = 'bold';
        banner.style.fontSize = '1.2em';
        banner.innerHTML = message;

        document.body.appendChild(banner);

        setTimeout(() => {
            if (banner.parentNode) banner.parentNode.removeChild(banner);
        }, 5000);
    }

    // Handlers
    handleVisibilityChange() {
        if (document.hidden) {
            this.recordViolation('Tab switched or window minimized');
        }
    }

    handleContextMenu(e) {
        e.preventDefault();
        this.showWarning('Right-click is disabled during the exam.');
    }

    handleCopyPaste(e) {
        e.preventDefault();
        this.recordViolation('Copy/Paste is not permitted');
    }

    handleKeyboard(e) {
        // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+C, Ctrl+V, Esc
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'U') ||
            (e.ctrlKey && (e.key === 'c' || e.key === 'v'))
        ) {
            e.preventDefault();
            this.showWarning('Developer tools and keyboard shortcuts are disabled.');
        }

        // Prevent escaping fullscreen unless they violate
        if (e.key === 'Escape') {
            e.preventDefault();
            this.recordViolation('Attempted to exit fullscreen mode');
        }
    }
}

// Global instance
const proctor = new ProctoringSystem();
