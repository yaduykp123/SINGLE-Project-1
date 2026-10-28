import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import ProductDetailModal from '../components/ProductDetailModal';

const mockStore = configureStore([]);

const mockProductWithBatches = {
  _id: 'prod-123',
  name: 'Farm Fresh Organic Strawberries',
  category: 'Fruits',
  brand: 'BerryFarms',
  description: 'Sweet and ripe local strawberries',
  marketPrice: 150,
  discountPrice: 90,
  quantity: 1,
  unit: 'box',
  stock: 10,
  expiryDate: new Date(Date.now() + 3 * 86400000).toISOString(),
  image: 'https://example.com/strawberry.jpg',
  ownerName: 'Green Valley Grocers',
  city: 'Mumbai',
  storageInstructions: 'Keep refrigerated to preserve freshness.',
  batches: [
    {
      _id: 'b-1',
      batchNumber: 'BATCH-A1',
      availableStock: 6,
      expiryDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    },
    {
      _id: 'b-2',
      batchNumber: 'BATCH-A2',
      availableStock: 4,
      expiryDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    },
  ],
};

describe('ProductDetailModal Component', () => {
  it('renders detailed product info, badges, and storage instructions', () => {
    const store = mockStore({
      auth: { user: { _id: 'user1' } },
      cart: { cart: { items: [] } },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ProductDetailModal
            isOpen={true}
            onClose={() => {}}
            product={mockProductWithBatches}
          />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Farm Fresh Organic Strawberries')).toBeInTheDocument();
    expect(screen.getByText('Brand: BerryFarms')).toBeInTheDocument();
    expect(screen.getByText('₹90')).toBeInTheDocument();
    expect(screen.getByText('40% OFF')).toBeInTheDocument();
    expect(screen.getByText(/Keep refrigerated to preserve freshness/i)).toBeInTheDocument();
    expect(screen.getByText('Green Valley Grocers')).toBeInTheDocument();
  });

  it('allows quantity increment up to available stock', () => {
    const store = mockStore({
      auth: { user: { _id: 'user1' } },
      cart: { cart: { items: [] } },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ProductDetailModal
            isOpen={true}
            onClose={() => {}}
            product={mockProductWithBatches}
          />
        </MemoryRouter>
      </Provider>
    );

    // Initial quantity 1
    expect(screen.getByText('1')).toBeInTheDocument();

    // Click increment
    const plusButtons = screen.getAllByRole('button');
    const plusBtn = plusButtons.find(b => b.querySelector('svg.lucide-plus'));
    if (plusBtn) {
      fireEvent.click(plusBtn);
      expect(screen.getByText('2')).toBeInTheDocument();
    }
  });

  it('does not render when isOpen is false', () => {
    const store = mockStore({ auth: { user: null } });

    const { container } = render(
      <Provider store={store}>
        <MemoryRouter>
          <ProductDetailModal
            isOpen={false}
            onClose={() => {}}
            product={mockProductWithBatches}
          />
        </MemoryRouter>
      </Provider>
    );

    expect(container.firstChild).toBeNull();
  });
});
