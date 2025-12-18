import express from "express";
import upload from "../utils/multer.js";
import { uploadMedia } from "../utils/cloudinary.js";

const router = express.Router();

router.route("/upload-video").post(upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided",
      });
    }

    console.log("Uploading file:", req.file.filename);
    const result = await uploadMedia(req.file.path);

    console.log("Upload successful:", result.secure_url);

    res.status(200).json({
      success: true,
      message: "File uploaded successfully.",
      data: {
        videoUrl: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        duration: result.duration,
        format: result.format,
      },
    });
  } catch (error) {
    console.log("Upload route error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading file",
      error: error.message,
    });
  }
});

export default router;

// import express from "express";
// import upload from "../utils/multer.js";
// import { uploadMedia } from "../utils/cloudinary.js";

// const router = express.Router();

// router.route("/upload-video").post(upload.single("file"), async(req,res) => {
//     try {
//         const result = await uploadMedia(req.file.path);
//         res.status(200).json({
//             success:true,
//             message:"File uploaded successfully.",
//             data:result
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({message:"Error uploading file"})
//     }
// });
// export default router;
