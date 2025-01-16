import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ArtworkDashboard.css';

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

  // Fetch artwork data
  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const response = await axios.get('/api/artwork');
        setArtworks(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching artwork:', err);
        setError('Failed to load artwork data');
        setLoading(false);
      }
    };

    fetchArtwork();
  }, []);

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
      console.error('Error updating status:', error);
      setArtworks(original);
      toast.error('Failed to update status. Please try again.');
    }
  };

  // Group artworks by status
  const groupedArtworks = STATUS_COLUMNS.reduce((acc, status) => {
    acc[status] = artworks.filter(art => art.Status === status);
    return acc;
  }, {});

  if (loading) return <div className="loading">Loading artwork...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="artwork-dashboard">
      <ToastContainer />
      <h1>Artwork Dashboard</h1>
      
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
                    {groupedArtworks[status].map((artwork, index) => (
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
                            <div className="artwork-image">
                              {artwork.File_Upload_One ? (
                                <img 
                                  src={`/api/artwork/${artwork.ID_Design}/image?v=${imageVersion}`}
                                  alt={`Design for ${artwork.CompanyName}`}
                                  onError={(e) => {
                                    e.target.classList.add('error');
                                    e.target.parentElement.classList.add('no-image');
                                  }}
                                />
                              ) : (
                                <div className="no-image">No Image</div>
                              )}
                            </div>
                            <div className="artwork-details">
                              <h3>{artwork.CompanyName}</h3>
                              <p>Due: {new Date(artwork.Due_Date).toLocaleDateString()}</p>
                              <p>ID: #{artwork.ID_Design}</p>
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
