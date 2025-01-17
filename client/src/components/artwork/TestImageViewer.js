import React from 'react';
import ImageViewer from './ImageViewer';
import './ImageViewer.css';

const TestImageViewer = () => {
    // Test cases with different scenarios
    const testFiles = [
        {
            path: 'IMG_6990.JPG',
            exists: true,
            metadata: {
                Name: 'IMG_6990.JPG',
                ExternalKey: '2e1da40b-944c-4fb8-88b4-3223cdfbf1d0',
                Size: 4853462,
                ContentType: 'image/jpeg',
                DateCreated: '7/9/2024 5:28:16 PM'
            }
        },
        {
            path: 'missing-file.jpg',
            exists: false,
            metadata: null
        },
        {
            path: 'BABY PIC.JPG',
            exists: true,
            metadata: {
                Name: 'BABY PIC.JPG',
                ExternalKey: '671c5e86-3e40-4495-8ddb-80ae50ee1ee3',
                Size: 1626342,
                ContentType: 'image/jpeg',
                DateCreated: '11/8/2022 5:17:27 PM'
            }
        },
        {
            path: 'Erik Modeling Hoodie Front and Back.png',
            exists: true,
            metadata: {
                Name: 'Erik Modeling Hoodie Front and Back.png',
                ExternalKey: '9e042451-e241-480a-a07f-576d6d014846',
                Size: 395697,
                ContentType: 'image/png',
                DateCreated: '7/23/2024 11:51:50 PM'
            }
        }
    ];

    return (
        <div style={{ 
            padding: '20px',
            maxWidth: '1200px',
            margin: '0 auto',
            backgroundColor: '#f8f9fa',
            minHeight: '100vh'
        }}>
            <h1 style={{ 
                marginBottom: '20px',
                color: '#333',
                borderBottom: '1px solid #dee2e6',
                paddingBottom: '10px'
            }}>
                Image Viewer Test
            </h1>
            
            <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px',
                marginTop: '20px'
            }}>
                {testFiles.map((file, index) => (
                    <div key={index} style={{
                        background: 'white',
                        padding: '15px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ 
                            marginBottom: '15px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <h3 style={{ 
                                margin: 0,
                                fontSize: '1rem',
                                color: '#333',
                                wordBreak: 'break-all'
                            }}>
                                {file.path}
                            </h3>
                            <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                backgroundColor: file.exists ? '#d1e7dd' : '#f8d7da',
                                color: file.exists ? '#0f5132' : '#842029',
                                whiteSpace: 'nowrap'
                            }}>
                                {file.exists ? 'Exists' : 'Missing'}
                            </span>
                        </div>
                        <ImageViewer filePath={file} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TestImageViewer;
