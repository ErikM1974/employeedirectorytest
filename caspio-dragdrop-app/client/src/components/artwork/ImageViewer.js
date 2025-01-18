import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './ImageViewer.css';

const Modal = ({ show, onClose, children }) => {
    if (!show) return null;

    return ReactDOM.createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body
    );
};

const ImageViewer = ({ filePath }) => {
    const [showModal, setShowModal] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Get file info
    const path = typeof filePath === 'string' ? filePath : filePath?.path || '';
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const fileUrl = cleanPath ? `/api/artwork/file/${encodeURIComponent(cleanPath)}` : '';
    const fileName = path.split('/').pop() || '';
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
    
    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showModal]);

    if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
        return null;
    }

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    const openModal = (e) => {
        e.stopPropagation();
        setShowModal(true);
        setImageLoaded(false);
    };

    const closeModal = (e) => {
        if (e) e.stopPropagation();
        setShowModal(false);
        setImageLoaded(false);
    };

    return (
        <div className="viewer">
            {/* Thumbnail */}
            <div className="thumbnail" onClick={openModal}>
                <img 
                    src={fileUrl} 
                    alt={fileName}
                    className="thumb-img"
                />
            </div>

            {/* Modal */}
            <Modal show={showModal} onClose={closeModal}>
                {!imageLoaded && (
                    <div className="loading">Loading...</div>
                )}
                <img 
                    src={fileUrl} 
                    alt={fileName}
                    className={`modal-img ${imageLoaded ? 'loaded' : ''}`}
                    onLoad={handleImageLoad}
                />
                <button 
                    className="close-btn"
                    onClick={closeModal}
                    aria-label="Close"
                >
                    ×
                </button>
            </Modal>
        </div>
    );
};

export default ImageViewer;
