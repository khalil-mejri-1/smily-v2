import React, { useState, useRef } from "react";
import NavbarAdmin from "./navbar_admin"; // Assuming this component exists
import axios from "axios";
import { FaClipboard } from "react-icons/fa"; // Make sure to install react-icons: npm install react-icons

const ClienLinks = () => {
  const [rawHtmlInput, setRawHtmlInput] = useState("");
  const [extractedData, setExtractedData] = useState([]);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [htmlResult, setHtmlResult] = useState("");
  const [error, setError] = useState("");







const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setHtmlResult('');
  setError('');
  setExtractedData([]); // امسح البيانات القديمة

try {
  const response = await axios.post('http://localhost:3002/run-python-script', {
    searchQuery,
    startPage: parseInt(startPage),
    endPage: parseInt(endPage),
  });

  const fetchedHtml = response.data.output;

  setHtmlResult(fetchedHtml);
  setRawHtmlInput(fetchedHtml);

  // استدعاء مباشرة عند الجلب
  handleParseHtml(fetchedHtml);

} catch (err) {
  setError("حدث خطأ أثناء الجلب.");
}
finally {
  setIsLoading(false);
}
};




  const handleCopy2 = () => {
    navigator.clipboard.writeText(htmlResult);
    alert("Results copied to clipboard!");
  };

  const inputRef = useRef(null);

const handleParseHtml = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const results = [];

  // --- Parsing Method 1 ---
  const productCardsMethod1 = doc.querySelectorAll(
    '[data-testid="search-result-card"]'
  );
  productCardsMethod1.forEach((card) => {
    const imgElement = card.querySelector(
      "img.ProductCard_productCardImage____xct"
    );
    const imageUrl = imgElement
      ? imgElement.getAttribute("src")
      : "No Image Found";

    const titleElement = card.querySelector(
      '[data-testid="ds-box"].SearchResultsPageProductCard_title__nz0UT'
    );
    const title = titleElement
      ? titleElement.textContent.trim()
      : "No Title Found";

    results.push({ imageUrl, title });
  });

  // --- Parsing Method 2 ---
if (results.length === 0) {
  const productCardsMethod2 = doc.querySelectorAll(".tp-design-tile");
  productCardsMethod2.forEach((card) => {
    const imgElement = card.querySelector(".tp-design-tile__image");
    const imageUrl = imgElement
      ? imgElement.getAttribute("src")
      : "No Image Found";

    // Corrected selector to grab the full title from the h2 element
    const titleElement = card.querySelector(".tp-design-tile__title");
    const title = titleElement
      ? titleElement.textContent.trim().replace("Sticker", "").trim()
      : "No Title Found";

    results.push({ imageUrl, title });
  });
}
  results.reverse();
  setExtractedData(results);
};


  const handleCopy = () => {
    if (extractedData.length === 0) {
      setCopyFeedback("No data to copy.");
      return;
    }

    const formattedText = extractedData
      .map(
        (item) =>
          `Image: ${item.imageUrl}\nTitle: ${item.title}\n--------------------\n`
      )
      .join("");

    navigator.clipboard
      .writeText(formattedText)
      .then(() => {
        setCopyFeedback("Copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        setCopyFeedback("Failed to copy.");
      });
  };

  return (
    <div style={{ display: "flex", maxWidth: "1200px", margin: " auto" }}>
      <div className="dark-theme-container">
        <div className="card">
          <h1 className="title">Teepublic Content Fetcher 🎨</h1>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="searchQuery">Search Keyword:</label>
              <input
                id="searchQuery"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="startPage">Start Page:</label>
              <input
                id="startPage"
                type="number"
                value={startPage}
                onChange={(e) => setStartPage(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="endPage">End Page:</label>
              <input
                id="endPage"
                type="number"
                value={endPage}
                onChange={(e) => setEndPage(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="submit-button"
            >
              {isLoading ? "Fetching..." : "Run"}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}

          {htmlResult && (
            <div className="results-container">
              <div className="results-header">
                <h3>Results:</h3>
                <button onClick={handleCopy2} className="copy-button">
                  <FaClipboard /> Copy
                </button>
              </div>
              <pre className="results-content">{htmlResult}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="main-container">
        <h1 className="title">Clean HTML Code Extractor</h1>

        {/* Input Section */}
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
    onClick={() => handleParseHtml(rawHtmlInput)}
    className="action-button"
>
    Extract Links & Titles
</button>
        </div>

        <hr style={{ margin: "30px 0", border: "1px solid #333" }} />

        {/* Output Section */}
        <div className="results-container">
          <h2
            style={{
              textAlign: "center",
              marginBottom: "15px",
              color: "#bb86fc",
            }}
          >
            Extracted Clean Data
          </h2>
          <p
            style={{ textAlign: "center", color: "#888", marginBottom: "20px" }}
          >
            Total Results: {extractedData.length}
          </p>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            disabled={extractedData.length === 0}
            className="copy-button"
          >
            Copy Results
          </button>
          {copyFeedback && (
            <span className="copy-feedback">{copyFeedback}</span>
          )}

          {/* Extracted Data List */}
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
                No data extracted yet. Please click the button to process the
                code.
              </p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClienLinks;
