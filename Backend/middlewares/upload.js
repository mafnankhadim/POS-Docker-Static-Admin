const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Uploads go straight to Cloudinary. After multer runs, `req.file.path`
// holds the Cloudinary secure URL — that is what we store in Mongo
// (Product.ProImage / Detail.logo), instead of a local filename.
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "possystem",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [{ width: 1000, crop: "limit" }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// Derive a Cloudinary public_id (incl. folder) from a stored secure URL,
// so old images can be removed on update/delete.
// e.g. https://res.cloudinary.com/<cloud>/image/upload/v123/possystem/abc.jpg
//   -> possystem/abc
upload.publicIdFromUrl = (url) => {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return null;
  }
  return url.split("/").slice(-2).join("/").split(".")[0];
};

module.exports = upload;
