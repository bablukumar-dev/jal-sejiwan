'use client';
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, RotateCw, Check } from 'lucide-react';

interface ImageCropperModalProps {
  image: string;
  onConfirm: (croppedImage: File) => void;
  onClose: () => void;
}

export default function ImageCropperModal({ image, onConfirm, onClose }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const toggleAspect = () => {
    setAspect(prev => prev === 1 ? undefined : 1);
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: any, rotation = 0) => {
    const image = new Image();
    image.src = imageSrc;
    await image.decode();
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(new File([blob!], 'cropped.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg');
    });
  };

  const handleConfirm = async () => {
    const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
    if (croppedImage) onConfirm(croppedImage);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      <div className="p-4 flex justify-between items-center bg-black/50 text-white">
        <h3 className="font-bold">Crop & Rotate</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative bg-black">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>

      <div className="p-4 bg-black/50 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setRotation(r => r + 90)} 
            className="bg-white/20 p-3 rounded-full text-white"
            title="Rotate"
          >
            <RotateCw className="w-6 h-6" />
          </button>
          
          <button 
            onClick={toggleAspect} 
            className={`p-3 rounded-xl font-bold text-xs transition-colors ${aspect === 1 ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
            title="Lock 1:1 Aspect Ratio"
          >
            {aspect === 1 ? '1:1 Locked' : 'Free Crop'}
          </button>

          <div className="flex-1 flex items-center gap-2">
            <span className="text-white text-xs">Zoom</span>
            <input
              type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1"
          />
        </div>
      </div>
        
        <button
          onClick={handleConfirm}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Finalize Photo
        </button>
      </div>
    </div>
  );
}
