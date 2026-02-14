/**
 * Compress an image file to a target size (in KB)
 * @param file - The image file to compress
 * @param maxSizeKB - Maximum size in kilobytes (default: 100KB)
 * @returns Promise with compressed image as base64 string
 */
export async function compressImage(file: File, maxSizeKB: number = 100): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Calculate new dimensions (max 800x800 to reduce size)
                let width = img.width;
                let height = img.height;
                const maxDimension = 800;

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = (height / width) * maxDimension;
                        width = maxDimension;
                    } else {
                        width = (width / height) * maxDimension;
                        height = maxDimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Draw image on canvas
                ctx.drawImage(img, 0, 0, width, height);

                // Start with quality 0.9 and reduce until size is acceptable
                let quality = 0.9;
                let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

                // Calculate size in KB (base64 is ~33% larger than binary)
                const sizeKB = (compressedDataUrl.length * 3) / 4 / 1024;

                // If still too large, reduce quality iteratively
                while (sizeKB > maxSizeKB && quality > 0.1) {
                    quality -= 0.1;
                    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    const newSizeKB = (compressedDataUrl.length * 3) / 4 / 1024;

                    if (newSizeKB <= maxSizeKB) {
                        break;
                    }
                }

                resolve(compressedDataUrl);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Clear all avatar images from localStorage to free up space
 */
export function clearAllAvatars(): void {
    const keys = Object.keys(localStorage);
    const avatarKeys = keys.filter(key => key.startsWith('avatar_'));

    avatarKeys.forEach(key => {
        localStorage.removeItem(key);
    });

    console.log(`Cleared ${avatarKeys.length} avatar(s) from localStorage`);
}

/**
 * Get the total size of localStorage in KB
 */
export function getLocalStorageSize(): number {
    let total = 0;
    for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length + key.length;
        }
    }
    return (total / 1024); // Return size in KB
}
