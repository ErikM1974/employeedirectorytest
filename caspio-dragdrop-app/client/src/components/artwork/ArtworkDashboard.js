import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ImageViewer from './ImageViewer';
import './ArtworkDashboard.css';

const FILE_FIELDS = [
    { key: 'File_Upload_One', label: 'File 1' },
    { key: 'File_Upload_Two', label: 'File 2' },
    { key: 'File_Upload_Three', label: 'File 3' },
    { key: 'File_Upload_Four', label: 'File 4' }
];

const STATUS_TOOLTIPS = {
    pending: 'Artwork is awaiting review',
    'in progress': 'Artwork is being processed',
    completed: 'Artwork has been approved',
    rejected: 'Artwork needs revision'
};

const ArtworkDashboard = () => {
    const [artworkRequests, setArtworkRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchArtworkRequests(currentPage);
    }, [currentPage]);

    const fetchArtworkRequests = async (page) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/artwork/requests?page=${page}`);
            setArtworkRequests(response.data);
            // Calculate total pages based on 200 total records and 20 per page
            setTotalPages(10); // 200/20 = 10 pages
            setError(null);
        } catch (err) {
            console.error('Error fetching artwork requests:', err);
            setError('Failed to load artwork requests');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleStatusChange = async (requestId, newStatus) => {
        try {
            await axios.put(`/api/artwork/status/${requestId}`, { status: newStatus });
            fetchArtworkRequests();
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getFileName = (filePath) => {
        if (typeof filePath !== 'string') return '';
        const parts = filePath.split('/');
        return parts[parts.length - 1] || '';
    };

    const filteredRequests = artworkRequests.filter(request => {
        const matchesSearch = searchTerm === '' || 
            request.CompanyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.ID_Design?.toString().includes(searchTerm) ||
            FILE_FIELDS.some(field => 
                request[field.key]?.toLowerCase().includes(searchTerm.toLowerCase())
            );

        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'pending' && !request.Status) ||
            (request.Status?.toLowerCase() === statusFilter);

        return matchesSearch && matchesStatus;
    });

    if (loading) return (
        <div className="loading loading-shimmer">
            Loading artwork requests...
        </div>
    );
    
    if (error) return (
        <div className="error">
            <div className="error-icon">!</div>
            {error}
        </div>
    );

    return (
        <div className="artwork-dashboard">
            <div className="dashboard-header hover-lift">
                <h1>Artwork Requests</h1>
                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search by company, ID, or filename..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="status-filter"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="artwork-grid">
                {filteredRequests.map(request => (
                    <div key={request.ID_Design} className="artwork-card hover-lift">
                        <div className="artwork-header">
                            <h3>{request.CompanyName}</h3>
                            <span 
                                className={`status status-glow ${request.Status?.toLowerCase().replace(/\s+/g, '-') || 'pending'}`}
                                data-tooltip={STATUS_TOOLTIPS[request.Status?.toLowerCase() || 'pending']}
                            >
                                {request.Status || 'Pending'}
                            </span>
                        </div>

                        <div className="artwork-files">
                            {FILE_FIELDS.map(field => 
                                request[field.key] ? (
                                    <div key={field.key} className="artwork-file hover-lift">
                                        <div className="file-header">
                                            <span className="file-label">{field.label}</span>
                                            <span className="file-name" data-tooltip={getFileName(request[field.key])}>
                                                {getFileName(request[field.key])}
                                            </span>
                                        </div>
                                        <ImageViewer filePath={request[field.key]} />
                                    </div>
                                ) : null
                            )}
                        </div>

                        <div className="artwork-details">
                            <p><strong>Design ID:</strong> {request.ID_Design}</p>
                            {request.Due_Date && (
                                <p><strong>Due Date:</strong> {formatDate(request.Due_Date)}</p>
                            )}
                            {request.Notes && (
                                <p><strong>Notes:</strong> {request.Notes}</p>
                            )}
                        </div>

                        <div className="artwork-actions">
                            <select 
                                value={request.Status || ''} 
                                onChange={(e) => handleStatusChange(request.ID_Design, e.target.value)}
                                className={`status-select ${request.Status?.toLowerCase().replace(/\s+/g, '-') || 'pending'}`}
                                data-tooltip="Update artwork status"
                            >
                                <option value="">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            {filteredRequests.length === 0 && (
                <div className="no-results hover-lift">
                    No artwork requests found matching your criteria
                </div>
            )}

            <div className="pagination-controls">
                <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-button"
                >
                    Previous
                </button>
                <span className="page-info">
                    Page {currentPage} of {totalPages}
                </span>
                <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default ArtworkDashboard;
