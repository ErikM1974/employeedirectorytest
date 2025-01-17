import React from 'react';
import './ImageViewer.css';

const ImageViewer = ({ artwork, imageField, onClose }) => {
    if (!artwork || !artwork[imageField]) return null;

    const baseUrl = process.env.NODE_ENV === 'production' 
        ? '' 
        : 'http://localhost:3001';

    const fieldNumber = imageField.replace('File_Upload_', '');
    const imageUrl = `${baseUrl}/api/artwork/${artwork.ID_Design}/image/${fieldNumber}`;
    const filename = artwork[imageField].split('/').pop();
    const fileType = artwork[imageField].split('.').pop().toUpperCase();

    return (
        <div className="image-viewer-overlay" onClick={onClose}>
            <div className="image-viewer-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={onClose}>&times;</button>
            <div className="image-wrapper">
                <img 
                    src={imageUrl}
                    alt={`${artwork.CompanyName} - ${imageField}`}
                    onError={(e) => {
                        console.error('Image load error:', imageField);
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('error');
                    }}
                />
            </div>
            <div className="image-info">
                <div className="info-header">
                    <h3>{artwork.CompanyName}</h3>
                    <span className="file-type">{fileType}</span>
                </div>
                <p className="design-id">Design ID: #{artwork.ID_Design}</p>
                <p className="file-name">{filename}</p>
            </div>
            </div>
        </div>
    );
};

export default ImageViewer;
