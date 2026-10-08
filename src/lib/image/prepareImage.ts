/**
 * Image ingestion and preparation for Gemini multimodal analysis
 */

export interface PreparedImage {
  image: {
    mimeType: string;
    data: string; // raw base64 string
  };
  previewUrl: string;
  width?: number;
  height?: number;
}

export async function prepareImageForGemini(file: File): Promise<PreparedImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Tệp tải lên phải là hình ảnh (JPEG, PNG, WEBP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Không thể giải mã hình ảnh.'));
      img.onload = () => {
        const maxDimension = 1024;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // fallback to original base64
          const parts = dataUrl.split(',');
          const mimeType = parts[0].match(/:(.*?);/)?.[1] || file.type;
          resolve({
            image: { mimeType, data: parts[1] },
            previewUrl: dataUrl,
            width: img.width,
            height: img.height,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = 'image/jpeg';
        const resizedDataUrl = canvas.toDataURL(mimeType, 0.85);
        const base64Data = resizedDataUrl.split(',')[1];

        resolve({
          image: {
            mimeType,
            data: base64Data,
          },
          previewUrl: resizedDataUrl,
          width,
          height,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
