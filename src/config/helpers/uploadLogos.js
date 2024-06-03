const multer = require("multer");
const fs = require("fs");

if (!fs.existsSync("uploads/logos")) {
  fs.mkdirSync("uploads/logos");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/logos/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const logoUpload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1, // limiting files size to 2MB
  },
  fileFilter: function (req, file, cb) {
    // Set the filetypes, it is optional
    var filetypes = /svg|png/;
    var mimetype = filetypes.test(file.mimetype);

    if (mimetype) {
      return cb(null, true);
    }
    cb("Error: File upload only supports the following filetypes - " + filetypes);
  },
});

module.exports = logoUpload;
