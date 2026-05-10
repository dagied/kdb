'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSpinner } from 'react-icons/fa';

const roleRedirects = {
  'System Administrator': '/dashboard/admin',
  'Kebele Manager': '/dashboard/manager',
  'Record Officer': '/dashboard/officer',
  'Resident': '/dashboard/resident',
};

export function withAuth(Component, allowedRoles = []) {
  return function AuthenticatedComponent(props) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          // Get user from localStorage
          const storedUser = localStorage.getItem('user');
          
          if (!storedUser) {
            console.log('No user found, redirecting to login');
            router.push('/login');
            return;
          }
          
          const user = JSON.parse(storedUser);
          const userRole = user.role;
          
          // Check if role is allowed
          if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
            console.log(`Role ${userRole} not allowed. Redirecting to ${roleRedirects[userRole] || '/login'}`);
            router.push(roleRedirects[userRole] || '/login');
            return;
          }
          
          // Also verify with server
          try {
            const response = await fetch('/api/auth/verify');
            const data = await response.json();
            
            if (!data.authenticated) {
              console.log('Session expired, redirecting to login');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              router.push('/login');
              return;
            }
            
            // Check role from server as well
            if (allowedRoles.length > 0 && !allowedRoles.includes(data.role)) {
              console.log(`Server verification failed: Role ${data.role} not allowed`);
              router.push(roleRedirects[data.role] || '/login');
              return;
            }
          } catch (fetchError) {
            console.error('Server verification error:', fetchError);
            // Continue anyway - middleware will handle
          }
          
          setIsAuthorized(true);
        } catch (error) {
          console.error('Auth check error:', error);
          router.push('/login');
        } finally {
          setIsLoading(false);
        }
      };
      
      checkAuth();
    }, [router]);
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Verifying access...</p>
          </div>
        </div>
      );
    }
    
    if (!isAuthorized) {
      return null;
    }
    
    return <Component {...props} />;
  };
}