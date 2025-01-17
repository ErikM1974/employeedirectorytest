import React, { useState } from 'react';
import './ImageViewer.css';

const ImageViewer = ({ filePath }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    if (!filePath) return null;

    const { path, exists, metadata } = filePath;
    
    // Use external key for file access
    const imageUrl = metadata?.externalKey 
        ? `/api/artwork/file/${encodeURIComponent(metadata.externalKey)}`
        : null;

    // Format file info
    const getFileInfo = () => {
        if (!metadata) return null;
        const size = Math.round(metadata.size / 1024);
        const date = new Date(metadata.dateCreated).toLocaleDateString();
        const type = metadata.contentType.split('/')[1].toUpperCase();
        return `${size} KB • ${type} • ${date}`;
    };

    // For downloading the file
    const handleDownload = (e) => {
        e.stopPropagation(); // Prevent triggering fullscreen
        if (imageUrl) {
            window.open(imageUrl, '_blank');
        }
    };

    // Toggle fullscreen preview
    const toggleFullscreen = () => {
        if (exists && imageUrl && !loading && !error) {
            setIsFullscreen(!isFullscreen);
        }
    };

    return (
        <div className="image-viewer">
            <div 
                className={`image-container ${loading ? 'loading' : ''} ${error ? 'error' : ''}`}
                onClick={toggleFullscreen}
            >
                {!exists ? (
                    <div className="error-placeholder">
                        <div className="error-icon">!</div>
                        <div>File not found in Caspio</div>
                        <div className="error-details">
                            <div className="filename">{path}</div>
                        </div>
                    </div>
                ) : !imageUrl ? (
                    <div className="error-placeholder">
                        <div className="error-icon">!</div>
                        <div>Missing file metadata</div>
                        <div className="error-details">
                            <div className="filename">{path}</div>
                        </div>
                    </div>
                ) : (
                    <>
                        <img 
                            src={imageUrl}
                            alt={path}
                            onLoad={() => {
                                console.log('Image loaded successfully:', path);
                                setLoading(false);
                                setError(false);
                            }}
                            onError={(e) => {
                                console.error('Error loading image:', path);
                                setLoading(false);
                                setError(true);
                            }}
                            style={{ display: loading || error ? 'none' : 'block' }}
                        />
                        {loading && (
                            <div className="loading-placeholder">
                                <div className="loading-spinner"></div>
                                <div>Loading {path}</div>
                                {metadata && <div className="file-info">{getFileInfo()}</div>}
                            </div>
                        )}
                        {error && (
                            <div className="error-placeholder">
                                <div className="error-icon">!</div>
                                <div>Failed to load image</div>
                                <div className="error-details">
                                    <div className="filename">{path}</div>
                                    {metadata && <div className="file-info">{getFileInfo()}</div>}
                                    <div className="error-actions">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(imageUrl, '_blank');
                                            }}
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
                    </>
                )}
            </div>
            
            {exists && imageUrl && !error && (
                <div className="image-footer">
                    {metadata && <div className="file-info">{getFileInfo()}</div>}
                    <button 
                        onClick={handleDownload} 
                        className="download-button"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : `Download ${path}`}
                    </button>
                </div>
            )}

            {isFullscreen && (
                <div className="fullscreen-preview" onClick={() => setIsFullscreen(false)}>
                    <img 
                        src={imageUrl} 
                        alt={path}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                    />
                </div>
            )}
        </div>
    );
};

export default ImageViewer;
