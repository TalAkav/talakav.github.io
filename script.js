let uploadedFile = null;
let validFormats = [];
let selectedFormat = null;
let convertedBlob = null;

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileType = document.getElementById('fileType');
const conversionSection = document.getElementById('conversionSection');
const formatSearch = document.getElementById('formatSearch');
const formatDropdown = document.getElementById('formatDropdown');
const convertBtn = document.getElementById('convertBtn');
const resultSection = document.getElementById('resultSection');
const downloadBtn = document.getElementById('downloadBtn');
const errorMessage = document.getElementById('errorMessage');

const CONVERSION_MAP = {
    "image": ["png", "jpg", "jpeg", "webp", "bmp"],
    "audio": [],
    "video": []
};

// Handle browse button click
browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

// Handle drop zone click (but not when clicking the button)
dropZone.addEventListener('click', (e) => {
    if (e.target !== browseBtn && !browseBtn.contains(e.target)) {
        fileInput.click();
    }
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function detectFileType(file) {
    const type = file.type.split('/')[0];
    if (type === 'image') return 'image';
    if (type === 'audio') return 'audio';
    if (type === 'video') return 'video';
    return null;
}

function handleFile(file) {
    uploadedFile = file;
    hideError();

    const detectedType = detectFileType(file);

    if (!detectedType) {
        showError('Unsupported file type');
        return;
    }

    if (detectedType === 'audio' || detectedType === 'video') {
        showError('Audio and video conversion require server-side processing. Only image conversion is supported in browser.');
        return;
    }

    validFormats = CONVERSION_MAP[detectedType];

    fileName.textContent = file.name;
    fileType.textContent = detectedType;

    dropZone.style.display = 'none';
    fileInfo.style.display = 'flex';
    conversionSection.style.display = 'block';

    renderFormatOptions();
}

function renderFormatOptions() {
    formatDropdown.innerHTML = '';
    validFormats.forEach(format => {
        const option = document.createElement('div');
        option.className = 'format-option';
        option.textContent = format.toUpperCase();
        option.onclick = () => selectFormat(format);
        formatDropdown.appendChild(option);
    });
}

function filterFormats(query) {
    const filtered = validFormats.filter(f =>
        f.toLowerCase().includes(query.toLowerCase())
    );

    formatDropdown.innerHTML = '';
    filtered.forEach(format => {
        const option = document.createElement('div');
        option.className = 'format-option';
        option.textContent = format.toUpperCase();
        option.onclick = () => selectFormat(format);
        formatDropdown.appendChild(option);
    });
}

formatSearch.addEventListener('input', (e) => {
    const query = e.target.value;
    if (query) {
        filterFormats(query);
        formatDropdown.classList.add('show');
    } else {
        renderFormatOptions();
        formatDropdown.classList.remove('show');
    }
});

formatSearch.addEventListener('focus', () => {
    formatDropdown.classList.add('show');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
        formatDropdown.classList.remove('show');
    }
});

function selectFormat(format) {
    selectedFormat = format;
    formatSearch.value = format.toUpperCase();
    formatDropdown.classList.remove('show');
    convertBtn.disabled = false;
}

convertBtn.addEventListener('click', async () => {
    if (!selectedFormat || !uploadedFile) return;

    convertBtn.disabled = true;
    convertBtn.textContent = 'Converting...';
    hideError();

    try {
        await convertImage(uploadedFile, selectedFormat);

        conversionSection.style.display = 'none';
        resultSection.style.display = 'block';
    } catch (error) {
        showError('Conversion failed: ' + error.message);
        convertBtn.disabled = false;
        convertBtn.textContent = 'Convert';
    }
});

async function convertImage(file, targetFormat) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            let mimeType = 'image/png';
            let quality = 0.92;

            if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
                mimeType = 'image/jpeg';
            } else if (targetFormat === 'webp') {
                mimeType = 'image/webp';
            } else if (targetFormat === 'bmp') {
                mimeType = 'image/bmp';
            } else if (targetFormat === 'png') {
                mimeType = 'image/png';
            }

            canvas.toBlob((blob) => {
                if (blob) {
                    convertedBlob = blob;
                    resolve();
                } else {
                    reject(new Error('Failed to create image blob'));
                }
            }, mimeType, quality);
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        reader.readAsDataURL(file);
    });
}

downloadBtn.addEventListener('click', () => {
    if (!convertedBlob) return;

    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${selectedFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

function resetUpload() {
    uploadedFile = null;
    validFormats = [];
    selectedFormat = null;
    convertedBlob = null;

    dropZone.style.display = 'block';
    fileInfo.style.display = 'none';
    conversionSection.style.display = 'none';
    resultSection.style.display = 'none';

    fileInput.value = '';
    formatSearch.value = '';
    convertBtn.disabled = true;
    convertBtn.textContent = 'Convert';
    hideError();
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}
