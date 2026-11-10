
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// ==========================================
// UPLOAD DIRECTORY
// ==========================================

const uploadDirectory = path.join(__dirname, "../../uploads");

// Create uploads directory automatically if it doesn't exist.
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// ==========================================
// STORAGE CONFIGURATION
// ==========================================

const storage = multer.diskStorage({

    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {

        const extension = path.extname(file.originalname).toLowerCase();

        const uniqueName = `${Date.now()}-${crypto.randomUUID()}${extension}`;

        callback(null, uniqueName);
    }

});

// ==========================================
// FILE VALIDATION
// ==========================================

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
];

const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif"
];

const fileFilter = (req, file, callback) => {

    const extension = path.extname(file.originalname).toLowerCase();

    const isValid =
        allowedMimeTypes.includes(file.mimetype) &&
        allowedExtensions.includes(extension);

    if (!isValid) {
        return callback(
            new Error("Only JPG, JPEG, PNG, WEBP and GIF images are allowed.")
        );
    }

    callback(null, true);
};

// ==========================================
// MULTER CONFIGURATION
// ==========================================

const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB per image
        files: 6                  // 1 cover + 5 additional images
    }

});

module.exports = upload;
