'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn()) router.push('/dashboard');
    else router.push('/home');
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: '#07090f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 32, height: 32, border: '2px solid #00d4ff',
        borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}/>
    </div>
  );
}