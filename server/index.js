const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Order = require("./models/order");
const Review = require("./models/review");
// const multer = require("multer"); // <--- REMOVED
const path = require("path"); // <--- REMOVED
const fs = require("fs"); // <--- REMOVED
const { spawn } = require("child_process"); 
const stickres = require("./models/stickres"); 
const pack = require("./models/pack");
const PORT = 3002;

app.use(express.json()); // Middleware to parse JSON requests

// ✅ اجعل مجلد 'uploads' عاماً لكي يتمكن المتصفح من عرض الصور
// app.use("/uploads", express.static("uploads")); // <--- REMOVED

const cors = require("cors");
app.use(cors()); // Enable CORS for cross-origin requests

// ----------------------------------------------------------------------
// ✅ تعريف Multer ووحدة التخزين
// ----------------------------------------------------------------------
// تأكد من وجود مجلد 'uploads'
// const uploadsDir = path.join(__dirname, 'uploads'); // <--- REMOVED
// if (!fs.existsSync(uploadsDir)) { // <--- REMOVED
//     fs.mkdirSync(uploadsDir); // <--- REMOVED
// }

// const storage = multer.diskStorage({ // <--- REMOVED
//   destination: (req, file, cb) => { // <--- REMOVED
//     cb(null, "uploads/"); // <--- REMOVED
//   }, // <--- REMOVED
//   filename: (req, file, cb) => { // <--- REMOVED
//     // حفظ الملف باسم فريد لتجنب التكرار // <--- REMOVED
//     cb(null, Date.now() + path.extname(file.originalname)); // <--- REMOVED
//   }, // <--- REMOVED
// }); // <--- REMOVED

// const upload = multer({ storage: storage }); // <--- REMOVED
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
// مسارات البحث والمنتجات (Stickers)
// ----------------------------------------------------------------------

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
                        { autocomplete: { query: q, path: 'title', score: { boost: { value: 5 } } } },
                        { autocomplete: { query: q, path: 'category', score: { boost: { value: 3 } } } },
                        { text: { query: q, path: 'title', fuzzy: { maxEdits: 1 } } }
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
                total: [ { $count: 'count' } ]
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
    const items = await stickres
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
    res.status(500).json({ message: "Failed to fetch count.", error: error.message });
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

app.post("/stickers/bulk", async (req, res) => {
  const { products } = req.body;
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: "Invalid or empty product data provided." });
  }
  try {
    const lastSticker = await stickres.findOne().sort({ orderIndex: -1 });
    const startOrderIndex = lastSticker ? lastSticker.orderIndex + 1 : 0;
    const productsWithIndex = products.map((product, index) => ({
      ...product,
      orderIndex: startOrderIndex + index,
    }));
    await stickres.insertMany(productsWithIndex);
    res.status(201).json({ message: `Successfully added ${products.length} stickers!` });
  } catch (error) {
    console.error("Error bulk inserting stickers:", error);
    res.status(500).json({ message: "Failed to add stickers to the database.", error: error.message });
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

app.delete("/stickers/category/:category", async (req, res) => {
  const categoryToDelete = req.params.category;
  if (!categoryToDelete) {
    return res.status(400).json({ message: "Category name is required." });
  }
  try {
    const result = await stickres.deleteMany({ category: categoryToDelete });
    if (result.deletedCount > 0) {
      res.status(200).json({ message: `Successfully deleted ${result.deletedCount} stickers from the category: ${categoryToDelete}.` });
    } else {
      res.status(404).json({ message: `No stickers found for the category: ${categoryToDelete}.` });
    }
  } catch (error) {
    console.error("Error deleting stickers by category:", error);
    res.status(500).json({ message: "Failed to delete stickers.", error: error.message, });
  }
});

app.delete("/delete-all-products", async (req, res) => {
  try {
    await stickres.deleteMany({}); 
    res.json({ success: true, message: `All products deleted successfully!`, });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting products", error: error.message, });
  }
});

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

// ----------------------------------------------------------------------
// مسارات المراجعات (Reviews)
// ----------------------------------------------------------------------

// app.post("/reviews", upload.single("image"), async (req, res) => { // <--- upload.single("image") REMOVED
app.post("/reviews", async (req, res) => {
  try {
    const { customerName, comment } = req.body;

    if (!customerName || !comment) {
      return res.status(400).json({ error: "الاسم والتعليق حقول إجبارية." });
    }

    // Since file upload logic is removed, we assume imageUrl might be passed directly in the body 
    // or is simply ignored. I'll remove the req.file check to prevent errors.
    const reviewData = {
      customerName,
      comment,
      // imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined, // <--- REMOVED
      imageUrl: req.body.imageUrl, // Assuming image URL might now be sent in the body
    };

    const newReview = new Review(reviewData);
    await newReview.save();

    res.status(201).json({ message: "شكرًا لك! تم إرسال تعليقك بنجاح.", review: newReview });
  } catch (error) {
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

app.get("/ReviewAdmin", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

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

// ----------------------------------------------------------------------
// مسارات الطلبات (Orders)
// ----------------------------------------------------------------------

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
    res.status(500).json({ error: "Erreur lors de la récupération des commandes" });
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

// ----------------------------------------------------------------------
// المسار الرئيسي والاستماع
// ----------------------------------------------------------------------

app.get("/", (req, res) => {
  res.send("update 2/28/2025");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
