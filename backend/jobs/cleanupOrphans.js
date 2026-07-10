require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const File = require('../models/File');

async function cleanupOrphanedAssets() {
  let nextCursor;
  let totalDeleted = 0;

  const dbPublicIds = new Set((await File.find({}, 'publicId')).map((f) => f.publicId));

  do {
    const { resources, next_cursor } = await cloudinary.api.resources({
      type: 'upload',
      max_results: 200,
      next_cursor: nextCursor,
    });

    const orphans = resources.filter((r) => !dbPublicIds.has(r.public_id));
    for (const orphan of orphans) {
      await cloudinary.uploader.destroy(orphan.public_id, { resource_type: 'auto' });
      totalDeleted += 1;
    }

    nextCursor = next_cursor;
  } while (nextCursor);

  console.log(`[cleanupOrphans] Removed ${totalDeleted} orphaned Cloudinary asset(s).`);
}

if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(cleanupOrphanedAssets)
    .then(() => mongoose.disconnect())
    .catch((err) => {
      console.error('Cleanup job failed:', err);
      process.exit(1);
    });
}

module.exports = cleanupOrphanedAssets;
