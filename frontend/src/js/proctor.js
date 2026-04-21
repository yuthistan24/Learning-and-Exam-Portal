class ProctoringSystem {
    constructor() {
        this.violations = 0;
        this.maxViolations = 3;
        this.isProctoring = false;
        this.videoStream = null;
        this.fullscreenCheckInterval = null;
        this.focusCheckInterval = null;
        this.cameraCheckInterval = null;
        this.violationLog = [];

        // Bind methods to keep `this` context
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.handleCopyPaste = this.handleCopyPaste.bind(this);
        this.handleKeyboard = this.handleKeyboard.bind(this);
        this.handleWindowBlur = this.handleWindowBlur.bind(this);
        this.handleFullscreenChange = this.handleFullscreenChange.bind(this);
        this.handlePointerLock = this.handlePointerLock.bind(this);
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

        // 2. Request Fullscreen (non-blocking, but required for anti-cheat)
        this.enforceFullscreen();

        // 3. Request Pointer Lock (prevents mouse access to taskbar)
        this.requestPointerLock();

        // 4. Attach Listeners
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        document.addEventListener('contextmenu', this.handleContextMenu);
        document.addEventListener('copy', this.handleCopyPaste);
        document.addEventListener('paste', this.handleCopyPaste);
        document.addEventListener('keydown', this.handleKeyboard);
        document.addEventListener('keyup', this.handleKeyboard);
        window.addEventListener('blur', this.handleWindowBlur);
        document.addEventListener('fullscreenchange', this.handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', this.handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', this.handleFullscreenChange);

        // 5. Start monitoring intervals
        this.fullscreenCheckInterval = setInterval(() => this.enforceFullscreen(), 2000);
        this.focusCheckInterval = setInterval(() => this.checkWindowFocus(), 1000);
        this.cameraCheckInterval = setInterval(() => this.checkCameraStatus(), 1500);

        // 6. Prevent drag-and-drop
        document.addEventListener('drag', e => e.preventDefault());
        document.addEventListener('drop', e => e.preventDefault());

        // 7. Notify user
        this.showWarning('Exam Proctoring ENABLED: Stay fullscreen, no alt-tab, no copying. Violations will auto-submit exam.');
    }

    stop() {
        if (!this.isProctoring) return;
        this.isProctoring = false;

        // Clear intervals
        if (this.fullscreenCheckInterval) {
            clearInterval(this.fullscreenCheckInterval);
            this.fullscreenCheckInterval = null;
        }
        if (this.focusCheckInterval) {
            clearInterval(this.focusCheckInterval);
            this.focusCheckInterval = null;
        }
        if (this.cameraCheckInterval) {
            clearInterval(this.cameraCheckInterval);
            this.cameraCheckInterval = null;
        }

        // Remove Listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        document.removeEventListener('contextmenu', this.handleContextMenu);
        document.removeEventListener('copy', this.handleCopyPaste);
        document.removeEventListener('paste', this.handleCopyPaste);
        document.removeEventListener('keydown', this.handleKeyboard);
        document.removeEventListener('keyup', this.handleKeyboard);
        window.removeEventListener('blur', this.handleWindowBlur);
        document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange);
        document.removeEventListener('drag', e => e.preventDefault());
        document.removeEventListener('drop', e => e.preventDefault());

        // Exit pointer lock
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

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
        this.violationLog.push({
            reason,
            timestamp: new Date().toISOString()
        });
        
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

    getSummary() {
        return {
            violations: this.violations,
            flags: this.violationLog
        };
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
        // Prevent developer tools and common shortcuts
        const blockedShortcuts = [
            { key: 'F12' },
            { ctrlKey: true, shiftKey: true, key: 'I' },  // DevTools
            { ctrlKey: true, shiftKey: true, key: 'J' },  // DevTools Console
            { ctrlKey: true, shiftKey: true, key: 'C' },  // DevTools Inspector
            { ctrlKey: true, shiftKey: true, key: 'K' },  // DevTools
            { ctrlKey: true, key: 'U' },                   // View Source
            { ctrlKey: true, key: 'S' },                   // Save
            { ctrlKey: true, key: 'P' },                   // Print (could be used to export)
            { metaKey: true, key: 'd' },                   // Bookmark (Mac)
            { metaKey: true, key: 's' },                   // Save (Mac)
            { metaKey: true, altKey: true, key: 'i' },    // DevTools (Mac)
            { key: 'Escape' },                              // Exit fullscreen
        ];

        // Block copy and paste
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
            e.preventDefault();
            this.recordViolation('Copy/Paste/Cut is not permitted');
            return;
        }

        // Check for Alt+Tab (Windows)
        if (e.altKey && e.key === 'Tab') {
            e.preventDefault();
            this.recordViolation('Alt+Tab is not permitted - cannot switch applications');
            return;
        }

        // Check for Cmd+Tab (Mac)
        if (e.metaKey && e.key === 'Tab') {
            e.preventDefault();
            this.recordViolation('Cmd+Tab is not permitted - cannot switch applications');
            return;
        }

        // Check for Windows key
        if (e.key === 'Meta' || e.key === 'Windows') {
            e.preventDefault();
            this.recordViolation('Windows key is disabled during exam');
            return;
        }

        // Check other blocked shortcuts
        for (let shortcut of blockedShortcuts) {
            if (
                (shortcut.ctrlKey === true ? e.ctrlKey : true) &&
                (shortcut.shiftKey === true ? e.shiftKey : true) &&
                (shortcut.altKey === true ? e.altKey : true) &&
                (shortcut.metaKey === true ? e.metaKey : true) &&
                e.key === shortcut.key
            ) {
                e.preventDefault();
                if (e.key === 'Escape') {
                    this.recordViolation('Attempted to exit fullscreen mode');
                } else {
                    this.showWarning('This keyboard shortcut is disabled during the exam');
                }
                return;
            }
        }
    }

    // New anti-cheat methods
    enforceFullscreen() {
        if (!this.isProctoring) return;

        // Check if we're in fullscreen
        const isFullscreen = 
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement;

        if (!isFullscreen) {
            // Try to re-enter fullscreen
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(err => {
                    if (err.name !== 'NotSupportedError') {
                        this.recordViolation('Exited fullscreen mode');
                    }
                });
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        }
    }

    handleFullscreenChange() {
        if (!this.isProctoring) return;
        
        const isFullscreen = 
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement;

        if (!isFullscreen && this.isProctoring) {
            this.recordViolation('Exited fullscreen mode');
        }
    }

    handleWindowBlur() {
        if (!this.isProctoring) return;
        this.recordViolation('Exam window lost focus - user may have switched applications');
    }

    checkWindowFocus() {
        if (!this.isProctoring) return;

        // If document is not visible (minimized or hidden), record violation
        if (document.hidden) {
            // Already handled by visibilitychange, but double-check
            this.recordViolation('Tab is hidden or minimized');
        }
    }

    checkCameraStatus() {
        if (!this.isProctoring) return;
        if (!this.videoStream) {
            this.recordViolation('Webcam stream is unavailable');
            return;
        }
        const tracks = this.videoStream.getVideoTracks();
        if (!tracks || tracks.length === 0) {
            this.recordViolation('Webcam video track missing');
            return;
        }
        const active = tracks.some(t => t.readyState === 'live' && t.enabled);
        if (!active) {
            this.recordViolation('Webcam was disabled or stopped');
        }
    }

    requestPointerLock() {
        // Attempt to lock pointer to prevent taskbar access on some browsers
        document.addEventListener('click', () => {
            const elem = document.documentElement;
            if (elem.requestPointerLock) {
                elem.requestPointerLock().catch(() => {
                    // Pointer lock not supported or denied, continue anyway
                    console.log('Pointer lock not available');
                });
            }
        }, { once: true });
    }

    handlePointerLock() {
        if (!this.isProctoring) return;
        // Automatically try to maintain pointer lock if it was exited
        const elem = document.documentElement;
        if (elem.requestPointerLock && !document.pointerLockElement) {
            elem.requestPointerLock().catch(() => {});
        }
    }
}

// Global instance
const proctor = new ProctoringSystem();
