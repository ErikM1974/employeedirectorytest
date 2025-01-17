import React from 'react';
import './ImageViewer.css';

const ImageViewer = ({ artwork, imageField, onClose }) => {
    if (!artwork || !artwork[imageField]) return null;

    const baseUrl = process.env.NODE_ENV === 'production' 
        ? '' 
        : 'http://localhost:3001';

    const fieldNumber = imageField.replace('File_Upload_', '');
    const imageUrl = `${baseUrl}/api/artwork/${artwork.ID_Design}/image/${fieldNumber}?v=${Date.now()}`;

    return (
        <div className="image-viewer-overlay" onClick={onClose}>
            <div className="image-viewer-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>&times;</button>
                <img 
                    src={imageUrl}
                    alt={`${artwork.CompanyName} - ${imageField}`}
                    onError={(e) => {
                        console.error('Image load error:', imageField);
                        e.target.classList.add('error');
                    }}
                />
                <div className="image-info">
                    <h3>{artwork.CompanyName}</h3>
                    <p>Design ID: #{artwork.ID_Design}</p>
                    <p>File: {artwork[imageField]}</p>
                </div>
            </div>
        </div>
    );
};

export default ImageViewer;
