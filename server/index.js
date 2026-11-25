require("dotenv").config();
require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Order = require("./models/order");
const Review = require("./models/review");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const stickres = require("./models/stickres"); // يجب التأكد من وجود الموديل
const pack = require("./models/pack"); // يجب التأكد من وجود الموديل
const PYTHON_COMMAND = process.env.PYTHON_CMD || 'python';
const axios = require('axios');
const cors = require("cors");
const archiver = require("archiver");

app.use(express.json());

// إعداد CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * ترسل إشعار طلب جديد إلى التلغرام.
 * @param {object} orderData - كائن الطلب المحفوظ في قاعدة البيانات.
 */
async function sendTelegramNotification(orderData) {
  // تنسيق قائمة المنتجات في الطلب
  const itemsList = orderData.items.map(item =>
    `  - ${item.title} (${item.size}) x ${item.quantity} | ${item.price}`
  ).join('\n');

  // بناء نص الرسالة الكلي
  const messageText = `
        **💰 طلب جديد قيد الانتظار!**
        
        **معلومات الطلب:**
        رقم الطلب (ID): \`${orderData._id}\`
        التاريخ: ${new Date(orderData.orderDate).toLocaleString('ar-EG')}
        الإجمالي: ${orderData.totalPrice}
        الحالة: ${orderData.status}

        **العميل:**
        الاسم: ${orderData.customerName}
        الهاتف: \`${orderData.customerPhone}\`

        **المنتجات المطلوبة:**
        ${itemsList}

        ---------------------------
        🚨 يرجى مراجعة لوحة الإدارة فوراً.
    `;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.');
    return;
  }
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: messageText,
      parse_mode: 'Markdown'
    });
    console.log('✅ تم إرسال إشعار التلغرام بنجاح.');
  } catch (error) {
    console.error('❌ فشل إرسال إشعار التلغرام:', error.response ? error.response.data : error.message);
  }
}


// إعداد مسارات الملفات
const UPLOADS_DIR = path.join(__dirname, "uploads");
const PROCESSED_DIR = path.join(__dirname, "processed_images");
const PYTHON_SCRIPT_PATH = path.join(__dirname, 'contour.py');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR);

// إعداد التخزين لـ Multer
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// جعل المجلدات عامة
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/processed", express.static(PROCESSED_DIR));

// اتصال قاعدة البيانات
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not configured in environment variables");
    }
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB();


// ------------------------------------------------------------------
//  مسارات معالجة الصور وتشغيل سكريبت بايثون
// ------------------------------------------------------------------

app.post("/api/process-images", upload.array('stickers'), (req, res) => {
  const border_mm = req.query.border || '0.1';
  const sticker_size_cm = req.query.size || '6';

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded." });
  }

  const filesToProcess = req.files;
  const results = [];
  let processingCount = 0;
  const base_url = `${req.protocol}://${req.get('host')}`;

  filesToProcess.forEach(file => {
    const inputPath = file.path;
    // Force output to be .png to support transparency (RGBA)
    const originalNameWithoutExt = path.parse(file.filename).name;
    const outputFilename = `processed-${originalNameWithoutExt}.png`;
    const outputPath = path.join(PROCESSED_DIR, outputFilename);

    processingCount++;

    const pythonProcess = spawn(PYTHON_COMMAND, [
      PYTHON_SCRIPT_PATH,
      inputPath,
      outputPath,
      border_mm,
      sticker_size_cm
    ]);

    let pythonOutput = '';
    let pythonError = '';

    pythonProcess.stdout.on('data', (data) => {
      pythonOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      pythonError += data.toString();
    });

    pythonProcess.on('close', (code) => {

      fs.unlink(inputPath, (err) => {
        if (err) console.error(`Error deleting original file ${inputPath}:`, err);
      });

      if (code !== 0) {
        console.error(`Python script exited with code ${code}. Error: ${pythonError}`);
        const cleanError = pythonError.includes('ERROR_PROCESSING') ? pythonError.split('ERROR_PROCESSING:')[1].trim() : `Script failed with code ${code}.`;

        results.push({
          originalName: file.originalname,
          status: 'failed',
          message: cleanError,
        });
      } else {
        results.push({
          originalName: file.originalname,
          status: 'success',
          url: `${base_url}/processed/${outputFilename}`,
          processedFileName: outputFilename
        });
      }

      processingCount--;

      if (processingCount === 0) {
        res.json({
          message: "Images processed successfully.",
          results: results
        });
      }
    });
  });
});


// مسار تشغيل سكريبت البايثون (Scraping)
app.post("/run-python-script", (req, res) => {
  const { searchQuery, startPage, endPage, siteName } = req.body;

  if (!searchQuery || !startPage || !endPage || !siteName) {
    return res
      .status(400)
      .json({ error: "الرجاء إرسال جميع المعطيات المطلوبة: كلمة البحث، الصفحات، واسم الموقع." });
  }

  console.log(
    `بدء تشغيل سكريبت Python مع المعطيات: ${searchQuery}, ${startPage}, ${endPage} على موقع ${siteName}`
  );

  const pythonProcess = spawn(PYTHON_COMMAND, [
    "fetch.py",
    searchQuery,
    startPage,
    endPage,
    siteName,
  ]);

  let scriptOutput = "";
  let scriptError = "";

  pythonProcess.stdout.on("data", (data) => {
    console.log(`مخرجات بايثون: ${data.toString()}`);
    scriptOutput += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`خطأ من بايثون: ${data.toString()}`);
    scriptError += data.toString();
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      console.log("انتهت عملية بايثون بنجاح.");
      res.json({ message: "تمت العملية بنجاح.", output: scriptOutput });
    } else {
      console.error(`انتهت عملية بايثون بخطأ (رمز الخروج: ${code})`);
      res
        .status(500)
        .json({
          error: "حدث خطأ أثناء تشغيل سكريبت بايثون.",
          details: scriptError,
        });
    }
  });
});


// ------------------------------------------------------------------
//  مسارات الملصقات (Stickers)
// ------------------------------------------------------------------

// بحث Atlas Search متقدم
app.get("/search/products", async (req, res) => {
  const { q } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;

  if (!q) {
    return res.json({ items: [], total: 0 });
  }

  try {
    const searchStage = {
      $search: {
        index: 'default',
        compound: {
          should: [
            {
              autocomplete: {
                query: q,
                path: 'title',
                score: { boost: { value: 5 } }
              }
            },
            {
              autocomplete: {
                query: q,
                path: 'category',
                score: { boost: { value: 3 } }
              }
            },
            {
              text: {
                query: q,
                path: 'title',
                fuzzy: { maxEdits: 1 }
              }
            }
          ]
        }
      }
    };

    const facetStage = {
      $facet: {
        items: [
          { $sort: { score: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit }
        ],
        total: [{ $count: 'count' }]
      }
    };

    const aggregationResult = await stickres.aggregate([searchStage, facetStage]);

    const data = aggregationResult[0];
    const items = data.items || [];
    const total = (data.total && data.total.length > 0) ? data.total[0].count : 0;

    res.json({ items, total });

  } catch (error) {
    console.error("Error fetching Atlas Search results:", error);
    res.status(500).json({ message: "Error during search", error: error.message });
  }
});

// جلب الملصقات مع Pagination والبحث (واجهة المستخدم العادية)
app.get("/stickers", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const titleQuery = req.query.title || "";

    const filter = {};
    if (titleQuery) {
      filter.title = { $regex: titleQuery, $options: "i" };
    }

    const totalItems = await stickres.countDocuments(filter);

    items = await stickres
      .find(filter)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

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

// جلب الملصقات مع Pagination والبحث (واجهة المشرف)
app.get("/stickers_admin", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const title = req.query.title || "";

    const skip = (page - 1) * limit;

    const query = {};
    if (title) {
      query.title = { $regex: title, $options: "i" };
    }

    const items = await stickres.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalItems = await stickres.countDocuments(query);
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

// حذف جميع الملصقات في فئة محددة
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

// جلب عدد الملصقات في فئة محددة
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

// حذف ملصق معين بواسطة الـ ID
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

// جلب آخر ملصق تم تسجيله
app.get("/latest", async (req, res) => {
  try {
    const latestSticker = await stickres
      .findOne()
      .sort({ _id: -1 });

    if (!latestSticker) {
      return res.status(404).json({ message: "No stickers found in the database." });
    }
    res.status(200).json(latestSticker);

  } catch (error) {
    console.error("Error fetching the latest sticker:", error);
    res.status(500).json({
      message: "Failed to fetch the latest sticker from the database.",
      error: error.message
    });
  }
});

// جلب العناصر حسب الفئة (مع دعم العشوائية لـ "all")
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
      totalItems = await stickres.countDocuments(query);
      items = await stickres
        .find(query)
        .sort({ _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit);

    } else if (category.toLowerCase() === "all") {
      totalItems = await stickres.countDocuments({});

      items = await stickres.aggregate([
        { $match: {} },
        { $sample: { size: limit } }
      ]);

    } else {
      query = { category: category };
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


// جلب صور الملصقات داخل حزمة
app.get("/pack_items/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const item = await pack.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const images = [
      ...item.stickers.map((sticker) => sticker.image),
    ].filter(Boolean);

    res.json({ images });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ message: "Error fetching images" });
  }
});

// حذف جميع المنتجات (Admin Utility)
app.delete("/delete-all-products", async (req, res) => {
  try {
    await stickres.deleteMany({});
    res.json({
      success: true,
      message: `All products deleted successfully!`,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error deleting products",
        error: error.message,
      });
  }
});

// إضافة ملصق واحد
app.post("/add_stickres", async (req, res) => {
  try {
    const newstickres = new stickres(req.body);
    await newstickres.save();
    res.status(201).send("Stickres added successfully");
  } catch (error) {
    res.status(500).send(error);
  }
});

// إضافة مجموعة من الملصقات دفعة واحدة (Bulk Add)
app.post("/stickers/bulk", async (req, res) => {
  const { products } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res
      .status(400)
      .json({ message: "Invalid or empty product data provided." });
  }

  try {
    const lastSticker = await stickres.findOne().sort({ orderIndex: -1 });
    const startOrderIndex = lastSticker ? lastSticker.orderIndex + 1 : 0;

    const productsWithIndex = products.map((product, index) => ({
      ...product,
      orderIndex: startOrderIndex + index,
    }));

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


// ------------------------------------------------------------------
//  مسارات الطلبات (Orders)
// ------------------------------------------------------------------

// إنشاء طلب جديد
app.post("/orders", async (req, res) => {
  try {
    const order = new Order(req.body);

    await order.save();
    await sendTelegramNotification(order.toObject());

    res.status(201).json({ message: "Commande créée avec succès", order });

  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    res.status(400).json({ error: error.message });
  }
});

// جلب جميع الطلبات مع المراجعات المرتبطة
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("review")
      .sort({ orderDate: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des commandes" });
  }
});

// حذف طلب
app.delete("/orders/:orderId", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.orderId);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }
    res.json({ msg: "Order removed successfully" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Order not found" });
    }
    res.status(500).send("Server Error");
  }
});

// تحديث حالة الطلب
app.put("/orders/:orderId/status", async (req, res) => {
  const { status } = req.body;

  if (!status || !["Pending", "Completed", "Cancelled"].includes(status)) {
    return res.status(400).json({ msg: "Invalid status value" });
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status: status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ msg: "Order not found" });
    }
    res.json(updatedOrder);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Order not found" });
    }
    res.status(500).send("Server Error");
  }
});


// ------------------------------------------------------------------
//  مسارات المراجعات (Reviews)
// ------------------------------------------------------------------

// إضافة تعليق (مع/بدون صورة)
app.post("/reviews", upload.single("image"), async (req, res) => {
  try {
    const { customerName, comment } = req.body;

    if (!customerName || !comment) {
      return res.status(400).json({ error: "الاسم والتعليق حقول إجبارية." });
    }

    const reviewData = {
      customerName,
      comment,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
    };

    const newReview = new Review(reviewData);
    await newReview.save();

    res
      .status(201)
      .json({ message: "شكرًا لك! تم إرسال تعليقك بنجاح.", review: newReview });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ error: "حدث خطأ في الخادم أثناء إرسال التعليق." });
  }
});

// جلب جميع المراجعات (الواجهة الأمامية)
app.get("/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

// تحديث حالة المراجعة وتطبيق الخصم على الطلب المرتبط
app.put("/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { approved },
      { new: true }
    );

    if (!updatedReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (approved) {
      const orderToUpdate = await Order.findOne({ review: id });

      if (orderToUpdate) {
        const originalPrice = parseFloat(orderToUpdate.totalPrice);
        const discountedPrice = originalPrice * 0.95;

        orderToUpdate.totalPrice = discountedPrice.toFixed(2);
        await orderToUpdate.save();

        return res.json({
          message: "Review approved and order price updated!",
          order: orderToUpdate,
        });
      }
    }

    res.json({ message: "Review status updated successfully." });
  } catch (error) {
    console.error("Error updating review and order:", error);
    res.status(500).json({ error: "Error during the update process" });
  }
});

// جلب جميع المراجعات (واجهة المشرف)
app.get("/ReviewAdmin", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// حذف مراجعة (واجهة المشرف)
app.delete("/ReviewAdmin/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }

    await review.deleteOne();
    res.json({ msg: "Review removed successfully" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Review not found" });
    }
    res.status(500).send("Server Error");
  }
});

// مسار الاختبار الأساسي
app.get("/", (req, res) => {
  res.send("update 2/28/2025");
});

// ------------------------------------------------------------------
//  Bulk Process & Download Route via Python (New Feature)
// ------------------------------------------------------------------
app.get("/api/download-processed-stickers", async (req, res) => {
  try {
    // 1. Fetch all stickers
    // Or filter by category if passed? User said "all".
    const stickers = await stickres.find({});

    if (!stickers || stickers.length === 0) {
      return res.status(404).json({ message: "No stickers found in database." });
    }

    // 2. Setup temporary directory
    const tempDirName = `temp_process_${Date.now()}`;
    const tempDir = path.join(__dirname, tempDirName);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const pythonScript = path.join(__dirname, 'crop_border.py');
    const processedFiles = [];

    // 3. Process each sticker using Python
    console.log(`Starting bulk processing for ${stickers.length} stickers...`);

    // We process sequentially to avoid spawning too many processes at once
    for (const sticker of stickers) {
      if (!sticker.image) continue;

      let inputFilePath = null;
      let isTempInput = false;
      let originalFilename = `sticker_${sticker._id}`;

      try {
        // CASE A: Remote URL (e.g. from Scraper/Redbubble)
        if (sticker.image.startsWith('http') && !sticker.image.includes('/uploads/')) {
          try {
            // Download remote image
            const response = await axios({
              url: sticker.image,
              method: 'GET',
              responseType: 'arraybuffer',
              timeout: 10000 // 10s timeout
            });

            // Determine extension or default to png
            const ext = path.extname(sticker.image).split('?')[0] || '.png';
            const tempInputName = `temp_in_${sticker._id}${ext}`;
            inputFilePath = path.join(tempDir, tempInputName);
            fs.writeFileSync(inputFilePath, response.data);
            isTempInput = true;
            originalFilename = `sticker_${sticker._id}`; // Use ID as name base
          } catch (err) {
            console.error(`Failed to download remote sticker ${sticker._id}:`, err.message);
            continue; // Skip this sticker
          }
        }
        // CASE B: Local File (in /uploads/)
        else {
          // Determine local path
          // Handle both full URL "http://localhost.../uploads/file.png" and relative "/uploads/file.png"
          let filename = null;
          const uploadMarker = '/uploads/';

          if (sticker.image.includes(uploadMarker)) {
            const parts = sticker.image.split(uploadMarker);
            if (parts.length > 1) {
              filename = parts[1];
            }
          } else {
            // Maybe it's just the filename stored?
            filename = sticker.image;
          }

          if (filename) {
            // Decode URI component to handle spaces (%20) etc.
            filename = decodeURIComponent(filename);
            inputFilePath = path.join(UPLOADS_DIR, filename);
            originalFilename = path.parse(filename).name;
          }
        }

        // If we have a valid input path and it exists
        if (inputFilePath && fs.existsSync(inputFilePath)) {
          const outputFilename = `processed-${originalFilename}.png`;
          const outputPath = path.join(tempDir, outputFilename);

          await new Promise((resolve) => {
            const proc = spawn(PYTHON_COMMAND, [
              pythonScript,
              inputFilePath,
              outputPath,
              '50', // threshold
              '1'   // border_thickness
            ]);

            // Capture stderr for debugging
            let stdErrData = '';
            proc.stderr.on('data', d => stdErrData += d.toString());

            proc.on('close', (code) => {
              if (code === 0 && fs.existsSync(outputPath)) {
                processedFiles.push({ path: outputPath, name: outputFilename });
              } else {
                console.error(`Failed to process ${originalFilename}, exit code: ${code}. PyErr: ${stdErrData}`);
              }
              resolve();
            });

            proc.on('error', (err) => {
              console.error(`Spawn error for ${originalFilename}:`, err);
              resolve();
            });
          });
        } else {
          console.warn(`Skipping sticker ${sticker._id}: File not found at ${inputFilePath}`);
        }

      } catch (loopErr) {
        console.error(`Unexpected error processing sticker ${sticker._id}:`, loopErr);
      } finally {
        // Cleanup temp input if we created one
        if (isTempInput && inputFilePath && fs.existsSync(inputFilePath)) {
          try { fs.unlinkSync(inputFilePath); } catch (e) { }
        }
      }
    }

    if (processedFiles.length === 0) {
      // Cleanup empty temp dir
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) { }
      // Return 200 with JSON message instead of 400 so client can handle it gracefully? 
      // Or keep 400 but ensure client reads it. A 404 might be better if no files found.
      return res.status(404).json({ message: "No stickers were successfully processed. Check console for details." });
    }

    // 4. Create ZIP and send
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Set headers
    res.attachment('processed_stickers.zip');

    // Handle cleanup when response is finished or error
    res.on('finish', () => {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) { }
    });

    res.on('error', (err) => {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) { }
    });

    archive.pipe(res);

    processedFiles.forEach((file) => {
      archive.file(file.path, { name: file.name });
    });

    await archive.finalize();

  } catch (error) {
    console.error("Error in bulk processing:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error during bulk processing.", error: error.message });
    }
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});