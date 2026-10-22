import { PhotoAnalysisResult } from '../types';

/**
 * Resizes an image file or data URL to max 1024px longest edge and re-encodes as JPEG.
 * This strips EXIF data and ensures a small payload (< 1 MB).
 */
export async function resizeImageToJpeg(sourceDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1024;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(sourceDataUrl);
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Re-encode as clean JPEG without EXIF metadata
      const cleanJpeg = canvas.toDataURL('image/jpeg', 0.85);
      resolve(cleanJpeg);
    };
    img.onerror = () => reject(new Error('Failed to load image for processing'));
    img.src = sourceDataUrl;
  });
}

export async function analyzePhoto(
  imageDataUrl: string,
  ageRange?: string,
  consent: boolean = true
): Promise<PhotoAnalysisResult> {
  try {
    const cleanImage = await resizeImageToJpeg(imageDataUrl);

    const response = await fetch('/api/analyze-skin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: cleanImage,
        ageRange,
        consent,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const failure: any = new Error(errData.error || 'Photo analysis failed.');
      failure.reason = errData.reason;
      throw failure;
    }

    const data: PhotoAnalysisResult = await response.json();
    return data;
  } catch (err: any) {
    // If backend is unreachable or fails, return an image_ok=false result with clear retake message
    // A busy or unavailable scan service is not the person's fault, so say so.
    const serviceProblem = ['busy', 'quota', 'timeout', 'model', 'api_key', 'unknown'].includes(err?.reason);
    if (serviceProblem) {
      return {
        image_ok: false,
        quality_issues: [],
        findings: [],
        needs_clinician: false,
        clinician_reason: '',
        confidence: 'low',
        summary:
          'The scan service is busy right now, so your photo could not be analysed. Please try again in a minute. Your picks can still come from your quiz answers.',
      };
    }
    return {
      image_ok: false,
      quality_issues: ['low_resolution'],
      findings: [],
      needs_clinician: false,
      clinician_reason: '',
      confidence: 'low',
      summary:
        'Unable to process this image clearly. Please check lighting, face the camera without makeup or filters, and retake in natural daylight.',
    };
  }
}
