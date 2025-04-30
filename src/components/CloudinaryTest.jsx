import { useState } from 'react';
import { uploadImage, getOptimizedImageUrl, getPublicIdFromUrl } from '../lib/cloudinary';

export default function CloudinaryTest() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [error, setError] = useState(null);
  const [optimizedUrl, setOptimizedUrl] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Upload image to Cloudinary
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Upload the image with progress tracking
      const result = await uploadImage(file, 'test-uploads', (percent) => {
        setProgress(percent);
      });

      setUploadedImage(result);

      // Generate an optimized URL
      const publicId = getPublicIdFromUrl(result.url);
      if (publicId) {
        const optimized = getOptimizedImageUrl(publicId, { width: 300 });
        setOptimizedUrl(optimized);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <h2 className="gradient-text" style={{
        fontSize: '2.5rem',
        marginBottom: '30px',
        background: 'linear-gradient(90deg, #3f51b5, #2196f3)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textAlign: 'center'
      }}>
        Cloudinary Test
      </h2>

      <div style={{
        marginBottom: '30px',
        background: 'rgba(63, 81, 181, 0.1)',
        padding: '20px',
        borderRadius: '10px',
        border: '1px solid rgba(63, 81, 181, 0.2)'
      }}>
        <h3 style={{
          color: '#3f51b5',
          marginBottom: '15px',
          fontSize: '1.3rem',
          borderBottom: '1px solid rgba(63, 81, 181, 0.2)',
          paddingBottom: '10px'
        }}>
          Upload an Image
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          alignItems: 'center'
        }}>
          <div style={{
            width: '100%',
            padding: '20px',
            border: '2px dashed rgba(63, 81, 181, 0.3)',
            borderRadius: '10px',
            textAlign: 'center',
            background: 'rgba(63, 81, 181, 0.05)'
          }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              style={{
                display: 'none',
                id: 'cloudinary-file-input'
              }}
              id="cloudinary-file-input"
            />
            <label
              htmlFor="cloudinary-file-input"
              style={{
                display: 'block',
                cursor: uploading ? 'not-allowed' : 'pointer',
                padding: '10px',
                color: 'var(--text-secondary)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📷</div>
              <p style={{ margin: 0 }}>
                {file ? file.name : 'Click to select an image file'}
              </p>
              <p style={{
                margin: '5px 0 0',
                fontSize: '0.8rem',
                opacity: 0.7
              }}>
                PNG, JPG or JPEG recommended
              </p>
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{
              padding: '12px 25px',
              background: !file || uploading ? 'rgba(63, 81, 181, 0.4)' : 'rgba(63, 81, 181, 0.9)',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: !file || uploading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              fontSize: '1rem',
              width: '100%',
              maxWidth: '300px'
            }}
          >
            {uploading ? `Uploading (${progress}%)` : 'Upload Image'}
          </button>
        </div>
      </div>

      {uploading && (
        <div style={{
          marginBottom: '30px',
          background: 'rgba(63, 81, 181, 0.1)',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid rgba(63, 81, 181, 0.2)'
        }}>
          <h3 style={{
            color: '#3f51b5',
            marginBottom: '15px',
            fontSize: '1.3rem',
            borderBottom: '1px solid rgba(63, 81, 181, 0.2)',
            paddingBottom: '10px'
          }}>
            Upload Progress
          </h3>
          <div style={{
            width: '100%',
            height: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '5px',
            overflow: 'hidden',
            marginBottom: '10px'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3f51b5, #2196f3)',
              borderRadius: '5px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{
            textAlign: 'center',
            color: '#3f51b5',
            fontWeight: '500',
            fontSize: '1.1rem'
          }}>
            {progress}% Complete
          </p>
        </div>
      )}

      {uploadedImage && (
        <div style={{
          marginBottom: '30px',
          background: 'rgba(63, 81, 181, 0.1)',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid rgba(63, 81, 181, 0.2)'
        }}>
          <h3 style={{
            color: '#3f51b5',
            marginBottom: '15px',
            fontSize: '1.3rem',
            borderBottom: '1px solid rgba(63, 81, 181, 0.2)',
            paddingBottom: '10px'
          }}>
            Uploaded Image
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '5px',
              maxWidth: '100%',
              textAlign: 'center'
            }}>
              <img
                src={uploadedImage.url}
                alt="Uploaded"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '3px'
                }}
              />
            </div>

            <div style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '15px',
              borderRadius: '5px'
            }}>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>
                <strong>URL:</strong> <span style={{ wordBreak: 'break-all' }}>{uploadedImage.url}</span>
              </p>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>
                <strong>Public ID:</strong> <span style={{ wordBreak: 'break-all' }}>{uploadedImage.publicId}</span>
              </p>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>
                <strong>Size:</strong> {uploadedImage.width} x {uploadedImage.height}
              </p>
              <p style={{ margin: 0, color: 'var(--text-primary)' }}>
                <strong>Format:</strong> {uploadedImage.format}
              </p>
            </div>
          </div>
        </div>
      )}

      {optimizedUrl && (
        <div style={{
          marginBottom: '30px',
          background: 'rgba(63, 81, 181, 0.1)',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid rgba(63, 81, 181, 0.2)'
        }}>
          <h3 style={{
            color: '#3f51b5',
            marginBottom: '15px',
            fontSize: '1.3rem',
            borderBottom: '1px solid rgba(63, 81, 181, 0.2)',
            paddingBottom: '10px'
          }}>
            Optimized Image (300px width)
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '5px',
              maxWidth: '100%',
              textAlign: 'center'
            }}>
              <img
                src={optimizedUrl}
                alt="Optimized"
                style={{
                  maxWidth: '100%',
                  borderRadius: '3px'
                }}
              />
            </div>

            <div style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '15px',
              borderRadius: '5px'
            }}>
              <p style={{ margin: 0, color: 'var(--text-primary)' }}>
                <strong>Optimized URL:</strong> <span style={{ wordBreak: 'break-all' }}>{optimizedUrl}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          color: '#f44336',
          marginTop: '20px',
          background: 'rgba(244, 67, 54, 0.1)',
          padding: '15px',
          borderRadius: '5px',
          border: '1px solid rgba(244, 67, 54, 0.3)'
        }}>
          <p style={{ margin: 0 }}><strong>Error:</strong> {error}</p>
        </div>
      )}

      <div style={{
        marginTop: '30px',
        background: 'rgba(63, 81, 181, 0.1)',
        padding: '20px',
        borderRadius: '10px',
        border: '1px solid rgba(63, 81, 181, 0.2)'
      }}>
        <h3 style={{
          color: '#3f51b5',
          marginBottom: '15px',
          fontSize: '1.3rem',
          borderBottom: '1px solid rgba(63, 81, 181, 0.2)',
          paddingBottom: '10px'
        }}>
          Cloudinary Configuration
        </h3>
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '15px',
          borderRadius: '5px'
        }}>
          <p style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>
            <strong>Cloud Name:</strong> dmsvblrzv
          </p>
          <p style={{ margin: 0, color: 'var(--text-primary)' }}>
            <strong>Upload Preset:</strong> nits_preset
          </p>
        </div>
      </div>
    </div>
  );
}
