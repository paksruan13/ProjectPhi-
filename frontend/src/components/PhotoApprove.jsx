import {useEffect, useState} from 'react';

const PhotoApprove = ()=> {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetch('http://localhost:4243/photos/pending')
        .then(response => response.json())
        .then(data => {
            setPhotos(data);
            setLoading(false);
        })
        .catch(error => {
            console.error('Error fetching photos:', error);
            setLoading(false);
        });
    }, []);
    
    const handleApprove = async (photoId) => {
        await fetch(`http://localhost:4243/photos/${photoId}/approve`, {
            method: 'PUT',
        });
        setPhotos(photos.filter(photo => photo.id !== photoId));
    };
    const handleReject = async (photoId) => {
        const reason = prompt("Please enter the reason for rejection:");
        if (!reason) {
            alert("Rejection reason is required.");
            return;
         }
        await fetch(`http://localhost:4243/photos/${photoId}/reject`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason }),
        });
        setPhotos(photos.filter(photo => photo.id !== photoId));
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-4 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Pending Photo Approvals</h1>
          {photos.length === 0 ? (
            <p className="text-gray-500">No pending photos.</p>
          ) : (
            <div className="grid gap-6">
              {photos.map(photo => (
                <div key={photo.id} className="bg-white shadow-md rounded-lg p-4">
                  <img
                    src={photo.url}
                    alt="Submitted"
                    className="w-full h-64 object-cover rounded-md mb-2"
                  />
                  <p className="text-sm text-gray-700 mb-2">Team: <strong>{photo.team.name}</strong></p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApprove(photo.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(photo.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
};
    
export default PhotoApprove;