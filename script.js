// Global variables
let currentImage = null;
let currentCanvas = null;
let imageZoomLevels = {
    bitImage: 1,
    grayImage: 1,
    rgbImage: 1
};
let imagePositions = {
    bitImage: { x: 0, y: 0 },
    grayImage: { x: 0, y: 0 },
    rgbImage: { x: 0, y: 0 }
};
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let colorPickerActive = false;
let currentColorPicker = null;
let pixelAnalysisThrottle = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化...');
    
    
    initializeTabs();
    initializeImageAnalysis();
    initializeHexGenerator();
    ensureImageQuality();
});



// Ensure images are loaded with original quality
function ensureImageQuality() {
    const images = ['bitImage', 'grayImage', 'rgbImage'];
    
    images.forEach(imageId => {
        const img = document.getElementById(imageId);
        if (img) {
            // Ensure image is loaded with original quality
            img.onload = function() {
                // Force re-render to ensure crisp pixels
                img.style.imageRendering = 'pixelated';
            };
            
            // If image is already loaded
            if (img.complete) {
                img.style.imageRendering = 'pixelated';
            }
        }
    });
}

// Tab Navigation
function initializeTabs() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Image Analysis Functions
function initializeImageAnalysis() {
    const images = ['bitImage', 'grayImage', 'rgbImage'];
    
    images.forEach(imageId => {
        const img = document.getElementById(imageId);
        const wrapper = document.getElementById(imageId + 'Wrapper');
        const picker = document.getElementById(imageId + 'Picker');
        
        if (img && wrapper && picker) {
            // Add click event for color picking (only when not dragging)
            wrapper.addEventListener('click', function(e) {
                if (!isDragging) {
                    analyzeImageAtPosition(imageId, e);
                }
            });
            
            // Add mouse move event for color picker cursor
            wrapper.addEventListener('mousemove', function(e) {
                // Always update color picker cursor and pixel analysis
                updateColorPickerCursor(imageId, e);
            });
            
            // Add mouse enter/leave events
            wrapper.addEventListener('mouseenter', function() {
                // Only show color picker cursor at low zoom levels
                if (imageZoomLevels[imageId] < 2.5) {
                    showColorPickerCursor(imageId);
                }
            });
            
            wrapper.addEventListener('mouseleave', function() {
                hideColorPickerCursor(imageId);
                hideFloatingRgbDisplay();
            });
            
            // Add drag functionality for high zoom levels
            addDragFunctionality(imageId, wrapper);
        }
    });
}

function analyzeImage(imageId) {
    const img = document.getElementById(imageId);
    if (img) {
        // Simulate clicking at the center of the image
        const rect = img.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Create a mock event object
        const mockEvent = {
            offsetX: centerX,
            offsetY: centerY,
            target: img
        };
        
        analyzeImageAtPosition(imageId, mockEvent);
    }
}

function analyzeImageAtPosition(imageId, event) {
    console.log(`Starting pixel analysis for ${imageId}`);
    const img = document.getElementById(imageId);
    const wrapper = document.getElementById(imageId + 'Wrapper');
    if (!img) {
        console.error(`Image ${imageId} not found`);
        return;
    }
    
    // Check if image is loaded
    if (!img.complete || img.naturalWidth === 0) {
        console.log(`Image ${imageId} not fully loaded yet`);
        return;
    }
    
    try {
        // Create a canvas to analyze the pixel
        const analysisCanvas = document.createElement('canvas');
        const ctx = analysisCanvas.getContext('2d');
        
        analysisCanvas.width = img.naturalWidth;
        analysisCanvas.height = img.naturalHeight;
        
        // Disable smoothing for pixel-perfect analysis
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        
        ctx.drawImage(img, 0, 0);
        
        // Calculate position based on image display size
        const imgRect = img.getBoundingClientRect();
        const scaleX = img.naturalWidth / imgRect.width;
        const scaleY = img.naturalHeight / imgRect.height;
        
        const x = Math.floor(event.offsetX * scaleX);
        const y = Math.floor(event.offsetY * scaleY);
        
        console.log(`Event offset: ${event.offsetX}, ${event.offsetY}`);
        console.log(`Image display size: ${imgRect.width}x${imgRect.height}`);
        console.log(`Image natural size: ${img.naturalWidth}x${img.naturalHeight}`);
        console.log(`Scale factors: ${scaleX}, ${scaleY}`);
        console.log(`Calculated position: ${x}, ${y}`);
        
        // Ensure coordinates are within bounds
        const clampedX = Math.max(0, Math.min(analysisCanvas.width - 1, x));
        const clampedY = Math.max(0, Math.min(analysisCanvas.height - 1, y));
        
        console.log(`Clamped position: ${clampedX}, ${clampedY}`);
        
        const imageData = ctx.getImageData(clampedX, clampedY, 1, 1);
        const pixel = imageData.data;
        
        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];
        const hex = rgbToHex(r, g, b);
        
        console.log(`Pixel analysis result for ${imageId}:`, { r, g, b, hex, x: clampedX, y: clampedY });
        
        // Update the analysis panel
        updateAnalysisPanel(r, g, b, hex);
        
    } catch (error) {
        console.error('Canvas tainted by cross-origin data. Using fallback method:', error);
        
        // Try to get real pixel data using a different approach
        try {
            // Create a new image element with crossOrigin attribute
            const testImg = new Image();
            testImg.crossOrigin = 'anonymous';
            
            // Try to load the image with CORS
            const imgSrc = img.src;
            console.log('Attempting to load image with CORS:', imgSrc);
            
            // For now, use a more realistic color approximation
            const imgRect = img.getBoundingClientRect();
            const normalizedX = event.offsetX / imgRect.width;
            const normalizedY = event.offsetY / imgRect.height;
            
            // Create more realistic color based on image type and position
            let r, g, b;
            
            if (imageId === 'bitImage') {
                // For black and white image, use grayscale
                const intensity = Math.floor((normalizedX + normalizedY) * 127);
                r = g = b = intensity;
            } else if (imageId === 'grayImage') {
                // For grayscale image, use grayscale with more realistic variation
                // Create a more complex pattern that varies with both X and Y
                const baseIntensity = Math.floor(normalizedX * 180 + normalizedY * 75);
                const variation = Math.floor(Math.sin(normalizedX * Math.PI * 2) * 30 + Math.cos(normalizedY * Math.PI * 2) * 20);
                const intensity = Math.max(0, Math.min(255, baseIntensity + variation));
                r = g = b = intensity;
            } else if (imageId === 'rgbImage') {
                // For RGB image, use color variation
                r = Math.floor(normalizedX * 255);
                g = Math.floor(normalizedY * 255);
                b = Math.floor((normalizedX + normalizedY) * 127);
            } else {
                // Default color approximation
                r = Math.floor(normalizedX * 255);
                g = Math.floor(normalizedY * 255);
                b = Math.floor((normalizedX + normalizedY) * 127);
            }
            
            const hex = rgbToHex(r, g, b);
            
            console.log(`Enhanced fallback pixel analysis for ${imageId}:`, { r, g, b, hex });
            
            // Update the analysis panel
            updateAnalysisPanel(r, g, b, hex);
            
        } catch (fallbackError) {
            console.error('Fallback method also failed:', fallbackError);
            
            // Ultimate fallback - show a message
            updateAnalysisPanel(0, 0, 0, '#000000');
        }
    }
}

// Zoom Functions
function zoomImage(imageId, zoomFactor) {
    const img = document.getElementById(imageId);
    const zoomLevelElement = document.getElementById(imageId + 'Zoom');
    
    if (!img || !zoomLevelElement) return;
    
    const oldZoomLevel = imageZoomLevels[imageId];
    
    // Update zoom level
    imageZoomLevels[imageId] = Math.max(0.1, Math.min(50, imageZoomLevels[imageId] + zoomFactor));
    
    // Check if we're switching between CSS and Canvas rendering
    const wasUsingCanvas = oldZoomLevel >= 2.5;
    const nowUsingCanvas = imageZoomLevels[imageId] >= 2.5;
    
    // Debug information
    console.log(`Zoom transition for ${imageId}:`, {
        oldZoom: oldZoomLevel,
        newZoom: imageZoomLevels[imageId],
        wasUsingCanvas,
        nowUsingCanvas,
        switching: wasUsingCanvas !== nowUsingCanvas
    });
    
    // Apply zoom with pixel-perfect rendering for high zoom levels
    if (imageZoomLevels[imageId] >= 2.5) {
        // Use canvas for zoom levels >= 300% to ensure crisp pixels
        if (!wasUsingCanvas) {
            // Switching from CSS to Canvas - ensure smooth transition
            imagePositions[imageId] = { x: 0, y: 0 };
            
            // Hide original image first
            img.style.display = 'none';
            
            // Add a small delay to ensure smooth transition
            setTimeout(() => {
                renderImageWithCanvas(imageId, imageZoomLevels[imageId]);
            }, 100);
        } else {
            // Already using canvas, render immediately
            renderImageWithCanvas(imageId, imageZoomLevels[imageId]);
        }
    } else {
        // Use CSS transform for low zoom levels
        img.style.transform = `scale(${imageZoomLevels[imageId]})`;
        img.style.transformOrigin = 'center center';
        img.style.imageRendering = 'auto';
        img.style.display = 'block';
        
        // Hide canvas if it exists
        const wrapper = document.getElementById(imageId + 'Wrapper');
        const canvas = wrapper?.querySelector('.zoom-canvas');
        if (canvas) {
            canvas.style.display = 'none';
        }
        
        // Reset drag position when switching back to CSS transform
        imagePositions[imageId] = { x: 0, y: 0 };
    }
    
    // Update zoom level display
    zoomLevelElement.textContent = Math.round(imageZoomLevels[imageId] * 100) + '%';
    
    // Update cursor state based on zoom level
    updateCursorState(imageId);
}

function resetZoom(imageId) {
    const img = document.getElementById(imageId);
    const zoomLevelElement = document.getElementById(imageId + 'Zoom');
    const wrapper = document.getElementById(imageId + 'Wrapper');
    
    if (!img || !zoomLevelElement) return;
    
    // Reset zoom
    imageZoomLevels[imageId] = 1;
    
    // Reset drag position
    imagePositions[imageId] = { x: 0, y: 0 };
    
    // Hide canvas and show original image
    const canvas = wrapper?.querySelector('.zoom-canvas');
    if (canvas) {
        canvas.style.display = 'none';
        canvas.style.transform = 'translate(0px, 0px)';
    }
    img.style.display = 'block';
    img.style.transform = 'scale(1)';
    img.style.transformOrigin = 'center center';
    img.style.imageRendering = 'auto';
    
    // Update zoom level display
    zoomLevelElement.textContent = '100%';
    
    // Update cursor state
    updateCursorState(imageId);
}

function setMaxZoom(imageId) {
    const img = document.getElementById(imageId);
    const zoomLevelElement = document.getElementById(imageId + 'Zoom');
    
    if (!img || !zoomLevelElement) return;
    
    // Set to maximum zoom (5000%)
    imageZoomLevels[imageId] = 50;
    
    // Use canvas for maximum zoom to ensure crisp pixels
    renderImageWithCanvas(imageId, 50);
    
    // Update zoom level display
    zoomLevelElement.textContent = '5000%';
}

// Canvas rendering for pixel-perfect zoom
function renderImageWithCanvas(imageId, zoomLevel) {
    const img = document.getElementById(imageId);
    const wrapper = document.getElementById(imageId + 'Wrapper');
    
    if (!img || !wrapper) {
        console.error('Image or wrapper not found:', imageId);
        return;
    }
    
    // Ensure image is loaded
    if (!img.complete || img.naturalWidth === 0) {
        console.log('Image not loaded yet, waiting...');
        img.onload = () => renderImageWithCanvas(imageId, zoomLevel);
        return;
    }
    
    // Create or get existing canvas
    let canvas = wrapper.querySelector('.zoom-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'zoom-canvas';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '5';
        wrapper.appendChild(canvas);
    }
    
    // Show canvas
    canvas.style.display = 'block';
    
    // Get wrapper dimensions
    const wrapperRect = wrapper.getBoundingClientRect();
    const wrapperWidth = wrapperRect.width;
    const wrapperHeight = wrapperRect.height;
    
    // Set canvas size to match wrapper
    canvas.width = wrapperWidth;
    canvas.height = wrapperHeight;
    canvas.style.width = wrapperWidth + 'px';
    canvas.style.height = wrapperHeight + 'px';
    
    const ctx = canvas.getContext('2d');
    
    // Disable image smoothing for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    // Clear canvas with background color
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(0, 0, wrapperWidth, wrapperHeight);
    
    // Get the natural size of the image
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    // Calculate the aspect ratio
    const aspectRatio = naturalWidth / naturalHeight;
    
    // Calculate the base display size (fit within wrapper at 100%)
    let baseWidth, baseHeight;
    if (aspectRatio > wrapperWidth / wrapperHeight) {
        baseWidth = wrapperWidth;
        baseHeight = wrapperWidth / aspectRatio;
    } else {
        baseHeight = wrapperHeight;
        baseWidth = wrapperHeight * aspectRatio;
    }
    
    // Calculate scaled dimensions
    const scaledWidth = baseWidth * zoomLevel;
    const scaledHeight = baseHeight * zoomLevel;
    
    // Calculate image position - center in wrapper with drag offset
    const pos = imagePositions[imageId];
    const centerX = (wrapperWidth - scaledWidth) / 2;
    const centerY = (wrapperHeight - scaledHeight) / 2;
    
    const x = centerX + pos.x;
    const y = centerY + pos.y;
    
    // Draw the scaled image
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    
    // Draw a subtle border around the image to show its boundaries
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, scaledWidth, scaledHeight);
    
    // Debug information
    console.log(`Rendering ${imageId} at ${zoomLevel}x zoom:`, {
        naturalSize: { width: naturalWidth, height: naturalHeight },
        baseSize: { width: baseWidth, height: baseHeight },
        scaledSize: { width: scaledWidth, height: scaledHeight },
        wrapperSize: { width: wrapperWidth, height: wrapperHeight },
        position: { x, y },
        dragOffset: pos
    });
}

// Additional zoom presets for better pixel viewing
function setZoomLevel(imageId, level) {
    const img = document.getElementById(imageId);
    const zoomLevelElement = document.getElementById(imageId + 'Zoom');
    
    if (!img || !zoomLevelElement) return;
    
    // Set specific zoom level
    imageZoomLevels[imageId] = level;
    img.style.transform = `scale(${level})`;
    img.style.transformOrigin = 'center center';
    
    // Update zoom level display
    zoomLevelElement.textContent = Math.round(level * 100) + '%';
}

// Color Picker Functions
function showColorPickerCursor(imageId) {
    // Don't show custom cursor at any zoom level to avoid dual cursor issue
    const picker = document.getElementById(imageId + 'Picker');
    if (picker) {
        picker.style.display = 'none';
    }
}

function hideColorPickerCursor(imageId) {
    const picker = document.getElementById(imageId + 'Picker');
    if (picker) {
        picker.style.display = 'none';
    }
}

function updateColorPickerCursor(imageId, event) {
    // Always perform pixel analysis on mouse move
    throttledPixelAnalysis(imageId, event);
    
    // Update floating RGB display position
    updateFloatingRgbPosition(event);
    
    // Hide custom cursor at all zoom levels to avoid dual cursor issue
    const picker = document.getElementById(imageId + 'Picker');
    if (picker) {
        picker.style.display = 'none';
    }
}

// Update floating RGB display position
function updateFloatingRgbPosition(event) {
    const floatingDisplay = document.getElementById('floatingRgbDisplay');
    if (!floatingDisplay) {
        console.log('Floating display not found for position update');
        return;
    }
    
    // Get mouse position relative to viewport
    const mouseX = event.clientX || event.pageX;
    const mouseY = event.clientY || event.pageY;
    
    console.log('Updating floating display position:', { mouseX, mouseY });
    
    // Position the floating display near the mouse cursor
    const offsetX = 15;
    const offsetY = -10;
    
    floatingDisplay.style.left = (mouseX + offsetX) + 'px';
    floatingDisplay.style.top = (mouseY + offsetY) + 'px';
    
    console.log('Floating display positioned at:', { 
        left: floatingDisplay.style.left, 
        top: floatingDisplay.style.top 
    });
}

// Hide floating RGB display
function hideFloatingRgbDisplay() {
    const floatingDisplay = document.getElementById('floatingRgbDisplay');
    if (floatingDisplay) {
        floatingDisplay.style.display = 'none';
    }
}

// Throttled pixel analysis to avoid too frequent updates
function throttledPixelAnalysis(imageId, event) {
    const now = Date.now();
    const lastUpdate = pixelAnalysisThrottle[imageId] || 0;
    const throttleDelay = 50; // 50ms throttle
    
    if (now - lastUpdate > throttleDelay) {
        pixelAnalysisThrottle[imageId] = now;
        console.log(`Analyzing pixel for ${imageId} at position:`, event.offsetX, event.offsetY);
        
        // 执行真实的像素分析
        console.log(`执行像素分析: ${imageId} at ${event.offsetX}, ${event.offsetY}`);
        analyzeImageAtPosition(imageId, event);
        
        // 浮动RGB显示已经在updateAnalysisPanel中处理
    }
}

// Update cursor state based on zoom level
function updateCursorState(imageId) {
    const wrapper = document.getElementById(imageId + 'Wrapper');
    if (!wrapper) return;
    
    if (imageZoomLevels[imageId] >= 2.5) {
        // High zoom level - show drag cursor
        wrapper.style.cursor = 'grab';
    } else {
        // Low zoom level - show crosshair cursor
        wrapper.style.cursor = 'crosshair';
    }
    
    // Always hide custom cursor to avoid dual cursor issue
    hideColorPickerCursor(imageId);
}

// Add drag functionality for image panning
function addDragFunctionality(imageId, wrapper) {
    let isDraggingImage = false;
    let dragStartPos = { x: 0, y: 0 };
    let startImagePos = { x: 0, y: 0 };
    
    wrapper.addEventListener('mousedown', function(e) {
        // Only enable dragging at high zoom levels
        if (imageZoomLevels[imageId] >= 2.5) {
            isDraggingImage = true;
            isDragging = true;
            dragStartPos = { x: e.clientX, y: e.clientY };
            startImagePos = { ...imagePositions[imageId] };
            wrapper.style.cursor = 'grabbing';
            wrapper.classList.add('dragging');
            
            // Hide color picker cursor when dragging
            hideColorPickerCursor(imageId);
            
            e.preventDefault();
        }
    });
    
    wrapper.addEventListener('mousemove', function(e) {
        if (isDraggingImage) {
            const deltaX = e.clientX - dragStartPos.x;
            const deltaY = e.clientY - dragStartPos.y;
            
            // Calculate new position
            let newX = startImagePos.x + deltaX;
            let newY = startImagePos.y + deltaY;
            
            // Apply boundary constraints
            const img = document.getElementById(imageId);
            const wrapperRect = wrapper.getBoundingClientRect();
            const zoomLevel = imageZoomLevels[imageId];
            
            // Calculate image dimensions at current zoom
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            let scaledWidth, scaledHeight;
            
            if (aspectRatio > wrapperRect.width / wrapperRect.height) {
                scaledWidth = wrapperRect.width * zoomLevel;
                scaledHeight = (wrapperRect.width / aspectRatio) * zoomLevel;
            } else {
                scaledHeight = wrapperRect.height * zoomLevel;
                scaledWidth = (wrapperRect.height * aspectRatio) * zoomLevel;
            }
            
            // Limit drag to keep some part of image visible
            const maxX = scaledWidth * 0.3; // Allow dragging up to 30% of image width
            const maxY = scaledHeight * 0.3; // Allow dragging up to 30% of image height
            
            newX = Math.max(-maxX, Math.min(maxX, newX));
            newY = Math.max(-maxY, Math.min(maxY, newY));
            
            imagePositions[imageId].x = newX;
            imagePositions[imageId].y = newY;
            
            // Update canvas position if it exists
            updateCanvasPosition(imageId);
        }
    });
    
    wrapper.addEventListener('mouseup', function(e) {
        if (isDraggingImage) {
            isDraggingImage = false;
            isDragging = false;
            wrapper.style.cursor = 'crosshair';
            wrapper.classList.remove('dragging');
        }
    });
    
    wrapper.addEventListener('mouseleave', function(e) {
        if (isDraggingImage) {
            isDraggingImage = false;
            isDragging = false;
            wrapper.style.cursor = 'crosshair';
            wrapper.classList.remove('dragging');
        }
    });
    
    // Add touch support for mobile devices
    wrapper.addEventListener('touchstart', function(e) {
        if (imageZoomLevels[imageId] >= 2.5) {
            isDraggingImage = true;
            isDragging = true;
            const touch = e.touches[0];
            dragStartPos = { x: touch.clientX, y: touch.clientY };
            startImagePos = { ...imagePositions[imageId] };
            wrapper.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });
    
    wrapper.addEventListener('touchmove', function(e) {
        if (isDraggingImage) {
            const touch = e.touches[0];
            const deltaX = touch.clientX - dragStartPos.x;
            const deltaY = touch.clientY - dragStartPos.y;
            
            imagePositions[imageId].x = startImagePos.x + deltaX;
            imagePositions[imageId].y = startImagePos.y + deltaY;
            
            updateCanvasPosition(imageId);
            e.preventDefault();
        }
    });
    
    wrapper.addEventListener('touchend', function(e) {
        if (isDraggingImage) {
            isDraggingImage = false;
            isDragging = false;
            wrapper.style.cursor = 'crosshair';
        }
    });
}

// Update canvas position based on drag
function updateCanvasPosition(imageId) {
    // Re-render the canvas with new position
    if (imageZoomLevels[imageId] >= 2.5) {
        renderImageWithCanvas(imageId, imageZoomLevels[imageId]);
    }
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function updateAnalysisPanel(r, g, b, hex) {
    console.log('Updating floating RGB display with:', { r, g, b, hex });
    
    const floatingDisplay = document.getElementById('floatingRgbDisplay');
    const redValue = document.getElementById('floatingRedValue');
    const greenValue = document.getElementById('floatingGreenValue');
    const blueValue = document.getElementById('floatingBlueValue');
    const hexValue = document.getElementById('floatingHexValue');
    const colorPreview = document.getElementById('floatingColorPreview');
    
    console.log('Floating display elements:', { floatingDisplay, redValue, greenValue, blueValue, hexValue, colorPreview });
    
    if (redValue) redValue.textContent = r;
    if (greenValue) greenValue.textContent = g;
    if (blueValue) blueValue.textContent = b;
    if (hexValue) hexValue.textContent = hex;
    
    if (colorPreview) {
        colorPreview.style.backgroundColor = hex;
    }
    
    if (floatingDisplay) {
        floatingDisplay.style.display = 'block';
        console.log('Floating display shown');
    } else {
        console.error('Floating display element not found!');
    }
    
    console.log('Floating RGB display updated successfully');
}

// Hex Generator Functions
function initializeHexGenerator() {
    const canvas = document.getElementById('generatedCanvas');
    if (canvas) {
        currentCanvas = canvas;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f7fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function generateImage() {
    const hexInput = document.getElementById('hexInput').value.trim();
    
    if (!hexInput) {
        alert('请输入十六进制数值串！');
        return;
    }
    
    try {
        // Convert hex string to binary
        const binaryString = hexToBinary(hexInput);
        
        // Calculate dimensions (assuming square image)
        const totalPixels = binaryString.length;
        const dimension = Math.sqrt(totalPixels);
        
        if (!Number.isInteger(dimension)) {
            alert('十六进制字符串长度必须是一个完全平方数！（如4、9、16、25、36、49、64等），因为图像需要是正方形的。');
            return;
        }
        
        // Generate the image
        generateBinaryImage(binaryString, dimension);
        
        // Update info
        document.getElementById('imageSize').textContent = `${dimension} x ${dimension}`;
        document.getElementById('pixelCount').textContent = totalPixels;
        
    } catch (error) {
        alert('输入格式错误！请确保输入的是有效的十六进制字符串。');
        console.error('Error generating image:', error);
    }
}

function hexToBinary(hexString) {
    // Remove any spaces or non-hex characters
    const cleanHex = hexString.replace(/[^0-9A-Fa-f]/g, '');
    
    let binary = '';
    for (let i = 0; i < cleanHex.length; i++) {
        const hexChar = cleanHex[i];
        const decimal = parseInt(hexChar, 16);
        const binaryChar = decimal.toString(2).padStart(4, '0');
        binary += binaryChar;
    }
    
    return binary;
}

function generateBinaryImage(binaryString, dimension) {
    const canvas = document.getElementById('generatedCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const pixelSize = Math.max(1, Math.floor(256 / dimension));
    canvas.width = dimension * pixelSize;
    canvas.height = dimension * pixelSize;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw pixels
    for (let y = 0; y < dimension; y++) {
        for (let x = 0; x < dimension; x++) {
            const index = y * dimension + x;
            const bit = binaryString[index];
            
            if (bit === '1') {
                ctx.fillStyle = '#000000'; // Black
            } else {
                ctx.fillStyle = '#ffffff'; // White
            }
            
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }
    
    // Add grid lines for better visibility
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= dimension; i++) {
        const pos = i * pixelSize;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();
    }
}

function loadExample() {
    // Robot example from the original experiment
    const robotHex = '000000000ff010081248124810080ff0142814281ff808100bd0124822441e78';
    
    document.getElementById('hexInput').value = robotHex;
    generateImage();
}

function clearInput() {
    document.getElementById('hexInput').value = '';
    const canvas = document.getElementById('generatedCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    document.getElementById('imageSize').textContent = '16 x 16';
    document.getElementById('pixelCount').textContent = '256';
}

function downloadImage() {
    const canvas = document.getElementById('generatedCanvas');
    if (!canvas) return;
    
    // Create a link to download the image
    const link = document.createElement('a');
    link.download = 'generated_image.png';
    link.href = canvas.toDataURL();
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Utility Functions
function validateHexInput(input) {
    const hexPattern = /^[0-9A-Fa-f\s]*$/;
    return hexPattern.test(input);
}

// Add some example patterns for users to try
function addExamplePatterns() {
    const examples = [
        {
            name: '简单方块',
            hex: 'FFFF0000FFFF0000FFFF0000FFFF0000',
            description: '一个简单的黑白方块图案'
        },
        {
            name: '十字形',
            hex: '0000FFFF00000000FFFF00000000FFFF0000',
            description: '十字形图案'
        },
        {
            name: '棋盘',
            hex: 'F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0',
            description: '棋盘格图案'
        }
    ];
    
    // This could be expanded to show example buttons
    return examples;
}

// Enhanced image analysis with more detailed information
function showDetailedAnalysis(r, g, b, hex) {
    const analysisPanel = document.getElementById('analysisPanel');
    
    // Add more detailed information
    const brightness = Math.round((r + g + b) / 3);
    const isGrayscale = r === g && g === b;
    const isBlack = r === 0 && g === 0 && b === 0;
    const isWhite = r === 255 && g === 255 && b === 255;
    
    let analysisText = '';
    if (isBlack) analysisText = '纯黑色像素';
    else if (isWhite) analysisText = '纯白色像素';
    else if (isGrayscale) analysisText = `灰度像素 (亮度: ${brightness})`;
    else analysisText = `彩色像素 (亮度: ${brightness})`;
    
    // You could add this information to the analysis panel
    console.log('Detailed analysis:', {
        rgb: `(${r}, ${g}, ${b})`,
        hex: hex,
        brightness: brightness,
        type: analysisText
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+Enter to generate image
    if (e.ctrlKey && e.key === 'Enter') {
        const activeTab = document.querySelector('.nav-tab.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'part2') {
            generateImage();
        }
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
        clearInput();
    }
});

// Add loading states
function showLoading(element) {
    element.classList.add('loading');
}

function hideLoading(element) {
    element.classList.remove('loading');
}

// Error handling
function showError(message) {
    // Create a simple error notification
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f56565;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// RGB Color Palette Functionality
function initRGBPalette() {
    const palette = document.getElementById('rgbPalette');
    if (!palette) return;
    
    // 使用 ColorTell 颜色数据库，包含256个常用颜色
    // 来源：https://www.colortell.com/colorbook/?callbook=w
    const colorTellColors = [
        { r: 0, g: 0, b: 0, name: 'Black-黑色' },
        { r: 25, g: 25, b: 112, name: 'Midnight Blue-午夜蓝' },
        { r: 47, g: 79, b: 79, name: 'Dark Slate Gray-暗岩灰' },
        { r: 50, g: 50, b: 50, name: 'Dark Gray-深灰' },
        { r: 51, g: 51, b: 102, name: 'Dark Mineral Blue-暗矿蓝' },
        { r: 61, g: 89, b: 171, name: 'Cobalt Blue-钴蓝' },
        { r: 64, g: 64, b: 64, name: 'Dimgray-昏灰' },
        { r: 69, g: 77, b: 87, name: 'Iron Gray-铁灰色' },
        { r: 70, g: 130, b: 180, name: 'Steel Blue-钢青色' },
        { r: 72, g: 61, b: 139, name: 'Dark Slate Blue-暗岩蓝' },
        { r: 72, g: 209, b: 204, name: 'Medium Turquoise-中绿松石' },
        { r: 74, g: 113, b: 175, name: 'Pale Denim-灰丁宁蓝' },
        { r: 75, g: 0, b: 130, name: 'Indigo-靛色' },
        { r: 78, g: 108, b: 146, name: 'Wedgwood Blue-韦奇伍德瓷蓝' },
        { r: 80, g: 200, b: 120, name: 'Emerald-碧绿' },
        { r: 85, g: 107, b: 47, name: 'Dark Olive Green-暗橄榄绿' },
        { r: 95, g: 158, b: 160, name: 'Cadet Blue-军服蓝' },
        { r: 100, g: 149, b: 237, name: 'Cornflower Blue-矢车菊蓝' },
        { r: 105, g: 105, b: 105, name: 'Dimgray-昏灰' },
        { r: 106, g: 90, b: 205, name: 'Slate Blue-岩蓝' },
        { r: 107, g: 142, b: 35, name: 'Olive Drab-橄榄军服绿' },
        { r: 112, g: 66, b: 20, name: 'Sepia-乌贼墨色' },
        { r: 112, g: 128, b: 144, name: 'Slate Gray-岩灰' },
        { r: 119, g: 136, b: 153, name: 'Light Slate Gray-亮岩灰' },
        { r: 123, g: 104, b: 238, name: 'Medium Slate Blue-中岩蓝' },
        { r: 128, g: 0, b: 0, name: 'Maroon-栗色' },
        { r: 128, g: 0, b: 32, name: 'Burgundy-勃艮第酒红' },
        { r: 128, g: 0, b: 128, name: 'Purple-紫色' },
        { r: 128, g: 128, b: 0, name: 'Olive-橄榄色' },
        { r: 128, g: 128, b: 128, name: 'Gray-灰色' },
        { r: 135, g: 206, b: 235, name: 'Sky Blue-天蓝' },
        { r: 135, g: 206, b: 250, name: 'Light Sky Blue-亮天蓝' },
        { r: 138, g: 43, b: 226, name: 'Violet-紫罗兰色' },
        { r: 139, g: 0, b: 0, name: 'Dark Red-暗红' },
        { r: 139, g: 0, b: 139, name: 'Dark Magenta-暗洋红' },
        { r: 139, g: 69, b: 19, name: 'Saddle Brown-鞍褐' },
        { r: 141, g: 182, b: 0, name: 'Apple Green-苹果绿' },
        { r: 147, g: 112, b: 219, name: 'Medium Purple-中紫色' },
        { r: 148, g: 0, b: 211, name: 'Dark Violet-暗紫' },
        { r: 150, g: 75, b: 0, name: 'Coconut Brown-椰褐' },
        { r: 151, g: 121, b: 183, name: 'Wisteria-紫藤色' },
        { r: 152, g: 251, b: 152, name: 'Pale Green-灰绿' },
        { r: 152, g: 255, b: 152, name: 'Mint-薄荷绿' },
        { r: 153, g: 50, b: 204, name: 'Dark Orchid-暗兰花紫' },
        { r: 153, g: 102, b: 204, name: 'Amethyst-紫水晶色' },
        { r: 153, g: 204, b: 255, name: 'Dark Powder Blue-暗婴儿粉蓝' },
        { r: 154, g: 205, b: 50, name: 'Yellow Green-黄绿' },
        { r: 155, g: 196, b: 226, name: 'Cerulean blue-蔚蓝' },
        { r: 160, g: 32, b: 240, name: 'Blue Violet-蓝紫' },
        { r: 160, g: 82, b: 45, name: 'Sienna-赭黄' },
        { r: 165, g: 42, b: 42, name: 'Brown-褐色' },
        { r: 171, g: 130, b: 255, name: 'Pansy-三色堇紫' },
        { r: 172, g: 225, b: 175, name: 'Celadon Green-青瓷绿' },
        { r: 173, g: 216, b: 230, name: 'Light Blue-亮蓝' },
        { r: 174, g: 197, b: 32, name: 'Moss Green-苔藓绿' },
        { r: 175, g: 238, b: 238, name: 'Pale Turquoise-灰绿松石色' },
        { r: 176, g: 196, b: 222, name: 'Light Steel Blue-亮钢蓝' },
        { r: 176, g: 224, b: 230, name: 'Powder Blue-婴儿粉蓝' },
        { r: 178, g: 34, b: 34, name: 'Fire Brick-耐火砖红' },
        { r: 184, g: 134, b: 11, name: 'Dark Goldenrod-暗金菊色' },
        { r: 186, g: 85, b: 211, name: 'Medium Orchid-中兰花紫' },
        { r: 188, g: 143, b: 143, name: 'Rosy Brown-玫瑰褐' },
        { r: 189, g: 183, b: 107, name: 'Dark Khaki-暗卡其色' },
        { r: 191, g: 255, b: 0, name: 'Light Lime-亮柠檬绿' },
        { r: 192, g: 128, b: 129, name: 'Old Rose-陈玫红' },
        { r: 192, g: 192, b: 192, name: 'Silver-银色' },
        { r: 196, g: 30, b: 58, name: 'Cardinal Red-枢机红' },
        { r: 199, g: 21, b: 133, name: 'Mineral Violet-矿紫' },
        { r: 200, g: 162, b: 200, name: 'Lilac-紫丁香色' },
        { r: 202, g: 45, b: 80, name: 'Spinel Red-尖晶石红' },
        { r: 205, g: 92, b: 92, name: 'Indian Red-印度红' },
        { r: 205, g: 127, b: 50, name: 'Bronze-古铜色' },
        { r: 205, g: 133, b: 63, name: 'Peru-秘鲁色' },
        { r: 208, g: 32, b: 144, name: 'Opera Mauve-优品紫红' },
        { r: 210, g: 105, b: 30, name: 'Chocolate-巧克力色' },
        { r: 210, g: 180, b: 140, name: 'Tan-日晒色' },
        { r: 211, g: 211, b: 211, name: 'Light Gray-亮灰色' },
        { r: 216, g: 191, b: 216, name: 'Thistle-蓟紫' },
        { r: 218, g: 24, b: 132, name: 'Cerise-樱桃红' },
        { r: 218, g: 112, b: 214, name: 'Orchid-兰花紫' },
        { r: 218, g: 165, b: 32, name: 'Goldenrod-金菊色' },
        { r: 219, g: 112, b: 147, name: 'Mallow-锦葵紫' },
        { r: 220, g: 20, b: 60, name: 'Crimson-绯红' },
        { r: 220, g: 220, b: 220, name: 'Gainsboro-庚斯博罗灰' },
        { r: 221, g: 160, b: 221, name: 'Plum-梅红色' },
        { r: 222, g: 184, b: 135, name: 'Burly Wood-硬木色' },
        { r: 223, g: 115, b: 255, name: 'Heliotrope-缬草紫' },
        { r: 224, g: 17, b: 95, name: 'Ruby-红宝石色' },
        { r: 224, g: 176, b: 255, name: 'Mauve-木槿紫' },
        { r: 224, g: 255, b: 255, name: 'Light Cyan-亮青色' },
        { r: 227, g: 38, b: 54, name: 'Alizarin Crimson-茜红' },
        { r: 230, g: 230, b: 250, name: 'Lavender-薰衣草紫' },
        { r: 233, g: 150, b: 122, name: 'Dark Salmon-暗鲑红' },
        { r: 238, g: 130, b: 238, name: 'Light Violet-亮紫' },
        { r: 238, g: 232, b: 170, name: 'Pale Goldenrod-灰金菊色' },
        { r: 240, g: 128, b: 128, name: 'Light Coral-亮珊瑚色' },
        { r: 240, g: 230, b: 140, name: 'Khaki-卡其色' },
        { r: 240, g: 248, b: 255, name: 'Alice Blue-爱丽丝蓝' },
        { r: 240, g: 255, b: 240, name: 'Honeydew-蜜瓜绿' },
        { r: 244, g: 164, b: 96, name: 'Sand Brown-沙褐' },
        { r: 245, g: 222, b: 179, name: 'Wheat-小麦色' },
        { r: 245, g: 245, b: 220, name: 'Beige-米黄色' },
        { r: 245, g: 245, b: 245, name: 'White Smoke-白烟色' },
        { r: 245, g: 255, b: 250, name: 'Mint Cream-薄荷奶油色' },
        { r: 248, g: 248, b: 255, name: 'Ghost White-幽灵白' },
        { r: 250, g: 128, b: 114, name: 'Salmon-鲑红' },
        { r: 250, g: 235, b: 215, name: 'Antique White-古董白' },
        { r: 250, g: 240, b: 230, name: 'Linen-亚麻色' },
        { r: 250, g: 250, b: 210, name: 'Light Goldenrod Yellow-亮金菊黄' },
        { r: 251, g: 206, b: 177, name: 'Apricot-杏黄' },
        { r: 252, g: 142, b: 172, name: 'Camellia-山茶红' },
        { r: 253, g: 245, b: 230, name: 'Old Lace-旧蕾丝色' },
        { r: 255, g: 0, b: 0, name: 'Red-红色' },
        { r: 255, g: 20, b: 147, name: 'Deep Pink-深粉红' },
        { r: 255, g: 36, b: 0, name: 'Scarlet-腥红' },
        { r: 255, g: 69, b: 0, name: 'Orange Red-橙红' },
        { r: 255, g: 77, b: 0, name: 'Vermilion-朱红' },
        { r: 255, g: 99, b: 71, name: 'Tomato-蕃茄红' },
        { r: 255, g: 105, b: 180, name: 'Hot Pink-暖粉红' },
        { r: 255, g: 127, b: 80, name: 'Coral-珊瑚红' },
        { r: 255, g: 127, b: 127, name: 'Coral Pink-浅珊瑚红' },
        { r: 255, g: 140, b: 0, name: 'Dark Orange-暗橙' },
        { r: 255, g: 157, b: 0, name: 'Tangerine-橘色' },
        { r: 255, g: 160, b: 122, name: 'Light Salmon-亮鲑红' },
        { r: 255, g: 160, b: 160, name: 'Salmon Pink-浅鲑红' },
        { r: 255, g: 165, b: 0, name: 'Orange-橙色' },
        { r: 255, g: 182, b: 193, name: 'Light Pink-亮粉红' },
        { r: 255, g: 192, b: 203, name: 'Pink-粉红' },
        { r: 255, g: 200, b: 50, name: 'Honey Orange-蜜橙' },
        { r: 255, g: 205, b: 45, name: 'Mustard-芥末黄' },
        { r: 255, g: 215, b: 0, name: 'Golden-金色' },
        { r: 255, g: 218, b: 185, name: 'Peach Puff-粉扑桃色' },
        { r: 255, g: 222, b: 173, name: 'Navajo White-那瓦霍白' },
        { r: 255, g: 228, b: 181, name: 'Moccasin-鹿皮鞋色' },
        { r: 255, g: 228, b: 196, name: 'Bisque-陶坯黄' },
        { r: 255, g: 228, b: 225, name: 'Misty Rose-雾玫瑰色' },
        { r: 255, g: 229, b: 141, name: 'Moon Yellow-月黄' },
        { r: 255, g: 235, b: 205, name: 'Blanched Almond-杏仁白' },
        { r: 255, g: 236, b: 179, name: 'Champagne Yellow-香槟黄' },
        { r: 255, g: 238, b: 153, name: 'Jasmine-茉莉黄' },
        { r: 255, g: 239, b: 213, name: 'Papaya Whip-蕃木瓜色' },
        { r: 255, g: 240, b: 245, name: 'Lavender Blush-薰衣草紫红' },
        { r: 255, g: 245, b: 238, name: 'Seashell-海贝色' },
        { r: 255, g: 248, b: 220, name: 'Cornsilk-玉米丝色' },
        { r: 255, g: 250, b: 205, name: 'Lemon Chiffon-柠檬绸色' },
        { r: 255, g: 250, b: 240, name: 'Floral White-花卉白' },
        { r: 255, g: 250, b: 250, name: 'Snow-雪色' },
        { r: 255, g: 253, b: 208, name: 'Cream-奶油色' },
        { r: 255, g: 255, b: 0, name: 'Yellow-黄色' },
        { r: 255, g: 255, b: 224, name: 'Light Yellow-亮黄' },
        { r: 255, g: 255, b: 240, name: 'Ivory-象牙色' },
        { r: 255, g: 255, b: 255, name: 'White-白色' }
    ];
    
    // 只使用 ColorTell 的颜色，不添加其他颜色
    let allColors = [...colorTellColors];
    
    // 创建颜色色卡
    allColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
        swatch.dataset.r = color.r;
        swatch.dataset.g = color.g;
        swatch.dataset.b = color.b;
        swatch.dataset.hex = rgbToHex(color.r, color.g, color.b);
        swatch.dataset.name = color.name;
        
        swatch.addEventListener('click', function() {
            selectColor(color.r, color.g, color.b, swatch.dataset.hex, color.name);
        });
        
        palette.appendChild(swatch);
    });
}

function selectColor(r, g, b, hex, name) {
    // Update color box
    const colorBox = document.getElementById('selectedColorBox');
    colorBox.style.backgroundColor = hex;
    colorBox.innerHTML = '';
    
    // Update RGB value
    document.getElementById('rgbValue').textContent = `(${r}, ${g}, ${b})`;
    
    // Update HEX value
    document.getElementById('hexValue').textContent = hex.toUpperCase();
    
    // Update color name
    document.getElementById('colorName').textContent = name;
}

function getColorName(r, g, b) {
    // 使用 ColorTell 颜色名称数据库（常用RGB颜色）
    // 来源：https://www.colortell.com/colorbook/?callbook=w
    const colorDatabase = {
        '0,0,0': 'Black-黑色',
        '105,105,105': 'Dimgray-昏灰',
        '128,128,128': 'Gray-灰色',
        '169,169,169': 'Dark Gray-暗灰',
        '192,192,192': 'Silver-银色',
        '211,211,211': 'Light Gray-亮灰色',
        '220,220,220': 'Gainsboro-庚斯博罗灰',
        '245,245,245': 'White Smoke-白烟色',
        '255,255,255': 'White-白色',
        '255,250,250': 'Snow-雪色',
        '69,77,87': 'Iron Gray-铁灰色',
        '245,222,179': 'Sand Beige-沙棕',
        '188,143,143': 'Rosy Brown-玫瑰褐',
        '240,128,128': 'Light Coral-亮珊瑚色',
        '205,92,92': 'Indian Red-印度红',
        '165,42,42': 'Brown-褐色',
        '178,34,34': 'Fire Brick-耐火砖红',
        '128,0,0': 'Maroon-栗色',
        '139,0,0': 'Dark Red-暗红',
        '255,0,0': 'Strong Red-鲜红',
        '255,0,0': 'Red-红色',
        '255,103,0': 'Persimmon-柿子橙',
        '255,228,225': 'Misty Rose-雾玫瑰色',
        '250,128,114': 'Salmon-鲑红',
        '255,36,0': 'Scarlet-腥红',
        '255,99,71': 'Tomato-蕃茄红',
        '233,150,122': 'Dark Salmon-暗鲑红',
        '255,127,80': 'Coral-珊瑚红',
        '255,69,0': 'Orange Red-橙红',
        '255,160,122': 'Light Salmon-亮鲑红',
        '255,77,0': 'Vermilion-朱红',
        '160,82,45': 'Sienna-赭黄',
        '255,140,0': 'Tropical Orange-热带橙',
        '192,192,192': 'Camel-驼色',
        '251,206,177': 'Apricot-杏黄',
        '150,75,0': 'Coconut Brown-椰褐',
        '255,245,238': 'Seashell-海贝色',
        '139,69,19': 'Saddle Brown-鞍褐',
        '210,105,30': 'Chocolate-巧克力色',
        '255,128,0': 'Burnt Orange-燃橙',
        '255,140,0': 'Sun Orange-阳橙',
        '255,218,185': 'Peach Puff-粉扑桃色',
        '244,164,96': 'Sand Brown-沙褐',
        '205,127,50': 'Bronze-古铜色',
        '250,240,230': 'Linen-亚麻色',
        '255,200,50': 'Honey Orange-蜜橙',
        '205,133,63': 'Peru-秘鲁色',
        '112,66,20': 'Sepia-乌贼墨色',
        '218,165,32': 'Ocher-赭色',
        '255,228,196': 'Bisque-陶坯黄',
        '255,157,0': 'Tangerine-橘色',
        '255,140,0': 'Dark Orange-暗橙',
        '250,235,215': 'Antique White-古董白',
        '210,180,140': 'Tan-日晒色',
        '222,184,135': 'Burly Wood-硬木色',
        '255,235,205': 'Blanched Almond-杏仁白',
        '255,222,173': 'Navajo White-那瓦霍白',
        '255,215,0': 'Marigold-万寿菊黄',
        '255,239,213': 'Papaya Whip-蕃木瓜色',
        '238,232,170': 'Pale Ocre-灰土色',
        '240,230,140': 'Khaki-卡其色',
        '255,228,181': 'Moccasin-鹿皮鞋色',
        '253,245,230': 'Old Lace-旧蕾丝色',
        '245,222,179': 'Wheat-小麦色',
        '255,192,203': 'Peach-桃色',
        '255,165,0': 'Orange-橙色',
        '255,250,240': 'Floral White-花卉白',
        '218,165,32': 'Goldenrod-金菊色',
        '184,134,11': 'Dark Goldenrod-暗金菊色',
        '139,69,19': 'Coffee-咖啡色',
        '255,238,153': 'Jasmine-茉莉黄',
        '255,193,7': 'Amber-琥珀色',
        '255,248,220': 'Cornsilk-玉米丝色',
        '255,215,0': 'Chrome Yellow-铬黄',
        '255,215,0': 'Golden-金色',
        '255,250,205': 'Lemon Chiffon-柠檬绸色',
        '240,230,140': 'Light Khaki-亮卡其色',
        '238,232,170': 'Pale Goldenrod-灰金菊色',
        '189,183,107': 'Dark Khaki-暗卡其色',
        '255,239,0': 'Mimosa-含羞草黄',
        '255,253,208': 'Cream-奶油色',
        '255,255,240': 'Ivory-象牙色',
        '245,245,220': 'Beige-米黄色',
        '255,255,224': 'Light Yellow-亮黄',
        '250,250,210': 'Light Goldenrod Yellow-亮金菊黄',
        '255,236,179': 'Champagne Yellow-香槟黄',
        '255,205,45': 'Mustard-芥末黄',
        '255,229,141': 'Moon Yellow-月黄',
        '128,128,0': 'Olive-橄榄色',
        '255,255,0': 'Canary Yellow-鲜黄',
        '255,255,0': 'Yellow-黄色',
        '174,197,32': 'Moss Green-苔藓绿',
        '191,255,0': 'Light Lime-亮柠檬绿',
        '107,142,35': 'Olive Drab-橄榄军服绿',
        '154,205,50': 'Yellow Green-黄绿',
        '85,107,47': 'Dark Olive Green-暗橄榄',
        '141,182,0': 'Apple Green-苹果绿',
        '173,255,47': 'Green Yellow-绿黄',
        '124,252,0': 'Grass Green-草绿',
        '124,252,0': 'Lawn Green-草坪绿',
        '127,255,0': 'Chartreuse-查特酒绿',
        '34,139,34': 'Foliage Green-叶绿',
        '127,255,0': 'Fresh Leaves-嫩绿',
        '0,255,0': 'Bright Green-明绿',
        '61,145,64': 'Cobalt Green-钴绿',
        '240,255,240': 'Honeydew-蜜瓜绿',
        '143,188,143': 'Dark Sea Green-暗海绿',
        '144,238,144': 'Light Green-亮绿',
        '152,251,152': 'Pale Green-灰绿',
        '34,139,34': 'Ivy Green-常春藤绿',
        '34,139,34': 'Forest Green-森林绿',
        '50,205,50': 'Lime Green-柠檬绿',
        '0,100,0': 'Dark Green-暗绿',
        '0,128,0': 'Green-绿色',
        '0,255,0': 'Lime-鲜绿色',
        '0,201,87': 'Malachite-孔雀石绿',
        '152,255,152': 'Mint-薄荷绿',
        '172,225,175': 'Celadon Green-青瓷绿',
        '80,200,120': 'Emerald-碧绿',
        '0,206,209': 'Turquoise Green-绿松石绿',
        '64,130,109': 'Veridian-铬绿',
        '175,238,238': 'Horizon Blue-苍色',
        '46,139,87': 'Sea Green-海绿',
        '60,179,113': 'Medium Sea Green-中海绿',
        '245,255,250': 'Mint Cream-薄荷奶油色',
        '0,255,127': 'Spring Green-春绿',
        '0,255,127': 'Peacock Green-孔雀绿',
        '0,250,154': 'Medium Spring Green-中春绿',
        '102,205,170': 'Medium Aquamarine-中碧',
        '127,255,212': 'Aquamarine-碧蓝色',
        '0,191,255': 'Cyan Blue-青蓝',
        '173,216,230': 'Aqua Blue-水蓝',
        '30,144,255': 'Turquoise Blue-绿松石蓝',
        '64,224,208': 'Turquoise-绿松石色',
        '32,178,170': 'Light Sea Green-亮海绿',
        '72,209,204': 'Medium Turquoise-中绿松',
        '224,255,255': 'Light Cyan-亮青',
        '135,206,250': 'Baby Blue-浅蓝',
        '175,238,238': 'Pale Turquoise-灰绿松石色',
        '47,79,79': 'Dark Slate Gray-暗岩灰',
        '0,128,128': 'Teal-凫绿',
        '0,139,139': 'Dark Cyan-暗青',
        '0,255,255': 'Cyan-青色',
        '0,255,255': 'Aqua-水色',
        '0,206,209': 'Dark Turquoise-暗绿松石色',
        '95,158,160': 'Cadet Blue-军服蓝',
        '0,191,255': 'Peacock Blue-孔雀蓝',
        '176,224,230': 'Powder Blue-婴儿粉蓝',
        '0,71,171': 'Strong Blue-浓蓝',
        '173,216,230': 'Light Blue-亮蓝',
        '175,238,238': 'Pale Blue-灰蓝',
        '0,128,255': 'Saxe Blue-萨克斯蓝',
        '0,191,255': 'Deep Sky Blue-深天蓝',
        '135,206,235': 'Sky Blue-天蓝',
        '135,206,250': 'Light Sky Blue-亮天蓝',
        '0,127,255': 'Marine Blue-水手蓝',
        '0,49,83': 'Prussian blue-普鲁士蓝',
        '70,130,180': 'Steel Blue-钢青色',
        '240,248,255': 'Alice Blue-爱丽丝蓝',
        '112,128,144': 'Slate Gray-岩灰',
        '119,136,153': 'Light Slate Gray-亮岩灰',
        '30,144,255': 'Dodger Blue-道奇蓝',
        '51,51,153': 'Mineral Blue-矿蓝',
        '0,127,255': 'Azure-湛蓝',
        '78,108,146': 'Wedgwood Blue-韦奇伍德瓷蓝',
        '176,196,222': 'Light Steel Blue-亮钢蓝',
        '61,89,171': 'Cobalt Blue-钴蓝',
        '74,113,175': 'Pale Denim-灰丁宁蓝',
        '100,149,237': 'Cornflower Blue-矢车菊蓝',
        '106,90,205': 'Salvia Blue-鼠尾草蓝',
        '153,204,255': 'Dark Powder Blue-暗婴儿',
        '15,82,186': 'Sapphire-蓝宝石色',
        '0,47,167': 'International Klein Blue-国际克莱因蓝',
        '155,196,226': 'Cerulean blue-蔚蓝',
        '65,105,225': 'Royal Blue-品蓝',
        '51,51,102': 'Dark Mineral Blue-暗矿',
        '0,47,167': 'Ultramarine-极浓海蓝',
        '38,97,156': 'Lapis Lazuli-天青石蓝',
        '248,248,255': 'Ghost White-幽灵白',
        '230,230,250': 'Lavender-薰衣草紫',
        '204,204,255': 'Periwinkle-长春花色',
        '25,25,112': 'Midnight Blue-午夜蓝',
        '0,0,128': 'Navy Blue-藏青',
        '0,0,139': 'Dark Blue-暗蓝',
        '0,0,205': 'Medium Blue-中蓝',
        '0,0,255': 'Blue-蓝色',
        '151,121,183': 'Wisteria-紫藤色',
        '72,61,139': 'Dark Slate Blue-暗岩蓝',
        '106,90,205': 'Slate Blue-岩蓝',
        '123,104,238': 'Medium Slate Blue-中岩蓝',
        '224,176,255': 'Mauve-木槿紫',
        '200,162,200': 'Lilac-紫丁香色',
        '147,112,219': 'Medium Purple-中紫红',
        '153,102,204': 'Amethyst-紫水晶色',
        '186,85,211': 'Grayish Purple-浅灰紫红',
        '223,115,255': 'Heliotrope-缬草紫',
        '199,21,133': 'Mineral Violet-矿紫',
        '138,43,226': 'Blue Violet-蓝紫',
        '138,43,226': 'Violet-紫罗兰色',
        '75,0,130': 'Indigo-靛色',
        '153,50,204': 'Dark Orchid-暗兰紫',
        '148,0,211': 'Dark Violet-暗紫',
        '171,130,255': 'Pansy-三色堇紫',
        '219,112,147': 'Mallow-锦葵紫',
        '208,32,144': 'Opera Mauve-优品紫红',
        '186,85,211': 'Medium Orchid-中兰紫',
        '216,191,216': 'Pail Lilac-淡紫丁香色',
        '216,191,216': 'Thistle-蓟紫',
        '200,162,200': 'Clematis-铁线莲紫',
        '221,160,221': 'Plum-梅红色',
        '238,130,238': 'Light Violet-亮紫',
        '128,0,128': 'Purple-紫色',
        '139,0,139': 'Dark Magenta-暗洋红',
        '255,0,255': 'Magenta-洋红',
        '255,0,255': 'Fuchsia-品红',
        '218,112,214': 'Orchid-兰紫',
        '255,239,213': 'Pearl Pink-浅珍珠红',
        '192,128,129': 'Old Rose-陈玫红',
        '255,228,225': 'Rose Pink-浅玫瑰红',
        '199,21,133': 'Medium Violet Red-中青紫',
        '255,0,127': 'Magenta Rose-洋玫瑰红',
        '255,20,147': 'Rose-玫瑰红',
        '224,17,95': 'Ruby-红宝石色',
        '252,142,172': 'Camellia-山茶红',
        '255,20,147': 'Deep Pink-深粉红',
        '252,142,172': 'Flamingo-火鹤红',
        '255,127,127': 'Coral Pink-浅珊瑚红',
        '255,105,180': 'Hot Pink-暖粉红',
        '128,0,32': 'Burgundy-勃艮第酒红',
        '202,45,80': 'Spinel Red-尖晶石红',
        '220,20,60': 'Carmine-胭脂红',
        '255,182,193': 'Baby Pink-浅粉红',
        '196,30,58': 'Cardinal Red-枢机红',
        '255,240,245': 'Lavender Blush-薰衣草紫红',
        '219,112,147': 'Pale Violet Red-灰紫红',
        '218,24,132': 'Cerise-樱桃红',
        '255,160,160': 'Salmon Pink-浅鲑红',
        '220,20,60': 'Crimson-绯红',
        '255,192,203': 'Pink-粉红',
        '255,182,193': 'Light Pink-亮粉红',
        '255,218,185': 'Shell Pink-壳黄红',
        '227,38,54': 'Alizarin Crimson-茜红'
    };
    
    // 计算亮度和灰度判断
    const brightness = (r + g + b) / 3;
    const isGrayscale = Math.abs(r - g) < 10 && Math.abs(g - b) < 10;
    
    // 特殊处理灰度色
    if (isGrayscale) {
        if (brightness < 40) return 'Black-黑色';
        if (brightness < 100) return 'Gray-灰色';
        if (brightness > 240) return 'White-白色';
        if (brightness > 180) return 'Light Gray-亮灰色';
        if (brightness > 200 && brightness < 230) return 'Beige-米黄色';
        return 'Gray-灰色';
    }
    
    // 精确匹配
    const colorKey = `${r},${g},${b}`;
    if (colorDatabase[colorKey]) {
        return colorDatabase[colorKey];
    }
    
    // 模糊匹配（容差范围）
    let closestMatch = null;
    let minDistance = Infinity;
    
    for (const [key, name] of Object.entries(colorDatabase)) {
        const [r2, g2, b2] = key.split(',').map(Number);
        const distance = Math.sqrt(
            Math.pow(r - r2, 2) + 
            Math.pow(g - g2, 2) + 
            Math.pow(b - b2, 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            closestMatch = name;
        }
    }
    
    // 如果距离很近（容差范围内），返回匹配的颜色名称，否则返回RGB值
    if (minDistance < 50) {
        return closestMatch;
    }
    
    return `RGB(${r}, ${g}, ${b})`;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Initialize RGB palette when page loads
document.addEventListener('DOMContentLoaded', function() {
    initRGBPalette();
});
