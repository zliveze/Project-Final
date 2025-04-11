import { useState, useEffect } from 'react';

interface Branch {
  _id: string;
  name: string;
  address?: string;
}

export const useBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        // Use the Next.js API route
        const response = await fetch('/api/branches');

        if (!response.ok) {
          console.error(`Failed to fetch branches: ${response.status}`);
          // Don't throw here, just set empty branches and continue
          setBranches([]);
          setError(new Error(`Failed to fetch branches: ${response.status}`));
          return;
        }

        const data = await response.json();
        console.log('Branches API response:', data);

        // Handle different response structures
        if (data.data && Array.isArray(data.data)) {
          setBranches(data.data);
          console.log('Setting branches from data.data:', data.data);
        } else if (Array.isArray(data)) {
          setBranches(data);
          console.log('Setting branches from array data:', data);
        } else if (data.branches && Array.isArray(data.branches)) {
          setBranches(data.branches);
          console.log('Setting branches from data.branches:', data.branches);
        } else {
          console.error('Unexpected branches data structure:', data);
          setBranches([]);
          setError(new Error('Unexpected branches data structure'));
        }
      } catch (err) {
        console.error('Error fetching branches:', err);
        setBranches([]);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // Helper function to get branch name by ID
  const getBranchName = (branchId: string): string => {
    if (!branchId) return 'Chi nhánh không xác định';

    // Debug log to see what's happening
    console.log('Getting branch name for ID:', branchId);
    console.log('Available branches:', branches);

    const branch = branches.find(b => b._id === branchId);

    if (branch) {
      console.log('Found branch:', branch);
      return branch.name;
    } else {
      console.log('Branch not found, using fallback');
      return `Chi nhánh ${branchId.substring(0, 6)}...`;
    }
  };

  // Helper function to get branch by ID
  const getBranch = (branchId: string): Branch | undefined => {
    if (!branchId) return undefined;
    return branches.find(b => b._id === branchId);
  };

  // Fetch a specific branch by ID
  const fetchBranch = async (branchId: string): Promise<Branch | null> => {
    if (!branchId) return null;

    try {
      const response = await fetch(`/api/branches/${branchId}`);
      if (!response.ok) {
        console.error(`Failed to fetch branch ${branchId}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`Error fetching branch ${branchId}:`, err);
      return null;
    }
  };

  // Preload branches if they haven't been loaded yet
  const preloadBranches = async () => {
    if (branches.length === 0 && !loading && !error) {
      console.log('Preloading branches...');
      try {
        setLoading(true);
        const response = await fetch('/api/branches');

        if (!response.ok) {
          console.error(`Failed to preload branches: ${response.status}`);
          return;
        }

        const data = await response.json();
        console.log('Preloaded branches data:', data);

        if (data.data && Array.isArray(data.data)) {
          setBranches(data.data);
        } else if (Array.isArray(data)) {
          setBranches(data);
        } else if (data.branches && Array.isArray(data.branches)) {
          setBranches(data.branches);
        }
      } catch (err) {
        console.error('Error preloading branches:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    branches,
    loading,
    error,
    getBranchName,
    getBranch,
    fetchBranch,
    preloadBranches
  };
};
