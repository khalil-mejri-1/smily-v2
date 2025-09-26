import React, { useState } from 'react';
import axios from 'axios';
import { FaClipboard } from 'react-icons/fa'; // Make sure to install react-icons: npm install react-icons

const Url = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [htmlResult, setHtmlResult] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setHtmlResult('');
    setError('');

    try {
      const response = await axios.post('http://localhost:3002/run-python-script', {
        searchQuery,
        startPage: parseInt(startPage),
        endPage: parseInt(endPage),
      });

      setHtmlResult(response.data.output);
    } catch (err) {
      console.error('Error occurred:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.error || 'An error occurred while connecting to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlResult);
    alert('Results copied to clipboard!');
  };

  return (
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
          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? 'Fetching...' : 'Run'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {htmlResult && (
          <div className="results-container">
            <div className="results-header">
              <h3>Results:</h3>
              <button onClick={handleCopy} className="copy-button">
                <FaClipboard /> Copy
              </button>
            </div>
            <pre className="results-content">{htmlResult}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Url;