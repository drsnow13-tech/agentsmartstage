import { createCanvas, loadImage } from 'canvas';

export async function addWatermark(base64Image: string): Promise<string> {
  const mimeMatch = base64Image.match(/^data:([^;]+);base64,/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';
  const base64Data = base64Image.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const img = await loadImage(buffer);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(img, 0, 0);

  // Diagonal watermark
  const fontSize = Math.max(24, Math.floor(img.width / 20));
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 1;
  ctx.textAlign = 'center';

  ctx.save();
  ctx.translate(img.width / 2, img.height / 2);
  ctx.rotate(-Math.PI / 6);

  const text = 'StageSmart.ai';
  const spacing = img.height / 3;
  for (let y = -img.height; y < img.height; y += spacing) {
    ctx.strokeText(text, 0, y);
    ctx.fillText(text, 0, y);
  }
  ctx.restore();

  const watermarked = canvas.toDataURL(mimeType as any);
  return watermarked;
}
