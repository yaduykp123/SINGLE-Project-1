import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import ProductCard from '../components/ProductCard';

const mockStore = configureStore([]);

const mockProduct = {
  _id: '1',
  name: 'Fresh Apples',
  description: 'Organic red apples',
  category: 'Fruits',
  marketPrice: 100,
  discountPrice: 80,
  quantity: 1,
  unit: 'kg',
  expiryDate: new Date(Date.now() + 86400000).toISOString(),
  image: 'https://example.com/apple.jpg',
  owner: 'seller1',
  ownerName: 'Fresh Farms',
  ownerType: 'shop',
  city: 'Mumbai',
};

describe('ProductCard', () => {
  it('renders product details correctly', () => {
    const store = mockStore({ auth: { user: { _id: 'buyer1' } } });
    
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ProductCard product={mockProduct} />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Fresh Apples')).toBeInTheDocument();
    expect(screen.getByText('₹80')).toBeInTheDocument();
    expect(screen.getByText('₹100')).toBeInTheDocument();
    expect(screen.getByText('20% OFF')).toBeInTheDocument();
    expect(screen.getByText('Fresh Farms')).toBeInTheDocument();
  });

  it('shows expired badge for expired products', () => {
    const expiredProduct = {
      ...mockProduct,
      expiryDate: new Date(Date.now() - 86400000).toISOString(),
    };
    const store = mockStore({ auth: { user: { _id: 'buyer1' } } });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ProductCard product={expiredProduct} />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('shows "Your Listing" for own products', () => {
    const ownProduct = { ...mockProduct, owner: 'user1' };
    const store = mockStore({ auth: { user: { _id: 'user1' } } });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ProductCard product={ownProduct} />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Your Listing')).toBeInTheDocument();
  });
});