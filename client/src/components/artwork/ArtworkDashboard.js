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

const ArtworkDashboard = () => {
    const [artworkRequests, setArtworkRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchArtworkRequests();
    }, []);

    const fetchArtworkRequests = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/artwork/requests');
            setArtworkRequests(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching artwork requests:', err);
            setError('Failed to load artwork requests');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (requestId, newStatus) => {
        try {
            await axios.put(`/api/artwork/status/${requestId}`, { status: newStatus });
            // Refresh the list after status update
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

    // Filter and search logic
    const filteredRequests = artworkRequests.filter(request => {
        const matchesSearch = searchTerm === '' || 
            request.CompanyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.ID_Design?.toString().includes(searchTerm) ||
            FILE_FIELDS.some(field => 
                request[field.key]?.path?.toLowerCase().includes(searchTerm.toLowerCase())
            );

        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'pending' && !request.Status) ||
            (request.Status?.toLowerCase() === statusFilter);

        return matchesSearch && matchesStatus;
    });

    // Count files with issues
    const getMissingFilesCount = () => {
        return artworkRequests.reduce((count, request) => {
            return count + FILE_FIELDS.reduce((fieldCount, field) => {
                return fieldCount + (request[field.key] && !request[field.key].exists ? 1 : 0);
            }, 0);
        }, 0);
    };

    if (loading) return <div className="loading">Loading artwork requests...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="artwork-dashboard">
            <div className="dashboard-header">
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

            <div className="artwork-stats">
                <div className="stat-item">
                    <span className="stat-label">Total Requests:</span>
                    <span className="stat-value">{artworkRequests.length}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Filtered:</span>
                    <span className="stat-value">{filteredRequests.length}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Missing Files:</span>
                    <span className="stat-value">{getMissingFilesCount()}</span>
                </div>
            </div>

            <div className="artwork-grid">
                {filteredRequests.map(request => (
                    <div key={request.ID_Design} className="artwork-card">
                        <div className="artwork-header">
                            <h3>{request.CompanyName}</h3>
                            <span className={`status ${request.Status?.toLowerCase().replace(/\s+/g, '-') || 'pending'}`}>
                                {request.Status || 'Pending'}
                            </span>
                        </div>

                        {/* Files Display */}
                        <div className="artwork-files">
                            {FILE_FIELDS.map(field => 
                                request[field.key] ? (
                                    <div key={field.key} className="artwork-file">
                                        <div className="file-header">
                                            <span className="file-label">{field.label}</span>
                                            {request[field.key].exists ? (
                                                <span className="file-status success">Found</span>
                                            ) : (
                                                <span className="file-status error">Missing</span>
                                            )}
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
                <div className="no-results">
                    No artwork requests found matching your criteria
                </div>
            )}
        </div>
    );
};

export default ArtworkDashboard;
