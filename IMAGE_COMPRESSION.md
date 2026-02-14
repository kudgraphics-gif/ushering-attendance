# Image Compression & Storage Management

## Overview
This application now includes automatic image compression to prevent localStorage quota issues.

## Features

### 1. **Automatic Image Compression**
- All uploaded profile pictures are automatically compressed to a maximum of **100KB**
- Images are resized to a maximum dimension of 800x800 pixels
- JPEG compression with adaptive quality adjustment
- User-friendly notifications during compression

### 2. **Storage Quota Management**
- Automatic detection of localStorage quota exceeded errors
- Automatic clearing of old avatar images when storage is full
- Graceful fallback if compression fails

### 3. **User Notifications**
When uploading a large image, users will see:
1. **"Image is too large, reducing image size..."** - While compression is in progress
2. **"Image compressed successfully"** - When compression completes
3. **"Storage full, clearing old images..."** - If storage quota is exceeded
4. **"Old images cleared, profile picture saved"** - After successful cleanup and save

## Technical Details

### Compression Algorithm
- **Max Dimensions**: 800x800 pixels (maintains aspect ratio)
- **Target Size**: 100KB
- **Format**: JPEG
- **Quality**: Adaptive (starts at 0.9, reduces iteratively until target size is met)

### Storage Keys
- Avatar images are stored with the key pattern: `avatar_{user_email}`
- Only one avatar per user email is stored at a time

### Error Handling
- **QuotaExceededError**: Automatically clears all old avatars and retries
- **Compression Failure**: Reverts to previous avatar with error notification
- **Login Issues**: Skips avatar loading if localStorage has issues

## Utility Functions

Located in `/src/utils/imageCompression.ts`:

### `compressImage(file: File, maxSizeKB: number = 100): Promise<string>`
Compresses an image file to the specified maximum size.

### `clearAllAvatars(): void`
Clears all stored avatar images from localStorage.

### `getLocalStorageSize(): number`
Returns the total size of localStorage in KB.

## Manual Cleanup

If you need to manually clear all stored avatars, you can run this in the browser console:

```javascript
// Clear all avatars
Object.keys(localStorage)
  .filter(key => key.startsWith('avatar_'))
  .forEach(key => localStorage.removeItem(key));

console.log('All avatars cleared');
```

## Best Practices

1. **Image Selection**: Choose images that are already reasonably sized (< 5MB)
2. **Format**: JPEG images compress better than PNG for photos
3. **Monitoring**: Check browser console for compression logs and warnings
4. **Storage**: If you frequently switch between many user accounts, consider clearing old avatars periodically

## Browser Compatibility

This feature works in all modern browsers that support:
- FileReader API
- Canvas API
- localStorage
- Promises

## Troubleshooting

### "Storage quota exceeded even after clearing"
- The image might be extremely large even after compression
- Try selecting a smaller or lower resolution image
- Clear browser cache and try again

### Avatar not loading after login
- Check browser console for errors
- Verify localStorage is enabled in browser settings
- Try uploading the avatar again

### Compression taking too long
- Large images (> 10MB) may take several seconds to compress
- Wait for the compression notification to complete
- Consider pre-resizing images before upload
