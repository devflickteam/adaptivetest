// frontend/components/ScanForm.jsx
import { useApiClient } from '../../lib/api'; // Adjust path as needed
import toast from 'react-hot-toast';

export default function ScanForm() {
  const { startScan } = useApiClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');

    try {
      // ✅ Use the API client instead of direct fetch
      const result = await startScan(url);
      
      if (result.ok) {
        toast.success('Scan started successfully!');
        // Redirect to scanning page
        window.location.href = `/scanning/${result.data.scan_id}`;
      } else {
        toast.error('Failed to start scan');
      }
    } catch (error) {
      toast.error('Failed to start scan');
      console.error('Scan error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form JSX */}
    </form>
  );
}