import { useState, useEffect, useCallback, useMemo } from 'react';

interface Branch {
  _id: string;
  name: string;
  address?: string;
}

// Cache key for localStorage
const BRANCHES_CACHE_KEY = 'yumin_branches_cache';
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// In-memory cache to avoid repeated localStorage access
let inMemoryBranchesCache: { branches: Branch[], timestamp: number } | null = null;

// Function to get branches from cache
const getBranchesFromCache = (): Branch[] | null => {
  // First check in-memory cache
  if (inMemoryBranchesCache) {
    const now = Date.now();
    if (now - inMemoryBranchesCache.timestamp < CACHE_EXPIRY_TIME) {
      return inMemoryBranchesCache.branches;
    }
  }

  // Then check localStorage
  if (typeof window !== 'undefined') {
    try {
      const cachedData = localStorage.getItem(BRANCHES_CACHE_KEY);
      if (cachedData) {
        const { branches, timestamp } = JSON.parse(cachedData);
        const now = Date.now();
        if (now - timestamp < CACHE_EXPIRY_TIME) {
          // Update in-memory cache
          inMemoryBranchesCache = { branches, timestamp };
          return branches;
        }
      }
    } catch (error) {
      console.error('Error reading branches from cache:', error);
    }
  }
  return null;
};

// Function to save branches to cache
const saveBranchesToCache = (branches: Branch[]) => {
  if (typeof window !== 'undefined') {
    try {
      const cacheData = {
        branches,
        timestamp: Date.now()
      };
      // Update in-memory cache
      inMemoryBranchesCache = cacheData;
      // Save to localStorage
      localStorage.setItem(BRANCHES_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving branches to cache:', error);
    }
  }
};

export const useBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Memoized branch map for faster lookups
  const branchMap = useMemo(() => {
    const map = new Map<string, Branch>();
    branches.forEach(branch => map.set(branch._id, branch));
    return map;
  }, [branches]);

  const fetchBranches = useCallback(async (force = false) => {
    // Check if we should use cached data
    if (!force) {
      // Check if we've fetched recently (within 5 minutes)
      const now = Date.now();
      if (now - lastFetchTime < 5 * 60 * 1000 && branches.length > 0) {
        return; // Use existing data if we fetched recently
      }

      // Try to get from cache
      const cachedBranches = getBranchesFromCache();
      if (cachedBranches && cachedBranches.length > 0) {
        setBranches(cachedBranches);
        setLoading(false);
        return;
      }
    }

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
      // Reduced logging - only log once when debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Branches API response received');
      }

      let branchesData: Branch[] = [];

      // Handle different response structures
      if (data.data && Array.isArray(data.data)) {
        branchesData = data.data;
      } else if (Array.isArray(data)) {
        branchesData = data;
      } else if (data.branches && Array.isArray(data.branches)) {
        branchesData = data.branches;
      } else {
        console.error('Unexpected branches data structure');
        setBranches([]);
        setError(new Error('Unexpected branches data structure'));
        return;
      }

      // Save to state
      setBranches(branchesData);
      // Save to cache
      saveBranchesToCache(branchesData);
      // Update last fetch time
      setLastFetchTime(Date.now());
    } catch (err) {
      console.error('Error fetching branches:', err);
      setBranches([]);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [branches.length, lastFetchTime]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Helper function to get branch name by ID - memoized and optimized
  const getBranchName = useCallback((branchId: string): string => {
    if (!branchId) return 'Chi nhánh không xác định';

    // Use the branch map for faster lookups
    const branch = branchMap.get(branchId);

    if (branch) {
      return branch.name;
    } else {
      // If branch not found in current state, try to get from cache
      const cachedBranches = getBranchesFromCache();
      if (cachedBranches) {
        const cachedBranch = cachedBranches.find(b => b._id === branchId);
        if (cachedBranch) {
          return cachedBranch.name;
        }
      }

      // If still not found, use fallback
      return `Chi nhánh ${branchId.substring(0, 6)}...`;
    }
  }, [branchMap]);

  // Helper function to get branch by ID - optimized with map
  const getBranch = useCallback((branchId: string): Branch | undefined => {
    if (!branchId) return undefined;

    // Use the branch map for faster lookups
    const branch = branchMap.get(branchId);
    if (branch) return branch;

    // If not found in map, try cache
    const cachedBranches = getBranchesFromCache();
    if (cachedBranches) {
      const cachedBranch = cachedBranches.find(b => b._id === branchId);
      if (cachedBranch) return cachedBranch;
    }

    return undefined;
  }, [branchMap]);

  // Fetch a specific branch by ID - with caching
  const fetchBranch = useCallback(async (branchId: string): Promise<Branch | null> => {
    if (!branchId) return null;

    // First check if we have it in our current state
    const branch = branchMap.get(branchId);
    if (branch) return branch;

    // Then check cache
    const cachedBranches = getBranchesFromCache();
    if (cachedBranches) {
      const cachedBranch = cachedBranches.find(b => b._id === branchId);
      if (cachedBranch) return cachedBranch;
    }

    // If not found, fetch from API
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
  }, [branchMap]);

  // Preload branches if they haven't been loaded yet - simplified to use fetchBranches
  const preloadBranches = useCallback(async () => {
    if (branches.length === 0 && !loading) {
      await fetchBranches(false); // Use cached data if available
    }
  }, [branches.length, loading, fetchBranches]);

  return {
    branches,
    loading,
    error,
    getBranchName,
    getBranch,
    fetchBranch,
    preloadBranches,
    fetchBranches // Include the fetchBranches function for manual refresh
  };
};
