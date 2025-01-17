import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ArtworkDashboard.css';
import ImageViewer from './ImageViewer';

// Define the status columns
const STATUS_COLUMNS = ['In Progress', 'Awaiting Approval', 'Completed'];

// Status colors
const STATUS_COLORS = {
  'In Progress': '#0d6efd',
  'Awaiting Approval': '#ffc107',
  'Completed': '#198754'
};

const ArtworkDashboard = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageVersion, setImageVersion] = useState(Date.now());
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  
  // Search states
  const [searchParams, setSearchParams] = useState({
    company: '',
    status: '',
    rep: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'ID_Design',
    sortDir: 'desc'
  });

  // Status options
  const STATUS_OPTIONS = ['In Progress', 'Awaiting Approval', 'Completed'];
  
  // Sort options
  const SORT_OPTIONS = [
    { value: 'ID_Design', label: 'Design ID' },
    { value: 'CompanyName', label: 'Company Name' },
    { value: 'Status', label: 'Status' },
    { value: 'Date_Created', label: 'Date Created' },
    { value: 'Due_Date', label: 'Due Date' },
    { value: 'User_Email', label: 'User Email' }
  ];

  // Handle search parameter changes
  const handleSearchChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear search filters
  const clearSearch = () => {
    setSearchParams({
      company: '',
      status: '',
      rep: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'ID_Design',
      sortDir: 'desc'
    });
  };

  // Fetch artwork data with search parameters
  const fetchArtwork = async () => {
    try {
      setLoading(true);
      setError(null);
      const baseUrl = process.env.NODE_ENV === 'production'
        ? '/api/artwork'
        : 'http://localhost:3001/api/artwork';

      // Build query string from search parameters
      const params = new URLSearchParams();
      if (searchParams.company) params.append('company', searchParams.company);
      if (searchParams.status) params.append('status', searchParams.status);
      if (searchParams.rep) params.append('rep', searchParams.rep);
      if (searchParams.dateFrom) params.append('dateFrom', searchParams.dateFrom);
      if (searchParams.dateTo) params.append('dateTo', searchParams.dateTo);
      params.append('sortBy', searchParams.sortBy);
      params.append('sortDir', searchParams.sortDir);

      const response = await axios.get(`${baseUrl}?${params.toString()}`);
      console.log('Artwork response:', response.data); // Debug log
      if (response.data && Array.isArray(response.data.Result)) {
        // Transform the data to set default status if empty
        const transformedArtworks = response.data.Result.map(artwork => ({
          ...artwork,
          Status: artwork.Status || 'In Progress' // Set default status if empty
        }));
        setArtworks(transformedArtworks);
      } else {
        console.error('Invalid response format:', response.data);
        setError('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching artwork:', err.response?.data || err.message);
      setError(err.response?.data?.error || err.response?.data?.Message || 'Failed to load artwork data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when search parameters change
  useEffect(() => {
    fetchArtwork();
  }, [searchParams]); // Re-fetch when any search parameter changes

  // Handle drag end
  const onDragEnd = async (result) => {
    const { draggableId, destination, source } = result;
    
    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    const newStatus = destination.droppableId;
    const original = [...artworks];

    try {
      // Optimistic update
      const updated = artworks.map((art) => {
        if (art.ID_Design.toString() === draggableId) {
          return { ...art, Status: newStatus };
        }
        return art;
      });
      setArtworks(updated);

      // Make API call
      const baseUrl = process.env.NODE_ENV === 'production'
        ? `/api/artwork/${draggableId}`
        : `http://localhost:3001/api/artwork/${draggableId}`;

      await axios.put(baseUrl, {
        Status: newStatus
      });

      // Show success message
      toast.success(`Artwork moved to ${newStatus}`);
      
      // Refresh data
      await fetchArtwork();
    } catch (error) {
      console.error('Error updating status:', error.response?.data || error.message);
      setArtworks(original);
      toast.error(error.response?.data?.error || 'Failed to update status. Please try again.');
    }
  };

  // Group artworks by status
  const groupedArtworks = STATUS_COLUMNS.reduce((acc, status) => {
    acc[status] = artworks.filter(art => art.Status === status) || [];
    return acc;
  }, {});

  if (loading) return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Loading artwork...</p>
    </div>
  );
  
  if (error) return (
    <div className="error">
      <h3>Error</h3>
      <p>{error}</p>
      <button onClick={fetchArtwork} className="retry-button">
        Retry
      </button>
    </div>
  );

  return (
    <div className="artwork-dashboard">
      <ToastContainer />
      {selectedImage && selectedArtwork && (
        <ImageViewer
          artwork={selectedArtwork}
          imageField={selectedImage}
          onClose={() => {
            setSelectedImage(null);
            setSelectedArtwork(null);
          }}
        />
      )}
      <h1>Artwork Dashboard</h1>
      <div className="dashboard-controls">
        <form className="search-form" onSubmit={(e) => { e.preventDefault(); fetchArtwork(); }}>
          <div className="search-group">
            <label>Company Name</label>
            <input
              type="text"
              className="search-input"
              value={searchParams.company}
              onChange={(e) => handleSearchChange('company', e.target.value)}
              placeholder="Search company..."
            />
          </div>

          <div className="search-group">
            <label>Status</label>
            <select
              className="search-input"
              value={searchParams.status}
              onChange={(e) => handleSearchChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="search-group">
            <label>User Email</label>
            <input
              type="email"
              className="search-input"
              value={searchParams.rep}
              onChange={(e) => handleSearchChange('rep', e.target.value)}
              placeholder="Search by email..."
            />
          </div>

          <div className="search-group">
            <label>Date From</label>
            <input
              type="date"
              className="search-input"
              value={searchParams.dateFrom}
              onChange={(e) => handleSearchChange('dateFrom', e.target.value)}
            />
          </div>

          <div className="search-group">
            <label>Date To</label>
            <input
              type="date"
              className="search-input"
              value={searchParams.dateTo}
              onChange={(e) => handleSearchChange('dateTo', e.target.value)}
            />
          </div>

          <div className="search-group">
            <label>Sort By</label>
            <div className="sort-controls">
              <select
                className="search-input"
                value={searchParams.sortBy}
                onChange={(e) => handleSearchChange('sortBy', e.target.value)}
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                className="search-input"
                value={searchParams.sortDir}
                onChange={(e) => handleSearchChange('sortDir', e.target.value)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          <div className="search-buttons">
            <button type="button" className="search-button secondary" onClick={clearSearch}>
              Clear
            </button>
            <button type="submit" className="search-button primary">
              Search
            </button>
          </div>
        </form>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="artwork-columns">
          {STATUS_COLUMNS.map(status => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="artwork-column"
                >
                  <h2 style={{ color: STATUS_COLORS[status] }}>{status}</h2>
                  <div className="artwork-list">
                    {(groupedArtworks[status] || []).map((artwork, index) => (
                      <Draggable
                        key={artwork.ID_Design}
                        draggableId={artwork.ID_Design.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`artwork-card ${snapshot.isDragging ? 'dragging' : ''}`}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1
                            }}
                          >
                            <div className="artwork-images">
                              {['One', 'Two', 'Three', 'Four'].map((field) => {
                                const fieldName = `File_Upload_${field}`;
                                return artwork[fieldName] ? (
                                  <div 
                                    key={field} 
                                    className="artwork-image"
                                    onClick={() => {
                                      setSelectedImage(fieldName);
                                      setSelectedArtwork(artwork);
                                    }}
                                  >
                                    <img 
                                      src={`${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'}/api/artwork/${artwork.ID_Design}/image/${field}?v=${Date.now()}`}
                                      alt={`Design ${field} for ${artwork.CompanyName}`}
                                      onError={(e) => {
                                        console.error(`Image ${field} load error for ID:`, artwork.ID_Design);
                                        console.error('File path:', artwork[fieldName]);
                                        e.target.classList.add('error');
                                        e.target.parentElement.classList.add('no-image');
                                      }}
                                      style={{ maxHeight: '120px', objectFit: 'contain', cursor: 'pointer' }}
                                    />
                                    <div className="file-path">{artwork[fieldName]}</div>
                                  </div>
                                ) : null;
                              })}
                              {!artwork.File_Upload_One && 
                               !artwork.File_Upload_Two && 
                               !artwork.File_Upload_Three && 
                               !artwork.File_Upload_Four && (
                                <div className="no-image">No Images</div>
                              )}
                            </div>
                            <div className="artwork-details">
                              <h3>{artwork.CompanyName}</h3>
                              <p>Due: {artwork.Due_Date ? new Date(artwork.Due_Date).toLocaleDateString() : 'Not set'}</p>
                              <p>Design ID: #{artwork.ID_Design}</p>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default ArtworkDashboard;
