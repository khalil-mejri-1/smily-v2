import React, { useState, useRef } from "react";
// import NavbarAdmin from "./navbar_admin"; // تم التعليق عليه لافتراض عدم الحاجة في هذا الملف
import axios from "axios";
import { FaClipboard } from "react-icons/fa";
import { FiLoader } from "react-icons/fi"; 

const ClienLinks = () => {
    // --- States ---
    const [rawHtmlInput, setRawHtmlInput] = useState("");
    const [extractedData, setExtractedData] = useState([]);
    const [copyFeedback, setCopyFeedback] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [startPage, setStartPage] = useState("");
    const [endPage, setEndPage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [htmlResult, setHtmlResult] = useState("");
    const [error, setError] = useState("");
    // تم الإعداد الافتراضي على 'redbubble' للتجربة
    const [siteName, setSiteName] = useState("redbubble"); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setHtmlResult('');
        setError('');
        setExtractedData([]);

        const start = parseInt(startPage);
        const end = parseInt(endPage);
        if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
            setError("Invalid page range. Start page must be 1 or more, and End page must be greater than or equal to Start page.");
            setIsLoading(false);
            return;
        }

        try {
            // ملاحظة: هذا يفترض أن لديك خادم Node.js يعمل على المنفذ 3002 لتشغيل كود Python/Selenium
            const response = await axios.post('http://localhost:3002/run-python-script', {
                searchQuery,
                startPage: start,
                endPage: end,
                siteName, 
            });

            const fetchedHtml = response.data.output;

            setHtmlResult(fetchedHtml);
            setRawHtmlInput(fetchedHtml);

            // استخلاص البيانات مباشرة بعد جلب HTML
            handleParseHtml(fetchedHtml, siteName);

        } catch (err) {
            console.error("Fetch Error:", err);
            setError(`An error occurred during fetching or the server is unavailable. Details: ${err.response?.data?.details || err.message}`);
        }
        finally {
            setIsLoading(false);
        }
    };

    const handleCopy2 = () => {
        // نسخ كود HTML الكامل
        navigator.clipboard.writeText(htmlResult);
        alert("Full HTML Results copied to clipboard!");
    };

    const inputRef = useRef(null);

    // --- دالة استخلاص البيانات (Parsing Logic) ---
    const handleParseHtml = (html, currentSiteName) => {
        setCopyFeedback("");
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const results = [];
        
        // --- منطق استخلاص Teepublic ---
        if (currentSiteName.toLowerCase() === 'teepublic') {
            const productCardsMethod1 = doc.querySelectorAll(
                '[data-testid="search-result-card"]'
            );
            
            productCardsMethod1.forEach((card) => {
                const imgElement = card.querySelector(
                    "img.ProductCard_productCardImage____xct"
                );
                const imageUrl = imgElement
                    ? imgElement.getAttribute("src")
                    : "No Image Found (TP)";

                const titleElement = card.querySelector(
                    '[data-testid="ds-box"].SearchResultsPageProductCard_title__nz0UT'
                );
                const title = titleElement
                    ? titleElement.textContent.trim()
                    : "No Title Found (TP)";

                results.push({ imageUrl, title });
            });

            if (results.length === 0) {
                const productCardsMethod2 = doc.querySelectorAll(".tp-design-tile");
                productCardsMethod2.forEach((card) => {
                    const imgElement = card.querySelector(".tp-design-tile__image");
                    const imageUrl = imgElement
                        ? imgElement.getAttribute("src")
                        : "No Image Found (TP Fallback)";

                    const titleElement = card.querySelector(".tp-design-tile__title");
                    const title = titleElement
                        ? titleElement.textContent.trim().replace("Sticker", "").trim()
                        : "No Title Found (TP Fallback)";

                    results.push({ imageUrl, title });
                });
            }

        // --- منطق استخلاص Redbubble (المحدَّث) ---
       // داخل دالة handleParseHtml
} else if (currentSiteName.toLowerCase() === 'redbubble') {
    // المحدد الرئيسي لبطاقات المنتجات
    const productCardsRedbubble = doc.querySelectorAll('[data-testid="search-result-card"]'); 
    
    productCardsRedbubble.forEach((card) => {
        
        // 1. استخراج رابط الصورة
        const imgElement = card.querySelector('img.ProductCard_productCardImage____xct');
        const imageUrl = imgElement ? imgElement.getAttribute("src") : "No Image Found (RB)";

        // 2. استخراج العنوان
        const titleElement = card.querySelector('span.SearchResultsPageProductCard_title__nz0UT'); 
        const title = titleElement ? titleElement.textContent.trim() : "No Title Found (RB)";

        results.push({ imageUrl, title });
    });
}
        
        // عرض النتائج بترتيبها الأصلي أو حسب الحاجة
        // results.reverse(); 
        setExtractedData(results);
    };

    const handleCopy = () => {
        if (extractedData.length === 0) {
            setCopyFeedback("No data to copy.");
            return;
        }

        // تنسيق البيانات للعرض والنسخ
        const formattedText = extractedData
            .map(
                (item) =>
                    `Title: ${item.title}\nImage: ${item.imageUrl}\n`
            )
            .join("\n");

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
        width: '100%',
        padding: '10px 15px',
        margin: '8px 0',
        borderRadius: '8px',
        border: '1px solid #555',
        backgroundColor: '#333',
        color: '#eee',
        fontSize: '1rem',
        appearance: 'none', 
        cursor: 'pointer',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    };
    
    const inputFieldStyle = {
        width: '100%',
        padding: '10px 15px',
        margin: '8px 0',
        borderRadius: '8px',
        border: '1px solid #555',
        backgroundColor: '#333',
        color: '#eee',
        fontSize: '1rem',
        boxSizing: 'border-box',
    };
    
    const labelStyle = {
        display: 'block',
        marginBottom: '5px',
        fontWeight: '600',
        color: '#ccc',
    };


    return (
        <div className="dual-panel-container">
            {/* Left Panel: Fetcher (جلب HTML) */}
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
                            </select>
                        </div>
                        {/* بقية حقول الإدخال */}
                        <div className="input-group">
                            <label htmlFor="searchQuery" style={labelStyle}>Search Keyword:</label>
                            <input
                                id="searchQuery"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                required
                                style={inputFieldStyle}
                            />
                        </div>
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

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="submit-button"
                        >
                            {isLoading ? (<><FiLoader className="spinner-icon" size={20} /> <span>Fetching...</span></>) : "Run"}
                        </button>
                    </form>

                    {error && <div className="error-message">{error}</div>}

                    {htmlResult && (
                        <div className="results-container">
                            <div className="results-header">
                                <h3>Full HTML Results:</h3>
                                <button onClick={handleCopy2} className="copy-button">
                                    <FaClipboard /> Copy
                                </button>
                            </div>
                            <pre className="results-content">{htmlResult}</pre>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Extractor (استخلاص البيانات) */}
            <div className="main-container">
                <h1 className="title">Clean HTML Code Extractor</h1>

                <div style={{ marginBottom: "20px" }}>
                    <label
                        htmlFor="html-input"
                        style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "bold",
                        }}
                    >
                        Paste your messy HTML code here:
                    </label>
                    <textarea
                        id="html-input"
                        ref={inputRef}
                        className="html-input"
                        value={rawHtmlInput}
                        onChange={(e) => setRawHtmlInput(e.target.value)}
                        placeholder="Paste your 4000+ lines of HTML..."
                    />
                    <button
                        onClick={() => handleParseHtml(rawHtmlInput, siteName)} 
                        className="action-button"
                        disabled={!rawHtmlInput.trim()}
                    >
                        Extract Links & Titles
                    </button>
                </div>

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
                                    <p>
                                        <strong>Image:</strong>{" "}
                                        <a
                                            href={item.imageUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {item.imageUrl}
                                        </a>
                                    </p>
                                    <p>
                                        <strong>Title:</strong> {item.title}
                                    </p>
                                </li>
                            ))
                        ) : (
                            <p className="empty-state">
                                No data extracted yet. Please run the fetcher or click the button to process the code.
                            </p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ClienLinks;