import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import ProtectedRoute from '../components/ProtectedRoute';

const mockStore = configureStore([]);

const TestComponent = () => <div>Protected Content</div>;

const renderWithProviders = (storeState, allowedTypes, adminOnly = false) => {
  const store = mockStore({ auth: storeState });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/" element={<div>Home</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute allowedTypes={allowedTypes} adminOnly={adminOnly}>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('ProtectedRoute', () => {
  it('shows loader when loading', () => {
    const { container } = renderWithProviders({ loading: true, isAuthenticated: false, user: null });
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    renderWithProviders({ loading: false, isAuthenticated: false, user: null });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('allows admin to access any route', () => {
    renderWithProviders(
      { loading: false, isAuthenticated: true, user: { _id: '1', isAdmin: true, accountType: 'admin' } },
      ['shop']
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects non-shop users from shop routes', () => {
    renderWithProviders(
      { loading: false, isAuthenticated: true, user: { _id: '1', isAdmin: false, accountType: 'household' } },
      ['shop']
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('allows matching account types', () => {
    renderWithProviders(
      { loading: false, isAuthenticated: true, user: { _id: '1', isAdmin: false, accountType: 'household' } },
      ['household']
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});