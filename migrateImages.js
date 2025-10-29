const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const migrateImages = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log('⚠️  No uploads folder found. Exiting.');
    return;
  }

  const files = fs.readdirSync(uploadsDir);
  console.log(`Found ${files.length} files to migrate.`);

  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'scanndine-uploads'
      });

      const cloudinaryUrl = result.secure_url;

      const updateResult = await MenuItem.updateOne(
        { imageUrl: { $in: [
            file,
            `/uploads/${file}`,
            `uploads/${file}`,
            `http://localhost:5000/uploads/${file}`
        ] }},
        { imageUrl: cloudinaryUrl }
      );

      console.log(`✅ ${file} → updated ${updateResult.modifiedCount} record(s).`);

    } catch (err) {
      console.error(`❌ Failed ${file}:`, err.message);
    }
  }
  console.log("🎉 Migration complete.");
  process.exit();
};

migrateImages();
