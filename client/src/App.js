import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

// A placeholder if the employee does not have an image or fails to load
const DEFAULT_IMAGE =
  'https://cdn.caspio.com/A0E15000/Safety%20Stripes/NWCA%20Favicon%20for%20TEAMNWCA.com.png?ver=1';

function App() {
  const [employees, setEmployees] = useState([]);

  // Form states
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeDept, setNewEmployeeDept] = useState(DEPARTMENTS[0]);
  const [newEmployeeStartDate, setNewEmployeeStartDate] = useState('');
  const [newEmployee, setNewEmployee] = useState(null);
  const [isSecondStep, setIsSecondStep] = useState(false);
  const [imageVersion, setImageVersion] = useState(Date.now());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editName, setEditName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewEmployee, setPreviewEmployee] = useState(null);

  // Set global styles on mount
  useEffect(() => {
    document.body.style.backgroundColor = '#f5f5f5';
    document.body.style.margin = 0;
    document.body.style.padding = 0;
    document.body.style.fontFamily =
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  }, []);

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle modal close
  const handleModalClose = async (shouldSave = false) => {
    if (shouldSave) {
      try {
        const baseUrl =
          process.env.NODE_ENV === 'production'
            ? `/api/employees/${editingEmployee.ID_Employee}`
            : `http://localhost:3001/api/employees/${editingEmployee.ID_Employee}`;
        await axios.put(baseUrl, {
          EmployeeName: editName,
          StartDate: editStartDate || null,
        });
      } catch (error) {
        console.error('Error updating employee:', error);
        alert('Failed to update employee');
        return;
      }
    }
    await fetchEmployees();
    setEditModalOpen(false);
  };

  /**
   * Fetch all employees from the backend
   */
  async function fetchEmployees() {
    try {
      const baseUrl =
        process.env.NODE_ENV === 'production'
          ? '/api/employees'
          : 'http://localhost:3001/api/employees';
      const { data } = await axios.get(baseUrl);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }

  /**
   * Create a new employee (Step 1)
   */
  async function createEmployee() {
    if (!newEmployeeName) return; // Basic validation
    try {
      const baseUrl =
        process.env.NODE_ENV === 'production'
          ? '/api/employees'
          : 'http://localhost:3001/api/employees';

      // Create employee without image first
      const response = await axios.post(baseUrl, {
        EmployeeName: newEmployeeName.trim(),
        Department: newEmployeeDept,
        StartDate: newEmployeeStartDate || null
      });

      // Get the new employee data
      const newEmp = response.data;
      console.log('Created employee:', newEmp);

      if (!newEmp || !newEmp.ID_Employee) {
        throw new Error('Server did not return employee ID');
      }

      // Update the list first
      await fetchEmployees();

      // Clear form and file input
      setNewEmployeeName('');
      setNewEmployeeStartDate('');
      
      // Move to step 2
      setNewEmployee(newEmp);
      setIsSecondStep(true);

      console.log('Moving to photo upload for employee ID:', newEmp.ID_Employee);
      
      // Scroll the new employee into view
      setTimeout(() => {
        const element = document.querySelector(`[data-employee-id="${newEmp.ID_Employee}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.style.animation = 'highlight 2s';
        }
      }, 100);

    } catch (error) {
      console.error('Error creating employee:', error);
      alert(
        error?.response?.data?.error ||
          'Failed to create employee. Please try again.'
      );
    }
  }

  /**
   * Upload the image for a given employee (PUT /employees/:id/image)
   * with the actual file in multipart form-data.
   */
  async function uploadImage(employeeId, file) {
    try {
      const baseUrl =
        process.env.NODE_ENV === 'production'
          ? ''
          : 'http://localhost:3001';
      const url = `${baseUrl}/api/employees/${employeeId}/image`;

      const formData = new FormData();
      // The server expects field name to be 'File' exactly
      formData.append('File', file, file.name);

      // PUT with proper headers and timeout
      await axios.put(url, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000, // 30 second timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      // Clear any previous image errors and bump version to re-fetch
      setImageErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[employeeId];
        return newErrors;
      });
      setImageVersion(Date.now());
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error; // Rethrow so we can handle it upstream if needed
    }
  }

  /**
   * Construct the image URL for an employee with cache busting.
   */
  function getImageUrl(employeeId) {
    if (!employeeId) return DEFAULT_IMAGE;
    
    // If we've seen an error for this image before, return the default
    if (employeeId in imageErrors) {
      return DEFAULT_IMAGE;
    }

    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? ''
        : 'http://localhost:3001';
    return `${baseUrl}/api/employees/${employeeId}/image?v=${imageVersion}`;
  }

  // Track which images have failed to load
  const [imageErrors, setImageErrors] = useState({});

  // Handle image load errors
  const handleImageError = (employeeId) => {
    setImageErrors(prev => ({
      ...prev,
      [employeeId]: true
    }));
    return DEFAULT_IMAGE;
  };

  /**
   * Handle the drag-and-drop to move employees between departments
   */
  async function onDragEnd(result) {
    const { draggableId, destination, source } = result;
    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    const original = [...employees];
    try {
      // Optimistic update
      const updated = employees.map((emp) => {
        if (emp.ID_Employee.toString() === draggableId) {
          return { ...emp, Department: destination.droppableId };
        }
        return emp;
      });
      setEmployees(updated);

      // Make API call
      const baseUrl =
        process.env.NODE_ENV === 'production'
          ? `/api/employees/${draggableId}`
          : `http://localhost:3001/api/employees/${draggableId}`;
      await axios.put(baseUrl, {
        Department: destination.droppableId,
      });
      
      // Refresh from server
      await fetchEmployees();
    } catch (error) {
      console.error('Error updating department:', error);
      // revert on error
      setEmployees(original);
      alert('Failed to update department. Please try again.');
    }
  }

  /**
   * Group employees by department for rendering columns
   */
  const employeesByDept = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = employees.filter((emp) => emp.Department === dept);
    return acc;
  }, {});

  const renderEmployeeForm = () => (
    <div
      style={{
        background: '#fff',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label
            style={{
              fontSize: '0.95em',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Employee Name
          </label>
          <input
            type="text"
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
            placeholder="Enter employee name"
            style={{
              padding: '12px 16px',
              fontSize: '15px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              outline: 'none',
              transition: 'border-color 0.2s',
              ':focus': {
                borderColor: '#1a73e8',
              },
            }}
          />
        </div>

        {/* Start Date */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label
            style={{
              fontSize: '0.95em',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Start Date
          </label>
          <input
            type="date"
            value={newEmployeeStartDate}
            onChange={(e) => setNewEmployeeStartDate(e.target.value)}
            style={{
              padding: '12px 16px',
              fontSize: '15px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              outline: 'none',
              color: '#1e293b',
              transition: 'border-color 0.2s',
              ':focus': {
                borderColor: '#1a73e8',
              },
            }}
          />
        </div>

        {/* Department */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label
            style={{
              fontSize: '0.95em',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Department
          </label>
          <select
            value={newEmployeeDept}
            onChange={(e) => setNewEmployeeDept(e.target.value)}
            style={{
              padding: '12px 16px',
              fontSize: '15px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              outline: 'none',
              backgroundColor: '#fff',
              color: '#1e293b',
              transition: 'border-color 0.2s',
              ':focus': {
                borderColor: '#1a73e8',
              },
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '16px',
              paddingRight: '40px',
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
    </div>
  );

  const renderPhotoUpload = () => (
    <div
      style={{
        background: '#fff',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '150px',
            height: '150px',
            margin: '0 auto 20px',
            position: 'relative',
          }}
        >
          <img
            src={getImageUrl(newEmployee.ID_Employee)}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '75px',
              objectFit: 'cover',
              backgroundColor: '#f8f9fa',
              border: '3px solid #fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            onError={(e) => {
              e.target.src = DEFAULT_IMAGE;
            }}
          />
          <label
            htmlFor="photo-upload"
            style={{
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              backgroundColor: '#1a73e8',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              
              if (!newEmployee || !newEmployee.ID_Employee) {
                alert('Error: Employee ID not found');
                return;
              }

              console.log('Uploading for employee:', newEmployee.ID_Employee);
              try {
                await uploadImage(newEmployee.ID_Employee, file);
                await fetchEmployees();
                setImageVersion(Date.now());
                toast('Photo uploaded successfully!', {
                  type: 'success',
                  position: 'top-right',
                  autoClose: 2000
                });
              } catch (err) {
                console.error('Upload error:', err);
                toast.error('Failed to upload image: ' + (err.response?.data?.error || err.message));
              }
            }}
            style={{
              display: 'none',
            }}
          />
        </div>
        <div style={{ color: '#475569', marginBottom: '24px' }}>
          Click the + button to upload a photo
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <button
          onClick={() => {
            setIsSecondStep(false);
            setNewEmployee(null);
          }}
          style={{
            flex: 1,
            padding: '12px 24px',
            backgroundColor: '#fff',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s',
            ':hover': {
              backgroundColor: '#f8fafc',
            },
          }}
        >
          Add Another Employee
        </button>
        <button
          onClick={() => {
            setIsSecondStep(false);
            setNewEmployee(null);
            toast('Employee added successfully!', {
              type: 'success',
              position: 'top-right',
              autoClose: 3000,
            });
          }}
          style={{
            flex: 1,
            padding: '12px 24px',
            backgroundColor: '#1a73e8',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s',
            ':hover': {
              backgroundColor: '#1557b0',
            },
          }}
        >
          Finish
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f2f4f7', padding: '32px' }}>
      <style>
        {`
          @keyframes highlight {
            0% { box-shadow: 0 0 0 0 rgba(26, 115, 232, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(26, 115, 232, 0); }
            100% { box-shadow: 0 0 0 0 rgba(26, 115, 232, 0); }
          }
        `}
      </style>
      <ToastContainer />
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
        <h1
          style={{
            textAlign: 'center',
            color: '#1a73e8',
            fontSize: '2.2em',
            marginBottom: '40px',
            fontWeight: '700',
          }}
        >
          Employee Directory
        </h1>

        {/* New Employee Form - Step Process */}
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '40px',
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Steps Indicator */}
          <div style={{ marginBottom: '24px', display: 'flex', gap: '32px', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isSecondStep ? '#94a3b8' : '#1a73e8',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
              }}>1</div>
              <span style={{ color: isSecondStep ? '#94a3b8' : '#1a73e8', fontWeight: '500' }}>Enter Employee Info</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '20px' }}>→</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isSecondStep ? '#1a73e8' : '#94a3b8',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
              }}>2</div>
              <span style={{ color: isSecondStep ? '#1a73e8' : '#94a3b8', fontWeight: '500' }}>Upload Photo</span>
            </div>
          </div>

          {!isSecondStep ? (
            <>
              {renderEmployeeForm()}
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
                Continue to Photo Upload
              </button>
            </>
          ) : (
            renderPhotoUpload()
          )}
        </div>

        {/* Kanban Columns */}
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
                    {/* Column header */}
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

                    {/* Employee Cards */}
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
                              data-employee-id={emp.ID_Employee}
                              style={{
                                userSelect: 'none',
                                padding: '16px',
                                marginBottom: '12px',
                                backgroundColor: snapshot.isDragging
                                  ? '#f3f4f6'
                                  : '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: snapshot.isDragging
                                  ? '0 5px 10px rgba(0,0,0,0.15)'
                                  : '0 1px 2px rgba(0,0,0,0.08)',
                                transition: 'background-color 0.2s ease',
                                ...provided.draggableProps.style,
                              }}
                            >
                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                              >
                                <img
                                  src={getImageUrl(emp.ID_Employee)}
                                  alt="Employee"
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    backgroundColor: '#f9fafb',
                                    border: '2px solid #fff',
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewEmployee(emp);
                                    setImagePreviewOpen(true);
                                  }}
                                  onError={(e) => {
                                    console.log('Image load error, using default placeholder');
                                    handleImageError(emp.ID_Employee);
                                    e.target.src = DEFAULT_IMAGE;
                                  }}
                                />
                                {/* Name + date */}
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

                              {/* Edit + Delete Buttons */}
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
                                        ? new Date(emp.StartDate)
                                            .toISOString()
                                            .split('T')[0]
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
                                    if (window.confirm(`Are you sure you want to delete ${emp.EmployeeName}?`)) {
                                      try {
                                        const baseUrl =
                                          process.env.NODE_ENV === 'production'
                                            ? `/api/employees/${emp.ID_Employee}`
                                            : `http://localhost:3001/api/employees/${emp.ID_Employee}`;
                                        await axios.delete(baseUrl);
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
                  handleImageError(previewEmployee.ID_Employee);
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
            <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.25em' }}>
              Edit Employee
            </h2>

            {/* Existing image preview + file upload */}
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
                      // Upload the new file
                      await uploadImage(editingEmployee.ID_Employee, file);
                      // Re-fetch employees & bust cache
                      await fetchEmployees();
                      setImageVersion(Date.now());
                    } catch (err) {
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

            {/* Name field */}
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

            {/* Date field */}
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

            {/* Save + Cancel */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => handleModalClose(false)}
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
                onClick={() => handleModalClose(true)}
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
