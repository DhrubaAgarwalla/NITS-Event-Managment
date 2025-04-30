# Cloudinary Setup Guide

This guide will help you set up Cloudinary for image uploads in the NIT Silchar Event Management application.

## 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. After signing up, you'll be taken to your dashboard

## 2. Create an Upload Preset

1. In your Cloudinary dashboard, go to "Settings" > "Upload" in the left sidebar
2. Scroll down to "Upload presets"
3. Click "Add upload preset"
4. Set the following settings:
   - **Preset name**: Choose a name (e.g., `nits_event_uploads`)
   - **Signing Mode**: Set to "Unsigned" (important!)
   - **Folder**: You can specify a default folder if desired (e.g., `event-images`)
   - **Access Mode**: Set to "public"
5. Save the preset

## 3. Configure CORS Settings

1. In your Cloudinary dashboard, go to "Settings" > "Security" in the left sidebar
2. Scroll down to "CORS allowed origins"
3. Add your application domains:
   - `http://localhost:5173` (for local development)
   - `https://nits-event-managment.vercel.app` (for production)
   - `*` (if you want to allow all origins during testing)
4. Save the settings

## 4. Update Environment Variables

1. Make sure your `.env` file has the following variables:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
   ```
   
2. Replace `your-cloud-name` with your Cloudinary cloud name (found in the dashboard)
3. Replace `your-upload-preset` with the name of the upload preset you created

## 5. Test the Cloudinary Setup

1. Run your application
2. Navigate to the Cloudinary Test page
3. Upload an image to test the connection

## Troubleshooting

If you're getting a 400 error when uploading images, check the following:

1. **Upload Preset**: Make sure your upload preset is set to "Unsigned" mode
2. **CORS Settings**: Ensure your application domain is allowed in the CORS settings
3. **Environment Variables**: Verify that your cloud name and upload preset are correct in the `.env` file
4. **File Size**: Check if the file is too large (free Cloudinary accounts have limits)
5. **Browser Console**: Look for detailed error messages in the browser console

## Common Errors and Solutions

### "Upload failed with status: 400"

This usually means there's an issue with your upload preset or the request format:

1. Double-check that your upload preset is set to "Unsigned"
2. Verify that the upload preset name in your `.env` file matches exactly what's in Cloudinary
3. Make sure your cloud name is correct

### "Network error during upload"

This could be a CORS issue:

1. Check that your application domain is allowed in the Cloudinary CORS settings
2. Try adding `*` temporarily to the CORS allowed origins to see if that resolves the issue

### "File size too large"

Free Cloudinary accounts have upload limits:

1. Check the file size of the image you're trying to upload
2. Consider adding client-side image compression before uploading

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Upload API Reference](https://cloudinary.com/documentation/upload_images)
- [Cloudinary CORS Settings](https://cloudinary.com/documentation/upload_images#cors_considerations)
