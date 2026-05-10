'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useRoleGuard(allowedRoles = []) {
  const router = useRouter();

  useEffect(() => {
    const checkRole = () => {
      const storedUser = localStorage.getItem('user');
      
      if (!storedUser) {
        router.push('/login');
        return false;
      }
      
      try {
        const user = JSON.parse(storedUser);
        const userRole = user.role;
        
        if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
          // Redirect based on role
          if (userRole === 'System Administrator') {
            router.push('/dashboard/admin');
          } else if (userRole === 'Kebele Manager') {
            router.push('/dashboard/manager');
          } else if (userRole === 'Record Officer') {
            router.push('/dashboard/officer');
          } else if (userRole === 'Resident') {
            router.push('/dashboard/resident');
          } else {
            router.push('/login');
          }
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Role check error:', error);
        router.push('/login');
        return false;
      }
    };
    
    checkRole();
  }, [router, allowedRoles]);
}