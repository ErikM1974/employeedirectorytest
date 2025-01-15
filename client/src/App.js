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
  Sales: '#4CAF50',
  Accounting: '#2196F3',
  Production: '#FF9800',
  Administrative: '#9C27B0',
  'Direct To Garment': '#F44336',
  'Art Department': '#009688',
  'Cap Department': '#673AB7',
};

// Default placeholder image
const DEFAULT_IMAGE = 'https://cdn.caspio.com/A0E15000/Safety%20Stripes/NWCA%20Favicon%20for%20TEAMNWCA.com.png?ver=1';

function App() {
  const [employees, setEmployees] = useState([]);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeDept, setNewEmployeeDept] = useState(DEPARTMENTS[0]);
  const [newEmployeeStartDate, setNewEmployeeStartDate] = useState('');
  const [newEmployeeImage, setNewEmployeeImage] = useState(null);
  const [imageVersion, setImageVersion] = useState(Date.now());

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
    document.body.style.backgroundColor = '#f5f5f5';
    document.body.style.margin = 0;
    document.body.style.padding = 0;
    document.body.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  }, []);

  async function fetchEmployees() {
    try {
      const apiUrl =
        process.env.NODE_ENV === 'production' ? '/api/employees' : 'http://localhost:3001/api/employees';
      const { data } = await axios.get(apiUrl);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error.message);
    }
  }

  async function uploadImage(employeeId, imageFile) {
    if (!imageFile) return;

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const apiUrlImg =
        process.env.NODE_ENV === 'production'
          ? `/api/employees/${employeeId}/image`
          : `http://localhost:3001/api/employees/${employeeId}/image`;
      
      await axios.put(apiUrlImg, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Update image version to force refresh
      setImageVersion(Date.now());
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async function createEmployee() {
    if (!newEmployeeName) return;
    try {
      const apiUrl =
        process.env.NODE_ENV === 'production' ? '/api/employees' : 'http://localhost:3001/api/employees';
      const response = await axios.post(apiUrl, {
        EmployeeName: newEmployeeName,
        Department: newEmployeeDept,
        StartDate: newEmployeeStartDate || null,
      });

      const employeeId = response.data?.Result?.[0]?.ID_Employee;
      
      if (employeeId && newEmployeeImage) {
        await uploadImage(employeeId, newEmployeeImage);
        setImageVersion(Date.now()); // Force immediate image refresh
      }

      // Fetch updated employees list
      await fetchEmployees();

      // Reset form
      setNewEmployeeName('');
      setNewEmployeeStartDate('');
      setNewEmployeeImage(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
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

    const originalEmployees = [...employees];
    try {
      // Update UI optimistically
      const updatedEmployees = employees.map((emp) => {
        if (emp.ID_Employee.toString() === draggableId) {
          return { ...emp, Department: destination.droppableId };
        }
        return emp;
      });
      setEmployees(updatedEmployees);

      // Make API call
      const apiUrl =
        process.env.NODE_ENV === 'production'
          ? `/api/employees/${draggableId}`
          : `http://localhost:3001/api/employees/${draggableId}`;
      const response = await axios.put(apiUrl, {
        Department: destination.droppableId,
      });

      if (response.data) {
        // If server returns updated object, sync again
        const serverUpdatedEmployees = employees.map((emp) => {
          if (emp.ID_Employee.toString() === draggableId) {
            return { ...emp, ...response.data };
          }
          return emp;
        });
        setEmployees(serverUpdatedEmployees);
      }
    } catch (error) {
      console.error('Error updating department:', error.message);
      // Revert
      setEmployees(originalEmployees);
      alert('Failed to update department. Please try again.');
    }
  };

  const employeesByDept = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = employees.filter((emp) => emp.Department === dept);
    return acc;
  }, {});

  const getImageUrl = (employeeId) => {
    const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';
    return `${baseUrl}/api/employees/${employeeId}/image?v=${imageVersion}`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f2f4f7', padding: '32px' }}>
      <div
        style={{
          maxWidth: '1300px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        {/* Title */}
        <h1
          style={{
            textAlign: 'center',
            color: '#1a73e8',
            fontSize: '2.2em',
            marginBottom: '40px',
            fontWeight: '700',
            letterSpacing: '-0.5px',
          }}
        >
          Employee Directory
        </h1>

        {/* Add Employee Form */}
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '40px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              alignItems: 'start',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label
                style={{
                  fontSize: '0.9em',
                  fontWeight: '500',
                  marginBottom: '6px',
                  color: '#475569',
                }}
              >
                Employee Name
              </label>
              <input
                type="text"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                style={{
                  padding: '10px 14px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label
                style={{
                  fontSize: '0.9em',
                  fontWeight: '500',
                  marginBottom: '6px',
                  color: '#475569',
                }}
              >
                Start Date
              </label>
              <input
                type="date"
                value={newEmployeeStartDate}
                onChange={(e) => setNewEmployeeStartDate(e.target.value)}
                style={{
                  padding: '10px 14px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  color: '#2c3e50',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label
                style={{
                  fontSize: '0.9em',
                  fontWeight: '500',
                  marginBottom: '6px',
                  color: '#475569',
                }}
              >
                Profile Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewEmployeeImage(e.target.files[0])}
                style={{
                  padding: '10px 14px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  backgroundColor: '#fff',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label
                style={{
                  fontSize: '0.9em',
                  fontWeight: '500',
                  marginBottom: '6px',
                  color: '#475569',
                }}
              >
                Department
              </label>
              <select
                value={newEmployeeDept}
                onChange={(e) => setNewEmployeeDept(e.target.value)}
                style={{
                  padding: '10px 14px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  backgroundColor: '#fff',
                  color: '#2c3e50',
                }}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={createEmployee}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              fontSize: '14px',
            }}
          >
            Add Employee
          </button>
        </div>

        {/* DragDropContext */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              gap: '16px',
              paddingBottom: '8px',
            }}
          >
            {DEPARTMENTS.map((dept) => (
              <Droppable droppableId={dept} key={dept}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      flex: '0 0 320px',
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
                      minHeight: '500px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Column Header */}
                    <div
                      style={{
                        backgroundColor: DEPARTMENT_COLORS[dept],
                        padding: '10px 0',
                        borderRadius: '8px',
                        marginBottom: '16px',
                      }}
                    >
                      <h2
                        style={{
                          textAlign: 'center',
                          color: '#fff',
                          margin: 0,
                          fontSize: '1em',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                        }}
                      >
                        {dept}
                      </h2>
                    </div>

                    {/* Cards (Employees) */}
                    <div style={{ flexGrow: 1 }}>
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
                                marginBottom: '12px',
                                backgroundColor: snapshot.isDragging ? '#f3f4f6' : '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: snapshot.isDragging
                                  ? '0 5px 10px rgba(0,0,0,0.15)'
                                  : '0 1px 2px rgba(0,0,0,0.08)',
                                transition: 'background-color 0.2s ease',
                                ...provided.draggableProps.style,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {/* Avatar */}
                                <img
                                  src={getImageUrl(emp.ID_Employee)}
                                  alt=""
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    backgroundColor: '#f9fafb',
                                    border: '2px solid #fff',
                                    display: 'block',
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewEmployee(emp);
                                    setImagePreviewOpen(true);
                                  }}
                                  onError={(e) => {
                                    e.target.src = DEFAULT_IMAGE;
                                  }}
                                />

                                {/* Name & Date */}
                                <div>
                                  <div style={{ fontSize: '0.95em', fontWeight: '600' }}>
                                    {emp.EmployeeName}
                                  </div>
                                  {emp.StartDate && (
                                    <div
                                      style={{
                                        marginTop: '4px',
                                        fontSize: '0.8em',
                                        color: '#475569',
                                      }}
                                    >
                                      {new Date(emp.StartDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                  gap: '8px',
                                  marginTop: '12px',
                                }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingEmployee(emp);
                                    setEditName(emp.EmployeeName);
                                    setEditStartDate(
                                      emp.StartDate
                                        ? new Date(emp.StartDate).toISOString().split('T')[0]
                                        : ''
                                    );
                                    setEditModalOpen(true);
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '0.8em',
                                    fontWeight: '500',
                                    color: '#475569',
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (
                                      window.confirm(
                                        `Are you sure you want to delete ${emp.EmployeeName}?`
                                      )
                                    ) {
                                      try {
                                        const apiUrl =
                                          process.env.NODE_ENV === 'production'
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
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: '#dc2626',
                                    color: '#fff',
                                    fontSize: '0.8em',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Delete
                                </button>
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

      {/* Image Preview Modal */}
      {imagePreviewOpen && previewEmployee && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            cursor: 'pointer',
          }}
          onClick={() => setImagePreviewOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '90%',
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
              cursor: 'default',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(previewEmployee.ID_Employee)}
              alt={previewEmployee.EmployeeName}
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
              onError={(e) => {
                e.target.src = DEFAULT_IMAGE;
              }}
            />

            <div
              style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                width: '30px',
                height: '30px',
                backgroundColor: '#fff',
                borderRadius: '50%',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
              onClick={() => setImagePreviewOpen(false)}
            >
              ×
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingEmployee && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '12px',
              width: '360px',
              boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.25em' }}>Edit Employee</h2>
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
              <img
                src={getImageUrl(editingEmployee.ID_Employee)}
                alt=""
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '45px',
                  objectFit: 'cover',
                  backgroundColor: '#f8f9fa',
                  border: '2px solid #fff',
                }}
                onError={(e) => {
                  e.target.src = DEFAULT_IMAGE;
                }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    try {
                      await uploadImage(editingEmployee.ID_Employee, file);
                      setImageVersion(Date.now()); // Force immediate image refresh
                    } catch (error) {
                      alert('Failed to upload image. Please try again.');
                    }
                  }
                }}
                style={{
                  width: '100%',
                  marginTop: '10px',
                }}
              />
            </div>

            {/* Name */}
            <div style={{ marginBottom: '10px' }}>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '0.85em', fontWeight: '600' }}
              >
                Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '0.9em',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                }}
              />
            </div>

            {/* Date */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '0.85em', fontWeight: '600' }}
              >
                Start Date
              </label>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '0.9em',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#2c3e50',
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setEditModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                  color: '#555',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const apiUrl =
                      process.env.NODE_ENV === 'production'
                        ? `/api/employees/${editingEmployee.ID_Employee}`
                        : `http://localhost:3001/api/employees/${editingEmployee.ID_Employee}`;
                    await axios.put(apiUrl, {
                      EmployeeName: editName,
                      StartDate: editStartDate || null,
                    });
                    await fetchEmployees();
                    setEditModalOpen(false);
                  } catch (error) {
                    console.error('Error updating employee:', error);
                    alert('Failed to update employee');
                  }
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#1a73e8',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
