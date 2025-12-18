import React, { useState, useRef } from "react";
import axios from "axios";
import { FaClipboard } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";

const ClienLinks = () => {
    // --- States ---
    const [extractedData, setExtractedData] = useState([]); // لتخزين مصفوفة JSON النظيفة
    const [copyFeedback, setCopyFeedback] = useState("");
    const [searchQuery, setSearchQuery] = useState(""); // يستخدم لكلمة البحث أو الرابط لـ Pinterest
    const [startPage, setStartPage] = useState("1");
    const [endPage, setEndPage] = useState("1");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [siteName, setSiteName] = useState("redbubble");
    const [copyFormat, setCopyFormat] = useState('detailed'); // تنسيق النسخ الافتراضي

    // تحديد ما إذا كان الموقع يتطلب أرقام صفحات (أي ليس Pinterest)
    const requiresPages = siteName !== 'pinterest';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setExtractedData([]);

        let start = 1;
        let end = 1;
        let input_name = searchQuery;

        if (requiresPages) {
            start = parseInt(startPage);
            end = parseInt(endPage);

            if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
                setError("Invalid page range. Start page must be 1 or more, and End page must be greater than or equal to Start page.");
                setIsLoading(false);
                return;
            }
        } else {
            // التحقق من صلاحية رابط Pinterest
            if (!input_name.startsWith('http')) {
                setError("Please enter a valid Pinterest URL.");
                setIsLoading(false);
                return;
            }
            // بالنسبة لـ Pinterest، نرسل 1 و 1 كأرقام صفحات وهمية للسكربت
            start = 1;
            end = 1;
        }

        try {
            // ملاحظة: يُفترض أن خادم Node.js (http://localhost:3002) 
            // يقوم بتشغيل كود Python المُصلح الذي يخرج JSON.
            const response = await axios.post('http://localhost:3002/run-python-script', {
                searchQuery: input_name,
                startPage: start,
                endPage: end,
                siteName,
            });

            // 💥 معالجة إخراج JSON النظيف من سكربت Python
            const rawOutput = response.data.output || "";

            // نحاول استخراج الجزء JSON المحاط بـ [] من الإخراج الكامل (الذي قد يحتوي على رسائل stderr)
            const jsonStart = rawOutput.indexOf('[');
            const jsonEnd = rawOutput.lastIndexOf(']');

            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                const jsonPart = rawOutput.substring(jsonStart, jsonEnd + 1);

                try {
                    const cleanData = JSON.parse(jsonPart);
                    setExtractedData(cleanData);
                    console.log(`Successfully extracted ${cleanData.length} items from Python output.`);
                } catch (jsonError) {
                    console.error("JSON Parse Error:", jsonError);
                    setError(`Error processing Python output (Invalid JSON format). Raw output start: ${rawOutput.substring(0, 200)}...`);
                }
            } else {
                setError("Python script returned output but no valid JSON array was found. Check server logs.");
            }

        } catch (err) {
            console.error("Fetch Error:", err);
            // تحسين عرض رسائل الخطأ
            const errorDetails = err.response?.data?.details || err.message || 'Unknown error';
            setError(`An error occurred during fetching: ${errorDetails}`);
        }
        finally {
            setIsLoading(false);
        }
    };

    // 💥 دالة handleParseHtml لم تعد ضرورية وتمت إزالتها.

    const handleCopy = () => {
        if (extractedData.length === 0) {
            setCopyFeedback("No data to copy.");
            return;
        }

        let formattedText = "";

        // استخدام اسم الحقل 'image_url' كما هو مُعرّف في إخراج Python
        const items = extractedData.filter(item => item.title && item.image_url);

        if (copyFormat === 'simple') {
            // التنسيق المطلوب: Title URL
            formattedText = items
                .map(
                    (item) =>
                        `${item.title} ${item.image_url}`
                )
                .join("\n");
        } else {
            // التنسيق المطلوب: Title: / Image:
            formattedText = items
                .map(
                    (item, index) =>
                        `Example ${index + 1} (Title: / Image:):\nTitle: ${item.title}\nImage: ${item.image_url}\n`
                )
                .join("\n");
        }

        navigator.clipboard
            .writeText(formattedText)
            .then(() => {
                setCopyFeedback("Copied to clipboard!");
                setTimeout(() => setCopyFeedback(""), 3000);
            })
            .catch((err) => {
                console.error("Failed to copy:", err);
                setCopyFeedback("Failed to copy.");
            });
    };

    // --- الأنماط (Styles) ---
    const selectStyle = {
        width: '100%', padding: '10px 15px', margin: '8px 0',
        borderRadius: '8px', border: '1px solid #555',
        backgroundColor: '#333', color: '#eee', fontSize: '1rem',
        appearance: 'none', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    };

    const inputFieldStyle = {
        width: '100%', padding: '10px 15px', margin: '8px 0',
        borderRadius: '8px', border: '1px solid #555',
        backgroundColor: '#333', color: '#eee',
        fontSize: '1rem', boxSizing: 'border-box',
    };

    const labelStyle = {
        display: 'block', marginBottom: '5px', fontWeight: '600', color: '#ccc',
    };


    return (
        <div className="dual-panel-container">
            {/* Left Panel: Fetcher */}
            <div className="dark-theme-container">
                <div className="card">
                    <h1 className="title">Content Fetcher 🎨</h1>
                    <form onSubmit={handleSubmit}>
                        {/* حقل اختيار الموقع */}
                        <div className="input-group">
                            <label htmlFor="siteName" style={labelStyle}>Select Site:</label>
                            <select
                                id="siteName"
                                value={siteName}
                                onChange={(e) => setSiteName(e.target.value)}
                                required
                                style={selectStyle}
                            >
                                <option value="teepublic">Teepublic</option>
                                <option value="redbubble">Redbubble</option>
                                <option value="pinterest">Pinterest (URL)</option>
                            </select>
                        </div>
                        {/* حقل الإدخال (يتغير بناءً على الموقع) */}
                        <div className="input-group">
                            <label htmlFor="searchQuery" style={labelStyle}>
                                {requiresPages ? "Search Keyword:" : "Pinterest URL:"}
                            </label>
                            <input
                                id="searchQuery"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                required
                                style={inputFieldStyle}
                                placeholder={requiresPages ? "e.g., Arabic calligraphy sticker" : "e.g., https://in.pinterest.com/kmejri57/arabc/"}
                            />
                        </div>
                        {/* حقول الصفحات (تختفي لـ Pinterest) */}
                        {requiresPages && (
                            <>
                                <div className="input-group">
                                    <label htmlFor="startPage" style={labelStyle}>Start Page:</label>
                                    <input
                                        id="startPage"
                                        type="number"
                                        min="1"
                                        value={startPage}
                                        onChange={(e) => setStartPage(e.target.value)}
                                        required
                                        style={inputFieldStyle}
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="endPage" style={labelStyle}>End Page:</label>
                                    <input
                                        id="endPage"
                                        type="number"
                                        min="1"
                                        value={endPage}
                                        onChange={(e) => setEndPage(e.target.value)}
                                        required
                                        style={inputFieldStyle}
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="submit-button"
                        >
                            {isLoading ? (<><FiLoader className="spinner-icon" size={20} /> <span>Fetching...</span></>) : "Run Fetcher"}
                        </button>
                    </form>

                    {error && <div className="error-message">{error}</div>}

                </div>
            </div>

            {/* Right Panel: Extractor (النتائج النظيفة) */}
            <div className="main-container">
                <h1 className="title">Extracted Clean Data</h1>

                <hr style={{ margin: "30px 0", border: "1px solid #333" }} />

                <div className="results-container">
                    <h2
                        style={{
                            textAlign: "center",
                            marginBottom: "15px",
                            color: "var(--color-primary-purple)",
                            fontSize: "1.4rem",
                        }}
                    >
                        Extracted Clean Data
                    </h2>
                    <p
                        style={{ textAlign: "center", color: "#888", marginBottom: "20px" }}
                    >
                        Total Results: {extractedData.length}
                    </p>

                    {/* حقل اختيار التنسيق */}
                    <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                        <label style={labelStyle}>Choose Copy Format:</label>
                        <select
                            value={copyFormat}
                            onChange={(e) => setCopyFormat(e.target.value)}
                            style={{ ...selectStyle, width: 'auto', display: 'inline-block' }}
                        >
                            <option value="detailed">Detailed (Example: Title: / Image:)</option>
                            <option value="simple">Simple (Title URL)</option>
                        </select>
                    </div>

                    <button
                        onClick={handleCopy}
                        disabled={extractedData.length === 0}
                        className="copy-button"
                    >
                        <FaClipboard /> Copy Formatted Data
                    </button>
                    {copyFeedback && (
                        <span className="copy-feedback">{copyFeedback}</span>
                    )}

                    <ul className="results-list">
                        {extractedData.length > 0 ? (
                            extractedData.map((item, index) => (
                                <li key={index} className="result-item">
                                    {/* التأكد من استخدام أسماء الحقول الصحيحة: title, image_url, site */}
                                    <p>
                                        <strong>Title:</strong> {item.title}
                                    </p>
                                    <p>
                                        <strong>Site:</strong> {item.site || siteName}
                                    </p>
                                    <p>
                                        <strong>Image:</strong>{" "}
                                        <a
                                            href={item.image_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {item.image_url}
                                        </a>
                                    </p>
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                        style={{ maxWidth: '100px', maxHeight: '100px', marginTop: '10px', borderRadius: '4px' }}
                                    />
                                </li>
                            ))
                        ) : (
                            <p className="empty-state">
                                No data extracted yet. Run the fetcher to get clean results.
                            </p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ClienLinks;