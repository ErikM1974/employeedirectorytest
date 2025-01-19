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
    'Awaiting Approval': 'Artwork is awaiting review',
    'Completed': 'Artwork has been approved'
};

const ArtworkDashboard = () => {
    const [artworkRequests, setArtworkRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isSearching, setIsSearching] = useState(false);

    // Handle initial load
    useEffect(() => {
        fetchArtworkRequests(currentPage);
    }, [currentPage]);

    // Debounce search term
    useEffect(() => {
        setIsSearching(true);
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500); // Wait 500ms after last keystroke

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch when debounced search changes
    useEffect(() => {
        fetchArtworkRequests(1); // Reset to first page when search changes
    }, [debouncedSearch, statusFilter]);

    const fetchArtworkRequests = async (page) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString()
            });

            if (debouncedSearch) {
                // Try to parse as number for ID_Design search
                const trimmedSearch = debouncedSearch.trim();
                const isNumber = !isNaN(trimmedSearch) && trimmedSearch !== '';
                if (isNumber) {
                    params.append('search', trimmedSearch); // Server will handle ID_Design formatting
                } else {
                    params.append('search', trimmedSearch); // Server will handle LIKE query formatting
                }
            }
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            const response = await axios.get(`/api/artwork/requests?${params}`);
            setArtworkRequests(response.data);
            // Calculate total pages based on 200 total records and 20 per page
            setTotalPages(10); // 200/20 = 10 pages
            setError(null);
        } catch (err) {
            console.error('Error fetching artwork requests:', err);
            setError('Failed to load artwork requests');
        } finally {
            setLoading(false);
            setIsSearching(false); // Reset searching state after request completes
        }
    };


    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleStatusChange = async (requestId, newStatus) => {
        try {
            console.log('Updating status:', { requestId, newStatus });
            const response = await axios.put(`/api/artwork/status/${requestId}`, { status: newStatus });
            
            if (response.data.success) {
                // Refresh the current page to show updated status
                await fetchArtworkRequests(currentPage);
            } else {
                console.error('Status update failed:', response.data);
                alert(response.data.error || 'Failed to update status. Please try again.');
            }
        } catch (err) {
            console.error('Error updating status:', {
                error: err.message,
                response: err.response?.data,
                details: err.response?.data?.details
            });
            
            const errorMessage = err.response?.data?.error 
                ? `${err.response.data.error}\n\nDetails: ${JSON.stringify(err.response.data.details, null, 2)}`
                : 'Failed to update status. Please try again.';
            
            alert(errorMessage);
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

    // No need to filter locally since server handles it
    const filteredRequests = artworkRequests;

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
                <div className="header-top">
                    <h1>Artwork Requests</h1>
                    <div className="filters">
                        <input
                            type="text"
                            placeholder="Search by company name or design ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`search-input ${isSearching ? 'searching' : ''}`}
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="status-filter"
                        >
                            <option value="all">All Status</option>
                            <option value="Awaiting Approval">Awaiting Approval</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                </div>
                <div className="pagination-controls top">
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
                                value={request.Status || 'Awaiting Approval'} 
                                onChange={(e) => handleStatusChange(request.ID_Design, e.target.value)}
                                className={`status-select ${request.Status?.replace(/\s+/g, '-').toLowerCase() || 'awaiting-approval'}`}
                                data-tooltip="Update artwork status"
                            >
                                <option value="Awaiting Approval">Awaiting Approval</option>
                                <option value="Completed">Completed</option>
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

            <div className="pagination-controls bottom">
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
