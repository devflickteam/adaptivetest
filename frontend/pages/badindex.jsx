// frontend/pages/badindex.jsx
import { useApiClient } from '../../lib/api'; // Adjust path

export default function BadIndex() {
  const { getAllResults, downloadAllResultsPdf } = useApiClient();

  const loadResults = async () => {
    try {
      // ✅ Use API client
      const result = await getAllResults();
      if (result.ok) {
        setResults(result.data);
      }
    } catch (error) {
      console.error('Failed to load results:', error);
    }
  };

  const handleDownload = async () => {
    // ✅ Use API client
    await downloadAllResultsPdf();
  };

  return (
    // Your JSX
    <button onClick={handleDownload}>Download All</button>
  );
}