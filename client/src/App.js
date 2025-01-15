import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Define the departments for the columns
const DEPARTMENTS = [
  'Sales',
  'Accounting',
  'Production',
  'Administrative',
  'Direct To Garment',
  'Art Department',
  'Cap Department'
];

// Department colors
const DEPARTMENT_COLORS = {
  'Sales': '#4CAF50',
  'Accounting': '#2196F3',
  'Production': '#FF9800',
  'Administrative': '#9C27B0',
  'Direct To Garment': '#F44336',
  'Art Department': '#009688',
  'Cap Department': '#673AB7'
};

function App() {
  const [employees, setEmployees] = useState([]);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeDept, setNewEmployeeDept] = useState(DEPARTMENTS[0]);
  const [newEmployeeStartDate, setNewEmployeeStartDate] = useState('');
  const [newEmployeeImage, setNewEmployeeImage] = useState(null);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editName, setEditName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');

  // Image preview modal state
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewEmployee, setPreviewEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
    // Add CSS to body
    document.body.style.backgroundColor = '#f5f5f5';
    document.body.style.margin = 0;
    document.body.style.padding = 0;
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  }, []);

  async function fetchEmployees() {
    try {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/employees'
        : 'http://localhost:3001/api/employees';
      const { data } = await axios.get(apiUrl);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error.message);
    }
  }

  async function createEmployee() {
    if (!newEmployeeName) return;
    try {
      // First create the employee
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/employees'
        : 'http://localhost:3001/api/employees';
      const response = await axios.post(apiUrl, {
        EmployeeName: newEmployeeName,
        Department: newEmployeeDept,
        StartDate: newEmployeeStartDate || null
      });

      // If there's an image and we got a valid response
      if (newEmployeeImage && response.data && response.data.Result) {
        const formData = new FormData();
        formData.append('image', newEmployeeImage);
        
        // Get the ID from the response
        const employeeId = response.data.Result[0]?.ID_Employee;
        
        if (employeeId) {
          try {
            const apiUrl = process.env.NODE_ENV === 'production'
              ? `/api/employees/${employeeId}/image`
              : `http://localhost:3001/api/employees/${employeeId}/image`;
            await axios.post(
              apiUrl,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              }
            );
          } catch (imageError) {
            console.error('Error uploading image:', imageError);
            // Continue with form reset and refresh even if image upload fails
          }
        }
      }

      // Clear form
      setNewEmployeeName('');
      setNewEmployeeStartDate('');
      setNewEmployeeImage(null);
      // Clear file input if it exists
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      fetchEmployees();
    } catch (error) {
      console.error('Error creating employee:', error.message);
      if (error.response?.data?.error) {
        alert(`Failed to create employee: ${error.response.data.error}`);
      } else {
        alert('Failed to create employee. Please try again.');
      }
    }
  }

  const onDragEnd = async (result) => {
    const { draggableId, destination, source } = result;
    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    // Store the original state for rollback if needed
    const originalEmployees = [...employees];

    try {
      // Optimistically update the UI immediately
      const updatedEmployees = employees.map(emp => {
        if (emp.ID_Employee.toString() === draggableId) {
          return { ...emp, Department: destination.droppableId };
        }
        return emp;
      });
      setEmployees(updatedEmployees);

      // Make the API call
      const apiUrl = process.env.NODE_ENV === 'production'
        ? `/api/employees/${draggableId}`
        : `http://localhost:3001/api/employees/${draggableId}`;
      const response = await axios.put(apiUrl, {
        Department: destination.droppableId
      });

      // If the API call was successful but returned different data, update to match server
      if (response.data) {
        const serverUpdatedEmployees = employees.map(emp => {
          if (emp.ID_Employee.toString() === draggableId) {
            return { ...emp, ...response.data };
          }
          return emp;
        });
        setEmployees(serverUpdatedEmployees);
      }
    } catch (error) {
      console.error('Error updating department:', error.message);
      // Revert to the original state on error
      setEmployees(originalEmployees);
      // Show error message to user
      alert('Failed to update department. Please try again.');
    }
  };

  const employeesByDept = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = employees.filter(emp => emp.Department === dept);
    return acc;
  }, {});

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          color: '#1a73e8',
          fontSize: '2.5em',
          marginBottom: '40px',
          fontWeight: '600',
          letterSpacing: '-0.5px'
        }}>Employee Directory</h1>

        {/* Add new employee form */}
        <div style={{ 
          marginBottom: '40px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Employee Name"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e1e4e8',
                  fontSize: '15px',
                  width: '220px',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
              />
              <input
                type="date"
                value={newEmployeeStartDate}
                onChange={(e) => setNewEmployeeStartDate(e.target.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e1e4e8',
                  fontSize: '15px',
                  width: '160px',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
              />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewEmployeeImage(e.target.files[0])}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #e1e4e8',
                fontSize: '14px',
                width: '300px'
              }}
            />
          </div>
          <select
            value={newEmployeeDept}
            onChange={(e) => setNewEmployeeDept(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e1e4e8',
              fontSize: '15px',
              backgroundColor: 'white',
              transition: 'border-color 0.2s',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <button 
            onClick={createEmployee}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#1a73e8',
              color: 'white',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1976D2'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2196F3'}
          >
            Add Employee
          </button>
        </div>

        {/* DragDropContext */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            padding: '10px 0'
          }}>
            {DEPARTMENTS.map(dept => (
              <Droppable droppableId={dept} key={dept}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: `2px solid ${DEPARTMENT_COLORS[dept]}`,
                      minHeight: '400px',
                      transition: 'box-shadow 0.3s'
                    }}
                  >
                    <h2 style={{ 
                      margin: '0 0 20px 0',
                      padding: '12px 16px',
                      backgroundColor: DEPARTMENT_COLORS[dept],
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '1.1em',
                      fontWeight: '600',
                      textAlign: 'center',
                      letterSpacing: '0.5px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>{dept}</h2>
                    {employeesByDept[dept].map((emp, index) => (
                      <Draggable
                        key={emp.ID_Employee}
                        draggableId={emp.ID_Employee.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.dragHandleProps}
                            {...provided.draggableProps}
                            style={{
                              userSelect: 'none',
                              padding: '16px',
                              margin: '0 0 12px 0',
                              backgroundColor: snapshot.isDragging ? '#f8f9fa' : 'white',
                              border: '1px solid #eaecef',
                              borderRadius: '10px',
                              boxShadow: snapshot.isDragging 
                                ? '0 8px 16px rgba(0,0,0,0.1)' 
                                : '0 2px 4px rgba(0,0,0,0.05)',
                              transition: 'all 0.3s ease',
                              ...provided.draggableProps.style
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img 
                  src={`${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'}/api/employees/${emp.ID_Employee}/image`}
                                  alt=""
                                  style={{
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    backgroundColor: '#f8f9fa',
                                    cursor: 'pointer',
                                    border: '2px solid #fff',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewEmployee(emp);
                                    setImagePreviewOpen(true);
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                                <div>
                                  <div>{emp.EmployeeName}</div>
                                  {emp.StartDate && (
                                    <div style={{ 
                                      fontSize: '0.8em', 
                                      color: '#666',
                                      backgroundColor: '#f5f5f5',
                                      padding: '2px 6px',
                                      borderRadius: '3px',
                                      marginTop: '4px'
                                    }}>
                                      {new Date(emp.StartDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent drag start
                                    setEditingEmployee(emp);
                                    setEditName(emp.EmployeeName);
                                    setEditStartDate(emp.StartDate ? new Date(emp.StartDate).toISOString().split('T')[0] : '');
                                    setEditModalOpen(true);
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#f8f9fa',
                                    border: '1px solid #e1e4e8',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.85em',
                                    fontWeight: '500',
                                    color: '#444',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation(); // Prevent drag start
                                    if (window.confirm(`Are you sure you want to delete ${emp.EmployeeName}?`)) {
                                      try {
                        const apiUrl = process.env.NODE_ENV === 'production'
                          ? `/api/employees/${emp.ID_Employee}`
                          : `http://localhost:3001/api/employees/${emp.ID_Employee}`;
                        await axios.delete(apiUrl);
                                        fetchEmployees(); // Refresh the list
                                      } catch (error) {
                                        console.error('Error deleting employee:', error);
                                        alert('Failed to delete employee');
                                      }
                                    }
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.85em',
                                    fontWeight: '500',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={(e) => e.target.style.backgroundColor = '#cc0000'}
                                  onMouseOut={(e) => e.target.style.backgroundColor = '#ff4444'}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>

        {/* Image Preview Modal */}
        {imagePreviewOpen && previewEmployee && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }} onClick={() => setImagePreviewOpen(false)}>
            <div style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '90%',
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              cursor: 'default'
            }} onClick={e => e.stopPropagation()}>
              <img 
                src={`http://localhost:3001/api/employees/${previewEmployee.ID_Employee}/image`}
                alt={previewEmployee.EmployeeName}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(90vh - 40px)',
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
              />
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#666'
              }} onClick={() => setImagePreviewOpen(false)}>
                ×
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '400px'
            }}>
              <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Edit Employee</h2>
              <div style={{ 
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}>
                <img 
                  src={`${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'}/api/employees/${editingEmployee.ID_Employee}/image`}
                  alt=""
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '60px',
                    objectFit: 'cover',
                    backgroundColor: '#f8f9fa',
                    border: '3px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDBweCIgaGVpZ2h0PSI0MHB4IiB2aWV3Qm94PSIwIDAgNDAgNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZjBmMGYwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IiM2NjY2NjYiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        const formData = new FormData();
                        formData.append('image', file);
                        
                        await axios.put(
                          `${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'}/api/employees/${editingEmployee.ID_Employee}/image`,
                          formData,
                          {
                            headers: {
                              'Content-Type': 'multipart/form-data'
                            }
                          }
                        );
                        
                        // Force refresh of all employee images and data
                        await fetchEmployees();
                        
                        // Add a small delay before refreshing images to ensure new data is loaded
                        setTimeout(() => {
                          const timestamp = new Date().getTime();
                          document.querySelectorAll('img[src*="/api/employees/"]').forEach(img => {
                            img.src = `${img.src.split('?')[0]}?t=${timestamp}`;
                          });
                        }, 100);

                      } catch (error) {
                        console.error('Error uploading image:', error);
                        alert('Failed to upload image. Please try again.');
                      }
                    }
                  }}
                  style={{
                    width: '200px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Start Date:</label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setEditModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#f0f0f0',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const apiUrl = process.env.NODE_ENV === 'production'
                        ? `/api/employees/${editingEmployee.ID_Employee}`
                        : `http://localhost:3001/api/employees/${editingEmployee.ID_Employee}`;
                      await axios.put(apiUrl, {
                        EmployeeName: editName,
                        StartDate: editStartDate || null
                      });
                      
                      // Refresh employee list
                      await fetchEmployees();
                      
                      // Force refresh of all employee images
                      const timestamp = new Date().getTime();
                      document.querySelectorAll('img[src*="/api/employees/"]').forEach(img => {
                        img.src = `${img.src.split('?')[0]}?t=${timestamp}`;
                      });
                      
                      setEditModalOpen(false);
                    } catch (error) {
                      console.error('Error updating employee:', error);
                      alert('Failed to update employee');
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
