const mongoose = require('mongoose');

const packSchema = new mongoose.Schema({
    title: { type: String, required: true },
    image: { type: String },
    category: { type: String },
    quantity_pack: { type: String },
    stickers: [
        {
            image: { type: String }
        }
    ]
});

module.exports = mongoose.model('Pack', packSchema);
