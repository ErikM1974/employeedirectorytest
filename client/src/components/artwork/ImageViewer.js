import React, { useState } from 'react';
import './ImageViewer.css';

const ImageViewer = ({ filePath }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    if (!filePath) return null;

    // Get the raw path string
    const getRawPath = () => {
        if (typeof filePath === 'string') return filePath;
        if (typeof filePath === 'object' && filePath !== null && typeof filePath.path === 'string') {
            return filePath.path;
        }
        return '';
    };

    // Clean up the path
    const rawPath = getRawPath();
    const cleanPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
    const imageUrl = cleanPath ? `/api/artwork/file/${encodeURIComponent(cleanPath)}` : '';
    
    // Extract filename from path
    const getFileName = (path) => {
        if (typeof path !== 'string' || !path) return '';
        const parts = path.split('/');
        return parts[parts.length - 1] || '';
    };

    // Get file type from filename
    const getFileType = (filename) => {
        if (!filename) return 'unknown';
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        switch (ext) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return 'image';
            case 'pdf':
                return 'pdf';
            default:
                return 'unknown';
        }
    };

    // For downloading or opening the file
    const handleFileAction = (e, newTab = false) => {
        e.stopPropagation(); // Prevent triggering fullscreen
        if (imageUrl) {
            window.open(imageUrl, newTab ? '_blank' : '_self');
        }
    };

    // Toggle fullscreen preview (only for images)
    const toggleFullscreen = () => {
        if (!loading && !error && getFileType(rawPath) === 'image') {
            setIsFullscreen(!isFullscreen);
        }
    };

    const filename = getFileName(rawPath);
    const fileType = getFileType(rawPath);

    // Render PDF preview
    if (fileType === 'pdf') {
        return (
            <div className="image-viewer">
                <div className="image-container">
                    <div className="pdf-preview">
                        <div className="pdf-icon">📄</div>
                        <div className="pdf-filename">{filename}</div>
                        <div className="pdf-actions">
                            <button 
                                className="pdf-button"
                                onClick={(e) => handleFileAction(e, true)}
                            >
                                Open PDF
                            </button>
                            <button 
                                className="pdf-button"
                                onClick={(e) => handleFileAction(e, false)}
                            >
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render image preview
    return (
        <div className="image-viewer">
            <div 
                className={`image-container ${loading ? 'loading' : ''} ${error ? 'error' : ''}`}
                onClick={toggleFullscreen}
            >
                <img 
                    src={imageUrl}
                    alt={filename}
                    onLoad={() => {
                        console.log('Image loaded successfully:', rawPath);
                        setLoading(false);
                        setError(false);
                    }}
                    onError={(e) => {
                        console.error('Error loading image:', rawPath);
                        setLoading(false);
                        setError(true);
                    }}
                    style={{ display: loading || error ? 'none' : 'block' }}
                />
                {loading && (
                    <div className="loading-placeholder">
                        <div className="loading-spinner"></div>
                        <div>Loading {filename}</div>
                    </div>
                )}
                {error && (
                    <div className="error-placeholder">
                        <div className="error-icon">!</div>
                        <div>Failed to Load File</div>
                        <div className="error-details">
                            <div className="filename">{filename}</div>
                            <div className="file-type">
                                {fileType === 'image' ? 'Image File' : 
                                 fileType === 'pdf' ? 'PDF Document' : 
                                 'File'}
                            </div>
                            <div className="error-actions">
                                <button 
                                    onClick={(e) => handleFileAction(e, true)}
                                    className="retry-button"
                                >
                                    Open in new tab
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLoading(true);
                                        setError(false);
                                        // Force reload the image
                                        const img = document.createElement('img');
                                        img.src = `${imageUrl}?t=${Date.now()}`;
                                        img.onload = () => {
                                            setLoading(false);
                                            // Update the displayed image
                                            const displayedImg = document.querySelector(`img[src^="${imageUrl}"]`);
                                            if (displayedImg) {
                                                displayedImg.src = img.src;
                                            }
                                        };
                                        img.onerror = () => {
                                            setLoading(false);
                                            setError(true);
                                        };
                                    }}
                                    className="retry-button"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {!error && (
                <div className="image-footer">
                    <button 
                        onClick={(e) => handleFileAction(e, false)} 
                        className="download-button"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : `Download ${filename}`}
                    </button>
                </div>
            )}

            {isFullscreen && (
                <div className="fullscreen-preview" onClick={() => setIsFullscreen(false)}>
                    <img 
                        src={imageUrl} 
                        alt={filename}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                    />
                </div>
            )}
        </div>
    );
};

export default ImageViewer;
