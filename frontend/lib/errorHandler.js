import toast from 'react-hot-toast';

export function handleApiError(context, err) {
  console.error(`API Error: ${context}`, err);

  // Show toast message
  toast.error(`❌ ${context}: ${err.message || 'Something went wrong'}`);
}
