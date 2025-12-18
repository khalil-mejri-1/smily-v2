import React, { useState } from 'react';
import axios from 'axios';
import NavbarAdmin from './navbar_admin';
import { FiUpload, FiDownload, FiTrash2, FiLoader } from 'react-icons/fi';
// import ImageResizerDownloader from './resize'; // هذا الكومبوننت لم يعد مستخدماً هنا
import Removebg from './removebg';

// الثوابت
const BATCH_SIZE = 10;
const DEFAULT_BORDER_MM = 0.1;
const DEFAULT_SIZE_CM = 6;

// دالة تأخير
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const ModifierStickres = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [processedResults, setProcessedResults] = useState([]); // لنتائج إضافة الإطار/تغيير الحجم
    const [removedBgImages, setRemovedBgImages] = useState([]); // ⭐️ جديد: لتخزين الصور من Removebg
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // حالات التحكم
    const [borderWidth, setBorderWidth] = useState(DEFAULT_BORDER_MM);
    const [stickerSizeCM, setStickerSizeCM] = useState(DEFAULT_SIZE_CM);

    const BASE_API_URL = "http://localhost:3002/api/process-images"; // لعملية الإطار/الحجم

    // ⭐️ جديد: دالة لاستقبال الصور التي تم إزالة خلفيتها من Removebg
    const handleRemovedBgImages = (images) => {
        setRemovedBgImages(images);
        // يمكنك هنا إعطاء feedback للمستخدم بأن الصور جاهزة للمعالجة الثانية
        if (images.length > 0) {
            setFeedback({ type: 'success', message: `Background removed from ${images.length} images. Ready for border & resize!` });
        } else {
            setFeedback({ type: '', message: '' });
        }
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);
        setProcessedResults([]);
        setRemovedBgImages([]); // ⭐️ مسح الصور المُزالة الخلفية أيضاً
        setFeedback({ type: '', message: '' });
    };

    // معالجة المجموعات (Batch Processing) - هذه الدالة ستستخدم للصور المُزالة الخلفية
    const handleProcessImagesWithBorderAndResize = async (imagesToProcess) => { // ⭐️ تقبل قائمة صور
        const numericBorderWidth = parseFloat(borderWidth);
        
        if (imagesToProcess.length === 0) {
            setFeedback({ type: 'error', message: 'No images to add border/resize. Please remove background first.' });
            return;
        }
        if (isNaN(numericBorderWidth) || numericBorderWidth <= 0) {
            setFeedback({ type: 'error', message: 'Border width must be a positive number (e.g., 0.1 or 3).' });
            return;
        }
        
        const size_to_pass = parseFloat(stickerSizeCM) > 0 ? parseFloat(stickerSizeCM) : DEFAULT_SIZE_CM;

        setIsProcessing(true);
        setProcessedResults([]);
        setFeedback({ type: 'info', message: `Starting batch processing of ${imagesToProcess.length} images for border & resize...` });

        const API_URL_WITH_PARAMS = 
            `${BASE_API_URL}?border=${numericBorderWidth}&size=${size_to_pass}`;

        const totalFiles = imagesToProcess.length;
        let allResults = [];
        let totalFailed = 0;

        try {
            for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
                const batch = imagesToProcess.slice(i, i + BATCH_SIZE);
                const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
                const totalBatches = Math.ceil(totalFiles / BATCH_SIZE);
                
                setFeedback({ 
                    type: 'info', 
                    message: `Processing Batch ${batchNumber} of ${totalBatches} (${batch.length} files) for border & resize...` 
                });

                const formData = new FormData();
                // ⭐️ هنا نحتاج لتحويل الـ URLs إلى كائنات File أو Blobs لإرسالها
                // أفضل طريقة هي أن يرسل Removebg الـ Blobs مباشرة أو يعيد إنشاء File من الـ URLs
                // حالياً، سنفترض أن imagesToProcess تحتوي على Blobs أو Files.
                // إذا كانت تحتوي على URLs فقط، فسنحتاج إلى جلبها أولاً.
                
                // افتراض: imagesToProcess هي مصفوفة من { file: originalFile, resultBlob: blob }
                // لنقم بتبسيط الأمر الآن ونعتبر أنها مصفوفة من Blobs
                
                // ⭐️ تحديث: يجب أن نمرر `File` objects إلى FormData.
                // سنعدل Removebg لإعادة `File` objects بدلاً من URL فقط.
                
                for (const item of batch) {
                    const response = await fetch(item.resultUrl); // جلب الـ Blob من الـ URL
                    const blob = await response.blob();
                    // إنشاء File جديد من الـ Blob
                    const file = new File([blob], item.originalName, { type: blob.type });
                    formData.append('stickers', file);
                }


                const response = await axios.post(API_URL_WITH_PARAMS, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                const successfulResults = response.data.results.filter(r => r.status === 'success');
                allResults = [...allResults, ...successfulResults];
                totalFailed += response.data.results.length - successfulResults.length;
                
                await delay(500); 
            }

            setProcessedResults(allResults);
            
            if (totalFailed === 0) {
                setFeedback({ type: 'success', message: `Successfully added border and resized all ${totalFiles} images.` });
            } else {
                 setFeedback({ type: 'warning', message: `Finished processing border & resize. ${allResults.length} succeeded, but ${totalFailed} failed.` });
            }

        } catch (error) {
            const errorMessage = error.response?.data?.message || "An error occurred during border/resize connection.";
            setFeedback({ type: 'error', message: errorMessage });
            console.error("Border/Resize processing error:", error);
        } finally {
            setIsProcessing(false);
        }
    };
    
    // دالة تحميل صورة واحدة (لا تغيير)
    const handleDownload = async (url, filename) => {
        try {
            const res = await axios.get(url, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'image/png' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
            return true;
        } catch (err) {
            return false;
        }
    };
    
    // دالة تحميل الكل (لا تغيير)
    const handleDownloadAll = async () => {
        if (processedResults.length === 0) return;
        
        setIsDownloading(true);
        setFeedback({ type: 'info', message: `Starting batch download for ${processedResults.length} bordered files...` });

        let successCount = 0;

        for (const [index, result] of processedResults.entries()) {
            const filename = `Bordered-${result.processedFileName}`;
            const isSuccess = await handleDownload(result.url, filename);
            
            if (isSuccess) {
                successCount++;
            }
            
            setFeedback({ 
                type: 'info', 
                message: `Downloading ${index + 1} of ${processedResults.length} files...` 
            });

            await delay(500); 
        }

        setIsDownloading(false);

        if (successCount === processedResults.length) {
            setFeedback({ type: 'success', message: `Successfully downloaded all ${successCount} files!` });
        } else {
            setFeedback({ type: 'error', message: `Finished download with errors. Only ${successCount} of ${processedResults.length} files were downloaded.` });
        }
    };

    const handleClear = () => {
        setSelectedFiles([]);
        setProcessedResults([]);
        setRemovedBgImages([]); // ⭐️ مسح الصور المُزالة الخلفية أيضاً
        setFeedback({ type: '', message: '' });
    };

    // -------------------------------------------------------------
    // المظهر (Return)
    // -------------------------------------------------------------
    return (
        <div className="main-app-container">
            <NavbarAdmin />
            
            <div className="process-container">
                <h1 className="form-title">Add Sticker Border & Resize</h1>
                
                {feedback.message && (
                    <div className={`feedback ${feedback.type}`}>
                        {(isProcessing || isDownloading) ? <FiLoader className="spinner-icon" size={20} /> : null}
                        <span>{feedback.message}</span>
                    </div>
                )}
                
                <div className="upload-box">
                    <input 
                        type="file" 
                        id="file-upload" 
                        multiple 
                        accept="image/png, image/jpeg, image/webp" // ⭐️ يفضل تحديد الصيغ المدعومة
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        disabled={isProcessing}
                    />
                    <label htmlFor="file-upload" className="upload-label">
                        <FiUpload size={24} />
                        <span>{selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected.` : 'Click to select images'}</span>
                    </label>
                    
                    <div className="form-controls-group"> 
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="border-width">Border Width (mm) *Required</label>
                            <input
                                id="border-width"
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={borderWidth}
                                onChange={(e) => setBorderWidth(e.target.value)}
                                className="admin-search-input"
                                disabled={isProcessing || isDownloading}
                            />
                        </div>
                        
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="sticker-size">Max Height (CM) *Optional</label>
                            <input
                                id="sticker-size"
                                type="number"
                                step="0.5"
                                min="1"
                                value={stickerSizeCM}
                                onChange={(e) => setStickerSizeCM(e.target.value)}
                                className="admin-search-input" 
                                disabled={isProcessing || isDownloading}
                            />
                        </div>
                    </div>
                    
                    <div className="button-group">
                        <button 
                            className="process-btn" 
                            onClick={() => handleProcessImagesWithBorderAndResize(removedBgImages)} // ⭐️ تم تغيير الدالة واستخدام removedBgImages
                            disabled={removedBgImages.length === 0 || isProcessing || isDownloading || !borderWidth} 
                        >
                            {isProcessing ? (
                                <>
                                <FiLoader className="spinner-icon" size={20} /> Processing Border...
                                </>
                            ) : (
                                <>
                                <FiUpload size={20} /> Add Border & Resize
                                </>
                            )}
                        </button>
                        <button 
                            className="clear-btn" 
                            onClick={handleClear} 
                            disabled={isProcessing || isDownloading}
                        >
                            <FiTrash2 size={20} /> Clear All
                        </button>
                    </div>
                </div>
                
                {processedResults.length > 0 && (
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <button 
                            className="download-all-btn" 
                            onClick={handleDownloadAll} 
                            disabled={isDownloading || isProcessing}
                        >
                            {isDownloading ? (
                                <>
                                <FiLoader className="spinner-icon" size={20} /> Downloading All ({processedResults.length})
                                </>
                            ) : (
                                <>
                                <FiDownload size={20} /> Download All ({processedResults.length})
                                </>
                            )}
                        </button>
                    </div>
                )}

                <div className="results-grid">
                    {processedResults.map((result, index) => (
                        <div key={index} className="result-card">
                            <img 
                                src={result.url} 
                                alt={result.originalName} 
                                className="processed-img"
                                onError={(e) => e.target.src = 'placeholder_error.png'}
                            />
                            <p>{result.originalName}</p>
                            <button 
                                onClick={() => handleDownload(result.url, `Bordered-${result.processedFileName}`)}
                                className="download-btn"
                                disabled={isDownloading}
                            >
                                <FiDownload size={16} /> Download
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* تمرير الدالة الجديدة لـ Removebg */}
            <Removebg onProcessedImages={handleRemovedBgImages} initialFiles={selectedFiles} />
        </div>
    );
}

export default ModifierStickres;