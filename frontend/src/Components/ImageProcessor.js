import React, { useState, useRef } from 'react';
import './ImageProcessor.css';

export function ImageProcessor() {
  const [originalImage, setOriginalImage] = useState(null);
  const [pixelatedImage, setPixelatedImage] = useState(null);
  const [colorMap, setColorMap] = useState([]);
  const [pixelSize, setPixelSize] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef();
  const canvasRef = useRef();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        processImage(img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const processImage = (img) => {
    setIsProcessing(true);
    
    // Create offscreen canvas for processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    const width = Math.min(img.width, 600); // Limit size for performance
    const height = (img.height / img.width) * width;
    canvas.width = width;
    canvas.height = height;
    
    // Draw original image
    ctx.drawImage(img, 0, 0, width, height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Pixelate the image
    const pixelated = pixelateImage(imageData, pixelSize);
    
    // Extract unique colors and create color map
    const colors = extractColors(pixelated, 12); // Limit to 12 colors
    
    setColorMap(colors);
    setPixelatedImage(pixelated);
    renderPixelatedImage(pixelated, colors);
    
    setIsProcessing(false);
  };

  const pixelateImage = (imageData, pixelSize) => {
    const { width, height, data } = imageData;
    const newData = new Uint8ClampedArray(data.length);
    
    for (let y = 0; y < height; y += pixelSize) {
      for (let x = 0; x < width; x += pixelSize) {
        // Get the color of the center pixel of the block
        const pixelIndex = (y * width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        const a = data[pixelIndex + 3];
        
        // Fill the block with the same color
        for (let dy = 0; dy < pixelSize && y + dy < height; dy++) {
          for (let dx = 0; dx < pixelSize && x + dx < width; dx++) {
            const index = ((y + dy) * width + (x + dx)) * 4;
            newData[index] = r;
            newData[index + 1] = g;
            newData[index + 2] = b;
            newData[index + 3] = a;
          }
        }
      }
    }
    
    return { width, height, data: newData };
  };

  const extractColors = (imageData, maxColors) => {
    const colorMap = new Map();
    const { data } = imageData;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      if (a < 128) continue; // Skip transparent pixels
      
      const colorKey = `${r},${g},${b}`;
      colorMap.set(colorKey, colorMap.has(colorKey) ? colorMap.get(colorKey) + 1 : 1);
    }
    
    // Sort by frequency and take top colors
    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxColors)
      .map(([colorKey], index) => {
        const [r, g, b] = colorKey.split(',').map(Number);
        return {
          id: index + 1,
          color: `rgb(${r}, ${g}, ${b})`,
          hex: rgbToHex(r, g, b)
        };
      });
  };

  const rgbToHex = (r, g, b) => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const renderPixelatedImage = (imageData, colors) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    
    // Create new ImageData
    const newImageData = new ImageData(imageData.data, imageData.width, imageData.height);
    ctx.putImageData(newImageData, 0, 0);
    
    // Add numbers to each color region
    if (colors.length > 0) {
      ctx.font = '12px Arial';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Sample points to place numbers (not every pixel)
      for (let y = pixelSize; y < imageData.height; y += pixelSize * 2) {
        for (let x = pixelSize; x < imageData.width; x += pixelSize * 2) {
          if (x < imageData.width && y < imageData.height) {
            const pixelIndex = (y * imageData.width + x) * 4;
            const r = imageData.data[pixelIndex];
            const g = imageData.data[pixelIndex + 1];
            const b = imageData.data[pixelIndex + 2];
            
            const color = colors.find(c => {
              const [cr, cg, cb] = c.color.match(/\d+/g).map(Number);
              return Math.abs(cr - r) < 10 && Math.abs(cg - g) < 10 && Math.abs(cb - b) < 10;
            });
            
            if (color) {
              // Add white background for number
              ctx.fillStyle = 'white';
              ctx.fillRect(x - 6, y - 6, 12, 12);
              
              // Add number
              ctx.fillStyle = 'black';
              ctx.fillText(color.id.toString(), x, y);
            }
          }
        }
      }
    }
  };

  const handlePixelSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPixelSize(newSize);
    if (originalImage) {
      processImage(originalImage);
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'color-by-numbers.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="image-processor">
      <div className="upload-section">
        <h2>Create Color-by-Numbers</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button 
          onClick={() => fileInputRef.current.click()}
          className="upload-btn"
        >
          Upload Image
        </button>
        
        {originalImage && (
          <div className="controls">
            <label>
              Pixel Size:
              <input
                type="range"
                min="5"
                max="30"
                value={pixelSize}
                onChange={handlePixelSizeChange}
              />
              {pixelSize}px
            </label>
            
            <button onClick={downloadImage} className="download-btn">
              Download Template
            </button>
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="processing">Processing image...</div>
      )}

      <div className="result-container">
        {pixelatedImage && (
          <>
            <div className="color-palette">
              <h3>Color Guide</h3>
              <div className="colors-grid">
                {colorMap.map(color => (
                  <div key={color.id} className="color-item">
                    <div 
                      className="color-swatch" 
                      style={{ backgroundColor: color.color }}
                    ></div>
                    <span className="color-number">{color.id}</span>
                    <span className="color-hex">{color.hex}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="canvas-container">
              <h3>Your Color-by-Numbers Template</h3>
              <canvas ref={canvasRef} className="pixel-canvas" />
              <p className="instructions">
                Each number corresponds to a color in the guide above. 
                Match the numbers to the colors to recreate your image!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}