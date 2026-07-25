import authReducer, { setCredentials, clearCredentials, updateUserLocation, setError,} from '../redux/slices/authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    otpUserId: null,
  };

  it('should handle setCredentials', () => {
    const user = { _id: '1', fullName: 'Test', email: 'test@example.com' };
    const nextState = authReducer(initialState, setCredentials({ token: 'abc123', user }));
    
    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.token).toBe('abc123');
    expect(nextState.user).toEqual(user);
  });

  it('should handle clearCredentials', () => {
    const loggedInState = {
      ...initialState,
      isAuthenticated: true,
      token: 'abc',
      user: { _id: '1' },
    };
    const nextState = authReducer(loggedInState, clearCredentials());
    
    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.token).toBeNull();
    expect(nextState.user).toBeNull();
  });

  it('should handle updateUserLocation', () => {
    const stateWithUser = {
      ...initialState,
      user: { _id: '1', city: 'Old City' },
    };
    const nextState = authReducer(
      stateWithUser,
      updateUserLocation({ city: 'Mumbai', state: 'Maharashtra', latitude: 19.076, longitude: 72.8777 })
    );
    
    expect(nextState.user.city).toBe('Mumbai');
    expect(nextState.user.state).toBe('Maharashtra');
    expect(nextState.user.latitude).toBe(19.076);
  });

  it('should handle setError', () => {
    const nextState = authReducer(initialState, setError('Invalid credentials'));
    expect(nextState.error).toBe('Invalid credentials');
    expect(nextState.loading).toBe(false);
  });
});