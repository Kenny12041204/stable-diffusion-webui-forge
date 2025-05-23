(function() {
    let currentColor = { h: 0, s: 100, v: 100 }; // Default: Red

    let customColorPickerElement,
        colorPickerHeaderElement,
        svPadElement,
        svHandleElement,
        hueSliderElement,
        colorPreviewElement,
        modeSelectorElement,
        rgbInputsContainer,
        hsvInputsContainer,
        hexInputContainer,
        rgbRInputElement, rgbGInputElement, rgbBInputElement,
        hsvHInputElement, hsvSInputElement, hsvVInputElement,
        hexValueInputElement,
        eyedropperButton,
        closeButtonElement;

    let isDraggingSv = false;
    let isDraggingPicker = false;
    let pickerDragOffsetX, pickerDragOffsetY;

    // --- Color Conversion Functions ---
    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, v = max;
        const d = max - min;
        s = max === 0 ? 0 : d / max;
        if (max === min) {
            h = 0; // achromatic
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
    }

    function hsvToRgb(h, s, v) {
        s /= 100; v /= 100;
        let r, g, b;
        const i = Math.floor(h / 60);
        const f = (h / 60) - i;
        const p = v * (1 - s);
        const q = v * (1 - s * f);
        const t = v * (1 - s * (1 - f));
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function hsvToHex(h, s, v) {
        const { r, g, b } = hsvToRgb(h, s, v);
        return rgbToHex(r, g, b);
    }

    function hexToHsv(hex) {
        const rgb = hexToRgb(hex);
        return rgb ? rgbToHsv(rgb.r, rgb.g, rgb.b) : null;
    }

    // --- UI Update Functions ---
    function updateColorPickerUI(source) {
        const rgb = hsvToRgb(currentColor.h, currentColor.s, currentColor.v);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

        // SV Pad background (based on current hue)
        svPadElement.style.backgroundColor = `hsl(${currentColor.h}, 100%, 50%)`;

        // SV Handle position
        const svPadWidth = svPadElement.offsetWidth;
        const svPadHeight = svPadElement.offsetHeight;
        svHandleElement.style.left = `${(currentColor.s / 100) * svPadWidth}px`;
        svHandleElement.style.top = `${((100 - currentColor.v) / 100) * svPadHeight}px`;
        // Ensure handle color contrasts with background
        svHandleElement.style.borderColor = currentColor.v > 70 ? 'black' : 'white';


        // Hue slider value
        if (source !== 'hue') {
            hueSliderElement.value = currentColor.h;
        }

        // Color preview
        colorPreviewElement.style.backgroundColor = hex;

        // RGB inputs
        if (source !== 'rgb') {
            rgbRInputElement.value = rgb.r;
            rgbGInputElement.value = rgb.g;
            rgbBInputElement.value = rgb.b;
        }

        // HSV inputs
        if (source !== 'hsv') {
            hsvHInputElement.value = currentColor.h;
            hsvSInputElement.value = currentColor.s;
            hsvVInputElement.value = currentColor.v;
        }

        // HEX input
        if (source !== 'hex') {
            hexValueInputElement.value = hex;
        }
    }

    // --- Event Handlers ---
    function handleSvPadMouseDown(event) {
        isDraggingSv = true;
        updateSvColor(event);
    }

    function handleSvPadMouseMove(event) {
        if (isDraggingSv) {
            updateSvColor(event);
        }
    }

    function handleSvPadMouseUp() {
        isDraggingSv = false;
    }

    function updateSvColor(event) {
        const rect = svPadElement.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;

        x = Math.max(0, Math.min(rect.width, x));
        y = Math.max(0, Math.min(rect.height, y));

        currentColor.s = Math.round((x / rect.width) * 100);
        currentColor.v = Math.round(100 - (y / rect.height) * 100);
        updateColorPickerUI('sv');
    }

    function handleHueSliderInput() {
        currentColor.h = parseInt(hueSliderElement.value);
        updateColorPickerUI('hue');
    }

    function handleRgbInputChange() {
        const r = parseInt(rgbRInputElement.value);
        const g = parseInt(rgbGInputElement.value);
        const b = parseInt(rgbBInputElement.value);

        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            currentColor = rgbToHsv(
                Math.max(0, Math.min(255, r)),
                Math.max(0, Math.min(255, g)),
                Math.max(0, Math.min(255, b))
            );
            updateColorPickerUI('rgb');
        }
    }

    function handleHsvInputChange() {
        const h = parseInt(hsvHInputElement.value);
        const s = parseInt(hsvSInputElement.value);
        const v = parseInt(hsvVInputElement.value);

        if (!isNaN(h) && !isNaN(s) && !isNaN(v)) {
            currentColor.h = Math.max(0, Math.min(360, h));
            currentColor.s = Math.max(0, Math.min(100, s));
            currentColor.v = Math.max(0, Math.min(100, v));
            updateColorPickerUI('hsv');
        }
    }

    function handleHexInputChange() {
        const hex = hexValueInputElement.value;
        const hsv = hexToHsv(hex);
        if (hsv) {
            currentColor = hsv;
            updateColorPickerUI('hex');
        }
    }

    function handleModeSelectorChange() {
        const selectedMode = modeSelectorElement.value;
        rgbInputsContainer.classList.toggle('hidden', selectedMode !== 'rgb');
        hsvInputsContainer.classList.toggle('hidden', selectedMode !== 'hsv');
        hexInputContainer.classList.toggle('hidden', selectedMode !== 'hex');
    }

    // --- Draggable Logic ---
    function makeDraggable() {
        colorPickerHeaderElement.addEventListener('mousedown', function(event) {
            isDraggingPicker = true;
            const rect = customColorPickerElement.getBoundingClientRect();
            pickerDragOffsetX = event.clientX - rect.left;
            pickerDragOffsetY = event.clientY - rect.top;
            customColorPickerElement.style.cursor = 'grabbing'; // Optional: visual feedback
        });

        document.addEventListener('mousemove', function(event) {
            if (isDraggingPicker) {
                customColorPickerElement.style.left = `${event.clientX - pickerDragOffsetX}px`;
                customColorPickerElement.style.top = `${event.clientY - pickerDragOffsetY}px`;
            }
        });

        document.addEventListener('mouseup', function() {
            if (isDraggingPicker) {
                isDraggingPicker = false;
                customColorPickerElement.style.cursor = 'default'; // Reset cursor
            }
        });
    }

    // --- Eyedropper Logic ---
    function activateEyedropper() {
        console.log("Eyedropper activated. Click on the canvas to pick a color.");
        alert("Eyedropper functionality is a placeholder. Integration with canvas needed.");
        // Future:
        // 1. Hide color picker temporarily or change UI to indicate eyedropper mode.
        // 2. Add a one-time click listener to the `drawingCanvas_forge_mixin`.
        // 3. In that listener:
        //    const canvas = document.getElementById('drawingCanvas_forge_mixin');
        //    const ctx = canvas.getContext('2d');
        //    const x = event.offsetX; // Get click coordinates relative to canvas
        //    const y = event.offsetY;
        //    const pixelData = ctx.getImageData(x, y, 1, 1).data;
        //    currentColor = rgbToHsv(pixelData[0], pixelData[1], pixelData[2]);
        //    updateColorPickerUI('eyedropper');
        //    showColorPicker(); // Show picker again
        // 4. Remove the one-time click listener.
    }

    // --- Public API ---
    function initColorPicker() {
        customColorPickerElement = document.getElementById('custom-color-picker');
        colorPickerHeaderElement = document.getElementById('color-picker-header');
        svPadElement = document.getElementById('color-selection-area');
        svHandleElement = document.getElementById('sv-handle');
        hueSliderElement = document.getElementById('hue-slider');
        colorPreviewElement = document.getElementById('color-preview');
        modeSelectorElement = document.getElementById('color-mode-selector');

        rgbInputsContainer = document.getElementById('rgb-inputs');
        hsvInputsContainer = document.getElementById('hsv-inputs');
        hexInputContainer = document.getElementById('hex-input');

        rgbRInputElement = document.getElementById('rgb-r');
        rgbGInputElement = document.getElementById('rgb-g');
        rgbBInputElement = document.getElementById('rgb-b');
        hsvHInputElement = document.getElementById('hsv-h');
        hsvSInputElement = document.getElementById('hsv-s');
        hsvVInputElement = document.getElementById('hsv-v');
        hexValueInputElement = document.getElementById('hex-value');

        eyedropperButton = document.getElementById('eyedropper-button');
        closeButtonElement = document.getElementById('close-color-picker');

        // Add event listeners
        svPadElement.addEventListener('mousedown', handleSvPadMouseDown);
        document.addEventListener('mousemove', handleSvPadMouseMove); // Listen on document for wider drag range
        document.addEventListener('mouseup', handleSvPadMouseUp);     // Listen on document

        hueSliderElement.addEventListener('input', handleHueSliderInput);

        rgbRInputElement.addEventListener('change', handleRgbInputChange);
        rgbGInputElement.addEventListener('change', handleRgbInputChange);
        rgbBInputElement.addEventListener('change', handleRgbInputChange);

        hsvHInputElement.addEventListener('change', handleHsvInputChange);
        hsvSInputElement.addEventListener('change', handleHsvInputChange);
        hsvVInputElement.addEventListener('change', handleHsvInputChange);

        hexValueInputElement.addEventListener('change', handleHexInputChange);

        modeSelectorElement.addEventListener('change', handleModeSelectorChange);
        eyedropperButton.addEventListener('click', activateEyedropper);
        closeButtonElement.addEventListener('click', hideColorPicker);

        // Initialize UI
        updateColorPickerUI('initial');
        handleModeSelectorChange(); // Set initial input visibility
        makeDraggable();
        hideColorPicker(); // Hidden by default
    }

    function showColorPicker() {
        if (customColorPickerElement) {
            customColorPickerElement.style.display = 'block';
            // Optionally, position it:
            // For example, center it or position near the trigger element
            // This requires knowing the trigger or having a default position.
            // customColorPickerElement.style.left = '50%';
            // customColorPickerElement.style.top = '50%';
            // customColorPickerElement.style.transform = 'translate(-50%, -50%)';
        }
    }

    function hideColorPicker() {
        if (customColorPickerElement) {
            customColorPickerElement.style.display = 'none';
        }
    }

    function getCurrentColorHex() {
        return hsvToHex(currentColor.h, currentColor.s, currentColor.v);
    }
    
    function getCurrentColorRgb() {
        return hsvToRgb(currentColor.h, currentColor.s, currentColor.v);
    }


    // Expose public functions
    window.ForgeColorPicker = {
        init: initColorPicker,
        show: showColorPicker,
        hide: hideColorPicker,
        getCurrentColorHex: getCurrentColorHex,
        getCurrentColorRgb: getCurrentColorRgb // Added for potential direct RGB needs
    };

    // Defer initialization until DOM is loaded if this script is run early.
    // However, canvas.min.js will likely call init() explicitly.
    // document.addEventListener('DOMContentLoaded', initColorPicker);

})();
```
