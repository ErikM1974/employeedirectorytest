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
      backgroundColor: '#f0f2f5',
      padding: '32px 20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{ 
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '24px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.02)'
      }}>
        <h1 style={{ 
          textAlign: 'center',
          color: '#1a73e8',
          fontSize: '2.8em',
          marginBottom: '50px',
          fontWeight: '700',
          letterSpacing: '-1px',
          background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>Employee Directory</h1>

        {/* Add new employee form */}
        <div style={{ 
          marginBottom: '50px',
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'linear-gradient(to bottom, #ffffff, #f8faff)',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ 
                  fontSize: '0.9em',
                  color: '#475569',
                  fontWeight: '500',
                  marginLeft: '4px'
                }}>Employee Name</label>
                <input
                  type="text"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: '2px solid #e1e4e8',
                    fontSize: '15px',
                    width: '240px',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ 
                  fontSize: '0.9em',
                  color: '#475569',
                  fontWeight: '500',
                  marginLeft: '4px'
                }}>Start Date</label>
                <input
                  type="date"
                  value={newEmployeeStartDate}
                  onChange={(e) => setNewEmployeeStartDate(e.target.value)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: '2px solid #e1e4e8',
                    fontSize: '15px',
                    width: '180px',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    cursor: 'pointer',
                    color: '#2c3e50'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
              <label style={{ 
                fontSize: '0.9em',
                color: '#475569',
                fontWeight: '500',
                marginLeft: '4px'
              }}>Profile Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewEmployeeImage(e.target.files[0])}
                style={{
                  position: 'relative',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  border: '2px solid #e1e4e8',
                  fontSize: '14px',
                  width: '300px',
                  backgroundColor: '#fff',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ 
              fontSize: '0.9em',
              color: '#475569',
              fontWeight: '500',
              marginLeft: '4px'
            }}>Department</label>
            <select
              value={newEmployeeDept}
              onChange={(e) => setNewEmployeeDept(e.target.value)}
              style={{
                padding: '14px 18px',
                borderRadius: '12px',
                border: '2px solid #e1e4e8',
                fontSize: '15px',
                backgroundColor: 'white',
                transition: 'all 0.2s ease',
                outline: 'none',
                cursor: 'pointer',
                color: '#2c3e50',
                minWidth: '200px',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px top 50%',
                backgroundSize: '12px auto',
                paddingRight: '40px'
              }}
            >
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={createEmployee}
            style={{
              padding: '14px 28px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(26,115,232,0.3)',
              transform: 'translateY(0)',
              marginTop: '24px'
            }}
          >
            Add Employee
          </button>
        </div>

        {/* DragDropContext */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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
                      borderRadius: '16px',
                      padding: '24px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                      border: `2px solid ${DEPARTMENT_COLORS[dept]}20`,
                      minHeight: '400px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <h2 style={{ 
                      margin: '0 0 24px 0',
                      padding: '16px 20px',
                      background: `linear-gradient(135deg, ${DEPARTMENT_COLORS[dept]}, ${DEPARTMENT_COLORS[dept]}dd)`,
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '1.2em',
                      fontWeight: '600',
                      textAlign: 'center',
                      letterSpacing: '0.5px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      textTransform: 'uppercase'
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
                              padding: '20px',
                              margin: '0 0 16px 0',
                              backgroundColor: snapshot.isDragging ? '#f8faff' : 'white',
                              border: '1px solid #eef2f7',
                              borderRadius: '14px',
                              boxShadow: snapshot.isDragging 
                                ? '0 12px 24px rgba(0,0,0,0.15)' 
                                : '0 2px 4px rgba(0,0,0,0.02)',
                              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                              transform: snapshot.isDragging ? 'scale(1.02)' : 'scale(1)',
                              ...provided.draggableProps.style
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img 
                                  src={`${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'}/api/employees/${emp.ID_Employee}/image`}
                                  alt=""
                                  style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    backgroundColor: '#f8f9fa',
                                    cursor: 'pointer',
                                    border: '3px solid #fff',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                    transition: 'all 0.3s ease'
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
                                  <div style={{
                                    fontSize: '1.05em',
                                    fontWeight: '500',
                                    color: '#2c3e50'
                                  }}>{emp.EmployeeName}</div>
                                  {emp.StartDate && (
                                    <div style={{ 
                                      fontSize: '0.85em', 
                                      color: '#64748b',
                                      backgroundColor: '#f1f5f9',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      marginTop: '4px',
                                      display: 'inline-block'
                                    }}>
                                      {new Date(emp.StartDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingEmployee(emp);
                                    setEditName(emp.EmployeeName);
                                    setEditStartDate(emp.StartDate ? new Date(emp.StartDate).toISOString().split('T')[0] : '');
                                    setEditModalOpen(true);
                                  }}
                                  style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#fff',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.9em',
                                    fontWeight: '500',
                                    color: '#475569',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Are you sure you want to delete ${emp.EmployeeName}?`)) {
                                      try {
                                        const apiUrl = process.env.NODE_ENV === 'production'
                                          ? `/api/employees/${emp.ID_Employee}`
                                          : `http://localhost:3001/api/employees/${emp.ID_Employee}`;
                                        await axios.delete(apiUrl);
                                        fetchEmployees();
                                      } catch (error) {
                                        console.error('Error deleting employee:', error);
                                        alert('Failed to delete employee');
                                      }
                                    }
                                  }}
                                  style={{
                                    padding: '8px 16px',
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.9em',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 4px rgba(220,38,38,0.1)'
                                  }}
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
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            cursor: 'pointer',
            backdropFilter: 'blur(5px)'
          }} onClick={() => setImagePreviewOpen(false)}>
            <div style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '90%',
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '16px',
              cursor: 'default',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }} onClick={e => e.stopPropagation()}>
              <img 
                src={`${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'}/api/employees/${previewEmployee.ID_Employee}/image`}
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
        {editModalOpen && editingEmployee && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '20px',
              width: '400px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '24px',
                fontSize: '1.8em',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Edit Employee</h2>
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
                        
                        await fetchEmployees();
                        
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
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid #e1e4e8',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px',
                  fontSize: '0.95em',
                  color: '#475569',
                  fontWeight: '500'
                }}>Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid #e1e4e8',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px',
                  fontSize: '0.95em',
                  color: '#475569',
                  fontWeight: '500'
                }}>Start Date</label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: '2px solid #e1e4e8',
                    fontSize: '15px',
                    color: '#2c3e50',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setEditModalOpen(false)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '2px solid #e1e4e8',
                    backgroundColor: '#fff',
                    color: '#666',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
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
                      
                      await fetchEmployees();
                      
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
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(26,115,232,0.3)'
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
