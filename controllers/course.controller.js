import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import {
  deleteMediaFromCloudinary,
  deleteVideoFromCloudinary,
  uploadMedia,
} from "../utils/cloudinary.js";

export const createCourse = async (req, res) => {
  try {
    const { courseTitle, category } = req.body;
    if (!courseTitle || !category) {
      return res.status(400).json({
        message: "Course title and category is required.",
      });
    }

    const course = await Course.create({
      courseTitle,
      category,
      creator: req.id,
    });

    return res.status(201).json({
      course,
      message: "Course created.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to create course",
    });
  }
};

export const searchCourse = async (req, res) => {
  try {
    const { query = "", categories = [], sortByPrice = "" } = req.query;

    const searchCriteria = {
      isPublished: true,
      $or: [
        { courseTitle: { $regex: query, $options: "i" } },
        { subTitle: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    };

    if (categories.length > 0) {
      searchCriteria.category = { $in: categories };
    }

    const sortOptions = {};
    if (sortByPrice === "low") {
      sortOptions.coursePrice = 1;
    } else if (sortByPrice === "high") {
      sortOptions.coursePrice = -1;
    }

    let courses = await Course.find(searchCriteria)
      .populate({ path: "creator", select: "name photoUrl" })
      .sort(sortOptions);

    return res.status(200).json({
      success: true,
      courses: courses || [],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to search courses",
    });
  }
};

export const getPublishedCourse = async (_, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).populate({
      path: "creator",
      select: "name photoUrl",
    });

    if (!courses) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    return res.status(200).json({
      courses,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get published courses",
    });
  }
};

export const getCreatorCourses = async (req, res) => {
  try {
    const userId = req.id;
    const courses = await Course.find({ creator: userId });

    if (!courses) {
      return res.status(404).json({
        courses: [],
        message: "Course not found",
      });
    }

    return res.status(200).json({
      courses,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get creator courses",
    });
  }
};

export const editCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const {
      courseTitle,
      subTitle,
      description,
      category,
      courseLevel,
      coursePrice,
    } = req.body;
    const thumbnail = req.file;

    let course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found!",
      });
    }

    let courseThumbnail;
    if (thumbnail) {
      if (course.courseThumbnail) {
        const publicId = course.courseThumbnail.split("/").pop().split(".")[0];
        await deleteMediaFromCloudinary(publicId);
      }
      courseThumbnail = await uploadMedia(thumbnail.path);
    }

    const updateData = {
      courseTitle,
      subTitle,
      description,
      category,
      courseLevel,
      coursePrice,
      courseThumbnail: courseThumbnail?.secure_url,
    };

    course = await Course.findByIdAndUpdate(courseId, updateData, {
      new: true,
    });

    return res.status(200).json({
      course,
      message: "Course updated successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to update course",
    });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found!",
      });
    }

    return res.status(200).json({
      course,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get course by id",
    });
  }
};

export const createLecture = async (req, res) => {
  try {
    const { lectureTitle } = req.body;
    const { courseId } = req.params;

    if (!lectureTitle || !courseId) {
      return res.status(400).json({
        message: "Lecture title is required",
      });
    }

    const lecture = await Lecture.create({ lectureTitle });

    const course = await Course.findById(courseId);
    if (course) {
      course.lectures.push(lecture._id);
      await course.save();
    }

    return res.status(201).json({
      lecture,
      message: "Lecture created successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to create lecture",
    });
  }
};

export const getCourseLecture = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate("lectures");

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    return res.status(200).json({
      lectures: course.lectures,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get lectures",
    });
  }
};

// export const editLecture = async (req, res) => {
//   try {
//     const { lectureTitle, videoInfo, isPreviewFree } = req.body;
//     const { courseId, lectureId } = req.params;

//     const lecture = await Lecture.findById(lectureId);
//     if (!lecture) {
//       return res.status(404).json({
//         message: "Lecture not found!",
//       });
//     }

//     if (lectureTitle) lecture.lectureTitle = lectureTitle;

//     // FIXED: Properly store video URL
//     if (videoInfo?.videoUrl) {
//       lecture.videoUrl = videoInfo.videoUrl;
//       console.log("Video URL stored:", videoInfo.videoUrl);
//     }

//     if (videoInfo?.publicId) {
//       lecture.publicId = videoInfo.publicId;
//     }

//     if (isPreviewFree !== undefined) {
//       lecture.isPreviewFree = isPreviewFree;
//     }

//     await lecture.save();

//     const course = await Course.findById(courseId);
//     if (course && !course.lectures.includes(lecture._id)) {
//       course.lectures.push(lecture._id);
//       await course.save();
//     }

//     return res.status(200).json({
//       lecture,
//       message: "Lecture updated successfully.",
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       message: "Failed to edit lecture",
//     });
//   }
// };
export const editLecture = async (req, res) => {
  try {
    const { lectureTitle, videoInfo, isPreviewFree } = req.body;
    const { courseId, lectureId } = req.params;

    console.log("==========================================");
    console.log("📝 EDIT LECTURE REQUEST RECEIVED");
    console.log("==========================================");
    console.log("🔍 lectureId:", lectureId);
    console.log("🔍 courseId:", courseId);
    console.log("🔍 lectureTitle:", lectureTitle);
    console.log("🔍 isPreviewFree:", isPreviewFree);
    console.log("🔍 videoInfo:", JSON.stringify(videoInfo, null, 2));
    console.log("==========================================");

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      console.log("❌ Lecture not found with ID:", lectureId);
      return res.status(404).json({
        message: "Lecture not found!",
      });
    }

    console.log("✅ Lecture found:", lecture._id);
    console.log("📋 Current lecture data:", {
      title: lecture.lectureTitle,
      videoUrl: lecture.videoUrl,
      publicId: lecture.publicId,
    });

    // Update title
    if (lectureTitle) {
      lecture.lectureTitle = lectureTitle;
      console.log("✏️  Updated title:", lectureTitle);
    }

    // Update video URL - CRITICAL PART
    if (videoInfo) {
      console.log("🎥 videoInfo exists, type:", typeof videoInfo);
      console.log("🎥 videoInfo keys:", Object.keys(videoInfo));

      if (videoInfo.videoUrl) {
        lecture.videoUrl = videoInfo.videoUrl;
        console.log("✅ Set videoUrl:", videoInfo.videoUrl);
      } else {
        console.log("⚠️  videoInfo.videoUrl is missing or empty");
      }

      if (videoInfo.publicId) {
        lecture.publicId = videoInfo.publicId;
        console.log("✅ Set publicId:", videoInfo.publicId);
      } else {
        console.log("⚠️  videoInfo.publicId is missing or empty");
      }
    } else {
      console.log("⚠️  videoInfo is null/undefined");
    }

    if (isPreviewFree !== undefined) {
      lecture.isPreviewFree = isPreviewFree;
      console.log("✅ Set isPreviewFree:", isPreviewFree);
    }

    // SAVE TO DATABASE
    console.log("💾 Saving lecture to database...");
    await lecture.save();

    console.log("✅ Lecture saved successfully!");
    console.log("📊 Final lecture data:", {
      _id: lecture._id,
      title: lecture.lectureTitle,
      videoUrl: lecture.videoUrl,
      publicId: lecture.publicId,
      isPreviewFree: lecture.isPreviewFree,
    });
    console.log("==========================================");

    // Update course reference
    const course = await Course.findById(courseId);
    if (course && !course.lectures.includes(lecture._id)) {
      course.lectures.push(lecture._id);
      await course.save();
      console.log("✅ Course updated with lecture reference");
    }

    return res.status(200).json({
      success: true,
      lecture,
      message: "Lecture updated successfully.",
    });
  } catch (error) {
    console.error("❌ ERROR IN editLecture:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to edit lecture",
      error: error.message,
    });
  }
};

export const removeLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const lecture = await Lecture.findByIdAndDelete(lectureId);

    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found!",
      });
    }

    if (lecture.publicId) {
      await deleteVideoFromCloudinary(lecture.publicId);
    }

    await Course.updateOne(
      { lectures: lectureId },
      { $pull: { lectures: lectureId } }
    );

    return res.status(200).json({
      message: "Lecture removed successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to remove lecture",
    });
  }
};

export const getLectureById = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const lecture = await Lecture.findById(lectureId);

    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found!",
      });
    }

    return res.status(200).json({
      lecture,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get lecture by id",
    });
  }
};

export const togglePublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { publish } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found!",
      });
    }

    course.isPublished = publish === "true";
    await course.save();

    const statusMessage = course.isPublished ? "Published" : "Unpublished";
    return res.status(200).json({
      message: `Course is ${statusMessage}`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to update status",
    });
  }
};

// import { Course } from "../models/course.model.js";
// import { Lecture } from "../models/lecture.model.js";
// import {deleteMediaFromCloudinary, deleteVideoFromCloudinary, uploadMedia} from "../utils/cloudinary.js";

// export const createCourse = async (req,res) => {
//     try {
//         const {courseTitle, category} = req.body;
//         if(!courseTitle || !category) {
//             return res.status(400).json({
//                 message:"Course title and category is required."
//             })
//         }

//         const course = await Course.create({
//             courseTitle,
//             category,
//             creator:req.id
//         });

//         return res.status(201).json({
//             course,
//             message:"Course created."
//         })
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             message:"Failed to create course"
//         })
//     }
// }

// export const searchCourse = async (req,res) => {
//     try {
//         const {query = "", categories = [], sortByPrice =""} = req.query;
//         console.log(categories);

//         // create search query
//         const searchCriteria = {
//             isPublished:true,
//             $or:[
//                 {courseTitle: {$regex:query, $options:"i"}},
//                 {subTitle: {$regex:query, $options:"i"}},
//                 {category: {$regex:query, $options:"i"}},
//             ]
//         }

//         // if categories selected
//         if(categories.length > 0) {
//             searchCriteria.category = {$in: categories};
//         }

//         // define sorting order
//         const sortOptions = {};
//         if(sortByPrice === "low"){
//             sortOptions.coursePrice = 1;//sort by price in ascending
//         }else if(sortByPrice === "high"){
//             sortOptions.coursePrice = -1; // descending
//         }

//         let courses = await Course.find(searchCriteria).populate({path:"creator", select:"name photoUrl"}).sort(sortOptions);

//         return res.status(200).json({
//             success:true,
//             courses: courses || []
//         });

//     } catch (error) {
//         console.log(error);

//     }
// }

// export const getPublishedCourse = async (_,res) => {
//     try {
//         const courses = await Course.find({isPublished:true}).populate({path:"creator", select:"name photoUrl"});
//         if(!courses){
//             return res.status(404).json({
//                 message:"Course not found"
//             })
//         }
//         return res.status(200).json({
//             courses,
//         })
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             message:"Failed to get published courses"
//         })
//     }
// }
// export const getCreatorCourses = async (req,res) => {
//     try {
//         const userId = req.id;
//         const courses = await Course.find({creator:userId});
//         if(!courses){
//             return res.status(404).json({
//                 courses:[],
//                 message:"Course not found"
//             })
//         };
//         return res.status(200).json({
//             courses,
//         })
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             message:"Failed to create course"
//         })
//     }
// }
// export const editCourse = async (req,res) => {
//     try {
//         const courseId = req.params.courseId;
//         const {courseTitle, subTitle, description, category, courseLevel, coursePrice} = req.body;
//         const thumbnail = req.file;

//         let course = await Course.findById(courseId);
//         if(!course){
//             return res.status(404).json({
//                 message:"Course not found!"
//             })
//         }
//         let courseThumbnail;
//         if(thumbnail){
//             if(course.courseThumbnail){
//                 const publicId = course.courseThumbnail.split("/").pop().split(".")[0];
//                 await deleteMediaFromCloudinary(publicId); // delete old image
//             }
//             // upload a thumbnail on clourdinary
//             courseThumbnail = await uploadMedia(thumbnail.path);
//         }

//         const updateData = {courseTitle, subTitle, description, category, courseLevel, coursePrice, courseThumbnail:courseThumbnail?.secure_url};

//         course = await Course.findByIdAndUpdate(courseId, updateData, {new:true});

//         return res.status(200).json({
//             course,
//             message:"Course updated successfully."
//         })

//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             message:"Failed to create course"
//         })
//     }
// }
// export const getCourseById = async (req,res) => {
//     try {
//         const {courseId} = req.params;

//         const course = await Course.findById(courseId);

//         if(!course){
//             return res.status(404).json({
//                 message:"Course not found!"
//             })
//         }
//         return res.status(200).json({
//             course
//         })
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             message:"Failed to get course by id"
//         })
//     }
// }

// export const createLecture = async (req,res) => {
//     try {
//         const {lectureTitle} = req.body;
//         const {courseId} = req.params;

//         if(!lectureTitle || !courseId){
//             return res.status(400).json({
//                 message:"Lecture title is required"
//             })
//         };

//         // create lecture
//         const lecture = await Lecture.create({lectureTitle});

//         const course = await Course.findById(courseId);
//         if(course){
//             course.lectures.push(lecture._id);
//             await course.save();
//         }

//         return res.status(201).json({
//             lecture,
//             message:"Lecture created successfully."
//         });

//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             message:"Failed to create lecture"
//         })
//     }
// }
// export const getCourseLecture = async (req,res) => {
//     try {
//         const {courseId} = req.params;
//         const course = await Course.findById(courseId).populate("lectures");
//         if(!course){
//             return res.status(404).json({
//                 message:"Course not found"
//             })
//         }
//         return res.status(200).json({
//             lectures: course.lectures
//         });

//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             message:"Failed to get lectures"
//         })
//     }
// }
// export const editLecture = async (req,res) => {
//     try {
//         const {lectureTitle, videoInfo, isPreviewFree} = req.body;

//         const {courseId, lectureId} = req.params;
//         const lecture = await Lecture.findById(lectureId);
//         if(!lecture){
//             return res.status(404).json({
//                 message:"Lecture not found!"
//             })
//         }

//         // update lecture
//         if(lectureTitle) lecture.lectureTitle = lectureTitle;
//         if(videoInfo?.videoUrl) lecture.videoUrl = videoInfo.videoUrl;
//         if(videoInfo?.publicId) lecture.publicId = videoInfo.publicId;
//         lecture.isPreviewFree = isPreviewFree;

//         await lecture.save();

//         // Ensure the course still has the lecture id if it was not aleardy added;
//         const course = await Course.findById(courseId);
//         if(course && !course.lectures.includes(lecture._id)){
//             course.lectures.push(lecture._id);
//             await course.save();
//         };
//         return res.status(200).json({
//             lecture,
//             message:"Lecture updated successfully."
//         })
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             message:"Failed to edit lectures"
//         })
//     }
// }
// export const removeLecture = async (req,res) => {
//     try {
//         const {lectureId} = req.params;
//         const lecture = await Lecture.findByIdAndDelete(lectureId);
//         if(!lecture){
//             return res.status(404).json({
//                 message:"Lecture not found!"
//             });
//         }
//         // delete the lecture from couldinary as well
//         if(lecture.publicId){
//             await deleteVideoFromCloudinary(lecture.publicId);
//         }

//         // Remove the lecture reference from the associated course
//         await Course.updateOne(
//             {lectures:lectureId}, // find the course that contains the lecture
//             {$pull:{lectures:lectureId}} // Remove the lectures id from the lectures array
//         );

//         return res.status(200).json({
//             message:"Lecture removed successfully."
//         })
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             message:"Failed to remove lecture"
//         })
//     }
// }
// export const getLectureById = async (req,res) => {
//     try {
//         const {lectureId} = req.params;
//         const lecture = await Lecture.findById(lectureId);
//         if(!lecture){
//             return res.status(404).json({
//                 message:"Lecture not found!"
//             });
//         }
//         return res.status(200).json({
//             lecture
//         });
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             message:"Failed to get lecture by id"
//         })
//     }
// }

// // publich unpublish course logic

// export const togglePublishCourse = async (req,res) => {
//     try {
//         const {courseId} = req.params;
//         const {publish} = req.query; // true, false
//         const course = await Course.findById(courseId);
//         if(!course){
//             return res.status(404).json({
//                 message:"Course not found!"
//             });
//         }
//         // publish status based on the query paramter
//         course.isPublished = publish === "true";
//         await course.save();

//         const statusMessage = course.isPublished ? "Published" : "Unpublished";
//         return res.status(200).json({
//             message:`Course is ${statusMessage}`
//         });
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             message:"Failed to update status"
//         })
//     }
// }
