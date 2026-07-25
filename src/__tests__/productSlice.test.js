import productReducer, {
  setProducts,
  addProduct,
  removeProduct,
  updateProductInState,
  setSelectedCategory,
} from '../redux/slices/productSlice';

describe('productSlice', () => {
  const initialState = {
    products: [],
    myListings: [],
    reminders: [],
    currentProduct: null,
    categories: ['All', 'Fruits'],
    selectedCategory: 'All',
    loading: false,
    error: null,
    formOpen: false,
    editingProduct: null,
  };

  it('should set products', () => {
    const products = [{ _id: '1', name: 'Apple' }];
    const state = productReducer(initialState, setProducts(products));
    expect(state.products).toEqual(products);
    expect(state.loading).toBe(false);
  });

  it('should add product to both lists', () => {
    const product = { _id: '2', name: 'Banana' };
    const state = productReducer(initialState, addProduct(product));
    expect(state.products).toHaveLength(1);
    expect(state.myListings).toHaveLength(1);
    expect(state.products[0].name).toBe('Banana');
  });

  it('should remove product from all lists', () => {
    const stateWithProducts = {
      ...initialState,
      products: [{ _id: '1' }, { _id: '2' }],
      myListings: [{ _id: '1' }, { _id: '2' }],
      reminders: [{ _id: '1' }],
    };
    const state = productReducer(stateWithProducts, removeProduct('1'));
    expect(state.products).toHaveLength(1);
    expect(state.myListings).toHaveLength(1);
    expect(state.reminders).toHaveLength(0);
  });

  it('should update product in state', () => {
    const stateWithProduct = {
      ...initialState,
      products: [{ _id: '1', name: 'Old', discountPrice: 50 }],
      myListings: [{ _id: '1', name: 'Old', discountPrice: 50 }],
    };
    const state = productReducer(
      stateWithProduct,
      updateProductInState({ _id: '1', name: 'New', discountPrice: 40 })
    );
    expect(state.products[0].name).toBe('New');
    expect(state.products[0].discountPrice).toBe(40);
  });

  it('should set selected category', () => {
    const state = productReducer(initialState, setSelectedCategory('Fruits'));
    expect(state.selectedCategory).toBe('Fruits');
  });
});