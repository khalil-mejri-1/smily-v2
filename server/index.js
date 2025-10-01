const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Order = require("./models/order");
const Review = require("./models/review");
const multer = require("multer"); // <--- مهم
const path = require("path"); // <--- مهم
const fs = require("fs"); // <--- مهم
const { spawn } = require("child_process"); // <--- مهم
const stickres = require("./models/stickres"); // استخدام الاسم الصحيح
const pack = require("./models/pack");
const PORT = 3002;

app.use(express.json()); // Middleware to parse JSON requests

// ✅ اجعل مجلد 'uploads' عاماً لكي يتمكن المتصفح من عرض الصور
app.use("/uploads", express.static("uploads")); 

const cors = require("cors");
app.use(cors()); // Enable CORS for cross-origin requests

// ----------------------------------------------------------------------
// ✅ تعريف Multer ووحدة التخزين
// ----------------------------------------------------------------------
// تأكد من وجود مجلد 'uploads'
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // حفظ الملف باسم فريد لتجنب التكرار
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});

const upload = multer({ storage: storage });
// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------
// مسارات البحث والمنتجات
// ----------------------------------------------------------------------

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
        res.json({ items, total }); 
    
    } catch (error) {
        console.error("Error fetching Atlas Search results:", error);
        res.status(500).json({ message: "Error during search", error: error.message });
    }
});

app.get("/stickers", async (req, res) => {
  try {
    // --- 1. الحصول على متغيرات الصفحة والحد الأقصى ---
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // --- ✨ 2. الحصول على مصطلح البحث من الرابط ---
    const titleQuery = req.query.title || "";

    // --- ✨ 3. بناء فلتر البحث ---
    const filter = {};
    if (titleQuery) {
      filter.title = { $regex: titleQuery, $options: "i" };
    }

    // --- ✨ 4. استخدام الفلتر في الاستعلامات ---
    const totalItems = await stickres.countDocuments(filter);

    const items = await stickres
      .find(filter) // استخدام المتغير filter
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

app.get("/stickers_admin", async (req, res) => {
  try {
    // 1. استخراج المتغيرات من الطلب مع قيم افتراضية
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const title = req.query.title || ""; // ✨ استخراج عنوان البحث

    const skip = (page - 1) * limit;

    // 2. ✨ بناء كائن الاستعلام (query) للمنغودب
    const query = {};
    if (title) {
      query.title = { $regex: title, $options: "i" };
    }

    // 3. تنفيذ الاستعلام مع الفلترة والـ pagination
    // ✅ تصحيح: استخدام اسم الموديل stickres الصحيح
    const items = await stickres.find(query) 
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit);

    // 4. التأكد إذا كانت هناك صفحة تالية
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
      // جلب عدد (limit) من العناصر عشوائيًا من جميع الوثائق
      totalItems = await stickres.countDocuments({}); 
      
      items = await stickres.aggregate([
        { $match: {} }, 
        { $sample: { size: limit } } 
      ]);

    } else {
      // الفئة محددة وليست "all"
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
    // ✅ تصحيح: إزالة المتغير غير المعرّف DATABASE_NAME
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

// ----------------------------------------------------------------------
// مسارات المراجعات والطلبات
// ----------------------------------------------------------------------

app.post("/reviews", upload.single("image"), async (req, res) => {
  try {
    // 1. استخراج البيانات من الطلب
    const { customerName, comment } = req.body;

    // 2. التحقق من وجود الاسم والتعليق (وهي الحقول الإجبارية)
    if (!customerName || !comment) {
      return res.status(400).json({ error: "الاسم والتعليق حقول إجبارية." });
    }

    // 3. بناء كائن التعليق الجديد
    const reviewData = {
      customerName,
      comment,
      // 4. التحقق من وجود ملف مرفق. إذا كان موجودًا، احفظ مساره
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
    const reviews = await Review.find({}).sort({ createdAt: -1 });

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

app.post("/orders", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json({ message: "Commande créée avec succès", order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

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

app.put("/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    // الخطوة 1: تحديث المراجعة أولاً
    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { approved },
      { new: true } 
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

app.get("/ReviewAdmin", async (req, res) => {
  try {
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

app.get("/", (req, res) => {
  res.send("update 2/28/2025");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
