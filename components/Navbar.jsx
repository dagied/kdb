'use client';
import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export default function Navbar() {
  const { t } = useTranslation();
  return (
    <nav className="bg-white shadow p-4 fixed top-0 w-[100%] mb-10 z-1000">
      <h1 className="text-xl font-bold">{t('nav.dashboard')}</h1>
    </nav>
  );
}