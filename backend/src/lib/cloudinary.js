import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';

// Belt-and-braces: index.js loads dotenv as its very first import, so by the
// time this module evaluates the variables are already set. A plain config()
// here only covers direct imports of this module outside the app.
config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;