const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Order = require("./models/order");
const Review = require("./models/review");
const multer = require("multer"); // <--- مهم
const path = require("path"); // <--- مهم
const fs = require("fs"); // <--- مهم
const { spawn } = require("child_process"); // <--- مهم
const stickres = require("./models/stickres");
const pack = require("./models/pack");
const PORT = 3002;

app.use(express.json()); // Middleware to parse JSON requests

// اجعل مجلد 'uploads' عاماً لكي يتمكن المتصفح من عرض الصور
app.use("/uploads", express.static("uploads"));

const cors = require("cors");
app.use(cors()); // Enable CORS for cross-origin requests

// تأكد من وجود مجلد uploads و processed_images
const UPLOADS_DIR = path.join(__dirname, "uploads");
const PROCESSED_DIR = path.join(__dirname, "processed_images");
const PYTHON_SCRIPT_PATH = path.join(__dirname, 'contour.py'); 

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR);

// إعداد التخزين لـ Multer (لحفظ الصور الأصلية مؤقتاً)
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    // إنشاء اسم ملف فريد (لضمان عدم تداخل الأسماء)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// اجعل مجلد 'uploads' ومجلد 'processed_images' عاماً
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/processed", express.static(PROCESSED_DIR)); // <--- مسار جديد

const connectDB = async () => {
  try {
    const uri =
      "mongodb+srv://khalilmejri000:ZD6XD4Zz4KMuqnb1@cluster0.28bwdzy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB();















app.get("/search/products", async (req, res) => {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;

    if (!q) {
        return res.json({ items: [], total: 0 });
    }

    try {
        // بناء مرحلة بحث تستغل الفهرس متعدد الأنواع
        const searchStage = {
            $search: {
                index: 'default',
                compound: {
                    // "should" تعني أن أيًا من هذه الشروط يكفي للعثور على نتيجة
                    should: [
                        // أعطِ أولوية قصوى للبحث الجزئي (autocomplete) في العنوان
                        {
                            autocomplete: {
                                query: q,
                                path: 'title',
                                score: { boost: { value: 5 } } // زيادة نقاط الأولوية
                            }
                        },
                        // أعطِ أولوية للبحث الجزئي في الفئة
                        {
                            autocomplete: {
                                query: q,
                                path: 'category',
                                score: { boost: { value: 3 } }
                            }
                        },
                        // ابحث أيضًا ككلمة كاملة (text) في العنوان
                        {
                            text: {
                                query: q,
                                path: 'title',
                                fuzzy: { maxEdits: 1 } // السماح بخطأ إملائي واحد
                            }
                        }
                    ]
                }
            }
        };

        const facetStage = {
            $facet: {
                items: [
                    { $sort: { score: -1 } }, // ترتيب النتائج حسب الأولوية (النقاط)
                    { $skip: (page - 1) * limit },
                    { $limit: limit }
                ],
                total: [ { $count: 'count' } ]
            }
        };

        const aggregationResult = await stickres.aggregate([searchStage, facetStage]);
        
        const data = aggregationResult[0];
        const items = data.items || [];
        const total = (data.total && data.total.length > 0) ? data.total[0].count : 0;

        // ✅ إرسال 'items' و 'total' فقط كما كان في الأصل.
        // الـ Frontend هو من سيقوم باستخلاص الفئات من الـ 'items'.
        res.json({ items, total }); 
    
    } catch (error) {
        console.error("Error fetching Atlas Search results:", error);
        res.status(500).json({ message: "Error during search", error: error.message });
    }
});





// ... (الكود الموجود لديك مسبقًا مثل express, mongoose.connect, etc)

// ✅ مسار جديد لجلب جميع الملصقات
// ✅ مسار محدّث لجلب الملصقات مع دعم Pagination

app.get("/stickers", async (req, res) => {
  try {
    // --- 1. الحصول على متغيرات الصفحة والحد الأقصى ---
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // --- ✨ 2. الحصول على مصطلح البحث من الرابط ---
    // سيأتي من الرابط بهذا الشكل: /stickers?title=naruto
    const titleQuery = req.query.title || "";

    // --- ✨ 3. بناء فلتر البحث ---
    // هذا هو الجزء الأهم. سنقوم بإنشاء فلتر ديناميكي
    const filter = {};
    if (titleQuery) {
      // إذا كان هناك مصطلح بحث، قم بإضافته للفلتر
      // 'i' تجعل البحث غير حساس لحالة الأحرف (Naruto or naruto)
      filter.title = { $regex: titleQuery, $options: "i" };
    }

    // --- ✨ 4. استخدام الفلتر في الاستعلامات ---
    // الآن، سيتم حساب العدد الإجمالي بناءً على الفلتر (إما كل المنتجات أو نتائج البحث فقط)
    const totalItems = await stickres.countDocuments(filter);

    // وسيتم البحث عن المنتجات باستخدام نفس الفلتر (تم تغيير query إلى filter)
    items = await stickres
      .find(filter) // تم التصحيح هنا: استخدام المتغير filter
      .sort({ _id: -1 }) // هذا الجزء يقوم بفرز جميع المنتجات من الأحدث إلى الأقدم
      .skip(skip) // استخدام skip بدلاً من إعادة الحساب
      .limit(limit);

    // --- 5. إرسال الاستجابة ---
    res.json({
      items,
      totalItems: totalItems,
      page,
      hasNextPage: totalItems > page * limit,
    });
  } catch (error) {
    console.error("Error fetching stickers:", error);
    res.status(500).json({ message: "Error fetching stickers" });
  }
});

// ✅ New endpoint to delete all stickers in a specific category
app.delete("/stickers/category/:category", async (req, res) => {
  const categoryToDelete = req.params.category;

  if (!categoryToDelete) {
    return res.status(400).json({ message: "Category name is required." });
  }

  try {
    const result = await stickres.deleteMany({ category: categoryToDelete });

    if (result.deletedCount > 0) {
      res.status(200).json({
        message: `Successfully deleted ${result.deletedCount} stickers from the category: ${categoryToDelete}.`,
      });
    } else {
      res.status(404).json({
        message: `No stickers found for the category: ${categoryToDelete}.`,
      });
    }
  } catch (error) {
    console.error("Error deleting stickers by category:", error);
    res.status(500).json({
      message: "Failed to delete stickers.",
      error: error.message,
    });
  }
});

// ✅ New endpoint to get the count of stickers in a specific category
app.get("/stickers/count", async (req, res) => {
  const { category } = req.query;

  if (!category) {
    return res.status(400).json({ message: "Category name is required." });
  }

  try {
    const count = await stickres.countDocuments({ category: category });
    res.status(200).json({ count: count });
  } catch (error) {
    console.error("Error fetching category count:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch count.", error: error.message });
  }
});
// server/index.js (أو اسم ملف الخادم لديك)

// ... (imports and other app setup)

app.get("/stickers_admin", async (req, res) => {
  try {
    // 1. استخراج المتغيرات من الطلب مع قيم افتراضية
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const title = req.query.title || ""; // ✨ استخراج عنوان البحث

    const skip = (page - 1) * limit;

    // 2. ✨ بناء كائن الاستعلام (query) للمنغودب
    // إذا كان هناك عنوان للبحث، سنبحث عنه، وإلا سيكون الكائن فارغًا (لجلب الكل)
    const query = {};
    if (title) {
      // $regex يسمح بالبحث عن جزء من النص وليس النص الكامل
      // 'i' تجعل البحث غير حساس لحالة الأحرف (A-Z, a-z)
      query.title = { $regex: title, $options: "i" };
    }

    // 3. تنفيذ الاستعلام مع الفلترة والـ pagination
    const items = await Stickres.find(query) // Stickres هو اسم الموديل
      .sort({ createdAt: -1 }) // اختياري: لترتيب النتائج
      .skip(skip)
      .limit(limit);

    // 4. التأكد إذا كانت هناك صفحة تالية
    const totalItems = await Stickres.countDocuments(query);
    const hasNextPage = page * limit < totalItems;

    res.json({
      items,
      hasNextPage,
    });
  } catch (error) {
    console.error("Error fetching stickers:", error);
    res.status(500).send("Server Error");
  }
});

// ... (the rest of your server code)
// ✅ مسار جديد لحذف ملصق معين بواسطة الـ ID
app.delete("/stickers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await stickres.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Sticker not found" });
    }

    res.json({ message: "Sticker deleted successfully" });
  } catch (error) {
    console.error("Error deleting sticker:", error);
    res.status(500).json({ message: "Error deleting sticker" });
  }
});





// GET Route لعرض آخر منتج (ملصق) تم تسجيله في قاعدة البيانات
app.get("/latest", async (req, res) => {
    try {
        const latestSticker = await stickres
            .findOne() // يمكن استخدام findOne() أو find().limit(1)
            // الترتيب التنازلي بناءً على _id لضمان جلب الأحدث أولاً
            .sort({ _id: -1 }); 

        // التحقق مما إذا تم العثور على أي منتج
        if (!latestSticker) {
            return res.status(404).json({ message: "No stickers found in the database." });
        }

        // إرسال المنتج الأحدث كاستجابة
        res.status(200).json(latestSticker);

    } catch (error) {
        console.error("Error fetching the latest sticker:", error);
        res.status(500).json({ 
            message: "Failed to fetch the latest sticker from the database.",
            error: error.message
        });
    }
});





app.get("/items/:category", async (req, res) => {
  const { category } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  const { subcats } = req.query;

  try {
    let query = {};
    let totalItems;
    let items;

    if (subcats) {
      const subcategoriesArray = subcats.split(",");
      query = { category: { $in: subcategoriesArray } };
      
      // جلب العناصر وفقًا لـ subcats (غير عشوائي)
      totalItems = await stickres.countDocuments(query);
      items = await stickres
        .find(query)
        .sort({ _id: 1 }) 
        .skip((page - 1) * limit)
        .limit(limit);

    } else if (category.toLowerCase() === "all") {
      // 💡 التعديل هنا: جلب عشوائي لجميع العناصر 
      // استخدام عملية التجميع ($sample) لجلب عينة عشوائية بحجم (limit)
      
      // لا يمكن حساب totalItems بسهولة وكفاءة لـ 'all' مع الـ skip/limit
      // إذا كنت تحتاج إلى totalItems حقيقي لجميع الوثائق:
      totalItems = await stickres.countDocuments({}); 
      
      // جلب عدد (limit) من العناصر عشوائيًا من جميع الوثائق
      items = await stickres.aggregate([
        { $match: {} }, // تطابق كل الوثائق (اختياري لكن مفيد في التجميع)
        { $sample: { size: limit } } // جلب عينة عشوائية بحجم limit
      ]);

      // ملاحظة: لا يمكن تطبيق .skip() بشكل منطقي مع $sample
      // لأن $sample تقوم بالاختيار العشوائي في كل مرة، مما يعني
      // أن "الصفحة" الثانية ستأتي بعناصر عشوائية مختلفة تمامًا.
      // إذا كنت تصر على التصفح العشوائي، فالـ $sample هو الخيار.

    } else {
      // الفئة محددة وليست "all"
      query = { category: category };
      
      // جلب العناصر وفقًا للفئة (غير عشوائي)
      totalItems = await stickres.countDocuments(query);
      items = await stickres
        .find(query)
        .sort({ _id: 1 }) 
        .skip((page - 1) * limit)
        .limit(limit);
    }
    
    res.json({ items, total: totalItems });
    
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Error fetching items" });
  }
});


app.get("/pack_items/:id", async (req, res) => {
  const { id } = req.params; // استخراج المعرف من الرابط

  try {
    const item = await pack.findById(id); // البحث عن العنصر حسب المعرف

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // استخراج جميع الصور من العنصر
    const images = [
      ...item.stickers.map((sticker) => sticker.image), // جميع صور الملصقات
    ].filter(Boolean); // حذف القيم الفارغة (null أو undefined)

    res.json({ images });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ message: "Error fetching images" });
  }
});

app.delete("/delete-all-products", async (req, res) => {
  try {
    await stickres.deleteMany({}); // حذف جميع المنتجات من القاعدة المحددة
    res.json({
      success: true,
      message: `All products deleted from ${DATABASE_NAME} successfully!`,
    });
  } catch (error) {
    // طباعة التفاصيل في الـ console
    console.error(error);

    // إرسال تفاصيل الخطأ في الاستجابة
    res
      .status(500)
      .json({
        success: false,
        message: "Error deleting products",
        error: error.message,
      });
  }
});

// app.get("/items/:category", async (req, res) => {
//   const { category } = req.params; // Extract category from URL

//   try {
//       const items = await stickres.find({ category }) // Fetch items by category
//           .sort({ _id: -1 }); // Sort by latest items

//       res.json({ items });
//   } catch (error) {
//       console.error("Error fetching items:", error);
//       res.status(500).json({ message: "Error fetching items" });
//   }
// });

// ✅ مسار موحّد لإضافة تعليق (سواء مع صورة أو بدون)
// The multer middleware (upload.single) will handle the file if it exists,
// but won't throw an error if it doesn't.
app.post("/reviews", upload.single("image"), async (req, res) => {
  try {
    // 1. استخراج البيانات من الطلب
    const { customerName, comment } = req.body;

    // 2. التحقق من وجود الاسم والتعليق (وهي الحقول الإجبارية)
    if (!customerName || !comment) {
      // استخدام نفس رسالة الخطأ لتسهيل التعامل معها في الفرونت-إند
      return res.status(400).json({ error: "الاسم والتعليق حقول إجبارية." });
    }

    // 3. بناء كائن التعليق الجديد
    const reviewData = {
      customerName,
      comment,
      // 4. التحقق من وجود ملف مرفق. إذا كان موجودًا، احفظ مساره
      // إذا لم يكن موجودًا، سيتم تجاهل هذا الحقل (أو يمكنك تعيينه إلى null)
      imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
    };

    // 5. إنشاء وحفظ التعليق في قاعدة البيانات
    const newReview = new Review(reviewData);
    await newReview.save();

    // 6. إرسال استجابة ناجحة
    res
      .status(201)
      .json({ message: "شكرًا لك! تم إرسال تعليقك بنجاح.", review: newReview });
  } catch (error) {
    // 7. التعامل مع أي أخطاء أخرى (مثل أخطاء قاعدة البيانات)
    console.error("Error submitting review:", error);
    res.status(500).json({ error: "حدث خطأ في الخادم أثناء إرسال التعليق." });
  }
});

app.get("/reviews", async (req, res) => {
  try {
    // تم حذف شرط الموافقة مؤقتًا للتحقق فقط
    const reviews = await Review.find({}).sort({ createdAt: -1 });

    // إذا ظهرت التعليقات الآن، فهذا يؤكد أن المشكلة كانت في عدم وجود تعليقات موافق عليها
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

app.post("/add_stickres", async (req, res) => {
  try {
    const newstickres = new stickres(req.body);
    await newstickres.save();
    res.status(201).send("Stickres added successfully");
  } catch (error) {
    res.status(500).send(error);
  }
});

// app.get("/items", async (req, res) => {
//     try {
//       const items = await stickres.find().sort({ _id: -1 }); // Get all items sorted by _id in descending order

//       res.json({ items });
//     } catch (error) {
//       console.error("Error fetching items:", error);
//       res.status(500).json({ message: "Error fetching items" });
//     }
//   });

// ... (الكود الحالي الخاص بك: express, mongoose, etc.)

// ✅✅ نقطة نهاية جديدة لجلب اقتراحات البحث ✅✅
// في ملف index.js

// ... (باقي الكود الخاص بك: app.listen, etc.)

app.post("/orders", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json({ message: "Commande créée avec succès", order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ جلب جميع الطلبات مع بيانات المراجعات المرتبطة بها
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("review") // ✅ هذا هو السطر الذي سيصلح المشكلة
      .sort({ orderDate: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes:", error); // لتحسين تتبع الأخطاء
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des commandes" });
  }
});

// ✅ تحديث حالة المراجعة مع تطبيق الخصم على الطلب المرتبط
app.put("/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    // الخطوة 1: تحديث المراجعة أولاً
    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { approved },
      { new: true } // `new: true` يعيد المستند بعد التحديث
    );

    if (!updatedReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    // الخطوة 2: إذا تمت الموافقة على المراجعة (approved === true)
    if (approved) {
      // ابحث عن الطلب الذي يحتوي على هذه المراجعة
      const orderToUpdate = await Order.findOne({ review: id });

      if (orderToUpdate) {
        // الخطوة 3: حساب السعر الجديد وتحديث الطلب
        const originalPrice = parseFloat(orderToUpdate.totalPrice);
        const discountedPrice = originalPrice * 0.95; // تطبيق خصم 5%

        orderToUpdate.totalPrice = discountedPrice.toFixed(2); // تنسيق السعر ليبقى رقمين بعد الفاصلة

        // الخطوة 4: حفظ التغييرات في قاعدة البيانات
        await orderToUpdate.save();

        // إرسال رسالة نجاح مع الطلب المحدث
        return res.json({
          message: "Review approved and order price updated!",
          order: orderToUpdate,
        });
      }
    }

    // إذا لم تتم الموافقة أو لم يتم العثور على الطلب، أرسل رسالة عادية
    res.json({ message: "Review status updated successfully." });
  } catch (error) {
    console.error("Error updating review and order:", error);
    res.status(500).json({ error: "Error during the update process" });
  }
});

// ✅ مسار جديد لإضافة مجموعة من الملصقات دفعة واحدة (Bulk Add)
app.post("/stickers/bulk", async (req, res) => {
  const { products } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res
      .status(400)
      .json({ message: "Invalid or empty product data provided." });
  }

  try {
    // 1. Find the current highest orderIndex in the collection
    const lastSticker = await stickres.findOne().sort({ orderIndex: -1 });
    const startOrderIndex = lastSticker ? lastSticker.orderIndex + 1 : 0;

    // 2. Add the orderIndex to each product in the array
    const productsWithIndex = products.map((product, index) => ({
      ...product,
      orderIndex: startOrderIndex + index,
    }));

    // 3. Perform the bulk insert
    await stickres.insertMany(productsWithIndex);
    res
      .status(201)
      .json({ message: `Successfully added ${products.length} stickers!` });
  } catch (error) {
    console.error("Error bulk inserting stickers:", error);
    res
      .status(500)
      .json({
        message: "Failed to add stickers to the database.",
        error: error.message,
      });
  }
});

app.delete("/orders/:orderId", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.orderId);

    if (!order) {
      // If no order was found with that ID
      return res.status(404).json({ msg: "Order not found" });
    }

    // Successfully deleted
    res.json({ msg: "Order removed successfully" });
  } catch (err) {
    console.error(err.message);
    // Handle cases where the ID is not a valid ObjectId
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Order not found" });
    }
    res.status(500).send("Server Error");
  }
});

app.put("/orders/:orderId/status", async (req, res) => {
  const { status } = req.body;

  // Basic validation for the status field
  if (!status || !["Pending", "Completed", "Cancelled"].includes(status)) {
    return res.status(400).json({ msg: "Invalid status value" });
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status: status }, // The fields to update
      { new: true } // Return the modified document rather than the original
    );

    if (!updatedOrder) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // Send the updated order back to the client
    res.json(updatedOrder);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Order not found" });
    }
    res.status(500).send("Server Error");
  }
});

app.get("/ReviewAdmin", async (req, res) => {
  try {
    // جلب جميع المراجعات وترتيبها من الأحدث إلى الأقدم
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.delete("/ReviewAdmin/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    // التحقق مما إذا كانت المراجعة موجودة
    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }

    await review.deleteOne(); // استخدام deleteOne() لحذف المستند

    res.json({ msg: "Review removed successfully" });
  } catch (err) {
    console.error(err.message);
    // إذا كان الـ ID غير صالح
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Review not found" });
    }
    res.status(500).send("Server Error");
  }
});

app.get("/", (req, res) => {
  res.send("update 2/28/2025");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
