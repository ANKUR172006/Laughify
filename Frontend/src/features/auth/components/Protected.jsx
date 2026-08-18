import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../authContext';

const Protected = ({ children }) => {
  const { loading } = useAuth();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.isGuest) {
      const registeredOnly = ["/profile"];
      if (registeredOnly.includes(location.pathname)) {
        navigate("/login", { replace: true });
      }
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="loading-screen">
        <h1>Loading...</h1>
      </div>
    );
  }

  return user ? children : null;
};

export default Protected;
