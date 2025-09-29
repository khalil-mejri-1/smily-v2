import React, { useState, useEffect } from "react";
import { FiUpload, FiDownload, FiTrash2, FiLoader, FiLink } from 'react-icons/fi';

const API_ENDPOINT = "http://localhost:8001/api/remove-background"; 
const API_URL_ENDPOINT = "http://localhost:8001/api/remove-background-url"; 

const Removebg = ({ onProcessedImages, initialFiles = [] }) => { 
  const [selectedFiles, setSelectedFiles] = useState(initialFiles); 
  const [processedResults, setProcessedResults] = useState([]); 
  const [isProcessing, setIsProcessing] = useState(false); 
  const [currentFileIndex, setCurrentFileIndex] = useState(-1); 
  const [error, setError] = useState(null);
  
  // State for multiple URLs input
  const [imageUrlsInput, setImageUrlInput] = useState(""); 
  const [imageUrls, setImageUrls] = useState([]); // Array of actual URLs for processing

  useEffect(() => {
    setSelectedFiles(initialFiles);
    setProcessedResults([]); 
  }, [initialFiles]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files); 
    if (files.length > 0) {
      setSelectedFiles(files);
      setProcessedResults([]); 
      setError(null);
      setCurrentFileIndex(-1); 
      setImageUrlInput(""); // Clear URLs when files are selected
      setImageUrls([]);
      if (onProcessedImages) {
          onProcessedImages([]);
      }
    }
  };
    
  // Function to handle multiple URLs input change
  const handleImageUrlChange = (event) => {
    const input = event.target.value;
    setImageUrlInput(input);
    
    // Split by new line, trim, and filter empty links
    const links = input
      .split('\n')
      .map(link => link.trim())
      .filter(link => link.length > 0);
      
    setImageUrls(links);
    setSelectedFiles([]); // Clear local files when URL is entered
    setProcessedResults([]);
    setError(null);
    if (onProcessedImages) {
        onProcessedImages([]);
    }
  };

  // Function to process a single URL
  const processImageUrl = async (url) => {
    try {
      const response = await fetch(API_URL_ENDPOINT, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: url }), 
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server failed: ${response.status} - ${errorText}`);
      }

      const imageBlob = await response.blob();
      return {
        originalName: url.substring(url.lastIndexOf('/') + 1) || 'image_from_url',
        originalUrl: url,
        resultUrl: URL.createObjectURL(imageBlob),
        isSuccess: true
      };
    } catch (err) {
      console.error("Error processing URL:", err);
      return {
        originalName: url.substring(url.lastIndexOf('/') + 1) || 'image_from_url',
        originalUrl: url,
        resultUrl: `ERROR: ${err.message}`,
        isSuccess: false
      };
    }
  };


  // Function to process a single local file
  const processSingleImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file); 

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server failed: ${response.status} - ${errorText}`);
      }

      const imageBlob = await response.blob();
      return URL.createObjectURL(imageBlob);
    } catch (err) {
      console.error("Error connecting to API:", err);
      return `ERROR: ${err.message}`;
    }
  };

  // Main processing function
  const handleProcessAll = async () => {
    
    // Scenario 1: Process multiple URLs sequentially
    if (imageUrls.length > 0) {
        setIsProcessing(true);
        setError(null);
        setProcessedResults([]);
        
        const results = [];
        const successfulBlobs = []; 
        
        for (let i = 0; i < imageUrls.length; i++) {
          setCurrentFileIndex(i); 
          const url = imageUrls[i];
          
          const result = await processImageUrl(url);
          results.push(result);
          
          if (result.isSuccess) {
            successfulBlobs.push({
              originalName: result.originalName, 
              resultUrl: result.resultUrl 
            });
          }
          setProcessedResults([...results]);
        }
        
        setCurrentFileIndex(-1);
        setIsProcessing(false);

        if (onProcessedImages) {
            onProcessedImages(successfulBlobs);
        }
        return;
    }
    
    // Scenario 2: Process local files sequentially
    if (selectedFiles.length === 0) {
      setError("Please select image(s) or enter a URL.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessedResults([]);

    const results = [];
    const successfulBlobs = []; 

    for (let i = 0; i < selectedFiles.length; i++) {
      setCurrentFileIndex(i); 
      const file = selectedFiles[i];
      
      const originalUrl = URL.createObjectURL(file);
      const resultUrl = await processSingleImage(file);

      const isSuccess = !resultUrl.startsWith('ERROR:');
      
      results.push({
        originalName: file.name,
        originalUrl,
        resultUrl, 
        isSuccess
      });

      if (isSuccess) {
        successfulBlobs.push({
          originalName: file.name,
          resultUrl 
        });
      }

      setProcessedResults([...results]); 
    }

    setCurrentFileIndex(-1); 
    setIsProcessing(false);

    if (onProcessedImages) {
        onProcessedImages(successfulBlobs);
    }
  };

  const currentFileName = currentFileIndex !== -1 
    ? (imageUrls.length > 0 ? imageUrls[currentFileIndex] : selectedFiles[currentFileIndex]?.name)
    : '';
    
  const totalFiles = selectedFiles.length || imageUrls.length;

  // Determine if the button should be disabled
  const isDisabled = isProcessing || (selectedFiles.length === 0 && imageUrls.length === 0);

  const isUrlMode = imageUrls.length > 0;
  
  return (
    <>
    <div className="bg-remover-container dark-mode">
      <h1>AI Background Remover (File or URL)</h1>

      {/* Multiple URLs Input (textarea) */}
      <div className="url-input-section">
        <textarea
          value={imageUrlsInput}
          onChange={handleImageUrlChange}
          placeholder="Or enter image URLs here (one link per line)"
          className="image-url-textarea"
          rows="4"
          disabled={isProcessing}
        />
      </div>
      
      <p className="separator-text">— OR —</p>
      

      {/* File Upload Section */}
      <div className="input-section">
        <input
          type="file"
          accept="image/*" 
          onChange={handleFileChange}
          id="removebg-file-upload" 
          className="custom-file-upload"
          multiple 
          hidden
        />
        <label htmlFor="removebg-file-upload" className="upload-label" style={{opacity: imageUrls.length > 0 ? 0.5 : 1}}> 
            <FiUpload size={24} /> 
            <span>{selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected.` : 'Click to select images to remove background'}</span>
        </label>
        
        <button
          onClick={handleProcessAll} 
          disabled={isDisabled} 
          className="process-button"
        >
          {isProcessing ? 
            (isUrlMode ? `Processing URL ${currentFileIndex + 1} of ${totalFiles}...` : `Processing file ${currentFileIndex + 1} of ${totalFiles}...`) 
            : "Remove Background"}
        </button>
      </div>
      
      {/* Status and Error Messages */}
      {error && <div className="error-message">❌ {error}</div>}
      
      {isProcessing && (
        <div className="loading-message">
          <FiLoader className="loading-spinner" /> 
          ...Processing **{currentFileIndex + 1}** of **{totalFiles}**
        </div>
      )}
      
      {/* Results Display Area */}
      <div className="results-grid">
        {processedResults.map((item, index) => (
          <div className="result-card" key={index}>
            <h3>{item.originalName}</h3>
            
            <div className="image-pair">
                <div className="image-side">
                    <h4>Original</h4>
                    <img src={item.originalUrl} alt={`Original ${item.originalName}`} className="image-preview" />
                </div>
                
                <div className="image-side">
                    <h4>Result</h4>
                    {item.isSuccess ? (
                        <>
                            <img
                                src={item.resultUrl}
                                alt={`Result ${item.originalName}`}
                                className="image-preview result"
                            />
                            <a
                                href={item.resultUrl}
                                download={`bg_removed_${item.originalName}.png`} 
                                className="download-link small-download"
                            >
                                ⬇️ Download (PNG)
                            </a>
                        </>
                    ) : (
                        <div className="error-placeholder">
                            ❌ Processing Failed:<br/>{item.resultUrl.replace('ERROR: ', '').substring(0, 50) + '...'}
                        </div>
                    )}
                </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Next Step Button */}
      {processedResults.length > 0 && !isProcessing && onProcessedImages && (
          <div className="process-next-step">
              <button 
                  className="process-btn large-btn"
                  onClick={() => onProcessedImages(processedResults.filter(item => item.isSuccess))} 
                  disabled={processedResults.filter(item => item.isSuccess).length === 0}
              >
                  <FiUpload size={24} /> Process All for Border & Resize
              </button>
              <p className="info-message">
                **{processedResults.filter(item => item.isSuccess).length}** images are ready for the next step.
              </p>
          </div>
      )}

    </div>
    <br /><br /><br /><br />
    </>
    
  );
};

export default Removebg;