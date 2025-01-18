import React, { useState } from 'react';
import './ImageViewer.css';

const ImageViewer = ({ filePath }) => {
    const [showPreview, setShowPreview] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Get file info
    const path = typeof filePath === 'string' ? filePath : filePath?.path || '';
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const fileUrl = cleanPath ? `/api/artwork/file/${encodeURIComponent(cleanPath)}` : '';
    const fileName = path.split('/').pop() || '';
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
    
    const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExt);

    const handlePreview = () => {
        if (!showPreview) {
            setImageLoaded(false);
            setShowPreview(true);
            document.body.style.overflow = 'hidden';
        }
    };

    const handleClose = () => {
        setShowPreview(false);
        document.body.style.overflow = 'auto';
    };

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    return (
        <div className="image-preview">
            {/* Thumbnail */}
            <div className="preview-thumb" onClick={handlePreview}>
                {isImage && (
                    <img 
                        src={fileUrl} 
                        alt={fileName} 
                        className="thumb-img"
                    />
                )}
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="preview-modal" onClick={handleClose}>
                    <div className="preview-content" onClick={e => e.stopPropagation()}>
                        {!imageLoaded && (
                            <div className="loading">Loading...</div>
                        )}
                        <img 
                            src={fileUrl} 
                            alt={fileName} 
                            onLoad={handleImageLoad}
                            className={imageLoaded ? 'loaded' : ''}
                        />
                        <button 
                            className="preview-close" 
                            onClick={handleClose}
                            aria-label="Close preview"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageViewer;
