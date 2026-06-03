// Import the necessary functions from date-fns
import { formatDistanceToNow, format } from 'date-fns';

// Function to get relative time (e.g., '5 minutes ago', '1 month ago')
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
};

// Function to format date as 'YYYY-MM-DD HH:mm:ss'
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return format(date, 'yyyy-MM-dd HH:mm:ss');
};

// Add more date-related functions as needed

export { formatRelativeTime, formatDate };
