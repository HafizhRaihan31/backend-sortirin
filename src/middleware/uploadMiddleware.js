const multer = require("multer");
const path = require("path");

// STORAGE
const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    let folder = "uploads/";

    if (file.fieldname === "reward_image") {
      folder = "uploads/rewards/";
    }

    if (file.fieldname === "profile_image") {
      folder = "uploads/profiles/";
    }

    if (file.fieldname === "scan_image") {
      folder = "uploads/scans/";
    }

    cb(null, folder);
  },


  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9);
    cb(
      null,
      uniqueName +
      path.extname(file.originalname)
    );
  },
});

// FILE FILTER
const fileFilter = (req, file, cb) => {

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (
    allowedTypes.includes(file.mimetype)
  ) {
    cb(null, true);

  } else {

    cb(
      new Error(
        "Format file tidak didukung"
      ),
      false
    );
  }
};

// MULTER CONFIG
const upload = multer({

  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;