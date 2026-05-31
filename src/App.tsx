import { Trash2, Download, Upload, Loader2, Sparkles, AlertCircle } from "lucide-react";
import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setError(null);
    setResultImage(null);
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setSelectedImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please drop a valid image file.");
      return;
    }

    setError(null);
    setResultImage(null);
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setSelectedImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setResultImage(null);
    setError(null);
  };

  const enhanceImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Extract the raw base64 part
      const base64Data = selectedImage.split(',')[1];
      
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process image.");
      }

      setResultImage(data.resultImage);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 selection:bg-slate-200 font-sans">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center space-x-2 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-200 mb-6"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">AI Restoration</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-light tracking-tight text-slate-800 mb-4"
          >
            Baby Photo Restorer
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-500 max-w-lg mx-auto"
          >
            Upload your old, faded, or blurry baby photos and let AI restore the details, sharpness, and clarity.
          </motion.p>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, mb: 0 }}
              animate={{ opacity: 1, height: "auto", mb: 24 }}
              exit={{ opacity: 0, height: 0, mb: 0 }}
              className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 overflow-hidden"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
          <div className="p-6 sm:p-10">
            {!selectedImage ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full flex-col flex items-center justify-center border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50/50 hover:bg-slate-100 transition-colors py-24 px-6 cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-white shadow-sm border border-slate-200 rounded-full flex items-center justify-center mb-6 text-slate-400">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-light text-slate-800 mb-2">Click or drag image here</h3>
                <p className="text-slate-500 text-sm mb-6 text-center max-w-sm">
                  We support JPEG and PNG. High quality uploads yield better restoration results.
                </p>
                <button className="bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 hover:shadow-lg px-6 py-2.5 rounded-full text-sm font-medium transition-all">
                  Browse Files
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/webp" 
                  onChange={handleImageSelect}
                />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid md:grid-cols-2 gap-8"
              >
                {/* Original View */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Original Photo</h4>
                    <button 
                      onClick={clearImage}
                      disabled={isProcessing}
                      title="Remove image"
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[4/3] flex items-center justify-center">
                    <img src={selectedImage} alt="Original" className="max-w-full max-h-full object-contain" />
                  </div>
                </div>

                {/* Restored View */}
                <div className="flex flex-col">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 mt-[6px]">Restored Version</h4>
                  <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[4/3] flex items-center justify-center">
                    {isProcessing ? (
                      <div className="flex flex-col items-center text-slate-500">
                        <Loader2 className="w-8 h-8 mb-4 animate-spin text-blue-600" />
                        <p className="text-sm font-medium">Restoring your memory...</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px] text-center">This might take a minute depending on image size.</p>
                      </div>
                    ) : resultImage ? (
                      <img src={resultImage} alt="Restored" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center bg-slate-50/50">
                        <div className="w-16 h-16 bg-white shadow-sm border border-slate-200 rounded-full flex items-center justify-center mb-6 text-slate-300">
                          <Sparkles className="w-8 h-8" />
                        </div>
                        <p className="text-slate-500 mb-6 text-sm">
                          Ready to bring your photo back to life. Click below to begin the AI restoration process.
                        </p>
                        <button 
                          onClick={enhanceImage}
                          className="px-6 py-2 bg-slate-900 text-white rounded-full hover:shadow-lg text-sm font-medium transition-all shadow-sm shadow-slate-900/20 w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Restore Photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Footer */}
          {resultImage && (
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 sm:px-10">
               <button 
                  onClick={clearImage}
                  className="text-slate-600 hover:bg-slate-200/50 bg-transparent px-6 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Start Over
                </button>
              <a 
                href={resultImage}
                download="restored_baby_photo.png"
                className="px-6 py-2 text-sm font-semibold bg-white border border-slate-200 shadow-sm rounded-lg flex items-center gap-2 text-slate-800 hover:bg-slate-50 transition-all"
              >
                <Download className="w-4 h-4" />
                Download Restored Photo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
